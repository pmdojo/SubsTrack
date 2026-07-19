import React from 'react'
import { View } from 'react-native'
import { MotiView } from '../lib/motion'

type Props = {
  data: number[]
  width?: number
  height?: number
  peakColor?: string
  restColor?: string
  radius?: number
  gap?: number
  highlightPeak?: boolean
  animated?: boolean
}

/**
 * A tiny, chart-lib-free bar renderer built on <View>. Good for cards and
 * small sparkline-style visuals — no SVG, no react-native-svg needed.
 */
export default function MiniBars({
  data,
  height = 40,
  peakColor = '#7B6EF6',
  restColor = '#EEECEA',
  radius = 3,
  gap = 2,
  highlightPeak = true,
  animated = true,
}: Props) {
  const max = Math.max(...data, 1)
  const peakIdx = highlightPeak
    ? data.reduce((best, v, i) => (v > data[best] ? i : best), 0)
    : -1

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        height,
        width: '100%',
      }}
    >
      {data.map((v, i) => {
        const h = Math.max(3, Math.round((v / max) * height))
        const color = i === peakIdx ? peakColor : restColor
        const Comp: any = animated ? MotiView : View
        const animatedProps = animated
          ? {
              from: { height: 0 },
              animate: { height: h },
              transition: {
                type: 'timing',
                duration: 450,
                delay: i * 35,
              },
            }
          : {}
        return (
          <Comp
            key={i}
            {...animatedProps}
            style={{
              flex: 1,
              marginHorizontal: gap / 2,
              height: animated ? undefined : h,
              backgroundColor: color,
              borderTopLeftRadius: radius,
              borderTopRightRadius: radius,
            }}
          />
        )
      })}
    </View>
  )
}
