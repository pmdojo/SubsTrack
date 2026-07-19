import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from '../lib/motion'
import { colors, elevation, font, radius, spacing } from '../theme'
import type { Subscription } from '../lib/types'
import { formatINR } from '../lib/store'
import AnimatedCounter from './AnimatedCounter'

type Props = {
  subs: Subscription[]
}

type PayState = 'idle' | 'processing' | 'paid'

function daysUntil(iso: string, now = Date.now()): number {
  const d = new Date(iso).getTime()
  if (Number.isNaN(d)) return Infinity
  return Math.round((d - now) / (24 * 60 * 60 * 1000))
}

function dueLabel(days: number): string {
  if (days <= 0) return 'Due Today'
  if (days === 1) return 'Due Tomorrow'
  if (days <= 7) return `Due in ${days} days`
  return `Due in ${days} days`
}

export default function DuePaymentCard({ subs }: Props) {
  const activeSubs = useMemo(
    () => subs.filter((s) => s.status === 'active'),
    [subs]
  )

  // Amount = sum of all upcoming (next 30 days) active subs. Falls back to total.
  const { dueAmount, minDays, upcoming } = useMemo(() => {
    const now = Date.now()
    const withDays = activeSubs.map((s) => ({ s, days: daysUntil(s.billingDate, now) }))
    const soon = withDays.filter((x) => x.days >= 0 && x.days <= 30)
    const source = soon.length ? soon : withDays
    const sum = source.reduce((acc, x) => acc + x.s.price, 0)
    const min = source.length
      ? Math.min(...source.map((x) => x.days))
      : 0
    const upcomingList = [...source]
      .sort((a, b) => a.days - b.days)
      .slice(0, 3)
      .map((x) => x.s)
    return { dueAmount: sum, minDays: min, upcoming: upcomingList }
  }, [activeSubs])

  const [payState, setPayState] = useState<PayState>('idle')
  const handlePay = () => {
    if (payState !== 'idle') return
    setPayState('processing')
    setTimeout(() => setPayState('paid'), 1100)
    setTimeout(() => setPayState('idle'), 2400)
  }

  const [pressed, setPressed] = useState(false)

  return (
    <MotiView
      animate={{ translateY: pressed ? -4 : 0, scale: pressed ? 1.01 : 1 }}
      transition={{ type: 'spring', damping: 18, stiffness: 260 }}
      style={styles.wrapper}
    >
      <Pressable
        onHoverIn={() => setPressed(true)}
        onHoverOut={() => setPressed(false)}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={styles.pressable}
      >
        <LinearGradient
          colors={['#6D5AF8', '#4F46E5', '#3730A3']}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Decorative blobs */}
          <View style={[styles.blob, styles.blobA]} pointerEvents="none" />
          <View style={[styles.blob, styles.blobB]} pointerEvents="none" />

          <View style={styles.head}>
            <Text style={styles.caption}>Due Payment</Text>
            <View style={styles.chip}>
              <View style={styles.chipDot} />
              <Text style={styles.chipText}>{dueLabel(minDays)}</Text>
            </View>
          </View>

          <AnimatedCounter
            to={dueAmount}
            format={(n) => formatINR(n)}
            style={styles.amount}
            numberOfLines={1}
          />

          <Pressable
            onPress={handlePay}
            style={({ pressed: p }) => [
              styles.payBtn,
              payState === 'paid' && { backgroundColor: '#22C55E' },
              p && { transform: [{ translateY: -1 }] },
            ]}
          >
            <Text
              style={[
                styles.payText,
                payState === 'paid' && { color: '#fff' },
              ]}
            >
              {payState === 'processing'
                ? 'Processing…'
                : payState === 'paid'
                  ? 'Paid ✓'
                  : 'Pay Now'}
            </Text>
          </Pressable>

          <View style={styles.upcomingRow}>
            <Text style={styles.upcomingLabel}>Upcoming renewal</Text>
            <View style={styles.upcomingIcons}>
              {upcoming.map((s, i) => (
                <View
                  key={s.id}
                  style={[
                    styles.upcomingIcon,
                    { backgroundColor: s.color, marginLeft: i === 0 ? 0 : -8 },
                  ]}
                >
                  <Text style={styles.upcomingIconText}>{s.icon}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </MotiView>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    ...elevation.hero,
    borderRadius: radius.xxxl,
  },
  pressable: {
    borderRadius: radius.xxxl,
    overflow: 'hidden',
  },
  card: {
    borderRadius: radius.xxxl,
    padding: 24,
    paddingTop: 22,
    overflow: 'hidden',
    height: 320,
    justifyContent: 'space-between',
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: '#fff',
  },
  blobA: {
    width: 220,
    height: 220,
    opacity: 0.09,
    top: -90,
    right: -60,
  },
  blobB: {
    width: 180,
    height: 180,
    opacity: 0.06,
    bottom: -80,
    left: -50,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caption: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: font.medium,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FDE047',
  },
  chipText: {
    color: '#fff',
    fontSize: 10.5,
    fontFamily: font.semibold,
    letterSpacing: 0.2,
  },
  amount: {
    marginTop: 14,
    color: '#fff',
    fontSize: 44,
    letterSpacing: -1.8,
    fontFamily: font.bold,
  },
  payBtn: {
    marginTop: 18,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: radius.pill,
    ...elevation.float,
    shadowColor: '#000',
  },
  payText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: font.bold,
    letterSpacing: -0.2,
  },
  upcomingRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upcomingLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontFamily: font.medium,
    letterSpacing: 0.1,
  },
  upcomingIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingIconText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: font.bold,
  },
})
