import React, { useMemo, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { MotiView } from '../lib/motion'
import { useSubs } from '../features/subscriptions/hooks'
import type { Subscription } from '../lib/types'
import { formatINR } from '../lib/store'
import { colors, elevation, font, radius, spacing } from '../theme'

/**
 * Full-month calendar view of upcoming renewals.
 *
 * The reference splits each day cell into "date on top + tiny colored dots
 * below" — one dot per renewing sub that day. The dot color reuses the sub's
 * brand color, so Netflix days are red, Spotify green, etc. Tapping a day
 * scrolls the timeline below to that date's group.
 *
 * The list below groups the next ~30 days of renewals into date-bucketed
 * cards, each with a colored timeline dot down the left rail — same visual
 * language as the reference.
 */
export default function CalendarScreen() {
  const { data: subs = [] } = useSubs()
  const today = useMemo(() => atMidnight(new Date()), [])
  const [cursor, setCursor] = useState<Date>(startOfMonth(today))
  const [selected, setSelected] = useState<Date>(today)

  // Map YYYY-MM-DD → renewals on that day.
  const byDay = useMemo(() => groupByDay(subs), [subs])
  const activeCount = useMemo(
    () => subs.filter((s: Subscription) => s.status === 'active').length,
    [subs]
  )

  const monthLabel = cursor.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
  const selectedLabel = selected.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  // Build the 6-row × 7-col grid: pad front with prev-month spillover,
  // pad back with next-month spillover so weeks stay aligned.
  const grid = useMemo(() => buildMonthGrid(cursor), [cursor])

  const upcoming = useMemo(
    () => buildTimeline(subs, today),
    [subs, today]
  )

  return (
    <View style={styles.wrap}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Reminders</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconButton
            onPress={() => setCursor((c) => addMonths(c, -1))}
            icon="chevron-left"
          />
          <IconButton
            onPress={() => setCursor((c) => addMonths(c, 1))}
            icon="chevron-right"
          />
        </View>
      </View>

      <View style={styles.subHeaderRow}>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.activeCount}>{activeCount} active</Text>
          <Text style={styles.activeCountSub}>subscriptions</Text>
        </View>
      </View>

      {/* Month grid card */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 340 }}
        style={styles.gridCard}
      >
        <View style={styles.weekRow}>
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((w) => (
            <Text key={w} style={styles.weekLabel}>
              {w}
            </Text>
          ))}
        </View>

        {chunk(grid, 7).map((week, wi) => (
          <View key={wi} style={styles.dayRow}>
            {week.map((cell) => {
              const key = isoDate(cell.date)
              const renewalsToday = byDay.get(key) ?? []
              const isSelected = sameDay(cell.date, selected)
              const isToday = sameDay(cell.date, today)
              return (
                <Pressable
                  key={key}
                  onPress={() => setSelected(cell.date)}
                  style={styles.dayCell}
                >
                  <View
                    style={[
                      styles.dayInner,
                      isSelected && styles.dayInnerSelected,
                      isToday && !isSelected && styles.dayInnerToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNum,
                        !cell.inMonth && styles.dayNumMuted,
                        isSelected && styles.dayNumSelected,
                      ]}
                    >
                      {cell.date.getDate()}
                    </Text>
                  </View>
                  {/* Colored dots — up to 3, then a "+N" chip */}
                  {renewalsToday.length > 0 ? (
                    <View style={styles.dotRow}>
                      {renewalsToday.slice(0, 3).map((s) => (
                        <View
                          key={s.id}
                          style={[styles.dot, { backgroundColor: s.color }]}
                        />
                      ))}
                      {renewalsToday.length > 3 ? (
                        <Text style={styles.dotMore}>
                          +{renewalsToday.length - 3}
                        </Text>
                      ) : null}
                    </View>
                  ) : (
                    <View style={styles.dotSpacer} />
                  )}
                </Pressable>
              )
            })}
          </View>
        ))}
      </MotiView>

      {/* Timeline of upcoming renewals, grouped by day */}
      <View style={{ marginTop: spacing.xl }}>
        {upcoming.length === 0 ? (
          <View style={styles.emptyCard}>
            <Feather name="calendar" size={20} color={colors.muted} />
            <Text style={styles.emptyTitle}>No upcoming renewals</Text>
            <Text style={styles.emptyBody}>
              Renewals within the next 30 days will show up here.
            </Text>
          </View>
        ) : (
          upcoming.map((group) => (
            <TimelineGroup
              key={group.key}
              group={group}
              today={today}
            />
          ))
        )}
      </View>

      {/* Bottom padding so the last row clears the FAB */}
      <View style={{ height: 100 }} />

      {/* Selected-day debug hint kept subtle */}
      <Text style={styles.selectedHint}>Selected: {selectedLabel}</Text>
    </View>
  )
}

// ── Timeline group ────────────────────────────────────────────────────────

