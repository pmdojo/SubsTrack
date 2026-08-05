import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invalidate } from '../../lib/query-client'
import { log } from '../../lib/log'
import {
  deletePaymentMethod,
  fetchPaymentMethods,
  insertPaymentMethod,
} from './api'
import type { CardBrand, PaymentMethod } from './model'

const keys = {
  all: ['payment-methods'] as const,
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: keys.all,
    queryFn: fetchPaymentMethods,
    staleTime: 60 * 1000,
  })
}

type AddInput = {
  brand: CardBrand
  last4: string
  expMonth: number
  expYear: number
  nickname?: string
  makeDefault?: boolean
}

export function useAddPaymentMethod(userId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AddInput) => insertPaymentMethod(input, userId),
    onSuccess: (created) => {
      // Prepend to cache immediately — no extra roundtrip
      const prev = qc.getQueryData<PaymentMethod[]>(keys.all) ?? []
      qc.setQueryData<PaymentMethod[]>(keys.all, [
        created,
        ...prev.map((p) =>
          created.isDefault ? { ...p, isDefault: false } : p
        ),
      ])
      log.track('payment_method_added', { brand: created.brand })
      invalidate.paymentMethods()
    },
    onError: (err) => log.error('add_payment_method_failed', err),
  })
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePaymentMethod(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.all })
      const prev = qc.getQueryData<PaymentMethod[]>(keys.all) ?? []
      qc.setQueryData<PaymentMethod[]>(
        keys.all,
        prev.filter((p) => p.id !== id)
      )
      return { prev }
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(keys.all, ctx.prev)
      log.error('delete_payment_method_failed', err)
    },
    onSuccess: () => {
      log.track('payment_method_deleted')
      invalidate.paymentMethods()
    },
  })
}
