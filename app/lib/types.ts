export type Subscription = {
  id: string
  name: string
  icon: string
  color: string
  price: number // monthly INR
  cardLast4: string
  billingDate: string // YYYY-MM-DD
  status: 'active' | 'expired'
  category: string
}
