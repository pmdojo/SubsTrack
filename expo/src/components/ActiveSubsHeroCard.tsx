import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, elevation, font } from '../theme'
import type { Subscription } from '../lib/types'
import RollingNumber from './RollingNumber'

type Props = {
  subs: Subscription[]
  onOpen?: () => void
}

// ── Orbit config ─────────────────────────────────────────────────────────────
// Icons live inside a fixed 130×130 invisible ring centered in the card.
// Circle (not ellipse) so nothing ever spills past the container bounds.
const ORBIT_COUNT = 8
const REV_MS = 18000
const SAMPLES = 60
const ORBIT_BOX = 130 // diameter of the invisible orbit container
const ICON_SIZE = 28
const RADIUS = (ORBIT_BOX - ICON_SIZE) / 2 // 51 — icon centers hug the ring
const BOB_AMPLITUDE = 2 // very subtle bob so the ring stays contained
// Subtle depth cues — this is a decorative accent, not the focal point
const SCALE_MIN = 0.85
const SCALE_MAX = 1.05
const OPACITY_MIN = 0.55
const OPACITY_MAX = 1

function buildRanges(phaseOffset: number) {
  const inputRange: number[] = []
  const outX: number[] = []
  const outY: number[] = []
  const outScale: number[] = []
  const outOpacity: number[] = []
  const outBob: number[] = []
  for (let s = 0; s <= SAMPLES; s++) {
    const t = s / SAMPLES
    const angle = 2 * Math.PI * ((t + phaseOffset) % 1)
    inputRange.push(t)
    outX.push(Math.cos(angle) * RADIUS)
    outY.push(Math.sin(angle) * RADIUS)
    const front = (Math.sin(angle) + 1) / 2 // 0 back, 1 front
    outScale.push(SCALE_MIN + front * (SCALE_MAX - SCALE_MIN))
    outOpacity.push(OPACITY_MIN + front * (OPACITY_MAX - OPACITY_MIN))
    outBob.push(Math.sin(angle * 3 + phaseOffset * 6) * BOB_AMPLITUDE)
  }
  return { inputRange, outX, outY, outScale, outOpacity, outBob }
}

export default function ActiveSubsHeroCard({ subs, onOpen }: Props) {
  const active = useMemo(
    () => subs.filter((s) => s.status === 'active'),
    [subs]
  )
  const count = active.length
  const orbiters = active.slice(0, ORBIT_COUNT)

  const ranges = useMemo(
    () =>
      Array.from({ length: ORBIT_COUNT }, (_, i) =>
        buildRanges(i / ORBIT_COUNT)
      ),
    []
  )

  const phase = useRef(new Animated.Value(0)).current
  const gather = useRef(new Animated.Value(0)).current
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [gathering, setGathering] = useState(false)

  useEffect(() => {
    phase.setValue(0)
    const anim = Animated.loop(
      Animated.timing(phase, {
        toValue: 1,
        duration: hovered ? REV_MS * 1.4 : REV_MS,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    )
    anim.start()
    return () => anim.stop()
  }, [hovered, phase])

  const handlePress = () => {
    if (gathering) return
    setGathering(true)
    Animated.timing(gather, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return
      onOpen?.()
      setTimeout(() => {
        Animated.timing(gather, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start(() => setGathering(false))
      }, 320)
    })
  }

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [{ translateY: pressed || hovered ? -6 : 0 }],
          shadowOpacity: pressed || hovered ? 0.24 : 0.14,
          shadowRadius: pressed || hovered ? 28 : 22,
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={styles.pressable}
      >
        <LinearGradient
          colors={
            hovered
              ? ['#F5EFFF', '#EBE0FE', '#DAC9F8']
              : ['#FDFBFF', '#F1EBFE', '#E6DEFB']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Ambient radial glow behind the count */}
          <View style={styles.glow} pointerEvents="none" />

          {/* Center block: number + orbit ring around it, then caption */}
          <View style={styles.centerBlock}>
            <View style={styles.orbitBox}>
              {/* Icons — absolutely positioned around center */}
              {orbiters.map((sub, i) => {
                const r = ranges[i]
                const gatherOut = gather.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                })
                const x = Animated.multiply(
                  phase.interpolate({
                    inputRange: r.inputRange,
                    outputRange: r.outX,
                  }),
                  gatherOut
                )
                const yOrbit = Animated.multiply(
                  phase.interpolate({
                    inputRange: r.inputRange,
                    outputRange: r.outY,
                  }),
                  gatherOut
                )
                const bob = phase.interpolate({
                  inputRange: r.inputRange,
                  outputRange: r.outBob,
                })
                const y = Animated.add(yOrbit, bob)
                const scale = Animated.multiply(
                  phase.interpolate({
                    inputRange: r.inputRange,
                    outputRange: r.outScale,
                  }),
                  gather.interpolate({
                    inputRange: [0, 1],
                    outputRange: [hovered ? 1.06 : 1, 0.4],
                  })
                )
                const opacity = Animated.multiply(
                  phase.interpolate({
                    inputRange: r.inputRange,
                    outputRange: r.outOpacity,
                  }),
                  gather.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.2],
                  })
                )
                return (
                  <Animated.View
                    key={sub.id}
                    style={[
                      styles.icon,
                      {
                        backgroundColor: sub.color,
                        transform: [
                          { translateX: x },
                          { translateY: y },
                          { scale },
                        ],
                        opacity,
                      },
                    ]}
                    pointerEvents="none"
                  >
                    <Text style={styles.iconText}>{sub.icon}</Text>
                  </Animated.View>
                )
              })}

              {/* Count — dead center of the orbit ring, primary focal point */}
              <View style={styles.countWrap} pointerEvents="none">
                <RollingNumber
                  value={count}
                  size={64}
                  style={styles.count}
                  durationMs={1000}
                />
              </View>
            </View>

            {/* Caption directly beneath the number */}
            <Text style={styles.caption}>Active Subscriptions</Text>
          </View>

          {/* Bottom-anchored CTA */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Tap to Manage →</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    ...elevation.card,
    shadowColor: '#7B6EF6',
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 16 },
    borderRadius: 32,
  },
  pressable: {
    borderRadius: 32,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 32,
    height: 320,
    padding: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 160,
    height: 160,
    marginLeft: -80,
    marginTop: -80,
    borderRadius: 80,
    backgroundColor: '#EDE9FE',
    opacity: 0.7,
    shadowColor: '#7B6EF6',
    shadowOpacity: 0.35,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  // Fixed 130×130 invisible ring container — orbit lives entirely inside this.
  orbitBox: {
    width: ORBIT_BOX,
    height: ORBIT_BOX,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    // Anchor at the center point so translate is relative to it
    left: '50%',
    top: '50%',
    marginLeft: -ICON_SIZE / 2,
    marginTop: -ICON_SIZE / 2,
  },
  iconText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: font.bold,
  },
  // Count sits dead center of orbitBox
  countWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    color: colors.ink,
    fontSize: 64,
    letterSpacing: -3,
    fontFamily: font.bold,
    lineHeight: 64,
  },
  caption: {
    marginTop: 14,
    color: '#3F3D3A',
    fontSize: 13,
    fontFamily: font.semibold,
    letterSpacing: -0.2,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: font.semibold,
    letterSpacing: -0.1,
  },
})
