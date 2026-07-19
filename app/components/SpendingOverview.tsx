'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  XAxis,
} from 'recharts'
import type { Subscription } from '../lib/types'

type Props = {
  subs: Subscription[]
}

type TabId = '1W' | '1M' | '6M' | '1Y'

const TABS: TabId[] = ['1W', '1M', '6M', '1Y']

const DATASETS: Record<TabId, { label: string; value: number }[]> = {
  '1W': [
    { label: 'M', value: 240 },
    { label: 'T', value: 180 },
    { label: 'W', value: 320 },
    { label: 'T', value: 280 },
    { label: 'F', value: 410 },
    { label: 'S', value: 150 },
    { label: 'S', value: 90 },
  ],
  '1M': [
    { label: 'W1', value: 1200 },
    { label: 'W2', value: 1600 },
    { label: 'W3', value: 980 },
    { label: 'W4', value: 2100 },
    { label: 'W5', value: 1450 },
    { label: 'W6', value: 1820 },
    { label: 'W7', value: 2480 },
  ],
  '6M': [
    { label: 'Nov', value: 3200 },
    { label: 'Dec', value: 4100 },
    { label: 'Jan', value: 2800 },
    { label: 'Feb', value: 3600 },
    { label: 'Mar', value: 4420 },
    { label: 'Apr', value: 5100 },
    { label: 'May', value: 4700 },
  ],
  '1Y': [
    { label: 'Q1', value: 9200 },
    { label: 'Q2', value: 11400 },
    { label: 'Q3', value: 10100 },
    { label: 'Q4', value: 13800 },
    { label: 'Q5', value: 12200 },
    { label: 'Q6', value: 14600 },
    { label: 'Q7', value: 15900 },
  ],
}

const MOCK_SAVINGS = 12400
const MOCK_BUDGET = 20000

export default function SpendingOverview({ subs }: Props) {
  const [tab, setTab] = useState<TabId>('1M')

  const expensePct = useMemo(() => {
    const total = subs
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + s.price, 0)
    return Math.min(100, Math.round((total / MOCK_BUDGET) * 100))
  }, [subs])

  const data = DATASETS[tab]
  const peakIdx = data.reduce(
    (best, d, i) => (d.value > data[best].value ? i : best),
    0
  )

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#1A1917',
            letterSpacing: '-0.01em',
          }}
        >
          Spending overview
        </div>
        <button
          style={{
            background: 'transparent',
            border: 'none',
            color: '#7B6EF6',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          See all →
        </button>
      </div>

      <div
        style={{
          marginTop: 14,
          display: 'flex',
          gap: 16,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ minWidth: 80, flexShrink: 0 }}>
          <div
            style={{
              fontSize: 9,
              color: '#A09D99',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}
          >
            Savings
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#1A1917',
              letterSpacing: '-0.02em',
              marginTop: 2,
            }}
          >
            ₹{MOCK_SAVINGS.toLocaleString('en-IN')}
          </div>
          <div
            style={{
              fontSize: 9,
              color: '#A09D99',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
              marginTop: 10,
            }}
          >
            Expenses
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#7B6EF6',
              letterSpacing: '-0.02em',
              marginTop: 2,
            }}
          >
            {expensePct}%
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              gap: 6,
              background: '#F4F3F0',
              padding: 3,
              borderRadius: 10,
            }}
          >
            {TABS.map((t) => {
              const active = t === tab
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '5px 0',
                    borderRadius: 7,
                    background: active ? '#1A1917' : 'transparent',
                    color: active ? '#fff' : '#A09D99',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {t}
                </button>
              )
            })}
          </div>

          <div style={{ width: '100%', height: 90, marginTop: 8 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{ width: '100%', height: '100%' }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
                    barCategoryGap={6}
                  >
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 9, fill: '#A09D99' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {data.map((_, idx) => (
                        <Cell
                          key={`so-cell-${idx}`}
                          fill={idx === peakIdx ? '#7B6EF6' : '#EEECEA'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </AnimatePresence>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 4,
              alignItems: 'center',
            }}
          >
            <LegendDot color="#7B6EF6" label="Savings" />
            <LegendDot color="#C9C7C4" label="Expenses" />
          </div>
        </div>
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
