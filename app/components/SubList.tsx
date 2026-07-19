'use client'

import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Subscription } from '../lib/types'

type Props = {
  subs: Subscription[]
  onDelete: (id: string) => void
  onEdit: (sub: Subscription) => void
}

function formatBillingLabel(billingDate: string, status: Subscription['status']): string {
  if (status === 'expired') return 'Expired'
  const d = new Date(billingDate)
  if (Number.isNaN(d.getTime())) return 'Upcoming'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function SubList({ subs, onDelete, onEdit }: Props) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
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
          Active subscription
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
          Manage →
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <AnimatePresence mode="popLayout">
          {subs.map((sub) => (
            <SubRow
              key={sub.id}
              sub={sub}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function SubRow({
  sub,
  onDelete,
  onEdit,
}: {
  sub: Subscription
  onDelete: (id: string) => void
  onEdit: (sub: Subscription) => void
}) {
  const [hovered, setHovered] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isActive = sub.status === 'active'

  const startPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(() => {
      setActionsOpen(true)
    }, 500)
  }
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current)
    pressTimer.current = null
  }

  return (
    <motion.div
      layout
      layoutId={sub.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
        cancelPress()
      }}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onContextMenu={(e) => {
        e.preventDefault()
        setActionsOpen((v) => !v)
      }}
      style={{
        position: 'relative',
        background: hovered ? '#F0EEFE' : '#F7F6F4',
        borderRadius: 14,
        padding: 14,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transform: hovered ? 'translateX(4px)' : 'translateX(0)',
        boxShadow: hovered ? '0 4px 16px rgba(123,110,246,0.10)' : 'none',
        borderLeft: hovered ? '3px solid #7B6EF6' : '3px solid transparent',
        transition:
          'background 0.2s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease, border-color 0.15s ease',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          background: sub.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 18,
          fontWeight: 700,
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          flexShrink: 0,
          transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          transform: hovered ? 'scale(1.08)' : 'scale(1)',
        }}
      >
        {sub.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#1A1917',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {sub.name}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 4,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              background: '#EEECEA',
              borderRadius: 999,
              padding: '2px 8px',
              fontSize: 10,
              color: '#6E6B67',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            💳 ●●●● {sub.cardLast4}
          </span>
          <span style={{ fontSize: 10, color: '#A09D99' }}>
            {formatBillingLabel(sub.billingDate, sub.status)}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 4,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#1A1917',
            letterSpacing: '-0.01em',
          }}
        >
          ₹{sub.price.toLocaleString('en-IN')}
          <span style={{ fontSize: 10, color: '#A09D99', fontWeight: 500 }}>/mo</span>
        </div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            padding: '2px 7px',
            borderRadius: 999,
            background: isActive ? '#E8FAF1' : '#FDECEC',
            color: isActive ? '#1A8A4A' : '#C92D2D',
            textTransform: 'capitalize',
          }}
        >
          {sub.status}
        </div>
      </div>

      <AnimatePresence>
        {actionsOpen ? (
          <motion.div
            key="actions"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 12px',
              background:
                'linear-gradient(90deg, rgba(240,238,254,0) 0%, #F0EEFE 35%)',
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                setActionsOpen(false)
                onEdit(sub)
              }}
              style={{
                background: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '8px 10px',
                fontSize: 11,
                fontWeight: 600,
                color: '#7B6EF6',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              }}
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setActionsOpen(false)
                onDelete(sub.id)
              }}
              style={{
                background: '#FF3A30',
                border: 'none',
                borderRadius: 10,
                padding: '8px 10px',
                fontSize: 11,
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(255,58,48,0.35)',
              }}
            >
              Delete
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setActionsOpen(false)
              }}
              aria-label="Close actions"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#6E6B67',
                cursor: 'pointer',
                fontSize: 14,
                padding: '4px 6px',
              }}
            >
              ×
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}
