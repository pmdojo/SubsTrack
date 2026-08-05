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
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView, AnimatePresence } from '../lib/motion'
import { colors, elevation, font, radius } from '../theme'
import type { Subscription, SubStatus } from '../lib/types'
import { formatINR } from '../lib/store'

type Props = {
  sub: Subscription | null
  onClose: () => void
  onEdit: (sub: Subscription) => void
  onDelete: (id: string) => void
  onPause: (id: string) => void
  onResume: (id: string) => void
  onCancel: (id: string) => void
  onToggleAutoRenew?: (sub: Subscription, autoRenew: boolean) => void
}

type ActionKind =
  | 'pause-toggle'
  | 'cancel'
  | 'delete'
  | 'change-plan'
  | 'payment-history'
  | 'renew'
  | 'support'

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Days from today to an ISO date. Negative = in the past. */
function daysUntil(iso: string): number {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/** Human label for a days-away integer. */
function renewalChipLabel(days: number, isPaused: boolean, isTerminal: boolean): string {
  if (isTerminal) return 'Not renewing'
  if (isPaused) return 'Paused'
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days <= 7) return `In ${days} days`
  return `In ${days} days`
}

/** '#RRGGBB' → 'rgba(r,g,b,a)'. Falls back to primary tint if malformed. */
function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return `rgba(76,76,229,${alpha})`
  const r = parseInt(m[1], 16)
  const g = parseInt(m[2], 16)
  const b = parseInt(m[3], 16)
  return `rgba(${r},${g},${b},${alpha})`
}

const STATUS_META: Record<
  SubStatus,
  { label: string; dot: string; fg: string; bg: string }
> = {
  active:    { label: 'Active',    dot: '🟢', fg: colors.success, bg: colors.successBg },
  paused:    { label: 'Paused',    dot: '🟡', fg: colors.warn,    bg: colors.warnBg    },
  cancelled: { label: 'Cancelled', dot: '⚪', fg: colors.neutral, bg: colors.neutralBg },
  expired:   { label: 'Expired',   dot: '🔴', fg: colors.danger,  bg: colors.dangerBg  },
}

