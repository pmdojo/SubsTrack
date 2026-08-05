// Card brand values match the enum in supabase/migrations/init.sql.
export type CardBrand =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'rupay'
  | 'other'

export type PaymentMethod = {
  id: string
  brand: CardBrand
  last4: string // exactly 4 digits
  expMonth: number // 1–12
  expYear: number // full 4-digit
  nickname?: string
  isDefault: boolean
  createdAt: string
}

// Wire row shape (snake_case) — what Supabase actually returns.
export type PaymentMethodRow = {
  id: string
  brand: CardBrand
  last4: string
  exp_month: number
  exp_year: number
  nickname: string | null
  is_default: boolean
  created_at: string
  deleted_at: string | null
}

export function rowToPM(row: PaymentMethodRow): PaymentMethod {
  return {
    id: row.id,
    brand: row.brand,
    last4: row.last4,
    expMonth: row.exp_month,
    expYear: row.exp_year,
    nickname: row.nickname ?? undefined,
    isDefault: row.is_default,
    createdAt: row.created_at,
  }
}

// Human label for a brand — used in list + wizard chips.
export function brandLabel(brand: CardBrand): string {
  switch (brand) {
    case 'visa':       return 'Visa'
    case 'mastercard': return 'Mastercard'
    case 'amex':       return 'Amex'
    case 'discover':   return 'Discover'
    case 'rupay':      return 'RuPay'
    default:           return 'Card'
  }
}
