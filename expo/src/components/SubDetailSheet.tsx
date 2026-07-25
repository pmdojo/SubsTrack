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

            {/* Header — icon + name + close */}
            <View style={styles.headRow}>
              <View style={[styles.icon, { backgroundColor: sub.color }]}>
                <Text style={styles.iconText}>{sub.icon}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.name}>{sub.name}</Text>
                <Text style={styles.category}>{sub.category}</Text>
              </View>
              <Pressable
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={12}
              >
                <Feather name="x" size={18} color={colors.ink} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {/* Info list — key/value rows */}
              <View style={styles.infoCard}>
                <InfoRow
                  label="Status"
                  right={
                    <View
                      style={[styles.statusPill, { backgroundColor: status.bg }]}
                    >
                      <Text style={styles.statusDot}>{status.dot}</Text>
                      <Text style={[styles.statusText, { color: status.fg }]}>
                        {status.label}
                      </Text>
                    </View>
                  }
                />
                <Divider />
                <InfoRow label="Plan" value={sub.plan ?? 'Standard'} />
                <Divider />
                <InfoRow
                  label="Monthly Cost"
                  value={formatINR(sub.price)}
                  valueBold
                />
                <Divider />
                <InfoRow
                  label="Next Billing"
                  value={formatDate(sub.billingDate)}
                />
                <Divider />
                <InfoRow
                  label="Payment Method"
                  value={`•••• ${sub.cardLast4}`}
                />
                <Divider />
                <InfoRow
                  label="Auto Renewal"
                  right={
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text
                        style={[
                          styles.autoLabel,
                          { color: autoRenew ? colors.success : colors.muted },
                        ]}
                      >
                        {autoRenew ? 'ON' : 'OFF'}
                      </Text>
                      <Switch
                        value={autoRenew}
                        onValueChange={(v) => {
                          onToggleAutoRenew?.(sub, v)
                          fireToast(v ? 'Auto renewal enabled' : 'Auto renewal disabled')
                        }}
                        trackColor={{ true: colors.primary, false: '#D6D3CB' }}
                        thumbColor="#fff"
                      />
                    </View>
                  }
                />
              </View>

              {/* Actions */}
              <View style={styles.actionsGroup}>
                {actions.map((a) => (
                  <Pressable
                    key={a.kind}
                    onPress={() => !a.disabled && handleAction(a.kind)}
                    style={({ pressed }) => [
                      styles.actionRow,
                      pressed && !a.disabled && { backgroundColor: '#F0EEFE' },
                      a.disabled && { opacity: 0.35 },
                    ]}
                  >
                    <View
                      style={[
                        styles.actionIcon,
                        a.tone === 'danger' && { backgroundColor: colors.dangerBg },
                      ]}
                    >
                      <Feather
                        name={a.icon}
                        size={16}
                        color={a.tone === 'danger' ? colors.danger : colors.ink}
                      />
                    </View>
                    <Text
                      style={[
                        styles.actionLabel,
                        a.tone === 'danger' && { color: colors.danger },
                      ]}
                    >
                      {a.label}
                    </Text>
                    <Feather
                      name="chevron-right"
                      size={16}
                      color={colors.muted}
                    />
                  </Pressable>
                ))}
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
