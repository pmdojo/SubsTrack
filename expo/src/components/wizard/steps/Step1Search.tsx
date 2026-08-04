import React, { useMemo, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useAppLibrary, type AppLibraryEntry } from '../../../features/subscriptions/library'
import { colors, elevation, font, radius, spacing } from '../../../theme'
import type { Draft } from '../AddSubWizard'

type Props = {
  draft: Draft
  patch: <K extends keyof Draft>(key: K, value: Draft[K]) => void
}

/**
 * Step 1 — pick an app from the library (or fall through to manual entry).
 * Selecting an app pre-fills name, icon, color, category, and a suggested
 * price + plan so the remaining steps become just confirmations.
 */
export default function Step1Search({ draft, patch }: Props) {
  const [query, setQuery] = useState('')
  const { data: library = [] } = useAppLibrary()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return library
    return library.filter((a) => a.name.toLowerCase().includes(q))
  }, [library, query])

  const selectApp = (app: AppLibraryEntry) => {
    patch('name', app.name)
    patch('icon', app.icon ?? app.name.charAt(0).toUpperCase())
    patch('color', app.color)
    patch('categorySlug', app.category_slug ?? 'utility')
    // Best-effort category label from the slug (Step 4 lets the user change it)
    patch('categoryLabel', capitalize(app.category_slug ?? 'Utilities'))
    // Prefill price from the cheapest suggested plan; user can adjust in Step 2
    const suggestion = app.suggested_plans?.[0]
    if (suggestion) {
      patch('price', suggestion.price)
      patch('plan', suggestion.label)
    }
  }

  const startManual = () => {
    patch('name', query.trim() || 'New Subscription')
    patch('icon', (query.trim() || 'S').charAt(0).toUpperCase())
    patch('color', colors.primary)
  }

  const selectedSlug = library.find((a) => a.name === draft.name)?.slug

  return (
    <View style={{ gap: spacing.xl }}>
      <View>
        <Text style={styles.title}>Which subscription?</Text>
        <Text style={styles.subtitle}>
          Pick from popular apps or add your own.
        </Text>
      </View>

      {/* Search input */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search Netflix, Spotify…"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {/* Grid of app tiles */}
      <View style={styles.grid}>
        {filtered.map((app) => {
          const selected = app.name === draft.name
          return (
            <Pressable
              key={app.slug}
              onPress={() => selectApp(app)}
              style={[styles.tile, selected && styles.tileSelected]}
            >
              <View style={[styles.iconTile, { backgroundColor: app.color }]}>
                <Text style={styles.iconText}>{app.icon}</Text>
              </View>
              <Text style={styles.tileName} numberOfLines={1}>
                {app.name}
              </Text>
              {selected ? (
                <View style={styles.check}>
                  <Feather name="check" size={12} color="#fff" />
                </View>
              ) : null}
            </Pressable>
          )
        })}
      </View>

      {/* Empty result → offer manual add */}
      {filtered.length === 0 ? (
        <Pressable onPress={startManual} style={styles.manualCta}>
          <Feather name="plus-circle" size={16} color={colors.primary} />
          <Text style={styles.manualText}>
            Add "{query.trim()}" manually
          </Text>
        </Pressable>
      ) : null}

      {/* Show selection summary — reassures user of choice */}
      {draft.name && !selectedSlug && filtered.length > 0 ? (
        <Text style={styles.selectionHint}>
          Manual entry: <Text style={{ color: colors.ink }}>{draft.name}</Text>
        </Text>
      ) : null}
    </View>
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontFamily: font.bold,
    color: colors.ink,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: font.regular,
    color: colors.muted,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: '#F4F3F0',
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: font.medium,
    color: colors.ink,
    fontSize: 14,
    padding: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...elevation.card,
  },
  tileSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.tile,
  },
  iconText: {
    color: '#fff',
    fontFamily: font.bold,
    fontSize: 16,
  },
  tileName: {
    fontSize: 11,
    fontFamily: font.semibold,
    color: colors.ink,
    textAlign: 'center',
  },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  manualText: {
    fontSize: 14,
    color: colors.primary,
    fontFamily: font.semibold,
  },
  selectionHint: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: font.regular,
    textAlign: 'center',
  },
})
