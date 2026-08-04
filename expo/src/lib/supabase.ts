import 'react-native-url-polyfill/auto'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

// ── Config ─────────────────────────────────────────────────────────────────

// Env vars are inlined at build time. Values reach here via app.json → extra
// or via .env with EXPO_PUBLIC_* prefix (already public-safe — Supabase anon
// key is meant to be shipped in the client).
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

/**
 * True when both env vars are present. Consumers should use this to decide
 * whether to hit Supabase or fall back to the local AsyncStorage store.
 * Keeps the app fully functional before the backend is provisioned.
 */
export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0

// ── Client ─────────────────────────────────────────────────────────────────

let clientCache: SupabaseClient | null = null

/**
 * Returns the singleton Supabase client, or null if the env isn't configured.
 * Every caller MUST handle the null case — never throw.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null
  if (clientCache) return clientCache

  clientCache = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      // On web, Supabase auth handles storage itself via localStorage.
      // On native, we provide AsyncStorage so the session survives cold starts.
      storage: Platform.OS === 'web' ? undefined : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  })

  return clientCache
}
