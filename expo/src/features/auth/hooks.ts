import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabase'
import { invalidate } from '../../lib/query-client'
import { log } from '../../lib/log'

/**
 * Auth state observable via React state. Bootstrap on mount:
 *  1. Try to resume an existing session (Supabase reads AsyncStorage/localStorage).
 *  2. If no session, sign in anonymously so the RLS `auth.uid()` guard has a value.
 *  3. Subscribe to auth changes for the lifetime of the app.
 *
 * When Supabase isn't configured, returns a stable "not-ready" state and
 * lets the app run in offline-only AsyncStorage mode.
 */
export function useAuthBootstrap(): {
  user: User | null
  session: Session | null
  ready: boolean
  mode: 'supabase' | 'local'
} {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(!isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    const client = getSupabase()
    if (!client) return

    let cancelled = false

    ;(async () => {
      try {
        const { data: { session: existing } } = await client.auth.getSession()
        if (cancelled) return
        if (existing) {
          setSession(existing)
          setReady(true)
          log.track('session_resumed', {
            userId: existing.user.id,
            anon: existing.user.is_anonymous,
          })
          return
        }
        // No existing session → anon sign-in
        const { data, error } = await client.auth.signInAnonymously()
        if (error) throw error
        if (cancelled) return
        setSession(data.session)
        log.track('signed_in', { method: 'anon' })
      } catch (err) {
        log.error('auth_bootstrap_failed', err)
      } finally {
        if (!cancelled) setReady(true)
      }
    })()

    const { data: sub } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      // Any auth change (sign-in / sign-out / refresh) → refresh all queries
      invalidate.all()
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  return {
    user: session?.user ?? null,
    session,
    ready,
    mode: isSupabaseConfigured ? 'supabase' : 'local',
  }
}
