'use client'

import { useMemo } from 'react'
import type { Subscription } from '../lib/types'

type Props = {
  subs: Subscription[]
}

export default function Header({ subs }: Props) {
  const hasSoonExpiring = useMemo(() => {
    const now = Date.now()
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
    return subs.some((s) => {
      if (s.status !== 'active') return false
      const billing = new Date(s.billingDate).getTime()
      if (Number.isNaN(billing)) return false
      const diff = billing - now
      return diff >= 0 && diff <= SEVEN_DAYS
    })
  }, [subs])

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className="pulse-ring"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7B6EF6, #4F9CF9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: '-0.02em',
          }}
        >
          RS
        </div>
        <div className="flex flex-col leading-tight">
          <span style={{ fontSize: 12, color: '#A09D99' }}>Good morning,</span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#1A1917',
              letterSpacing: '-0.03em',
            }}
          >
            Hi, Rajashri 👋
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <IconButton ariaLabel="Notifications" showDot={hasSoonExpiring}>
          <BellIcon />
        </IconButton>
        <IconButton ariaLabel="Calendar">
          <CalendarIcon />
        </IconButton>
      </div>
    </div>
  )
}

function IconButton({
  children,
  ariaLabel,
  showDot = false,
}: {
  children: React.ReactNode
  ariaLabel: string
  showDot?: boolean
}) {
  return (
    <button
      aria-label={ariaLabel}
      style={{
        position: 'relative',
        width: 40,
        height: 40,
        borderRadius: 12,
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        cursor: 'pointer',
        transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {children}
      {showDot ? (
        <span
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#FF3A30',
            border: '1.5px solid #fff',
          }}
        />
      ) : null}
    </button>
  )
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#1A1917"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#1A1917"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
