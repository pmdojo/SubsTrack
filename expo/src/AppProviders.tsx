import React, { useEffect } from 'react'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient, queryPersister } from './lib/query-client'
import { UiProvider } from './components/ui/UiProvider'
import { useAuthBootstrap } from './features/auth/hooks'
import { useSubscriptionsRealtime } from './features/subscriptions/realtime'
import { migrateLocalSubsIfNeeded } from './features/subscriptions/migrate'
import { log } from './lib/log'

/**
 * Single root wrapper — QueryClient + query-cache persistor + Ui + auth
 * bootstrap. Any consumer downstream can use Tanstack Query hooks, imperative
 * toast/confirm, or read the auth state.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister }}
    >
      <UiProvider>
        <AuthBootstrap />
        {children}
      </UiProvider>
    </PersistQueryClientProvider>
  )
}

/**
 * Fire-and-forget effect component. Signs in anonymously, migrates legacy
 * local subs on first cloud launch, and opens the realtime channel. Renders
 * nothing — pure side effects.
 */
function AuthBootstrap() {
  const { user, ready, mode } = useAuthBootstrap()

  useSubscriptionsRealtime(user?.id)

  useEffect(() => {
    if (!ready) return
    if (mode !== 'supabase' || !user?.id) return
    migrateLocalSubsIfNeeded(user.id).then((result) => {
      if (result.migrated > 0) {
        log.track('local_migration_completed', { count: result.migrated })
      }
    })
  }, [ready, mode, user?.id])

  return null
}
