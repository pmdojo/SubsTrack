import React, { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { MotiView } from '../lib/motion'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, elevation, font, radius, spacing } from '../theme'
import type { Subscription } from '../lib/types'

type Props = { subs: Subscription[] }

function greetingFor(now = new Date()): string {
  const h = now.getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export default function Header({ subs }: Props) {
  const greeting = useMemo(greetingFor, [])
  const hasSoonExpiring = useMemo(() => {
    const now = Date.now()
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
    return subs.some((s) => {
      if (s.status !== 'active') return false
      const billing = new Date(s.billingDate).getTime()
      if (Number.isNaN(billing)) return false
      const diff = billing - now
      return diff >= 0 && diff <= SEVEN_DAYS
    })
  }, [subs])

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <MotiView
          from={{ scale: 0.96 }}
          animate={{ scale: 1 }}
          transition={{ type: 'timing', duration: 1600, loop: true }}
          style={styles.avatarWrap}
        >
          <LinearGradient
            colors={['#7B6EF6', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>RS</Text>
          </LinearGradient>
        </MotiView>
        <View>
          <Text style={styles.hi}>{greeting},</Text>
          <Text style={styles.name}>Rajashri 👋</Text>
          <Text style={styles.sub}>Let's manage your subscriptions.</Text>
        </View>
      </View>
      <View style={styles.iconRow}>
        <IconButton ariaLabel="Notifications" showDot={hasSoonExpiring}>
          <Feather name="bell" size={18} color={colors.ink} />
        </IconButton>
        <IconButton ariaLabel="Search">
          <Feather name="search" size={18} color={colors.ink} />
        </IconButton>
      </View>
    </View>
  )
}

function IconButton({
  children,
  ariaLabel,
  showDot = false,
}: {
  children: React.ReactNode
  ariaLabel: string
  showDot?: boolean
}) {
  return (
    <Pressable
      accessibilityLabel={ariaLabel}
      style={({ pressed }) => [
        styles.iconBtn,
        pressed && { transform: [{ scale: 0.95 }] },
      ]}
    >
      {children}
      {showDot && <View style={styles.dot} />}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },
  avatarWrap: {
    ...elevation.float,
    shadowColor: '#4F46E5',
    borderRadius: 26,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: -0.4,
    fontFamily: font.bold,
  },
  hi: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: font.regular,
    letterSpacing: -0.1,
  },
  name: {
    fontSize: 22,
    color: colors.ink,
    fontFamily: font.bold,
    letterSpacing: -0.8,
    marginTop: 1,
  },
  sub: {
    marginTop: 4,
    fontSize: 12.5,
    color: colors.muted,
    fontFamily: font.regular,
  },
  iconRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 2,
  },
  iconBtn: {
    position: 'relative',
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.card,
  },
  dot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3A30',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
})
