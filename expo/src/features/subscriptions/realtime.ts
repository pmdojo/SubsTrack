import { useEffect } from 'react'
import { getSupabase } from '../../lib/supabase'
import { invalidate } from '../../lib/query-client'
import { log } from '../../lib/log'

/**
 * Subscribe to Postgres change events on `public.subscriptions` for the
 * signed-in user. On any insert/update/delete, invalidate the sub query
 * cache — Tanstack Query refetches and every consumer re-renders.
 *
 * No-ops when Supabase isn't configured or no user is signed in.
 */
export function useSubscriptionsRealtime(userId: string | null | undefined) {
  useEffect(() => {
    if (!userId) return
    const client = getSupabase()
    if (!client) return

    const channel = client
      .channel(`subs:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          log.debug('realtime_subs_change', { event: payload.eventType })
          invalidate.subs()
          invalidate.metrics()
        }
      )
      .subscribe()

    return () => {
      client.removeChannel(channel)
    }
  }, [userId])
}
