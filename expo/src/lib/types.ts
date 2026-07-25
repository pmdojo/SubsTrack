export type SubStatus = 'active' | 'paused' | 'cancelled' | 'expired'

export type Subscription = {
  id: string
  name: string
  icon: string
  color: string
  price: number // monthly INR
  cardLast4: string
  billingDate: string // YYYY-MM-DD
  status: SubStatus
  category: string
  plan?: string // e.g. "Premium", "Family", "Basic" — optional for back-compat
  autoRenew?: boolean // defaults to true when missing
}