function TimelineGroup({
  group,
  today,
}: {
  group: TimelineGroupT
  today: Date
}) {
  const isToday = sameDay(group.date, today)
  const dateLabel = group.date
    .toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase()
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupDate}>{dateLabel}</Text>
        <Text style={styles.groupMeta}>
          {isToday
            ? 'Today'
            : `${group.subs.length} reminder${group.subs.length === 1 ? '' : 's'}`}
        </Text>
      </View>
      <View style={styles.groupList}>
        {/* Left rail — a vertical line that runs behind the dots */}
        <View style={styles.rail} />
        {group.subs.map((sub) => (
          <View key={sub.id} style={styles.timelineRow}>
            <View
              style={[
                styles.timelineDot,
                { borderColor: sub.color },
              ]}
            />
            <View style={styles.timelineCard}>
              <View
                style={[styles.rowIcon, { backgroundColor: sub.color }]}
              >
                <Text style={styles.rowIconText}>{sub.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>
                  {sub.name}
                  {sub.plan ? ` ${sub.plan}` : ''}
                </Text>
                <Text style={styles.rowMeta}>
                  Monthly renewal · {sub.category}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.rowPrice}>{formatINR(sub.price)}</Text>
                <Text style={styles.rowPriceSub}>per month</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

// ── Reusable icon button (chevron pills) ──────────────────────────────────

function IconButton({
  onPress,
  icon,
}: {
  onPress: () => void
  icon: keyof typeof Feather.glyphMap
}) {
  return (
    <Pressable onPress={onPress} style={styles.iconBtn} hitSlop={8}>
      <Feather name={icon} size={16} color={colors.ink} />
    </Pressable>
  )
}

// ── Data helpers ──────────────────────────────────────────────────────────

type Cell = { date: Date; inMonth: boolean }
type TimelineGroupT = { key: string; date: Date; subs: Subscription[] }

function atMidnight(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function sameDay(a: Date, b: Date): boolean {
  return isoDate(a) === isoDate(b)
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

/** 42-cell month grid, always 6 rows × 7 cols. */
function buildMonthGrid(cursor: Date): Cell[] {
  const first = startOfMonth(cursor)
  const startWeekday = first.getDay() // Sun = 0
  const grid: Cell[] = []
  const gridStart = new Date(first)
  gridStart.setDate(1 - startWeekday)
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    grid.push({ date: d, inMonth: d.getMonth() === cursor.getMonth() })
  }
  return grid
}

/** Group active-status renewals by their YYYY-MM-DD. */
function groupByDay(subs: Subscription[]): Map<string, Subscription[]> {
  const m = new Map<string, Subscription[]>()
  for (const s of subs) {
    if (s.status !== 'active') continue
    if (!s.billingDate) continue
    const key = s.billingDate.slice(0, 10)
    const arr = m.get(key) ?? []
    arr.push(s)
    m.set(key, arr)
  }
  return m
}

/** Next ~30 days of renewals, bucketed by day, sorted asc. */
function buildTimeline(
  subs: Subscription[],
  today: Date
): TimelineGroupT[] {
  const horizon = new Date(today)
  horizon.setDate(horizon.getDate() + 45)
  const byDay = new Map<string, Subscription[]>()
  for (const s of subs) {
    if (s.status !== 'active' || !s.billingDate) continue
    const d = new Date(s.billingDate)
    if (Number.isNaN(d.getTime())) continue
    if (d < today || d > horizon) continue
    const key = isoDate(d)
    const arr = byDay.get(key) ?? []
    arr.push(s)
    byDay.set(key, arr)
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, list]) => ({
      key,
      date: new Date(key),
      subs: list.sort((a, b) => a.name.localeCompare(b.name)),
    }))
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: font.bold,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.card,
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  monthLabel: {
    fontSize: 20,
    fontFamily: font.bold,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  activeCount: {
    fontSize: 13,
    fontFamily: font.bold,
    color: colors.ink,
    letterSpacing: -0.2,
    textAlign: 'right',
  },
  activeCountSub: {
    fontSize: 11,
    fontFamily: font.regular,
    color: colors.muted,
    textAlign: 'right',
  },
  // Grid card
  gridCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.card,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontFamily: font.bold,
    color: colors.muted,
    letterSpacing: 0.6,
  },
  dayRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  dayInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInnerSelected: {
    backgroundColor: colors.primary,
  },
  dayInnerToday: {
    backgroundColor: '#F0EEFE',
  },
  dayNum: {
    fontSize: 13,
    fontFamily: font.semibold,
    color: colors.ink,
  },
  dayNumMuted: {
    color: '#C9C6BE',
  },
  dayNumSelected: {
    color: '#fff',
    fontFamily: font.bold,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 3,
    minHeight: 8,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dotMore: {
    fontSize: 8,
    fontFamily: font.bold,
    color: colors.muted,
    marginLeft: 2,
  },
  dotSpacer: {
    marginTop: 3,
    height: 8,
  },
  // Timeline
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  groupDate: {
    fontSize: 12,
    fontFamily: font.bold,
    color: colors.ink,
    letterSpacing: 0.4,
  },
  groupMeta: {
    fontSize: 11,
    fontFamily: font.regular,
    color: colors.muted,
  },
  groupList: {
    position: 'relative',
    paddingLeft: 20,
  },
  rail: {
    position: 'absolute',
    left: 8,
    top: 8,
    bottom: 8,
    width: 1.5,
    backgroundColor: colors.border,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  timelineDot: {
    position: 'absolute',
    left: -19,
    top: '50%',
    marginTop: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  timelineCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.card,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconText: {
    color: '#fff',
    fontFamily: font.bold,
    fontSize: 16,
  },
  rowName: {
    fontFamily: font.bold,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  rowMeta: {
    marginTop: 2,
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.muted,
  },
  rowPrice: {
    fontFamily: font.bold,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  rowPriceSub: {
    marginTop: 2,
    fontFamily: font.regular,
    fontSize: 10,
    color: colors.muted,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontFamily: font.bold,
    fontSize: 14,
    color: colors.ink,
  },
  emptyBody: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
  },
  selectedHint: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 10,
    fontFamily: font.regular,
    color: colors.muted,
    opacity: 0.6,
  },
})
