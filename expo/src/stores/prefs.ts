import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * User preferences persisted to device storage. Server-synced to `profiles`
 * separately (via the auth layer) so that logged-in users see the same
 * prefs across devices. This store is the local, always-available copy.
 */
export type PrefsState = {
  currency: string // ISO 4217, e.g. 'INR', 'USD'
  locale: string // BCP-47, e.g. 'en-IN'
  reminderLeadDaysDefault: number // 0–30
  remindersEnabled: boolean // master notifications toggle
  quietHoursStart: string | null // 'HH:MM' or null
  quietHoursEnd: string | null // 'HH:MM' or null
  hasCompletedOnboarding: boolean
  hasMigratedLocalSubs: boolean // one-shot AS → Supabase flag
}

type PrefsActions = {
  set: <K extends keyof PrefsState>(key: K, value: PrefsState[K]) => void
  reset: () => void
}

const defaults: PrefsState = {
  currency: 'INR',
  locale: 'en-IN',
  reminderLeadDaysDefault: 2,
  remindersEnabled: true,
  quietHoursStart: null,
  quietHoursEnd: null,
  hasCompletedOnboarding: false,
  hasMigratedLocalSubs: false,
}

export const usePrefs = create<PrefsState & PrefsActions>()(
  persist(
    (set) => ({
      ...defaults,
      set: (key, value) => set({ [key]: value } as any),
      reset: () => set(defaults),
    }),
    {
      name: 'subtrack-prefs',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
