import AsyncStorage from '@react-native-async-storage/async-storage'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabase'
import {
  rowToPM,
  type CardBrand,
  type PaymentMethod,
  type PaymentMethodRow,
} from './model'

// Local fallback used when Supabase isn't configured. Persisted to AsyncStorage
// under this key so the wizard's payment step still works offline.
const LOCAL_KEY = 'subtrack_payment_methods'

async function readLocal(): Promise<PaymentMethod[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PaymentMethod[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeLocal(list: PaymentMethod[]): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(list))
  } catch {
    /* swallow — storage failure shouldn't crash the wizard */
  }
}

function client() {
  const c = getSupabase()
  if (!c) throw new Error('Supabase not configured')
  return c
}

// ── Reads ─────────────────────────────────────────────────────────────────

export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  if (!isSupabaseConfigured) return readLocal()

  const { data, error } = await client()
    .from('payment_methods')
    .select('*')
    .is('deleted_at', null)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as PaymentMethodRow[]).map(rowToPM)
}

// ── Writes ────────────────────────────────────────────────────────────────

type NewCardInput = {
  brand: CardBrand
  last4: string
  expMonth: number
  expYear: number
  nickname?: string
  makeDefault?: boolean
}

export async function insertPaymentMethod(
  input: NewCardInput,
  userId: string | null
): Promise<PaymentMethod> {
  const nowIso = new Date().toISOString()

  if (!isSupabaseConfigured) {
    const list = await readLocal()
    // Local fallback: generate an id locally, honor default flag by clearing
    // is_default on siblings if requested.
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `pm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const clearedList = input.makeDefault
      ? list.map((p) => ({ ...p, isDefault: false }))
      : list
    const created: PaymentMethod = {
      id,
      brand: input.brand,
      last4: input.last4,
      expMonth: input.expMonth,
      expYear: input.expYear,
      nickname: input.nickname,
      isDefault: input.makeDefault ?? list.length === 0,
      createdAt: nowIso,
    }
    await writeLocal([created, ...clearedList])
    return created
  }

  if (!userId) throw new Error('Not signed in')

  // If setting default, clear other defaults first (there's a partial unique
  // index that only allows one is_default=true per user among non-deleted).
  if (input.makeDefault) {
    await client()
      .from('payment_methods')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true)
  }

  const { data, error } = await client()
    .from('payment_methods')
    .insert({
      user_id: userId,
      brand: input.brand,
      last4: input.last4,
      exp_month: input.expMonth,
      exp_year: input.expYear,
      nickname: input.nickname ?? null,
      is_default: input.makeDefault ?? false,
    })
    .select('*')
    .single()
  if (error) throw error
  return rowToPM(data as PaymentMethodRow)
}

export async function deletePaymentMethod(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const list = await readLocal()
    await writeLocal(list.filter((p) => p.id !== id))
    return
  }
  // Soft-delete so existing subs that reference this card still resolve
  // (their FK is preserved; the cleanup cron hard-deletes after 30 days).
  const { error } = await client()
    .from('payment_methods')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
