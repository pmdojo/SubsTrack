import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, elevation, font, radius } from '../theme'
import type { Subscription } from '../lib/types'
import { formatINR } from '../lib/store'
import AnimatedCounter from './AnimatedCounter'

type Props = {
  subs: Subscription[]
}

type Trend = 'up' | 'down' | 'flat'
type Tone = 'default' | 'primary' | 'success' | 'warn' | 'danger'

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Every tile is a pure function of `subs` — no state, no timers. Any state
 * change upstream (add/pause/cancel/delete/edit) recomputes all five values
 * in the same render pass, so the dashboard feels alive without polling.
 */
export default function MetricsBar({ subs }: Props) {
  const m = useMemo(() => computeMetrics(subs), [subs])

  return (
    <View style={styles.grid}>
      <MetricCard
        label="Monthly Spend"
        value={m.monthlySpend}
        format={(n) => formatINR(n)}
        trend={m.monthlySpend > 0 ? 'up' : 'flat'}
        tone="primary"
      />
      <MetricCard
        label="Annual Spend"
        value={m.annualSpend}
        format={(n) => formatINR(n)}
        trend={m.annualSpend > 0 ? 'up' : 'flat'}
        tone="default"
      />
      <MetricCard
        label="Upcoming Renewals"
        value={m.upcomingRenewals}
        trend={m.upcomingRenewals > 0 ? 'up' : 'flat'}
        tone="warn"
        subtext="next 30 days"
      />
      <MetricCard
        label="Cancelled this Month"
        value={m.cancelledThisMonth}
        trend={m.cancelledThisMonth > 0 ? 'up' : 'flat'}
        tone="danger"
      />
      <MetricCard
        label="Saved this Year"
        value={m.savedThisYear}
        format={(n) => formatINR(n)}
        trend={m.savedThisYear > 0 ? 'down' : 'flat'}
        tone="success"
        wide
      />
    </View>
  )
}

// ── Calculations ────────────────────────────────────────────────────────────

function computeMetrics(subs: Subscription[]) {
  const now = new Date()
  const nowMs = now.getTime()
  const month = now.getMonth()
  const year = now.getFullYear()

  const activeSubs = subs.filter((s) => s.status === 'active')

  const monthlySpend = activeSubs.reduce((sum, s) => sum + s.price, 0)
  const annualSpend = monthlySpend * 12

  const upcomingRenewals = activeSubs.filter((s) => {
    const t = new Date(s.billingDate).getTime()
    if (Number.isNaN(t)) return false
    const days = (t - nowMs) / MS_PER_DAY
    return days >= 0 && days <= 30
  }).length

  const cancelledThisMonth = subs.filter((s) => {
    if (s.status !== 'cancelled' || !s.cancelledAt) return false
    const c = new Date(s.cancelledAt)
    return c.getFullYear() === year && c.getMonth() === month
  }).length

  // Saved-this-year = for each sub cancelled this year, price × months
  // remaining in the calendar year after cancellation month. Matches the
  // "you would have paid ₹X for the rest of the year" mental model.
  const savedThisYear = subs.reduce((sum, s) => {
    if (s.status !== 'cancelled' || !s.cancelledAt) return sum
    const c = new Date(s.cancelledAt)
    if (c.getFullYear() !== year) return sum
    const monthsRemaining = Math.max(0, 11 - c.getMonth())
    return sum + s.price * monthsRemaining
  }, 0)

  return {
    monthlySpend,
    annualSpend,
    upcomingRenewals,
    cancelledThisMonth,
    savedThisYear,
  }
}

// ── Card ────────────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  format,
  trend,
  tone = 'default',
  wide = false,
  subtext,
}: {
  label: string
  value: number
  format?: (n: number) => string
  trend?: Trend
  tone?: Tone
  wide?: boolean
  subtext?: string
}) {
  const toneStyles = toneMap[tone]
  const trendIcon: Record<Trend, keyof typeof Feather.glyphMap> = {
    up: 'trending-up',
    down: 'trending-down',
    flat: 'minus',
  }
  const trendColor: Record<Trend, string> = {
    up: colors.warn,
    down: colors.success,
    flat: colors.muted,
  }
  const t: Trend = trend ?? 'flat'

  return (
    <View style={[styles.card, wide && styles.cardWide]}>
      <View style={styles.cardHead}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <View
          style={[
            styles.trendChip,
            { backgroundColor: withAlpha(trendColor[t], 0.12) },
          ]}
        >
          <Feather name={trendIcon[t]} size={11} color={trendColor[t]} />
        </View>
      </View>

      <AnimatedCounter
        to={value}
        format={format}
        style={[styles.value, toneStyles.valueStyle]}
        durationMs={900}
      />

      {subtext ? (
        <Text style={styles.subtext} numberOfLines={1}>
          {subtext}
        </Text>
      ) : null}
    </View>
  )
}

const toneMap: Record<Tone, { valueStyle: object }> = {
  default: { valueStyle: { color: colors.ink } },
  primary: { valueStyle: { color: colors.primary } },
  success: { valueStyle: { color: colors.success } },
  warn:    { valueStyle: { color: colors.warn } },
  danger:  { valueStyle: { color: colors.danger } },
}

function withAlpha(hex: string, alpha: number): string {
  // #RRGGBB → rgba(r,g,b,a). Avoids adding a color lib for one function.
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    flexGrow: 1,
    flexBasis: 150,
    minWidth: 150,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#EFEDE7',
    ...elevation.card,
  },
  cardWide: {
    flexBasis: '100%',
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: font.medium,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    flex: 1,
    marginRight: 8,
  },
  trendChip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 22,
    fontFamily: font.bold,
    letterSpacing: -0.6,
  },
  subtext: {
    marginTop: 4,
    fontSize: 10,
    color: colors.muted,
    fontFamily: font.regular,
  },
})
