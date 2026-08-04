import React from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, elevation, font, radius, spacing } from '../../../theme'
import type { Draft } from '../AddSubWizard'

type Props = {
  draft: Draft
  patch: <K extends keyof Draft>(key: K, value: Draft[K]) => void
}

const CYCLES: { key: Draft['billingCycle']; label: string; hint: string }[] = [
  { key: 'monthly',   label: 'Monthly',   hint: 'Every month'   },
  { key: 'yearly',    label: 'Yearly',    hint: 'Every year'    },
  { key: 'quarterly', label: 'Quarterly', hint: 'Every 3 months'},
  { key: 'weekly',    label: 'Weekly',    hint: 'Every week'    },
]

/**
 * Step 3 — billing cycle radio + first-billing date picker.
 *
 * Web uses a native `<input type="date">` for the picker (best UX in browser);
 * native builds fall back to a simple textual editor for now — a proper
 * DateTimePicker lands in a follow-up.
 */
export default function Step3Cycle({ draft, patch }: Props) {
  return (
    <View style={{ gap: spacing.xxl }}>
      <View>
        <Text style={styles.title}>How often do you pay?</Text>
        <Text style={styles.subtitle}>
          Pick the cycle and when the next charge lands.
        </Text>
      </View>

      {/* Cycle radio cards */}
      <View style={styles.cycleRow}>
        {CYCLES.map((c) => {
          const active = draft.billingCycle === c.key
          return (
            <Pressable
              key={c.key}
              onPress={() => patch('billingCycle', c.key)}
              style={[styles.cycleCard, active && styles.cycleCardActive]}
            >
              <View style={styles.cycleHead}>
                <Text style={[styles.cycleLabel, active && styles.cycleLabelActive]}>
                  {c.label}
                </Text>
                {active ? (
                  <View style={styles.tick}>
                    <Feather name="check" size={12} color="#fff" />
                  </View>
                ) : null}
              </View>
              <Text style={styles.cycleHint}>{c.hint}</Text>
            </Pressable>
          )
        })}
      </View>

      {/* First billing date */}
      <View>
        <Text style={styles.sectionLabel}>First billing date</Text>
        <DateField
          value={draft.firstBillingAt}
          onChange={(iso) => patch('firstBillingAt', iso)}
        />
      </View>
    </View>
  )
}

// ── DateField ─────────────────────────────────────────────────────────────
// Web uses the browser's native <input type="date">, wrapped so it looks like
// a normal RN pressable. Native path falls back to a plain TextInput for now.

function DateField({
  value,
  onChange,
}: {
  value: string
  onChange: (iso: string) => void
}) {
  const displayed = formatDisplay(value)

  if (Platform.OS === 'web') {
    // React Native Web renders <input> natively when we pass the right style.
    // We can't use a <TextInput type=date> so drop into raw createElement.
    return (
      <View style={styles.dateWrap}>
        <Feather name="calendar" size={16} color={colors.muted} />
        {React.createElement('input' as any, {
          type: 'date',
          value,
          onChange: (e: any) => onChange(e.target.value),
          style: {
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'DMSans_600SemiBold',
            fontSize: 15,
            color: colors.ink,
          },
        })}
      </View>
    )
  }

  return (
    <View style={styles.dateWrap}>
      <Feather name="calendar" size={16} color={colors.muted} />
      <Text style={styles.dateText}>{displayed}</Text>
    </View>
  )
}

function formatDisplay(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
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
  cycleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cycleCard: {
    width: '48%',
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
    ...elevation.card,
    gap: 6,
  },
  cycleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  cycleHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cycleLabel: {
    fontFamily: font.bold,
    fontSize: 15,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  cycleLabelActive: {
    color: colors.primary,
  },
  cycleHint: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.muted,
  },
  tick: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: font.medium,
    color: colors.muted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
    ...elevation.card,
  },
  dateText: {
    flex: 1,
    fontFamily: font.semibold,
    fontSize: 15,
    color: colors.ink,
  },
})
