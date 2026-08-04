import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { Subscription, SubStatus } from '../../lib/types'
import { invalidate } from '../../lib/query-client'
import { log } from '../../lib/log'
import {
  deleteSub,
  fetchSub,
  fetchSubs,
  insertSub,
  setSubStatus,
  updateSub,
} from './api'

// Central query keys — keep in one place so invalidation stays consistent.
const keys = {
  all: ['subs'] as const,
  one: (id: string) => ['subs', id] as const,
}

// ── Reads ──────────────────────────────────────────────────────────────────

export function useSubs() {
  return useQuery({
    queryKey: keys.all,
    queryFn: fetchSubs,
  })
}

export function useSub(id: string | null) {
  return useQuery({
    queryKey: id ? keys.one(id) : ['subs', 'none'],
    queryFn: () => (id ? fetchSub(id) : Promise.resolve(null)),
    enabled: !!id,
  })
}

// ── Writes (optimistic) ────────────────────────────────────────────────────

export function useInsertSub(userId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sub: Subscription) => {
      if (!userId) throw new Error('Not signed in')
      return insertSub(sub, userId)
    },
    onMutate: async (sub) => {
      await qc.cancelQueries({ queryKey: keys.all })
      const prev = qc.getQueryData<Subscription[]>(keys.all) ?? []
      qc.setQueryData<Subscription[]>(keys.all, [sub, ...prev])
      return { prev }
    },
    onError: (err, _sub, ctx) => {
      if (ctx?.prev) qc.setQueryData(keys.all, ctx.prev)
      log.error('insert_sub_failed', err)
    },
    onSuccess: (created) => {
      log.track('subscription_added', {
        id: created.id,
        price: created.price,
      })
      invalidate.metrics()
    },
  })
}

export function useUpdateSub() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sub: Subscription) => updateSub(sub),
    onMutate: async (sub) => {
      await qc.cancelQueries({ queryKey: keys.all })
      const prevList = qc.getQueryData<Subscription[]>(keys.all) ?? []
      qc.setQueryData<Subscription[]>(
        keys.all,
        prevList.map((s) => (s.id === sub.id ? sub : s))
      )
      const prevOne = qc.getQueryData<Subscription | null>(keys.one(sub.id))
      qc.setQueryData(keys.one(sub.id), sub)
      return { prevList, prevOne }
    },
    onError: (err, sub, ctx) => {
      if (ctx?.prevList) qc.setQueryData(keys.all, ctx.prevList)
      if (ctx?.prevOne !== undefined)
        qc.setQueryData(keys.one(sub.id), ctx.prevOne)
      log.error('update_sub_failed', err)
    },
    onSuccess: (updated) => {
      log.track('subscription_edited', { id: updated.id })
      invalidate.metrics()
    },
  })
}

export function useDeleteSub() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSub(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.all })
      const prev = qc.getQueryData<Subscription[]>(keys.all) ?? []
      qc.setQueryData<Subscription[]>(
        keys.all,
        prev.filter((s) => s.id !== id)
      )
      return { prev, id }
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(keys.all, ctx.prev)
      log.error('delete_sub_failed', err)
    },
    onSuccess: (_data, id) => {
      log.track('subscription_deleted', { id })
      invalidate.metrics()
    },
  })
}

export function useSetSubStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SubStatus }) =>
      setSubStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: keys.all })
      const prev = qc.getQueryData<Subscription[]>(keys.all) ?? []
      const nowIso = new Date().toISOString()
      const patch = (s: Subscription): Subscription => {
        if (s.id !== id) return s
        const next: Subscription = { ...s, status }
        if (status === 'paused') next.pausedAt = nowIso
        if (status === 'cancelled') next.cancelledAt = nowIso
        if (status === 'active') {
          next.pausedAt = undefined
          next.cancelledAt = undefined
        }
        return next
      }
      qc.setQueryData<Subscription[]>(keys.all, prev.map(patch))
      const prevOne = qc.getQueryData<Subscription | null>(keys.one(id))
      if (prevOne) qc.setQueryData(keys.one(id), patch(prevOne))
      return { prev, prevOne, id }
    },
    onError: (err, { id }, ctx) => {
      if (ctx?.prev) qc.setQueryData(keys.all, ctx.prev)
      if (ctx?.prevOne !== undefined)
        qc.setQueryData(keys.one(id), ctx.prevOne)
      log.error('set_status_failed', err)
    },
    onSuccess: (_data, { id, status }) => {
      log.track(`subscription_${status}`, { id })
      invalidate.metrics()
    },
  })
}