export default function SubDetailSheet({
  sub,
  onClose,
  onEdit,
  onDelete,
  onPause,
  onResume,
  onCancel,
  onToggleAutoRenew,
}: Props) {
  const [toast, setToast] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<
    'cancel' | 'delete' | null
  >(null)

  if (!sub) {
    return (
      <AnimatePresence>{null}</AnimatePresence>
    )
  }

  const status = STATUS_META[sub.status]
  const autoRenew = sub.autoRenew ?? true
  const isPaused = sub.status === 'paused'
  const isTerminal = sub.status === 'cancelled' || sub.status === 'expired'

  const fireToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  const handleAction = (kind: ActionKind) => {
    if (kind === 'pause-toggle') {
      if (isPaused) {
        onResume(sub.id)
        fireToast(`${sub.name} resumed`)
      } else if (sub.status === 'active') {
        setConfirming(null)
        onPause(sub.id)
        fireToast(`${sub.name} paused`)
      } else {
        // cancelled/expired → treat as resume-to-active
        onResume(sub.id)
        fireToast(`${sub.name} reactivated`)
      }
      return
    }
    if (kind === 'cancel') {
      setConfirming('cancel')
      return
    }
    if (kind === 'delete') {
      setConfirming('delete')
      return
    }
    if (kind === 'change-plan') {
      onEdit(sub)
      onClose()
      return
    }
    const labels: Record<ActionKind, string> = {
      'payment-history': 'Payment history opened',
      renew: 'Renewed for next cycle',
      support: 'Support chat launching…',
      'pause-toggle': '',
      cancel: '',
      delete: '',
      'change-plan': '',
    }
    fireToast(labels[kind])
  }

  const confirmDestructive = () => {
    if (confirming === 'cancel') {
      onCancel(sub.id)
      fireToast('Subscription cancelled')
      setConfirming(null)
    } else if (confirming === 'delete') {
      const name = sub.name
      onDelete(sub.id)
      fireToast(`${name} deleted`)
      setConfirming(null)
      setTimeout(onClose, 600)
    }
  }

  // Action list — reflects the spec, with dynamic pause/resume label
  const actions: {
    kind: ActionKind
    label: string
    icon: keyof typeof Feather.glyphMap
    tone?: 'default' | 'danger'
    disabled?: boolean
  }[] = [
    {
      kind: 'pause-toggle',
      label: isPaused
        ? 'Resume Subscription'
        : isTerminal
          ? 'Reactivate Subscription'
          : 'Pause Subscription',
      icon: isPaused ? 'play-circle' : 'pause-circle',
    },
    {
      kind: 'cancel',
      label: 'Cancel Subscription',
      icon: 'slash',
      tone: 'danger',
      disabled: isTerminal,
    },
    { kind: 'change-plan',     label: 'Change Plan',         icon: 'sliders' },
    { kind: 'payment-history', label: 'View Payment History', icon: 'clock' },
    {
      kind: 'renew',
      label: 'Renew Now',
      icon: 'rotate-ccw',
      disabled: sub.status === 'paused',
    },
    { kind: 'support',         label: 'Contact Support',      icon: 'help-circle' },
    { kind: 'delete',          label: 'Delete Permanently',   icon: 'trash-2', tone: 'danger' },
  ]

  return (
    <AnimatePresence>
      <>
        <MotiView
          key="backdrop"
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'timing', duration: 200 }}
          style={styles.backdrop}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </MotiView>

        <MotiView
          key="sheet"
          from={{ translateY: 800 }}
          animate={{ translateY: 0 }}
          exit={{ translateY: 800 }}
          transition={{ type: 'spring', damping: 26, stiffness: 240 }}
          style={styles.sheetWrap}
        >
          <View style={styles.sheet}>
            <View style={styles.grabber} />

            {/* Gradient hero — tinted with the subscription's brand color.
                Reads as a "banner" that unifies icon + name + renewal chip. */}
            <LinearGradient
              colors={[hexToRgba(sub.color, 0.22), hexToRgba(sub.color, 0.04)] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View style={styles.heroTop}>
                <View style={[styles.icon, { backgroundColor: sub.color }]}>
                  <Text style={styles.iconText}>{sub.icon}</Text>
                </View>
                <Pressable
                  onPress={onClose}
                  style={styles.closeBtn}
                  hitSlop={12}
                >
                  <Feather name="x" size={18} color={colors.ink} />
                </Pressable>
              </View>
              <Text style={styles.name}>{sub.name}</Text>
              <Text style={styles.category}>{sub.category}</Text>

              <View style={styles.heroChipsRow}>
                <View
                  style={[styles.statusPill, { backgroundColor: status.bg }]}
                >
                  <Text style={styles.statusDot}>{status.dot}</Text>
                  <Text style={[styles.statusText, { color: status.fg }]}>
                    {status.label}
                  </Text>
                </View>
                <View style={styles.renewalChip}>
                  <Feather name="calendar" size={11} color={colors.ink} />
                  <Text style={styles.renewalChipText}>
                    {renewalChipLabel(daysUntil(sub.billingDate), isPaused, isTerminal)}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {/* 2×2 stat grid — matches reference exactly */}
              <View style={styles.statGrid}>
                <StatTile
                  icon="calendar"
                  label="Next Payment"
                  value={formatDate(sub.billingDate).replace(/, \d{4}$/, (m) => m)}
                  sub={nextPaymentSub(sub.billingDate)}
                />
                <StatTile
                  icon="refresh-cw"
                  label="Billing Cycle"
                  value="Monthly"
                  sub={`Since ${formatMonthYear(sub.billingDate)}`}
                />
                <StatTile
                  icon="clock"
                  label="Total Spent"
                  value={formatINR(sub.price * 12)}
                  sub="Yearly cost"
                />
                <StatTile
                  icon="tv"
                  label="Category"
                  value={sub.category}
                  sub={sub.category === 'Entertainment' ? 'Streaming' : ''}
                />
              </View>

              {/* Toggle rows — icon badge + label/sub + switch */}
              <ToggleRow
                icon="bell"
                title="Payment Reminder"
                sub="Notify me 2 days before"
                value={true}
                onChange={() =>
                  fireToast('Payment reminder saved to defaults in Settings')
                }
              />
              <ToggleRow
                icon="rotate-cw"
                title="Auto-Renew"
                sub="Renew automatically each month"
                value={autoRenew}
                onChange={(v) => {
                  onToggleAutoRenew?.(sub, v)
                  fireToast(v ? 'Auto renewal enabled' : 'Auto renewal disabled')
                }}
              />

              {/* Payment methods row */}
              <View style={styles.pmRow}>
                <View>
                  <Text style={styles.pmLabel}>Payment methods</Text>
                  <Text style={styles.pmValue}>
                    {sub.paymentBrand || sub.cardLast4
                      ? `${sub.paymentBrand ? sub.paymentBrand.toUpperCase() + ' ' : ''}•••• ${sub.cardLast4 || '—'}`
                      : 'Not set'}
                  </Text>
                </View>
                <Pressable
                  style={styles.pmChange}
                  onPress={() => {
                    onEdit(sub)
                    onClose()
                  }}
                >
                  <Text style={styles.pmChangeText}>Change</Text>
                  <Feather name="chevron-right" size={14} color="#fff" />
                </Pressable>
              </View>

              {/* Sticky-feel action pair: Pause + Cancel */}
              <View style={styles.actionPair}>
                <Pressable
                  disabled={isTerminal}
                  onPress={() => handleAction('pause-toggle')}
                  style={({ pressed }) => [
                    styles.actionPill,
                    styles.actionPillPause,
                    isTerminal && { opacity: 0.4 },
                    pressed && !isTerminal && { transform: [{ translateY: -1 }] },
                  ]}
                >
                  <Text style={styles.actionPillText}>
                    {isPaused ? 'Resume' : 'Pause'}
                  </Text>
                  <Feather
                    name={isPaused ? 'play' : 'pause'}
                    size={14}
                    color="#fff"
                  />
                </Pressable>
                <Pressable
                  disabled={isTerminal}
                  onPress={() => handleAction('cancel')}
                  style={({ pressed }) => [
                    styles.actionPill,
                    styles.actionPillCancel,
                    isTerminal && { opacity: 0.4 },
                    pressed && !isTerminal && { transform: [{ translateY: -1 }] },
                  ]}
                >
                  <Text style={styles.actionPillText}>Cancel</Text>
                  <Feather name="x" size={14} color="#fff" />
                </Pressable>
              </View>

              {/* Secondary — subtle text buttons for edit + delete */}
              <View style={styles.secondaryRow}>
                <Pressable
                  onPress={() => handleAction('change-plan')}
                  style={styles.secondaryBtn}
                >
                  <Feather name="sliders" size={13} color={colors.muted} />
                  <Text style={styles.secondaryText}>Change plan</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleAction('delete')}
                  style={styles.secondaryBtn}
                >
                  <Feather name="trash-2" size={13} color={colors.danger} />
                  <Text style={[styles.secondaryText, { color: colors.danger }]}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </MotiView>

        {/* Confirmation dialog */}
        {confirming && (
          <MotiView
            key="confirm"
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            style={styles.confirmWrap}
          >
            <View style={styles.confirm}>
              <Text style={styles.confirmTitle}>
                {confirming === 'cancel'
                  ? `Cancel ${sub.name}?`
                  : `Delete ${sub.name}?`}
              </Text>
              <Text style={styles.confirmBody}>
                {confirming === 'cancel'
                  ? "The subscription will be marked cancelled and stop counting toward your active total. You can reactivate it later."
                  : "This removes the subscription from your list permanently. This can't be undone."}
              </Text>
              <View style={styles.confirmRow}>
                <Pressable
                  onPress={() => setConfirming(null)}
                  style={[styles.confirmBtn, styles.confirmBtnGhost]}
                >
                  <Text style={styles.confirmBtnGhostText}>Keep</Text>
                </Pressable>
                <Pressable
                  onPress={confirmDestructive}
                  style={[styles.confirmBtn, styles.confirmBtnDanger]}
                >
                  <Text style={styles.confirmBtnFilledText}>
                    {confirming === 'cancel' ? 'Cancel it' : 'Delete'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </MotiView>
        )}

        {/* Toast */}
        {toast && (
          <MotiView
            key="toast"
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: 20 }}
            transition={{ type: 'timing', duration: 200 }}
            style={styles.toast}
          >
            <Text style={styles.toastText}>{toast}</Text>
          </MotiView>
        )}
      </>
    </AnimatePresence>
  )
}

