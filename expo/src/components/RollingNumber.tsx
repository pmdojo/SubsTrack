import React, { useEffect, useMemo, useRef } from 'react'
import {
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native'

type Props = {
  value: number
  /** Height of one digit row — controls glyph size. */
  size?: number
  style?: StyleProp<TextStyle>
  /** Ms per digit-cell roll. */
  durationMs?: number
}

const DIGITS = '0123456789'.split('')

/**
 * Slot-machine style number. Each digit gets its own vertical strip of 0-9;
 * translateY animates smoothly to land on the target digit. Handles mount
 * (rolls from 0), value changes (rolls to new), and adding/removing digits.
 */
export default function RollingNumber({
  value,
  size = 60,
  style,
  durationMs = 900,
}: Props) {
  const str = Math.round(value).toString()
  const digits = str.split('')

  return (
    <View style={styles.row}>
      {digits.map((d, i) => (
        <Digit
          key={`${digits.length}-${i}`}
          target={Number(d)}
          size={size}
          style={style}
          durationMs={durationMs + i * 60}
        />
      ))}
    </View>
  )
}

function Digit({
  target,
  size,
  style,
  durationMs,
}: {
  target: number
  size: number
  style: StyleProp<TextStyle>
  durationMs: number
}) {
  // Animate a numeric value that we interpolate into translateY.
  const val = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(val, {
      toValue: target,
      duration: durationMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [target, durationMs, val])

  const translateY = useMemo(
    () =>
      val.interpolate({
        inputRange: [0, 9],
        outputRange: [0, -9 * size],
      }),
    [val, size]
  )

  return (
    <View style={{ height: size, overflow: 'hidden' }}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        {DIGITS.map((d) => (
          <Text
            key={d}
            style={[
              style,
              {
                height: size,
                lineHeight: size,
                textAlign: 'center',
                includeFontPadding: false,
              } as TextStyle,
            ]}
          >
            {d}
          </Text>
        ))}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
