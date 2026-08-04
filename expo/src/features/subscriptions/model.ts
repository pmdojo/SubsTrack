import type { Subscription, SubStatus } from '../../lib/types'

/**
 * Wire ↔ app-domain mappers. DB stores snake_case; the app operates on the
 * legacy camelCase Subscription type (kept for compatibility with existing
 * components). Every conversion lives here so column renames stay local.
 */

// Full DB row shape as returned by Supabase (post-select). Only the fields
// we actually read/write are typed — extra columns are permitted.
export type SubRow = {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  category_id: string | null
  plan: string | null
  vendor_url: string | null
  price: number | string
  currency: string
  billing_cycle: string
  cycle_every: number
  first_billing_at: string // date
  next_billing_at: string // date
  auto_renew: boolean
  payment_method_id: string | null
  remind_lead_days: number
  reminder_enabled: boolean
  status: SubStatus
  paused_at: string | null
  cancelled_at: string | null
  expired_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  // From the view
  category_slug?: string | null
  category_label?: string | null
  payment_brand?: string | null
  payment_last4?: string | null
  day_chip?: string | null
  days_until?: number
}

export function rowToSub(row: SubRow): Subscription {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    price: typeof row.price === 'string' ? Number(row.price) : row.price,
    cardLast4: row.payment_last4 ?? '',
    billingDate: row.next_billing_at,
    status: row.status,
    category: row.category_label ?? row.category_slug ?? 'General',
    plan: row.plan ?? undefined,
    autoRenew: row.auto_renew,
    cancelledAt: row.cancelled_at ?? undefined,
    pausedAt: row.paused_at ?? undefined,
  }
}

/**
 * Insert shape used when creating a new sub. Fields that the app doesn't
 * expose default to reasonable server defaults or are computed here.
 */
export type SubInsert = Omit<
  SubRow,
  | 'id'
  | 'user_id'
  | 'category_id'
  | 'vendor_url'
  | 'payment_method_id'
  | 'category_slug'
  | 'category_label'
  | 'payment_brand'
  | 'payment_last4'
  | 'day_chip'
  | 'days_until'
  | 'created_at'
  | 'updated_at'
  | 'deleted_at'
  | 'notes'
  | 'reminder_enabled'
  | 'cycle_every'
  | 'currency'
  | 'expired_at'
> & {
  id?: string
  user_id: string
  category_id?: string | null
  vendor_url?: string | null
  payment_method_id?: string | null
  notes?: string | null
  reminder_enabled?: boolean
  cycle_every?: number
  currency?: string
}

export function subToInsert(sub: Subscription, userId: string): SubInsert {
  return {
    user_id: userId,
    name: sub.name,
    icon: sub.icon,
    color: sub.color,
    plan: sub.plan ?? null,
    price: sub.price,
    currency: 'INR',
    billing_cycle: 'monthly',
    cycle_every: 1,
    first_billing_at: sub.billingDate,
    next_billing_at: sub.billingDate,
    auto_renew: sub.autoRenew ?? true,
    remind_lead_days: 2,
    reminder_enabled: true,
    status: sub.status,
    paused_at: sub.pausedAt ?? null,
    cancelled_at: sub.cancelledAt ?? null,
  }
}
