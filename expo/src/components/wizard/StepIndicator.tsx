import React from 'react'
import { StyleSheet, View } from 'react-native'
import { MotiView } from '../../lib/motion'
import { colors, motion as motionTokens, radius } from '../../theme'

type Props = {
  total: number
  current: number // 1-indexed
}

/**
 * Row of `total` pill segments filled left-to-right up to `current`.
 * Backgrounds are static (the shim can't animate colors); opacity animates
 * to communicate the state change.
 */
export default function StepIndicator({ total, current }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1
        const state = step < current ? 'done' : step === current ? 'active' : 'upcoming'
        const bg =
          state === 'active' || state === 'done' ? colors.primary : colors.border
        return (
          <MotiView
            key={step}
            animate={{ opacity: state === 'upcoming' ? 0.35 : 1 }}
            transition={motionTokens.base}
            style={[styles.pill, { backgroundColor: bg }]}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
  },
})
