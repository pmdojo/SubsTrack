import React, { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Text, TextStyle, StyleProp } from 'react-native'

type Props = {
  to: number
  format?: (n: number) => string
  durationMs?: number
  style?: StyleProp<TextStyle>
  numberOfLines?: number
  decimals?: number
}

/**
 * Tweens a number from 0 → `to` on mount (and re-tweens from current on change).
 * Uses Animated.Value + listener → setState, so the visible Text updates each frame.
 */
export default function AnimatedCounter({
  to,
  format,
  durationMs = 1100,
  style,
  numberOfLines,
  decimals = 0,
}: Props) {
  const value = useRef(new Animated.Value(0)).current
  const [display, setDisplay] = useState(0)
  const target = useRef(to)

  useEffect(() => {
    const id = value.addListener(({ value: v }) => setDisplay(v))
    return () => value.removeListener(id)
  }, [value])

  useEffect(() => {
    target.current = to
    Animated.timing(value, {
      toValue: to,
      duration: durationMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [to, durationMs, value])

  const rendered =
    format?.(display) ??
    (decimals > 0 ? display.toFixed(decimals) : String(Math.round(display)))

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {rendered}
    </Text>
  )
}
