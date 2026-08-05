import React, { useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { MotiView } from '../lib/motion'
import {
  usePaymentMethods,
  useDeletePaymentMethod,
} from '../features/payment-methods/hooks'
import { brandLabel, type PaymentMethod } from '../features/payment-methods/model'
import { usePrefs } from '../stores/prefs'
import { useConfirm, useToast } from '../components/ui/UiProvider'
import { colors, elevation, font, radius, spacing } from '../theme'

/**
 * Lightweight settings surface — hosted inside the Home shell (rendered when
 * the bottom-nav "You" tab is active). Two sections for now: saved cards and
 * reminder defaults. Everything reads from the same hooks the wizard uses, so
 * a card deleted here disappears from the wizard on the next open.
 */
export default function SettingsScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>
        Manage saved cards and how we remind you.
      </Text>

      <PaymentMethodsSection />
      <NotificationsSection />
      <RemindersSection />
      <AboutSection />
    </View>
  )
}

// ── Payment methods ──────────────────────────────────────────────────────

function PaymentMethodsSection() {
  const { data, isLoading } = usePaymentMethods()
  const cards: PaymentMethod[] = data ?? []
  const deleteM = useDeletePaymentMethod()
  const confirm = useConfirm()
  const toast = useToast()

  const removeCard = async (card: PaymentMethod) => {
    const ok = await confirm({
      title: 'Remove this card?',
      body: `•••• ${card.last4} will be removed. Subscriptions linked to it stay, but you'll need to attach a new card.`,
      confirmLabel: 'Remove',
      destructive: true,
    })
    if (!ok) return
    deleteM.mutate(card.id, {
      onSuccess: () =>
        toast(`Card •••• ${card.last4} removed`, { kind: 'success' }),
    })
  }

  return (
    <SectionCard
      title="Payment methods"
      subtitle="Only last 4 digits are stored — never the full number."
    >
      {isLoading ? (
        <Text style={styles.hint}>Loading…</Text>
      ) : cards.length === 0 ? (
        <Text style={styles.hint}>
          No cards yet. Add one from the Add Subscription flow.
        </Text>
      ) : (
        <View style={{ gap: 10 }}>
          {cards.map((card) => (
            <CardRow key={card.id} card={card} onRemove={() => removeCard(card)} />
          ))}
        </View>
      )}
    </SectionCard>
  )
}

