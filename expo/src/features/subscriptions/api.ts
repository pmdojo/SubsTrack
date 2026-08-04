import { getSupabase } from '../../lib/supabase'
import type { Subscription, SubStatus } from '../../lib/types'
import { rowToSub, subToInsert, type SubRow } from './model'

// Every function throws on error. Callers (Tanstack Query hooks) handle
// the throw and surface a toast + Sentry breadcrumb.

function client() {
  const c = getSupabase()
  if (!c) throw new Error('Supabase not configured')
  return c
}

// ── Reads ──────────────────────────────────────────────────────────────────

export async function fetchSubs(): Promise<Subscription[]> {
  const { data, error } = await client()
    .from('subscription_with_meta')
    .select('*')
    .order('next_billing_at', { ascending: true })
  if (error) throw error
  return (data as SubRow[]).map(rowToSub)
}

export async function fetchSub(id: string): Promise<Subscription | null> {
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
  userId: string
): Promise<Subscription> {
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
 * Soft-delete — sets deleted_at instead of physically removing. The
 * cleanup edge function hard-deletes rows older than 30 days.
 */
export async function deleteSub(id: string): Promise<void> {
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
  const { error } = await client()
    .from('subscriptions')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}
