import { useQuery } from '@tanstack/react-query'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabase'

/**
 * A row in the `app_library` table — used by the wizard step 1 to seed the
 * "Pick an app" grid with brand colors, icons, and suggested plans.
 */
export type AppLibraryEntry = {
  slug: string
  name: string
  color: string
  icon: string | null
  category_slug: string | null
  vendor_url: string | null
  suggested_plans:
    | Array<{ label: string; price: number }>
    | null
  popularity_rank: number | null
}

// Small hardcoded fallback so the wizard works even without Supabase env
// vars (or offline). Same 12 apps that seed.sql inserts; keeps popularity
// hierarchy so grid ordering matches.
const FALLBACK_LIBRARY: AppLibraryEntry[] = [
  { slug: 'netflix',      name: 'Netflix',        color: '#E50914', icon: 'N',  category_slug: 'streaming',    vendor_url: null, suggested_plans: [{ label: 'Standard', price: 499 }, { label: 'Premium', price: 649 }], popularity_rank: 100 },
  { slug: 'chatgpt',      name: 'ChatGPT',        color: '#10A37F', icon: 'AI', category_slug: 'ai',           vendor_url: null, suggested_plans: [{ label: 'Plus', price: 1650 }],                                     popularity_rank: 95  },
  { slug: 'spotify',      name: 'Spotify',        color: '#1DB954', icon: '♪',  category_slug: 'music',        vendor_url: null, suggested_plans: [{ label: 'Individual', price: 119 }, { label: 'Family', price: 179 }], popularity_rank: 90 },
  { slug: 'claude',       name: 'Claude',         color: '#D97757', icon: '✳',  category_slug: 'ai',           vendor_url: null, suggested_plans: [{ label: 'Pro', price: 1700 }],                                       popularity_rank: 90 },
  { slug: 'figma',        name: 'Figma',          color: '#F24E1E', icon: 'F',  category_slug: 'design',       vendor_url: null, suggested_plans: [{ label: 'Professional', price: 999 }],                              popularity_rank: 90 },
  { slug: 'youtube',      name: 'YouTube Premium',color: '#FF0000', icon: '▷',  category_slug: 'streaming',    vendor_url: null, suggested_plans: [{ label: 'Individual', price: 149 }],                                popularity_rank: 85 },
  { slug: 'notion',       name: 'Notion',         color: '#111111', icon: 'N',  category_slug: 'productivity', vendor_url: null, suggested_plans: [{ label: 'Plus', price: 660 }],                                      popularity_rank: 85 },
  { slug: 'adobe',        name: 'Adobe CC',       color: '#FA0F00', icon: 'A',  category_slug: 'design',       vendor_url: null, suggested_plans: [{ label: 'All Apps', price: 4229 }],                                 popularity_rank: 80 },
  { slug: 'apple-music',  name: 'Apple Music',    color: '#111111', icon: 'A',  category_slug: 'music',        vendor_url: null, suggested_plans: [{ label: 'Individual', price: 99 }],                                 popularity_rank: 80 },
  { slug: 'icloud',       name: 'iCloud+',        color: '#3B82F6', icon: '☁',  category_slug: 'storage',      vendor_url: null, suggested_plans: [{ label: '200 GB', price: 219 }],                                    popularity_rank: 75 },
  { slug: 'discord',      name: 'Discord Nitro',  color: '#5865F2', icon: 'D',  category_slug: 'social',       vendor_url: null, suggested_plans: [{ label: 'Nitro', price: 830 }],                                     popularity_rank: 70 },
  { slug: 'github',       name: 'GitHub Pro',     color: '#111111', icon: 'G',  category_slug: 'dev',          vendor_url: null, suggested_plans: [{ label: 'Pro', price: 330 }],                                       popularity_rank: 70 },
]

export function useAppLibrary() {
  return useQuery({
    queryKey: ['app-library'],
    queryFn: async (): Promise<AppLibraryEntry[]> => {
      if (!isSupabaseConfigured) return FALLBACK_LIBRARY
      const client = getSupabase()!
      const { data, error } = await client
        .from('app_library')
        .select('*')
        .order('popularity_rank', { ascending: false, nullsFirst: false })
      if (error) throw error
      const rows = (data as AppLibraryEntry[]) ?? []
      return rows.length > 0 ? rows : FALLBACK_LIBRARY
    },
    staleTime: 60 * 60 * 1000, // library rarely changes
  })
}