// ── Stat + toggle building blocks ───────────────────────────────────────────

function StatTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: keyof typeof Feather.glyphMap
  label: string
  value: string
  sub?: string
}) {
  return (
    <View style={styles.statTile}>
      <View style={styles.statHead}>
        <Feather name={icon} size={13} color={colors.muted} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  )
}

function ToggleRow({
  icon,
  title,
  sub,
  value,
  onChange,
}: {
  icon: keyof typeof Feather.glyphMap
  title: string
  sub: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleBadge}>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: '#D6D3CB' }}
        thumbColor="#fff"
      />
    </View>
  )
}

function nextPaymentSub(iso: string): string {
  const days = daysUntil(iso)
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days <= 30) return `in ${days} days`
  if (days <= 60) return 'in next month'
  return `in ${Math.round(days / 30)} months`
}

function formatMonthYear(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

// ── Small helpers ───────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  right,
  valueBold,
}: {
  label: string
  value?: string
  right?: React.ReactNode
  valueBold?: boolean
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      {right ?? (
        <Text style={[styles.infoValue, valueBold && styles.infoValueBold]}>
          {value}
        </Text>
      )}
    </View>
  )
}

function Divider() {
  return <View style={styles.divider} />
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,10,40,0.45)',
    zIndex: 90,
  },
  sheetWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'flex-end',
    pointerEvents: 'box-none' as any,
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 28,
    height: '90%',
    display: 'flex',
    flexDirection: 'column',
    ...elevation.sheet,
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E1DED8',
    marginBottom: 14,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  hero: {
    borderRadius: radius.xl,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEEBE4',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  heroChipsRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  renewalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  renewalChipText: {
    fontSize: 12,
    fontFamily: font.bold,
    color: colors.ink,
    letterSpacing: -0.1,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.float,
  },
  iconText: {
    color: '#fff',
    fontSize: 22,
    fontFamily: font.bold,
  },
  name: {
    fontSize: 24,
    color: colors.ink,
    letterSpacing: -0.6,
    fontFamily: font.bold,
  },
  category: {
    marginTop: 2,
    fontSize: 12,
    color: colors.muted,
    fontFamily: font.medium,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F4F3F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Info panel
  infoCard: {
    backgroundColor: '#F7F6F4',
    borderRadius: radius.xl,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#EEEBE4',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    minHeight: 44,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: font.medium,
    letterSpacing: -0.1,
  },
  infoValue: {
    fontSize: 14,
    color: colors.ink,
    fontFamily: font.semibold,
    letterSpacing: -0.2,
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 12,
  },
  infoValueBold: {
    fontSize: 15,
    fontFamily: font.bold,
    letterSpacing: -0.3,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEBE4',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  statusDot: {
    fontSize: 10,
  },
  statusText: {
    fontSize: 12,
    fontFamily: font.bold,
    letterSpacing: -0.1,
  },
  autoLabel: {
    fontSize: 12,
    fontFamily: font.bold,
    letterSpacing: 0.4,
  },
  // 2x2 stat grid
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statTile: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 0,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.card,
  },
  statHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: font.bold,
    color: colors.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontFamily: font.bold,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  statSub: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: font.regular,
    color: colors.muted,
  },
  // Toggle rows
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    ...elevation.card,
  },
  toggleBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTitle: {
    fontFamily: font.bold,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  toggleSub: {
    marginTop: 2,
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.muted,
  },
  // Payment methods
  pmRow: {
    marginTop: 6,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  pmLabel: {
    fontFamily: font.bold,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  pmValue: {
    marginTop: 2,
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.muted,
  },
  pmChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  pmChangeText: {
    color: '#fff',
    fontFamily: font.bold,
    fontSize: 12,
    letterSpacing: -0.1,
  },
  // Action pair
  actionPair: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.pill,
  },
  actionPillPause: {
    backgroundColor: '#E38A5B', // warm terracotta like the reference
  },
  actionPillCancel: {
    backgroundColor: colors.danger,
  },
  actionPillText: {
    color: '#fff',
    fontFamily: font.bold,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 6,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  secondaryText: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.muted,
  },
  // Actions
  actionsGroup: {
    gap: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: radius.md,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F4F3F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
    fontFamily: font.semibold,
    letterSpacing: -0.2,
  },
  // Confirm
  confirmWrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: '30%',
    zIndex: 200,
    alignItems: 'center',
  },
  confirm: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: radius.xxl,
    padding: 22,
    ...elevation.sheet,
  },
  confirmTitle: {
    fontSize: 17,
    color: colors.ink,
    fontFamily: font.bold,
    letterSpacing: -0.4,
  },
  confirmBody: {
    marginTop: 8,
    fontSize: 13,
    color: colors.inkSoft,
    fontFamily: font.regular,
    lineHeight: 19,
  },
  confirmRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  confirmBtnGhost: {
    backgroundColor: '#F4F3F0',
  },
  confirmBtnGhostText: {
    color: colors.ink,
    fontFamily: font.bold,
    fontSize: 14,
  },
  confirmBtnDanger: {
    backgroundColor: colors.danger,
  },
  confirmBtnFilledText: {
    color: '#fff',
    fontFamily: font.bold,
    fontSize: 14,
  },
  // Toast
  toast: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    zIndex: 300,
    alignItems: 'center',
  },
  toastText: {
    backgroundColor: colors.ink,
    color: '#fff',
    fontFamily: font.semibold,
    fontSize: 13,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
})
