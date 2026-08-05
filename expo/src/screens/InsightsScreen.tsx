import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg'
import { Feather } from '@expo/vector-icons'
import { MotiView } from '../lib/motion'
import { useSubs } from '../features/subscriptions/hooks'
import type { Subscription } from '../lib/types'
import { formatINR } from '../lib/store'
import { colors, elevation, font, radius, spacing } from '../theme'

/**
 * Insights — data-only view over the user's subscription set. Renders when
 * the bottom-nav 'Stats' tab is active. Three cards, top-down:
 *   1) Category donut with legend + center "monthly total"
 *   2) 6-month spend sparkline (bar chart)
 *   3) Savings summary — cancelled/paused subs count & value
 *
 * Everything derives from the same useSubs cache the rest of the app uses,
 * so a cancel from the SubDetail sheet updates these numbers in real time.
 */
export default function InsightsScreen() {
  const { data: subs = [] } = useSubs()

  const active = useMemo(
    () => subs.filter((s: Subscription) => s.status === 'active'),
    [subs]
  )
  const monthly = useMemo(
    () => active.reduce((n: number, s: Subscription) => n + s.price, 0),
    [active]
  )

  const byCategory = useMemo(() => groupByCategory(active), [active])
  const trend = useMemo(() => monthlyTrend(subs), [subs])
  const savings = useMemo(() => savingsSummary(subs), [subs])

  // Empty state: fewer than 3 total subs — matches the "not enough data" copy.
  if (subs.length < 3) {
    return (
      <View style={styles.wrap}>
        <SectionHeader
          title="Insights"
          subtitle="Where your money's going, month by month."
        />
        <View style={styles.emptyCard}>
          <Feather name="bar-chart-2" size={22} color={colors.muted} />
          <Text style={styles.emptyTitle}>Not enough data yet.</Text>
          <Text style={styles.emptyBody}>
            Add a few subscriptions to see spending patterns.
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.wrap}>
      <SectionHeader
        title="Insights"
        subtitle="Where your money's going, month by month."
      />

      {/* Card 1 — Category donut */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 340 }}
        style={styles.card}
      >
        <Text style={styles.cardTitle}>Spend by category</Text>
        <Text style={styles.cardSub}>
          {active.length} active subscription{active.length === 1 ? '' : 's'}
        </Text>
        <View style={styles.donutRow}>
          <Donut segments={byCategory} total={monthly} />
          <View style={styles.legend}>
            {byCategory.map((seg) => (
              <View key={seg.label} style={styles.legendRow}>
                <View
                  style={[styles.legendDot, { backgroundColor: seg.color }]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.legendLabel}>{seg.label}</Text>
                  <Text style={styles.legendMeta}>
                    {formatINR(seg.value)} · {Math.round((seg.value / monthly) * 100)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </MotiView>

      {/* Card 2 — 6-month spend trend */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 380, delay: 60 }}
        style={styles.card}
      >
        <Text style={styles.cardTitle}>Monthly spend</Text>
        <Text style={styles.cardSub}>
          Last 6 months · {formatINR(monthly)}/mo now
        </Text>
        <BarChart points={trend} />
      </MotiView>

      {/* Card 3 — Savings summary */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 120 }}
        style={[styles.card, styles.savingsCard]}
      >
        <View style={styles.savingsHead}>
          <View style={styles.savingsIcon}>
            <Feather name="trending-down" size={16} color={colors.success} />
          </View>
          <Text style={styles.cardTitle}>Saved this year</Text>
        </View>
        <Text style={styles.savingsAmount}>{formatINR(savings.saved)}</Text>
        <Text style={styles.savingsSub}>
          {savings.cancelledCount} cancelled · {savings.pausedCount} paused
          {savings.saved > 0
            ? ` · that's ${formatINR(savings.saved / 12)}/mo trimmed`
            : ''}
        </Text>
      </MotiView>

      {/* Bottom padding so the last card clears the FAB */}
      <View style={{ height: 100 }} />
    </View>
  )
}

// ── Donut chart ───────────────────────────────────────────────────────────

const DONUT_SIZE = 140
const DONUT_STROKE = 20
const DONUT_R = (DONUT_SIZE - DONUT_STROKE) / 2

type Segment = { label: string; value: number; color: string }

function Donut({ segments, total }: { segments: Segment[]; total: number }) {
  const c = DONUT_SIZE / 2
  const circumference = 2 * Math.PI * DONUT_R
  let offset = 0
  return (
    <View>
      <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
        <G rotation={-90} origin={`${c}, ${c}`}>
          {/* Background ring */}
          <Circle
            cx={c}
            cy={c}
            r={DONUT_R}
            stroke="#EEEBE4"
            strokeWidth={DONUT_STROKE}
            fill="none"
          />
          {segments.map((seg, i) => {
            const pct = seg.value / total
            const dash = circumference * pct
            const gap = circumference - dash
            const node = (
              <Circle
                key={seg.label + i}
                cx={c}
                cy={c}
                r={DONUT_R}
                stroke={seg.color}
                strokeWidth={DONUT_STROKE}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                fill="none"
              />
            )
            offset += dash
            return node
          })}
        </G>
        {/* Center label */}
        <SvgText
          x={c}
          y={c - 4}
          textAnchor="middle"
          fontSize={11}
          fill={colors.muted}
          fontFamily={font.medium}
        >
          MONTHLY
        </SvgText>
        <SvgText
          x={c}
          y={c + 14}
          textAnchor="middle"
          fontSize={17}
          fill={colors.ink}
          fontFamily={font.bold}
        >
          {formatINR(total)}
        </SvgText>
      </Svg>
    </View>
  )
}

// ── Bar chart (6-month sparkline) ─────────────────────────────────────────

const BAR_H = 120
const BAR_GAP = 10

function BarChart({ points }: { points: { label: string; value: number }[] }) {
  const max = Math.max(1, ...points.map((p) => p.value))
  return (
    <View style={{ marginTop: 14 }}>
      <View style={{ height: BAR_H, flexDirection: 'row', alignItems: 'flex-end', gap: BAR_GAP }}>
        {points.map((p, i) => {
          const h = Math.max(6, (p.value / max) * BAR_H)
          const isLast = i === points.length - 1
          return (
            <View key={p.label} style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={[
                  styles.bar,
                  { height: h, backgroundColor: isLast ? colors.primary : '#DED9F5' },
                ]}
              />
            </View>
          )
        })}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 8, gap: BAR_GAP }}>
        {points.map((p, i) => (
          <Text
            key={p.label + i}
            style={[styles.barLabel, i === points.length - 1 && styles.barLabelActive]}
          >
            {p.label}
          </Text>
        ))}
      </View>
    </View>
  )
}