function CardRow({
  card,
  onRemove,
}: {
  card: PaymentMethod
  onRemove: () => void
}) {
  return (
    <View style={styles.cardRow}>
      <View style={styles.brandBadge}>
        <Text style={styles.brandBadgeText}>{brandLabel(card.brand)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>•••• {card.last4}</Text>
        <Text style={styles.cardMeta}>
          Exp {String(card.expMonth).padStart(2, '0')}/
          {String(card.expYear).slice(-2)}
          {card.nickname ? ` · ${card.nickname}` : ''}
          {card.isDefault ? ' · Default' : ''}
        </Text>
      </View>
      <Pressable onPress={onRemove} hitSlop={8} style={styles.iconBtn}>
        <Feather name="trash-2" size={16} color={colors.danger} />
      </Pressable>
    </View>
  )
}

// ── Notifications ────────────────────────────────────────────────────────

// Presets are stored as `start-end` HH:MM strings; null pair = quiet hours off.
type QuietPreset = { key: string; label: string; start: string | null; end: string | null }
const QUIET_PRESETS: QuietPreset[] = [
  { key: 'off',    label: 'Off',           start: null,    end: null    },
  { key: 'night',  label: '22:00 → 08:00', start: '22:00', end: '08:00' },
  { key: 'strict', label: '21:00 → 09:00', start: '21:00', end: '09:00' },
]

function NotificationsSection() {
  const enabled = usePrefs((s) => s.remindersEnabled)
  const qhStart = usePrefs((s) => s.quietHoursStart)
  const qhEnd   = usePrefs((s) => s.quietHoursEnd)
  const setPref = usePrefs((s) => s.set)
  const toast = useToast()

  const activeKey = QUIET_PRESETS.find(
    (p) => p.start === qhStart && p.end === qhEnd
  )?.key ?? 'off'

  const toggle = (v: boolean) => {
    setPref('remindersEnabled', v)
    toast(v ? 'Reminders on' : 'Reminders paused', { kind: 'success' })
  }

  const chooseQuiet = (p: QuietPreset) => {
    setPref('quietHoursStart', p.start)
    setPref('quietHoursEnd', p.end)
    toast(
      p.key === 'off'
        ? 'Quiet hours off'
        : `Quiet hours ${p.label}`,
      { kind: 'success' }
    )
  }

  return (
    <SectionCard
      title="Notifications"
      subtitle="Master switch, plus a nightly window where we stay silent."
    >
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Reminders</Text>
        <Switch
          value={enabled}
          onValueChange={toggle}
          trackColor={{ true: colors.primary, false: '#D6D3CB' }}
          thumbColor="#fff"
        />
      </View>

      <View
        style={[
          styles.quietBlock,
          !enabled && { opacity: 0.4 },
        ]}
        pointerEvents={enabled ? 'auto' : 'none'}
      >
        <Text style={styles.quietLabel}>Quiet hours</Text>
        <View style={styles.chipRow}>
          {QUIET_PRESETS.map((p) => {
            const active = activeKey === p.key
            return (
              <Pressable
                key={p.key}
                onPress={() => chooseQuiet(p)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {p.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    </SectionCard>
  )
}

// ── Reminders ─────────────────────────────────────────────────────────────

const LEAD_PRESETS = [1, 2, 3, 7]

function RemindersSection() {
  const leadDays = usePrefs((s) => s.reminderLeadDaysDefault)
  const setPref = usePrefs((s) => s.set)
  const toast = useToast()

  const choose = (d: number) => {
    setPref('reminderLeadDaysDefault', d)
    toast(`Reminders set to ${d} day${d === 1 ? '' : 's'} before`, {
      kind: 'success',
    })
  }

  return (
    <SectionCard
      title="Default reminder"
      subtitle="How many days before a renewal we'll nudge you."
    >
      <View style={styles.chipRow}>
        {LEAD_PRESETS.map((d) => {
          const active = leadDays === d
          return (
            <Pressable
              key={d}
              onPress={() => choose(d)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {d} day{d === 1 ? '' : 's'}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </SectionCard>
  )
}

// ── About / diagnostics ───────────────────────────────────────────────────

function AboutSection() {
  const [taps, setTaps] = useState(0)
  const currency = usePrefs((s) => s.currency)
  return (
    <SectionCard title="About">
      <View style={{ gap: 8 }}>
        <Row label="Currency" value={currency} />
        <Row label="Version" value="0.4.6 (Phase 4.6)" />
        <Pressable onPress={() => setTaps((t) => t + 1)}>
          <Row
            label="Build"
            value={taps >= 5 ? 'debug · anon-auth · realtime' : '—'}
          />
        </Pressable>
      </View>
    </SectionCard>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

// ── Shared shell ──────────────────────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320 }}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      <View style={{ marginTop: 12 }}>{children}</View>
    </MotiView>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  title: {
    fontSize: 26,
    fontFamily: font.bold,
    color: colors.ink,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: font.regular,
    color: colors.muted,
    marginBottom: 4,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.card,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: font.bold,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  sectionSub: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: font.regular,
    color: colors.muted,
  },
  hint: {
    fontSize: 13,
    fontFamily: font.regular,
    color: colors.muted,
    paddingVertical: 4,
  },
  // Card rows
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: '#F8F6F1',
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.ink,
  },
  brandBadgeText: {
    color: '#fff',
    fontFamily: font.bold,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  cardTitle: {
    fontFamily: font.bold,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  cardMeta: {
    marginTop: 2,
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.muted,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
  },
  // Chip row for reminder presets
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: '#F4F3F0',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.ink,
  },
  chipTextActive: {
    color: '#fff',
  },
  // About rows
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowLabel: {
    fontFamily: font.medium,
    fontSize: 13,
    color: colors.muted,
  },
  rowValue: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.ink,
  },
  quietBlock: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quietLabel: {
    fontFamily: font.medium,
    fontSize: 12,
    color: colors.muted,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
})
