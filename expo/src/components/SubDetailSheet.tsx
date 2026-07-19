import React, { useMemo, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { MotiView, AnimatePresence } from '../lib/motion'
import { colors, elevation, font, radius, spacing } from '../theme'
import type { Subscription } from '../lib/types'
import { formatINR } from '../lib/store'

type Props = {
  sub: Subscription | null
  onClose: () => void
  onEdit: (sub: Subscription) => void
  onDelete: (id: string) => void
}

type ActionKind =
  | 'manage'
  | 'pause'
  | 'renew'
  | 'cancel'
  | 'change-card'
  | 'reminder'
  | 'export'
  | 'history'

const SECONDARY: {
  key: Exclude<ActionKind, 'manage'>
  label: string
  icon: keyof typeof Feather.glyphMap
  tone?: 'default' | 'danger'
}[] = [
  { key: 'pause', label: 'Pause Subscription', icon: 'pause-circle' },
  { key: 'renew', label: 'Renew Now', icon: 'rotate-ccw' },
  { key: 'change-card', label: 'Change Payment Method', icon: 'credit-card' },
  { key: 'reminder', label: 'Reminder Settings', icon: 'bell' },
  { key: 'export', label: 'Export Invoice', icon: 'download' },
  { key: 'history', label: 'View Billing History', icon: 'clock' },
  { key: 'cancel', label: 'Cancel Subscription', icon: 'x-circle', tone: 'danger' },
]

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function SubDetailSheet({ sub, onClose, onEdit, onDelete }: Props) {
  const [toast, setToast] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<ActionKind | null>(null)

  const meta = useMemo(() => {
    if (!sub) return null
    return [
      { label: 'Amount', value: `${formatINR(sub.price)} / month`, icon: 'dollar-sign' as const },
      { label: 'Billing Cycle', value: 'Monthly', icon: 'refresh-cw' as const },
      { label: 'Payment Method', value: `Card •••• ${sub.cardLast4}`, icon: 'credit-card' as const },
      { label: 'Renewal Date', value: formatDate(sub.billingDate), icon: 'calendar' as const },
      { label: 'Category', value: sub.category, icon: 'grid' as const },
      { label: 'Status', value: sub.status === 'active' ? 'Active' : 'Expired', icon: 'zap' as const },
    ]
  }, [sub])

  const fireToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  const handleAction = (kind: ActionKind) => {
    if (!sub) return
    if (kind === 'cancel' || kind === 'pause') {
      setConfirming(kind)
      return
    }
    if (kind === 'manage') {
      onEdit(sub)
      onClose()
      return
    }
    const labels: Partial<Record<ActionKind, string>> = {
      renew: 'Renewed for next cycle',
      'change-card': 'Payment method updated',
      reminder: 'Reminder saved',
      export: 'Invoice exported',
      history: 'Billing history opened',
    }
    fireToast(labels[kind] ?? 'Done')
  }

  const confirmAction = () => {
    if (!sub || !confirming) return
    if (confirming === 'cancel') {
      onDelete(sub.id)
      fireToast('Subscription cancelled')
      setConfirming(null)
      setTimeout(onClose, 700)
      return
    }
    if (confirming === 'pause') {
      fireToast(`${sub.name} paused`)
      setConfirming(null)
    }
  }

  return (
    <AnimatePresence>
      {sub && (
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

              <View style={styles.headRow}>
                <View style={[styles.icon, { backgroundColor: sub.color }]}>
                  <Text style={styles.iconText}>{sub.icon}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.name}>{sub.name}</Text>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            sub.status === 'active'
                              ? colors.successBg
                              : colors.dangerBg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color:
                              sub.status === 'active'
                                ? colors.success
                                : colors.danger,
                          },
                        ]}
                      >
                        {sub.status === 'active' ? 'Active' : 'Expired'}
                      </Text>
                    </View>
                    <Text style={styles.category}>{sub.category}</Text>
                  </View>
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
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {/* Amount panel */}
                <View style={styles.pricePanel}>
                  <Text style={styles.priceLabel}>Next Charge</Text>
                  <Text style={styles.priceValue}>{formatINR(sub.price)}</Text>
                  <Text style={styles.priceSub}>
                    on {formatDate(sub.billingDate)}
                  </Text>
                </View>

                {/* Meta grid */}
                <View style={styles.metaGrid}>
                  {meta!.map((m) => (
                    <View key={m.label} style={styles.metaTile}>
                      <View style={styles.metaIcon}>
                        <Feather
                          name={m.icon}
                          size={14}
                          color={colors.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.metaLabel}>{m.label}</Text>
                        <Text style={styles.metaValue}>{m.value}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Primary action */}
                <Pressable
                  onPress={() => handleAction('manage')}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && { transform: [{ translateY: -1 }] },
                  ]}
                >
                  <Feather name="sliders" size={16} color="#fff" />
                  <Text style={styles.primaryBtnText}>Manage Subscription</Text>
                </Pressable>

                {/* Secondary actions */}
                <View style={{ marginTop: 18, gap: 6 }}>
                  {SECONDARY.map((a) => (
                    <Pressable
                      key={a.key}
                      onPress={() => handleAction(a.key)}
                      style={({ pressed }) => [
                        styles.actionRow,
                        pressed && { backgroundColor: '#F0EEFE' },
                      ]}
                    >
                      <View
                        style={[
                          styles.actionIcon,
                          a.tone === 'danger' && { backgroundColor: '#FDECEC' },
                        ]}
                      >
                        <Feather
                          name={a.icon}
                          size={15}
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
                    ? 'Cancel this subscription?'
                    : 'Pause this subscription?'}
                </Text>
                <Text style={styles.confirmBody}>
                  {confirming === 'cancel'
                    ? "You'll lose access at the end of your current cycle. This can't be undone."
                    : `${sub.name} won't renew until you resume.`}
                </Text>
                <View style={styles.confirmRow}>
                  <Pressable
                    onPress={() => setConfirming(null)}
                    style={[styles.confirmBtn, styles.confirmBtnGhost]}
                  >
                    <Text style={styles.confirmBtnGhostText}>Keep</Text>
                  </Pressable>
                  <Pressable
                    onPress={confirmAction}
                    style={[
                      styles.confirmBtn,
                      confirming === 'cancel'
                        ? styles.confirmBtnDanger
                        : styles.confirmBtnPrimary,
                    ]}
                  >
                    <Text style={styles.confirmBtnFilledText}>
                      {confirming === 'cancel' ? 'Cancel' : 'Pause'}
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
      )}
    </AnimatePresence>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    inset: 0 as any,
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
    fontSize: 22,
    color: colors.ink,
    letterSpacing: -0.6,
    fontFamily: font.bold,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: font.bold,
  },
  category: {
    fontSize: 11,
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
  pricePanel: {
    backgroundColor: '#F7F5FF',
    borderRadius: radius.xl,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EEE9FE',
  },
  priceLabel: {
    fontSize: 11,
    color: '#6B6787',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: font.medium,
  },
  priceValue: {
    fontSize: 32,
    color: colors.ink,
    letterSpacing: -1.1,
    fontFamily: font.bold,
    marginTop: 4,
  },
  priceSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    fontFamily: font.regular,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  metaTile: {
    width: '48.5%',
    backgroundColor: '#F7F6F4',
    borderRadius: radius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#EFEDE7',
  },
  metaIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EEE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaLabel: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: font.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaValue: {
    fontSize: 13,
    color: colors.ink,
    fontFamily: font.semibold,
    marginTop: 1,
  },
  primaryBtn: {
    marginTop: 18,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...elevation.float,
    shadowColor: colors.primary,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: font.bold,
    letterSpacing: -0.2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: radius.md,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F4F3F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
    fontFamily: font.semibold,
  },
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
  confirmBtnPrimary: {
    backgroundColor: colors.primary,
  },
  confirmBtnDanger: {
    backgroundColor: colors.danger,
  },
  confirmBtnFilledText: {
    color: '#fff',
    fontFamily: font.bold,
    fontSize: 14,
  },
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
