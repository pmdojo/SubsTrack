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
  plan?: string // e.g. "Premium", "Family", "Basic"
  autoRenew?: boolean // defaults to true when missing
  cancelledAt?: string // ISO date, set when status flips to 'cancelled'
  pausedAt?: string    // ISO date, set when status flips to 'paused'
  paymentMethodId?: string // FK → payment_methods.id
  paymentBrand?: string // Denormalised from the joined view (VISA / MC / …)
}
