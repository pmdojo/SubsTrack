import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Single QueryClient for the whole app. Defaults tuned for a subscription-
 * tracker: stale-time longer than typical fetches (data rarely changes on
 * the second), no refetch-on-window-focus (annoying on web), retries only
 * on read calls.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 min — subs rarely change server-side
      gcTime: 24 * 60 * 60 * 1000, // 24h — keep in cache long enough to survive tab reopens
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Writes are user-triggered — surface failures immediately, no retry
      retry: 0,
    },
  },
})

/**
 * Query-cache persistor — writes the cache to AsyncStorage on native and
 * localStorage on web. Restored on cold start so users see their last-known
 * data instantly, before Supabase responds.
 */
export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'subtrack-query-cache',
  throttleTime: 1000, // batch writes; avoids saving on every keypress
})

/**
 * Central invalidation helper — call after any mutation. Keeps every
 * component in sync via Tanstack Query's normalized cache.
 */
export const invalidate = {
  subs: () => queryClient.invalidateQueries({ queryKey: ['subs'] }),
  sub: (id: string) =>
    queryClient.invalidateQueries({ queryKey: ['subs', id] }),
  metrics: () => queryClient.invalidateQueries({ queryKey: ['metrics'] }),
  profile: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  paymentMethods: () =>
    queryClient.invalidateQueries({ queryKey: ['payment-methods'] }),
  categories: () =>
    queryClient.invalidateQueries({ queryKey: ['categories'] }),
  all: () => queryClient.invalidateQueries(),
}
