import { getSupabase, isSupabaseConfigured } from '../../lib/supabase'
import * as legacy from '../../lib/store'
import type { Subscription, SubStatus } from '../../lib/types'
import { rowToSub, subToInsert, type SubRow } from './model'

// Every function transparently falls back to the AsyncStorage-backed
// legacy store when Supabase env vars aren't present. That way the app
// runs cleanly in local dev, on Vercel without env vars, in offline
// mode after a network drop — with no branching in components.
//
// When Supabase IS configured, the legacy store is bypassed entirely
// (the one-shot migrate.ts already copied local rows into Postgres).

function client() {
  const c = getSupabase()
  if (!c) throw new Error('Supabase not configured')
  return c
}

// ── Reads ──────────────────────────────────────────────────────────────────

export async function fetchSubs(): Promise<Subscription[]> {
  if (!isSupabaseConfigured) return legacy.getSubs()

  const { data, error } = await client()
    .from('subscription_with_meta')
    .select('*')
    .order('next_billing_at', { ascending: true })
  if (error) throw error
  return (data as SubRow[]).map(rowToSub)
}

export async function fetchSub(id: string): Promise<Subscription | null> {
  if (!isSupabaseConfigured) {
    const all = await legacy.getSubs()
    return all.find((s) => s.id === id) ?? null
  }

  const { data, error } = await client()
    .from('subscription_with_meta')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? rowToSub(data as SubRow) : null
}

// ── Writes ─────────────────────────────────────────────────────────────────

export async function insertSub(
  sub: Subscription,
  userId: string | null
): Promise<Subscription> {
  if (!isSupabaseConfigured) {
    await legacy.addSub(sub)
    return sub
  }
  if (!userId) throw new Error('Not signed in')

  const insert = subToInsert(sub, userId)
  const { data, error } = await client()
    .from('subscriptions')
    .insert(insert)
    .select('*')
    .single()
  if (error) throw error
  return rowToSub(data as SubRow)
}

export async function updateSub(sub: Subscription): Promise<Subscription> {
  if (!isSupabaseConfigured) {
    await legacy.updateSub(sub)
    return sub
  }

  const { data, error } = await client()
    .from('subscriptions')
    .update({
      name: sub.name,
      icon: sub.icon,
      color: sub.color,
      plan: sub.plan ?? null,
      price: sub.price,
      auto_renew: sub.autoRenew ?? true,
      status: sub.status,
      next_billing_at: sub.billingDate,
    })
    .eq('id', sub.id)
    .select('*')
    .single()
  if (error) throw error
  return rowToSub(data as SubRow)
}

/**
 * Soft-delete in Supabase (sets deleted_at); hard-remove in legacy mode
 * where there's no soft-delete concept.
 */
export async function deleteSub(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    await legacy.deleteSub(id)
    return
  }

  const { error } = await client()
    .from('subscriptions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function setSubStatus(
  id: string,
  status: SubStatus
): Promise<void> {
  if (!isSupabaseConfigured) {
    // Legacy store already stamps timestamps via its own setStatus helper
    if (status === 'paused') await legacy.pauseSub(id)
    else if (status === 'cancelled') await legacy.cancelSub(id)
    else if (status === 'active') await legacy.resumeSub(id)
    else {
      // 'expired' — no dedicated legacy helper; use updateSub path
      const all = await legacy.getSubs()
      const target = all.find((s) => s.id === id)
      if (target) await legacy.updateSub({ ...target, status })
    }
    return
  }

  const { error } = await client()
    .from('subscriptions')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}
