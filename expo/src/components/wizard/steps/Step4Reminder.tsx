import React from 'react'
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useCategories, type Category } from '../../../features/categories/hooks'
import { colors, elevation, font, radius, spacing } from '../../../theme'
import type { Draft } from '../AddSubWizard'

type Props = {
  draft: Draft
  patch: <K extends keyof Draft>(key: K, value: Draft[K]) => void
}

const LEAD_DAYS: number[] = [1, 3, 7]

/**
 * Step 4 (of 4 in this slice; spec's step 5) — reminder lead-days + auto-renew
 * toggle + category picker.
 */
export default function Step4Reminder({ draft, patch }: Props) {
  const { data: categories = [] } = useCategories()

  return (
    <View style={{ gap: spacing.xxl }}>
      <View>
        <Text style={styles.title}>One last thing.</Text>
        <Text style={styles.subtitle}>
          Reminders keep you from forgetting to cancel.
        </Text>
      </View>

      {/* Reminder lead-days segmented */}
      <View>
        <Text style={styles.sectionLabel}>Remind me</Text>
        <View style={styles.segmented}>
          {LEAD_DAYS.map((days) => {
            const active = draft.remindLeadDays === days
            return (
              <Pressable
                key={days}
                onPress={() => patch('remindLeadDays', days)}
                style={[styles.segment, active && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {days} {days === 1 ? 'day' : 'days'} before
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* Auto renew */}
      <View style={styles.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.toggleTitle}>Auto renew</Text>
          <Text style={styles.toggleHint}>
            Count this toward your monthly total until you cancel.
          </Text>
        </View>
        <Switch
          value={draft.autoRenew}
          onValueChange={(v) => patch('autoRenew', v)}
          trackColor={{ true: colors.primary, false: '#D6D3CB' }}
          thumbColor="#fff"
        />
      </View>

      {/* Category */}
      <View>
        <Text style={styles.sectionLabel}>Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
        >
          {categories.map((c) => (
            <CategoryChip
              key={c.slug}
              cat={c}
              active={draft.categorySlug === c.slug}
              onPress={() => {
                patch('categorySlug', c.slug)
                patch('categoryLabel', c.label)
              }}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

function CategoryChip({
  cat,
  active,
  onPress,
}: {
  cat: Category
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.catChip,
        active && { backgroundColor: cat.color, borderColor: cat.color },
      ]}
    >
      {cat.emoji ? <Text style={styles.catEmoji}>{cat.emoji}</Text> : null}
      <Text style={[styles.catLabel, active && styles.catLabelActive]}>
        {cat.label}
      </Text>
    </Pressable>
  )
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
  sectionLabel: {
    fontSize: 11,
    fontFamily: font.medium,
    color: colors.muted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  segmented: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  segmentText: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.ink,
  },
  segmentTextActive: {
    color: '#fff',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.card,
    gap: 12,
  },
  toggleTitle: {
    fontFamily: font.bold,
    fontSize: 15,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  toggleHint: {
    marginTop: 2,
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.muted,
    lineHeight: 16,
  },
  catRow: {
    gap: 8,
    paddingRight: spacing.lg,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  catEmoji: {
    fontSize: 14,
  },
  catLabel: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.ink,
  },
  catLabelActive: {
    color: '#fff',
  },
})
