import React from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import SplitPrice from '../../SplitPrice'
import { colors, elevation, font, radius, spacing } from '../../../theme'
import type { Draft } from '../AddSubWizard'

type Props = {
  draft: Draft
  patch: <K extends keyof Draft>(key: K, value: Draft[K]) => void
}

/**
 * Step 2 — capture the monthly cost. Renders a huge SplitPrice preview
 * above a numeric TextInput so users see the split typography as they type.
 */
export default function Step2Amount({ draft, patch }: Props) {
  const displayValue = draft.price === null ? '' : String(draft.price)

  const handleChange = (text: string) => {
    // Allow decimals, strip anything non-numeric
    const cleaned = text.replace(/[^\d.]/g, '')
    if (cleaned === '') {
      patch('price', null)
    } else {
      const n = parseFloat(cleaned)
      patch('price', Number.isFinite(n) ? n : null)
    }
  }

  const suggestions = [149, 499, 649, 1650]

  return (
    <View style={{ gap: spacing.xxl }}>
      <View>
        <Text style={styles.title}>How much per month?</Text>
        <Text style={styles.subtitle}>
          {draft.name ? `Set the price for ${draft.name}.` : 'Enter the amount you pay.'}
        </Text>
      </View>

      {/* Live preview of the split typography */}
      <View style={styles.preview}>
        <SplitPrice
          value={draft.price ?? 0}
          size="xl"
          align="left"
          suffix="per month"
        />
      </View>

      {/* Actual input */}
      <View style={styles.inputWrap}>
        <Text style={styles.currency}>₹</Text>
        <TextInput
          value={displayValue}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
      </View>

      {/* Quick suggestions */}
      <View>
        <Text style={styles.suggestLabel}>Quick amounts</Text>
        <View style={styles.suggestRow}>
          {suggestions.map((amount) => (
            <SuggestChip
              key={amount}
              amount={amount}
              active={draft.price === amount}
              onPress={() => patch('price', amount)}
            />
          ))}
        </View>
      </View>
    </View>
  )
}

function SuggestChip({
  amount,
  active,
  onPress,
}: {
  amount: number
  active: boolean
  onPress: () => void
}) {
  return (
    <Text
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      ₹{amount.toLocaleString('en-IN')}
    </Text>
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
  preview: {
    backgroundColor: colors.primaryTint,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    alignItems: 'flex-start',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
    ...elevation.card,
  },
  currency: {
    fontFamily: font.bold,
    fontSize: 20,
    color: colors.muted,
  },
  input: {
    flex: 1,
    fontFamily: font.bold,
    fontSize: 24,
    color: colors.ink,
    padding: 0,
    letterSpacing: -0.6,
  },
  suggestLabel: {
    fontSize: 11,
    fontFamily: font.medium,
    color: colors.muted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  suggestRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: '#F4F3F0',
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    color: '#fff',
    borderColor: colors.primary,
  },
})
