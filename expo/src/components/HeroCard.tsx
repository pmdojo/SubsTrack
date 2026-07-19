import React, { useMemo, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from '../lib/motion'
import { colors, radius } from '../theme'
import type { Subscription } from '../lib/types'
import { formatINR } from '../lib/store'
import OrbitIcon from './OrbitIcon'

type Props = { subs: Subscription[] }
type PayState = 'idle' | 'processing' | 'paid'

export default function HeroCard({ subs }: Props) {
  const { width } = useWindowDimensions()
  const small = width < 380

  const activeSubs = useMemo(
    () => subs.filter((s) => s.status === 'active'),
    [subs]
  )
  const totalMonthly = useMemo(
    () => activeSubs.reduce((sum, s) => sum + s.price, 0),
    [activeSubs]
  )
  const inner = activeSubs.slice(0, 4)
  const outer = activeSubs.slice(4, 7)

  const [payState, setPayState] = useState<PayState>('idle')

  const handlePay = () => {
    if (payState !== 'idle') return
    setPayState('processing')
    setTimeout(() => setPayState('paid'), 1200)
    setTimeout(() => setPayState('idle'), 2600)
  }

  const btnLabel =
    payState === 'processing'
      ? 'Processing…'
      : payState === 'paid'
        ? 'Paid ✓'
        : 'Pay Now'

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#E9E4FB', '#F1EDFE', '#EDE7FE']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Decorative soft blobs */}
        <View style={[styles.deco, styles.decoTop]} pointerEvents="none" />
        <View style={[styles.deco, styles.decoBottom]} pointerEvents="none" />

        {/* Top strip: caption on left, floating orbit card on right */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.caption}>Manage</Text>
            <Text style={styles.captionBold}>your payments</Text>
          </View>
          <OrbitFloatCard
            inner={inner}
            outer={outer}
            count={activeSubs.length}
          />
        </View>

        {/* Amount block */}
        <View style={{ marginTop: 22 }}>
          <Text
            style={[styles.amount, small && { fontSize: 38 }]}
            numberOfLines={1}
          >
            {formatINR(totalMonthly)}
          </Text>
          <Text style={styles.due}>Due payment</Text>
        </View>

        {/* Pay button */}
        <View style={{ marginTop: 20 }}>
          <Pressable
            onPress={handlePay}
            style={({ pressed }) => [
              styles.payBtn,
              payState === 'paid' && { backgroundColor: '#1DB954' },
              pressed && { transform: [{ translateY: -2 }] },
            ]}
          >
            <Text
              style={[
                styles.payText,
                payState === 'paid' && { color: '#fff' },
              ]}
            >
              {btnLabel}
            </Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  )
}

function OrbitFloatCard({
  inner,
  outer,
  count,
}: {
  inner: Subscription[]
  outer: Subscription[]
  count: number
}) {
  return (
    <View style={styles.orbitCard}>
      <View style={styles.orbitBox}>
        <MotiView
          from={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ type: 'timing', duration: 1000, loop: true }}
          style={styles.centerCircle}
        >
          <Text style={styles.centerGlyph}>✳</Text>
        </MotiView>

        {inner.map((s, i) => (
          <OrbitIcon
            key={`inner-${s.id}`}
            icon={s.icon}
            color={s.color}
            index={i}
            total={Math.max(4, inner.length)}
            radius={30}
            size={22}
            durationMs={8000}
          />
        ))}
        {outer.map((s, i) => (
          <OrbitIcon
            key={`outer-${s.id}`}
            icon={s.icon}
            color={s.color}
            index={i}
            total={Math.max(3, outer.length)}
            radius={44}
            size={20}
            durationMs={12000}
            reverse
          />
        ))}
      </View>
      <Text style={styles.orbitCount}>
        <Text style={styles.orbitCountBold}>{count}+</Text> active subscription
      </Text>
      <Text style={styles.orbitAgo}>4 min ago ↻</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    shadowColor: '#7B6EF6',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  card: {
    borderRadius: radius.xxl,
    padding: 22,
    paddingTop: 24,
    paddingBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  deco: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: '#fff',
  },
  decoTop: {
    width: 220,
    height: 220,
    opacity: 0.35,
    top: -100,
    right: -60,
  },
  decoBottom: {
    width: 160,
    height: 160,
    opacity: 0.25,
    bottom: -70,
    left: -30,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  caption: {
    fontSize: 13,
    color: '#6E6B90',
    fontFamily: 'DMSans_400Regular',
  },
  captionBold: {
    fontSize: 17,
    color: colors.ink,
    fontWeight: '700',
    letterSpacing: -0.3,
    fontFamily: 'DMSans_700Bold',
    marginTop: 2,
  },
  orbitCard: {
    width: 148,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: radius.xl,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#7B6EF6',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  orbitBox: {
    width: 108,
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#7B6EF6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7B6EF6',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  centerGlyph: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'DMSans_700Bold',
  },
  orbitCount: {
    marginTop: 4,
    fontSize: 10,
    color: '#4C4A6A',
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
  },
  orbitCountBold: {
    color: '#7B6EF6',
    fontWeight: '700',
    fontFamily: 'DMSans_700Bold',
  },
  orbitAgo: {
    fontSize: 9,
    color: '#9995B0',
    marginTop: 1,
    fontFamily: 'DMSans_400Regular',
  },
  amount: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -2,
    fontFamily: 'DMSans_700Bold',
  },
  due: {
    marginTop: 4,
    fontSize: 12,
    color: '#6E6B90',
    fontFamily: 'DMSans_400Regular',
  },
  payBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: radius.pill,
    shadowColor: '#7B6EF6',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  payText: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: -0.2,
  },
})
