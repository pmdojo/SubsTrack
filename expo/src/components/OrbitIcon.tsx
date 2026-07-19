import React, { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

type Props = {
  icon: string
  color: string
  index: number
  total: number
  radius: number
  size: number
  durationMs: number
  reverse?: boolean
}

export default function OrbitIcon({
  icon,
  color,
  index,
  total,
  radius,
  size,
  durationMs,
  reverse = false,
}: Props) {
  const angle = useSharedValue(0)

  useEffect(() => {
    angle.value = withRepeat(
      withTiming(reverse ? -Math.PI * 2 : Math.PI * 2, {
        duration: durationMs,
        easing: Easing.linear,
      }),
      -1,
      false
    )
  }, [angle, durationMs, reverse])

  const offset = (index / total) * Math.PI * 2

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: Math.cos(angle.value + offset) * radius },
      { translateY: Math.sin(angle.value + offset) * radius },
    ],
  }))

  return (
    <Animated.View
      style={[
        styles.icon,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          backgroundColor: color,
          borderWidth: size > 25 ? 2 : 1.5,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: '#fff',
          fontWeight: '700',
          fontSize: size > 25 ? 13 : 11,
        }}
      >
        {icon}
      </Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  icon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
})
