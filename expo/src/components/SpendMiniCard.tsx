import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors, radius } from '../theme'
import type { Subscription } from '../lib/types'
import MiniBars from './MiniBars'

type Props = { subs: Subscription[] }

const CHART_DATA = [14, 22, 18, 28, 26, 34, 30, 42]

export default function SpendMiniCard({ subs }: Props) {
  const total = useMemo(
    () =>
      subs
        .filter((s) => s.status === 'active')
        .reduce((sum, s) => sum + s.price, 0),
    [subs]
  )

  return (
    <View style={styles.card}>
      <Text style={styles.label}>THIS MONTH</Text>
      <Text style={styles.amount}>
        ₹{total.toLocaleString('en-IN')}
      </Text>

      <View style={{ marginTop: 8 }}>
        <MiniBars
          data={CHART_DATA}
          height={60}
          peakColor={colors.primary}
          restColor={colors.border}
        />
      </View>

      <View style={styles.legend}>
        <LegendDot color={colors.primary} label="Savings" />
        <LegendDot color="#C9C7C4" label="Expenses" />
      </View>
    </View>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
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
  amount: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.7,
    marginTop: 6,
    fontFamily: 'DMSans_700Bold',
  },
  legend: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 9,
    color: colors.muted,
    fontFamily: 'DMSans_400Regular',
  },
})
