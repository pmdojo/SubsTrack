import { useQuery } from '@tanstack/react-query'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabase'

export type Category = {
  id: string | null
  slug: string
  label: string
  emoji: string | null
  color: string
}

const FALLBACK_CATEGORIES: Category[] = [
  { id: null, slug: 'streaming',    label: 'Streaming',    emoji: '📺', color: '#E50914' },
  { id: null, slug: 'music',        label: 'Music',        emoji: '🎵', color: '#1DB954' },
  { id: null, slug: 'ai',           label: 'AI',           emoji: '✨', color: '#4C4CE5' },
  { id: null, slug: 'design',       label: 'Design',       emoji: '🎨', color: '#F24E1E' },
  { id: null, slug: 'productivity', label: 'Productivity', emoji: '📝', color: '#0078D4' },
  { id: null, slug: 'dev',          label: 'Dev Tools',    emoji: '💻', color: '#181717' },
  { id: null, slug: 'storage',      label: 'Storage',      emoji: '☁️', color: '#3B82F6' },
  { id: null, slug: 'social',       label: 'Social',       emoji: '💬', color: '#5865F2' },
  { id: null, slug: 'fitness',      label: 'Fitness',      emoji: '🏃', color: '#F97316' },
  { id: null, slug: 'news',         label: 'News',         emoji: '📰', color: '#57534E' },
  { id: null, slug: 'gaming',       label: 'Gaming',       emoji: '🎮', color: '#7C3AED' },
  { id: null, slug: 'utility',      label: 'Utilities',    emoji: '🔧', color: '#8B887F' },
]

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      if (!isSupabaseConfigured) return FALLBACK_CATEGORIES
      const client = getSupabase()!
      const { data, error } = await client
        .from('categories')
        .select('id, slug, label, emoji, color')
        .order('label', { ascending: true })
      if (error) throw error
      const rows = (data as Category[]) ?? []
      return rows.length > 0 ? rows : FALLBACK_CATEGORIES
    },
    staleTime: 60 * 60 * 1000,
  })
}
