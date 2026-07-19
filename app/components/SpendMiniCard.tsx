'use client'

import { useMemo } from 'react'
import { BarChart, Bar, Cell, ResponsiveContainer } from 'recharts'
import type { Subscription } from '../lib/types'

type Props = {
  subs: Subscription[]
}

const CHART_DATA = [
  { value: 14 },
  { value: 22 },
  { value: 18 },
  { value: 28 },
  { value: 26 },
  { value: 34 },
  { value: 30 },
  { value: 42 },
]

export default function SpendMiniCard({ subs }: Props) {
  const total = useMemo(
    () =>
      subs
        .filter((s) => s.status === 'active')
        .reduce((sum, s) => sum + s.price, 0),
    [subs]
  )

  const peakIdx = CHART_DATA.reduce(
    (best, d, i) => (d.value > CHART_DATA[best].value ? i : best),
    0
  )

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: 18,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: '#A09D99',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
        }}
      >
        This month
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: '#1A1917',
          letterSpacing: '-0.03em',
          marginTop: 6,
          lineHeight: 1.1,
        }}
      >
        ₹{total.toLocaleString('en-IN')}
      </div>

      <div style={{ width: '100%', height: 60, marginTop: 8 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={CHART_DATA} barCategoryGap={2}>
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {CHART_DATA.map((_, idx) => (
                <Cell
                  key={`spend-cell-${idx}`}
                  fill={idx === peakIdx ? '#7B6EF6' : '#EEECEA'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          marginTop: 6,
          alignItems: 'center',
        }}
      >
        <LegendDot color="#7B6EF6" label="Savings" />
        <LegendDot color="#C9C7C4" label="Expenses" />
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
        }}
      />
      <span style={{ fontSize: 9, color: '#A09D99' }}>{label}</span>
    </div>
  )
}
