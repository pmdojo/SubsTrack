'use client'

import { useMemo, useState } from 'react'
import { BarChart, Bar, Cell, ResponsiveContainer } from 'recharts'
import type { Subscription } from '../lib/types'

type Props = {
  subs: Subscription[]
}

type PayState = 'idle' | 'processing' | 'paid'

const MINI_CHART_DATA = [
  { value: 22 },
  { value: 34 },
  { value: 28 },
  { value: 42 },
  { value: 36 },
  { value: 48 },
]

function formatINR(n: number): string {
  return '₹' + n.toLocaleString('en-IN')
}

export default function HeroCard({ subs }: Props) {
  const activeSubs = useMemo(() => subs.filter((s) => s.status === 'active'), [subs])

  const totalMonthly = useMemo(
    () => activeSubs.reduce((sum, s) => sum + s.price, 0),
    [activeSubs]
  )

  const innerOrbit = activeSubs.slice(0, 4)
  const outerOrbit = activeSubs.slice(4, 7)

  const [payState, setPayState] = useState<PayState>('idle')

  const handlePay = () => {
    if (payState !== 'idle') return
    setPayState('processing')
    setTimeout(() => setPayState('paid'), 1200)
    setTimeout(() => setPayState('idle'), 2600)
  }

  const btnLabel =
    payState === 'processing'
      ? 'Processing…'
      : payState === 'paid'
        ? 'Paid ✓'
        : 'Pay Now'

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 28,
        padding: '26px 24px 22px',
        background: 'linear-gradient(135deg, #7B6EF6 0%, #5B8EF8 55%, #4DD8F0 100%)',
        boxShadow: '0 20px 48px rgba(123,110,246,0.35)',
        color: '#fff',
      }}
    >
      {/* Decorative circles */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: '#fff',
          opacity: 0.07,
          top: -70,
          right: -40,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: '#fff',
          opacity: 0.05,
          bottom: -50,
          left: 10,
          pointerEvents: 'none',
        }}
      />

      {/* Top row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>Manage</div>
          <div style={{ fontSize: 15, color: '#fff', fontWeight: 700 }}>your payments</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="orbit-cluster">
            {/* Center element */}
            <div
              className="pulse-ring"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 18,
                fontWeight: 700,
                zIndex: 2,
              }}
            >
              ✳
            </div>

            {/* Inner orbit ring */}
            <div className="orbit-ring">
              {innerOrbit.map((s) => (
                <div
                  key={`inner-${s.id}`}
                  className="orbit-icon"
                  style={{ background: s.color }}
                  title={s.name}
                >
                  {s.icon}
                </div>
              ))}
            </div>

            {/* Outer orbit ring */}
            <div className="orbit-ring">
              {outerOrbit.map((s) => (
                <div
                  key={`outer-${s.id}`}
                  className="orbit-icon-outer"
                  style={{ background: s.color }}
                  title={s.name}
                >
                  {s.icon}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>
            {activeSubs.length}+ active subscription
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>1 min ago ↻</div>
        </div>
      </div>

      {/* Amount row */}
      <div style={{ marginTop: 18, position: 'relative', zIndex: 1 }}>
        <div
          style={{
            fontSize: 42,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
          className="hero-amount"
        >
          {formatINR(totalMonthly)}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.55)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginTop: 6,
          }}
        >
          Due payment
        </div>
      </div>

      {/* Bottom row */}
      <div
        style={{
          marginTop: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 16,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <button
          onClick={handlePay}
          style={{
            background: payState === 'paid' ? '#1DB954' : '#fff',
            color: payState === 'paid' ? '#fff' : '#7B6EF6',
            borderRadius: 50,
            padding: '11px 26px',
            fontWeight: 700,
            fontSize: 14,
            border: 'none',
            cursor: payState === 'idle' ? 'pointer' : 'default',
            boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
            transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          }}
          onMouseEnter={(e) => {
            if (payState !== 'idle') return
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 22px rgba(0,0,0,0.18)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.12)'
          }}
        >
          {btnLabel}
        </button>

        <div style={{ width: 110 }}>
          <div
            style={{
              fontSize: 9,
              color: 'rgba(255,255,255,0.6)',
              textAlign: 'right',
              marginBottom: 2,
            }}
          >
            Expenses
          </div>
          <div style={{ width: '100%', height: 40 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MINI_CHART_DATA} barCategoryGap={3}>
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {MINI_CHART_DATA.map((_, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={idx === MINI_CHART_DATA.length - 1 ? '#ffffff' : 'rgba(255,255,255,0.45)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 380px) {
          .hero-amount {
            font-size: 34px !important;
          }
        }
      `}</style>
    </div>
  )
}
