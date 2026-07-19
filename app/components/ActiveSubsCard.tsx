'use client'

import { useMemo, useState } from 'react'
import type { Subscription } from '../lib/types'

type Props = {
  subs: Subscription[]
}

const MAX_STACK = 4

export default function ActiveSubsCard({ subs }: Props) {
  const activeSubs = useMemo(() => subs.filter((s) => s.status === 'active'), [subs])
  const shown = activeSubs.slice(0, MAX_STACK)
  const remaining = Math.max(0, activeSubs.length - shown.length)

  const [spinning, setSpinning] = useState(false)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [stackHovered, setStackHovered] = useState(false)

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: 18,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
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
        Active subs
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 6,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#1A1917',
            letterSpacing: '-0.03em',
          }}
        >
          {activeSubs.length}
        </div>
        <button
          aria-label="Refresh"
          onClick={() => {
            setSpinning(true)
            setTimeout(() => setSpinning(false), 600)
          }}
          className={spinning ? 'spin-on-click' : ''}
          style={{
            width: 24,
            height: 24,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#A09D99"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      <div
        style={{
          marginTop: 12,
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          height: 40,
        }}
        onMouseEnter={() => setStackHovered(true)}
        onMouseLeave={() => {
          setStackHovered(false)
          setHoveredIdx(null)
        }}
      >
        {shown.map((s, i) => {
          const isHovered = hoveredIdx === i
          const baseMargin = i === 0 ? 0 : -10
          const expandedMargin = i === 0 ? 0 : -2
          return (
            <div
              key={s.id}
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 11,
                  background: s.color,
                  border: '2.5px solid #fff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  marginLeft: stackHovered ? expandedMargin : baseMargin,
                  transform: isHovered ? 'translateY(-6px) scale(1.15)' : 'none',
                  zIndex: isHovered ? 20 : i,
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              >
                {s.icon}
              </div>
              {isHovered ? (
                <div
                  style={{
                    position: 'absolute',
                    top: -28,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1A1917',
                    color: '#fff',
                    fontSize: 10,
                    padding: '3px 8px',
                    borderRadius: 6,
                    whiteSpace: 'nowrap',
                    zIndex: 30,
                    fontWeight: 500,
                  }}
                >
                  {s.name}
                </div>
              ) : null}
            </div>
          )
        })}
        {remaining > 0 ? (
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              background: '#EAE8FE',
              border: '2.5px solid #fff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7B6EF6',
              fontSize: 12,
              fontWeight: 700,
              marginLeft: stackHovered ? -2 : -10,
              transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            +{remaining}
          </div>
        ) : null}
      </div>

      <div style={{ fontSize: 10, color: '#A09D99', marginTop: 8 }}>Tap to manage</div>
    </div>
  )
}
