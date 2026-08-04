import AsyncStorage from '@react-native-async-storage/async-storage'
import { usePrefs } from '../../stores/prefs'
import { getSupabase } from '../../lib/supabase'
import type { Subscription } from '../../lib/types'
import { subToInsert } from './model'
import { log } from '../../lib/log'

const LEGACY_KEY = 'subtrack_subs'

/**
 * One-shot: read subs that live in AsyncStorage from the pre-Supabase era
 * and bulk-insert them into public.subscriptions for the signed-in user.
 * Guarded by `usePrefs.hasMigratedLocalSubs` so it runs exactly once per
 * device install.
 *
 * Safe to call on every cold start — the flag is the gate. Only runs when
 * Supabase is configured AND a user is signed in.
 */
export async function migrateLocalSubsIfNeeded(userId: string): Promise<{
  migrated: number
  skipped: boolean
}> {
  const { hasMigratedLocalSubs, set } = usePrefs.getState()
  if (hasMigratedLocalSubs) return { migrated: 0, skipped: true }

  const client = getSupabase()
  if (!client) return { migrated: 0, skipped: true }

  try {
    const raw = await AsyncStorage.getItem(LEGACY_KEY)
    if (!raw) {
      set('hasMigratedLocalSubs', true)
      return { migrated: 0, skipped: true }
    }
    const parsed = JSON.parse(raw) as Subscription[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      set('hasMigratedLocalSubs', true)
      return { migrated: 0, skipped: true }
    }

    const rows = parsed.map((s) => {
      const row = subToInsert(s, userId)
      // Strip client-generated ids — let Postgres assign uuids
      delete (row as any).id
      return row
    })

    const { error } = await client.from('subscriptions').insert(rows)
    if (error) throw error

    set('hasMigratedLocalSubs', true)
    log.track('local_migrated', { count: rows.length })
    // Keep the AsyncStorage copy as a local backup — don't delete.
    return { migrated: rows.length, skipped: false }
  } catch (err) {
    log.error('local_migration_failed', err)
    return { migrated: 0, skipped: true }
  }
}
