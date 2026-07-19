import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AnimatePresence, MotiView } from '../lib/motion'
import { colors, elevation, font, radius, spacing } from '../theme'
import type { Subscription } from '../lib/types'
import { formatINR } from '../lib/store'

type Props = { subs: Subscription[] }
type TabId = '1D' | '1W' | '1M' | '6M' | '1Y'
const TABS: TabId[] = ['1D', '1W', '1M', '6M', '1Y']

const DATASETS: Record<TabId, { label: string; value: number }[]> = {
  '1D': [
    { label: '6a', value: 150 },
    { label: '9a', value: 320 },
    { label: '12p', value: 640 },
    { label: '3p', value: 1820 },
    { label: '6p', value: 1120 },
    { label: '9p', value: 780 },
    { label: '12a', value: 280 },
  ],
  '1W': [
    { label: 'M', value: 840 },
    { label: 'T', value: 560 },
    { label: 'W', value: 1225 },
    { label: 'T', value: 1820 },
    { label: 'F', value: 1470 },
    { label: 'S', value: 630 },
    { label: 'S', value: 350 },
  ],
  '1M': [
    { label: 'W1', value: 3360 },
    { label: 'W2', value: 4340 },
    { label: 'W3', value: 2660 },
    { label: 'W4', value: 1820 },
    { label: 'W5', value: 3780 },
    { label: 'W6', value: 4900 },
    { label: 'W7', value: 4130 },
  ],
  '6M': [
    { label: 'Dec', value: 5740 },
    { label: 'Jan', value: 4480 },
    { label: 'Feb', value: 6370 },
    { label: 'Mar', value: 5040 },
    { label: 'Apr', value: 8260 },
    { label: 'May', value: 6860 },
    { label: 'Jun', value: 9240 },
  ],
  '1Y': [
    { label: 'Q1', value: 18200 },
    { label: 'Q2', value: 22400 },
    { label: 'Q3', value: 20300 },
    { label: 'Q4', value: 25200 },
    { label: 'Q5', value: 21700 },
    { label: 'Q6', value: 26600 },
    { label: 'Q7', value: 28700 },
  ],
}

const BAR_PALETTE = [
  '#FF3B7F', // pink
  '#FF7A45', // orange
  '#F5B301', // amber
  '#22C55E', // green
  '#14B8A6', // teal
  '#3B82F6', // blue
  '#7B6EF6', // purple
]

const MOCK_SAVINGS = 12400
const MOCK_BUDGET = 25000

export default function SpendingOverview({ subs }: Props) {
  const [tab, setTab] = useState<TabId>('1M')
  const data = DATASETS[tab]
  const peakIdx = data.reduce(
    (best, d, i) => (d.value > data[best].value ? i : best),
    0
  )
  const peakValue = data[peakIdx].value

  const expensePct = useMemo(() => {
    const total = subs
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + s.price, 0)
    return Math.min(100, Math.round((total / MOCK_BUDGET) * 100))
  }, [subs])

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Spending overview</Text>
        <Pressable>
          <Text style={styles.link}>See all →</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.left}>
          <Text style={styles.metricLabel}>Savings</Text>
          <Text style={styles.metric}>{formatINR(MOCK_SAVINGS, { withCents: false })}</Text>
          <Text style={[styles.metricLabel, { marginTop: 12 }]}>Expenses</Text>
          <Text style={[styles.metric, { color: '#7B6EF6' }]}>{expensePct}%</Text>

          <View style={styles.legend}>
            <LegendDot color="#7B6EF6" label="Savings" />
            <LegendDot color="#C9C7C4" label="Expenses" />
          </View>
        </View>

        <View style={styles.right}>
          <View style={styles.tabs}>
            {TABS.map((t) => {
              const active = t === tab
              return (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  style={[styles.tab, active && styles.tabActive]}
                >
                  <Text
                    style={[styles.tabText, active && styles.tabTextActive]}
                  >
                    {t}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <View style={styles.chartBox}>
            <AnimatePresence exitBeforeEnter>
              <MotiView
                key={tab}
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: -8 }}
                transition={{ type: 'timing', duration: 220 }}
                style={{ flex: 1 }}
              >
                <RainbowBars data={data} peakIdx={peakIdx} peakValue={peakValue} />
                <View style={styles.xAxis}>
                  {data.map((d, i) => (
                    <Text key={i} style={styles.xLabel}>
                      {d.label}
                    </Text>
                  ))}
                </View>
              </MotiView>
            </AnimatePresence>
          </View>
        </View>
      </View>
    </View>
  )
}

function RainbowBars({
  data,
  peakIdx,
  peakValue,
}: {
  data: { label: string; value: number }[]
  peakIdx: number
  peakValue: number
}) {
  const max = Math.max(...data.map((d) => d.value))
  const CHART_H = 90
  return (
    <View style={styles.barsRow}>
      {data.map((d, i) => {
        const pct = d.value / max
        const height = Math.max(6, Math.round(pct * CHART_H))
        const color = BAR_PALETTE[i % BAR_PALETTE.length]
        const isPeak = i === peakIdx
        return (
          <View key={i} style={styles.barCol}>
            {isPeak && (
              <View style={styles.tooltip} pointerEvents="none">
                <Text style={styles.tooltipText}>
                  {formatINR(peakValue, { withCents: false })}
                </Text>
                <View style={styles.tooltipTail} />
              </View>
            )}
            <MotiView
              from={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                damping: 16,
                stiffness: 220,
                delay: i * 40,
              }}
              style={[
                styles.bar,
                {
                  height,
                  backgroundColor: color,
                  borderColor: isPeak ? '#1A1917' : 'transparent',
                  borderWidth: isPeak ? 1.5 : 0,
                },
              ]}
            />
          </View>
        )
      })}
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
    backgroundColor: '#fff',
    borderRadius: radius.xxl,
    padding: 24,
    paddingTop: 22,
    ...elevation.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.4,
    fontFamily: font.bold,
  },
  link: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'DMSans_500Medium',
  },
  body: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 16,
    alignItems: 'flex-start',
  },
  left: {
    minWidth: 92,
  },
  right: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: font.medium,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  metric: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.9,
    marginTop: 4,
    fontFamily: font.bold,
  },
  legend: {
    marginTop: 16,
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: 'DMSans_400Regular',
  },
  tabs: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: colors.bg,
    padding: 3,
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 7,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.ink,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    fontFamily: 'DMSans_500Medium',
  },
  tabTextActive: {
    color: '#fff',
  },
  chartBox: {
    height: 130,
    marginTop: 12,
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingHorizontal: 2,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  tooltip: {
    position: 'absolute',
    top: -28,
    alignItems: 'center',
    zIndex: 10,
  },
  tooltipText: {
    backgroundColor: colors.ink,
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    fontFamily: 'DMSans_700Bold',
  },
  tooltipTail: {
    width: 8,
    height: 8,
    backgroundColor: colors.ink,
    transform: [{ rotate: '45deg' }],
    marginTop: -4,
  },
  xAxis: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 6,
    paddingHorizontal: 2,
  },
  xLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 9,
    color: colors.muted,
    fontFamily: 'DMSans_400Regular',
  },
})