// ── Section header + shared card shell ───────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  )
}

// ── Derivation helpers ────────────────────────────────────────────────────

/** Sum active-sub prices per category; return segments sorted desc. */
function groupByCategory(active: Subscription[]): Segment[] {
  const map = new Map<string, { value: number; color: string }>()
  for (const s of active) {
    const cat = s.category || 'Other'
    const prev = map.get(cat) ?? { value: 0, color: s.color }
    map.set(cat, { value: prev.value + s.price, color: prev.color })
  }
  return [...map.entries()]
    .map(([label, { value, color }]) => ({ label, value, color }))
    .sort((a, b) => b.value - a.value)
}

/** Approximate the last 6 months of spend. Since we only carry the
 *  next billing date, we back-fill by assuming price was constant across
 *  the period. This matches the "steady baseline" visual users expect. */
function monthlyTrend(subs: Subscription[]): { label: string; value: number }[] {
  const now = new Date()
  const active = subs.filter((s) => s.status === 'active')
  const cancelled = subs.filter((s) => s.status === 'cancelled')

  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const monthKey = d.toLocaleDateString('en-IN', { month: 'short' })

    // Include cancelled subs for months before they were cancelled.
    const cancelledStillContributing = cancelled.filter((s) => {
      if (!s.cancelledAt) return false
      const c = new Date(s.cancelledAt)
      return c >= d
    })

    const value =
      active.reduce((n, s) => n + s.price, 0) +
      cancelledStillContributing.reduce((n, s) => n + s.price, 0)

    return { label: monthKey, value }
  })
}

/** Savings = 12x monthly price of cancelled subs (annualised prevented cost). */
function savingsSummary(subs: Subscription[]): {
  cancelledCount: number
  pausedCount: number
  saved: number
} {
  const cancelled = subs.filter((s) => s.status === 'cancelled')
  const paused = subs.filter((s) => s.status === 'paused')
  const saved = cancelled.reduce((n, s) => n + s.price * 12, 0)
  return {
    cancelledCount: cancelled.length,
    pausedCount: paused.length,
    saved,
  }
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontFamily: font.bold,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: font.regular,
    color: colors.muted,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.card,
  },
  cardTitle: {
    fontFamily: font.bold,
    fontSize: 15,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  cardSub: {
    marginTop: 2,
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
  },
  // Donut
  donutRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  legend: {
    flex: 1,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.ink,
  },
  legendMeta: {
    marginTop: 1,
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.muted,
  },
  // Bars
  bar: {
    width: '80%',
    borderRadius: 6,
  },
  barLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.muted,
  },
  barLabelActive: {
    fontFamily: font.bold,
    color: colors.ink,
  },
  // Savings
  savingsCard: {
    borderColor: colors.success,
    borderWidth: 1.5,
  },
  savingsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  savingsIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingsAmount: {
    marginTop: 6,
    fontFamily: font.bold,
    fontSize: 32,
    color: colors.success,
    letterSpacing: -0.8,
  },
  savingsSub: {
    marginTop: 4,
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.muted,
  },
  // Empty state
  emptyCard: {
    padding: spacing.xxl,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontFamily: font.bold,
    fontSize: 15,
    color: colors.ink,
  },
  emptyBody: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
  },
})
