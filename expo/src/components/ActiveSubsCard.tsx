import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { MotiView } from '../lib/motion'
import { colors, radius } from '../theme'
import type { Subscription } from '../lib/types'

type Props = { subs: Subscription[] }

const MAX_STACK = 4

export default function ActiveSubsCard({ subs }: Props) {
  const activeSubs = useMemo(
    () => subs.filter((s) => s.status === 'active'),
    [subs]
  )
  const shown = activeSubs.slice(0, MAX_STACK)
  const remaining = Math.max(0, activeSubs.length - shown.length)

  const [pressedIdx, setPressedIdx] = useState<number | null>(null)
  const [fanOut, setFanOut] = useState(false)

  const spin = useSharedValue(0)
  const refreshStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }))

  const handleRefresh = () => {
    spin.value = 0
    spin.value = withTiming(360, { duration: 600, easing: Easing.out(Easing.cubic) })
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>ACTIVE SUBS</Text>

      <View style={styles.row}>
        <Text style={styles.count}>{activeSubs.length}</Text>
        <Pressable onPress={handleRefresh} hitSlop={8}>
          <Animated.View style={refreshStyle}>
            <Feather name="refresh-cw" size={16} color={colors.muted} />
          </Animated.View>
        </Pressable>
      </View>

      <Pressable
        onPressIn={() => setFanOut(true)}
        onPressOut={() => {
          setFanOut(false)
          setPressedIdx(null)
        }}
        style={styles.stackWrap}
      >
        {shown.map((s, i) => {
          const baseMargin = i === 0 ? 0 : -10
          const expandedMargin = i === 0 ? 0 : -2
          const isPressed = pressedIdx === i
          return (
            <Pressable
              key={s.id}
              onPressIn={() => setPressedIdx(i)}
              onPressOut={() => setPressedIdx(null)}
              style={{ position: 'relative' }}
            >
              <MotiView
                animate={{
                  marginLeft: fanOut ? expandedMargin : baseMargin,
                  translateY: isPressed ? -6 : 0,
                  scale: isPressed ? 1.15 : 1,
                }}
                transition={{ type: 'spring', damping: 14, stiffness: 220 }}
                style={[
                  styles.icon,
                  { backgroundColor: s.color, zIndex: isPressed ? 20 : i },
                ]}
              >
                <Text style={styles.iconText}>{s.icon}</Text>
              </MotiView>
              {isPressed && (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipText}>{s.name}</Text>
                </View>
              )}
            </Pressable>
          )
        })}
        {remaining > 0 && (
          <MotiView
            animate={{ marginLeft: fanOut ? -2 : -10 }}
            transition={{ type: 'spring', damping: 14, stiffness: 220 }}
            style={[
              styles.icon,
              {
                backgroundColor: colors.primarySoft,
              },
            ]}
          >
            <Text style={[styles.iconText, { color: colors.primary, fontSize: 12 }]}>
              +{remaining}
            </Text>
          </MotiView>
        )}
      </Pressable>

      <Text style={styles.hint}>Tap to manage</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  label: {
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1,
    fontWeight: '600',
    fontFamily: 'DMSans_500Medium',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  count: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.9,
    fontFamily: 'DMSans_700Bold',
  },
  stackWrap: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 2.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  tooltip: {
    position: 'absolute',
    top: -28,
    left: '50%',
    marginLeft: -30,
    backgroundColor: colors.ink,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 30,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
  },
  hint: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 8,
    fontFamily: 'DMSans_400Regular',
  },
})
