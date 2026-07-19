'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Subscription } from '../lib/types'

type Props = {
  isOpen: boolean
  onClose: () => void
  onAdd: (sub: Subscription) => void
  onEdit?: (sub: Subscription) => void
  editSub?: Subscription | null
}

type FormState = {
  name: string
  icon: string
  color: string
  price: string
  cardLast4: string
  billingDate: string
  status: Subscription['status']
  category: string
}

const EMPTY_FORM: FormState = {
  name: '',
  icon: '',
  color: '#7B6EF6',
  price: '',
  cardLast4: '',
  billingDate: '',
  status: 'active',
  category: 'General',
}

function genId(): string {
  return 'sub-' + Math.random().toString(36).slice(2, 10)
}

export default function AddSubModal({
  isOpen,
  onClose,
  onAdd,
  onEdit,
  editSub,
}: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const isEditMode = Boolean(editSub)

  useEffect(() => {
    if (editSub) {
      setForm({
        name: editSub.name,
        icon: editSub.icon,
        color: editSub.color,
        price: String(editSub.price),
        cardLast4: editSub.cardLast4,
        billingDate: editSub.billingDate,
        status: editSub.status,
        category: editSub.category,
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setError(null)
  }, [editSub, isOpen])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = () => {
    const priceNum = Number(form.price)
    if (!form.name.trim()) return setError('Please enter an app name')
    if (!form.icon.trim()) return setError('Please add an icon')
    if (!form.price.trim() || Number.isNaN(priceNum) || priceNum <= 0)
      return setError('Enter a valid monthly price')
    if (!/^\d{4}$/.test(form.cardLast4))
      return setError('Card last 4 must be 4 digits')
    if (!form.billingDate) return setError('Please pick a billing date')

    const sub: Subscription = {
      id: editSub?.id ?? genId(),
      name: form.name.trim(),
      icon: form.icon.trim(),
      color: form.color,
      price: priceNum,
      cardLast4: form.cardLast4,
      billingDate: form.billingDate,
      status: form.status,
      category: form.category,
    }

    if (isEditMode && onEdit) {
      onEdit(sub)
      showToast('✓ Subscription updated!')
    } else {
      onAdd(sub)
      showToast('✓ Subscription added!')
    }
    onClose()
  }

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                zIndex: 50,
              }}
            />
            <motion.div
              key="sheet"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 60,
                display: 'flex',
                justifyContent: 'center',
              }}
              role="dialog"
              aria-modal="true"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#fff',
                  width: '100%',
                  maxWidth: 460,
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  padding: '24px 22px 28px',
                  maxHeight: '92vh',
                  overflowY: 'auto',
                  boxShadow: '0 -20px 60px rgba(0,0,0,0.18)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: '#1A1917',
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {isEditMode ? 'Edit Subscription' : 'Add Subscription'}
                  </div>
                  <button
                    aria-label="Close"
                    onClick={onClose}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: '#F4F3F0',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 16,
                      color: '#1A1917',
                      fontWeight: 600,
                    }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label="App Name">
                    <input
                      type="text"
                      value={form.name}
                      placeholder="Netflix, Spotify…"
                      onChange={(e) => set('name', e.target.value)}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Icon">
                    <input
                      type="text"
                      value={form.icon}
                      placeholder="Paste emoji ▶ ♪ ✳"
                      onChange={(e) => set('icon', e.target.value)}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Icon Color">
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="color"
                        value={form.color}
                        onChange={(e) => set('color', e.target.value)}
                        style={{
                          width: 48,
                          height: 44,
                          borderRadius: 12,
                          border: '1px solid #EEECEA',
                          padding: 2,
                          cursor: 'pointer',
                          background: '#fff',
                        }}
                      />
                      <input
                        type="text"
                        value={form.color}
                        onChange={(e) => set('color', e.target.value)}
                        placeholder="#7B6EF6"
                        style={{ ...inputStyle, flex: 1 }}
                      />
                    </div>
                  </Field>

                  <Field label="Monthly Price (₹)">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={form.price}
                      onChange={(e) => set('price', e.target.value)}
                      placeholder="649"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Card Last 4">
                    <input
                      type="text"
                      maxLength={4}
                      value={form.cardLast4}
                      onChange={(e) =>
                        set('cardLast4', e.target.value.replace(/\D/g, ''))
                      }
                      placeholder="0977"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Billing Date">
                    <input
                      type="date"
                      value={form.billingDate}
                      onChange={(e) => set('billingDate', e.target.value)}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Status">
                    <StatusToggle
                      value={form.status}
                      onChange={(v) => set('status', v)}
                    />
                  </Field>

                  {error ? (
                    <div
                      style={{
                        color: '#C92D2D',
                        fontSize: 12,
                        marginTop: 2,
                        fontWeight: 500,
                      }}
                    >
                      {error}
                    </div>
                  ) : null}

                  <button
                    onClick={handleSubmit}
                    style={{
                      width: '100%',
                      background: '#7B6EF6',
                      color: '#fff',
                      borderRadius: 12,
                      padding: 14,
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: 'pointer',
                      marginTop: 4,
                      transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                      boxShadow: '0 8px 20px rgba(123,110,246,0.35)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#6C5CE7'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#7B6EF6'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    {isEditMode ? 'Save Changes' : 'Add Subscription'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {toast ? (
          <motion.div
            key="toast"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              background: '#1A1917',
              color: '#fff',
              borderRadius: 12,
              padding: '12px 20px',
              fontSize: 13,
              fontWeight: 600,
              zIndex: 80,
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            }}
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 14px',
  borderRadius: 12,
  border: '1px solid #EEECEA',
  fontSize: 14,
  background: '#FAF9F7',
  color: '#1A1917',
  outline: 'none',
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span
        style={{
          fontSize: 10,
          color: '#A09D99',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}

function StatusToggle({
  value,
  onChange,
}: {
  value: Subscription['status']
  onChange: (v: Subscription['status']) => void
}) {
  const isActive = value === 'active'
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button
        onClick={() => onChange(isActive ? 'expired' : 'active')}
        style={{
          position: 'relative',
          width: 58,
          height: 32,
          borderRadius: 999,
          background: isActive ? '#7B6EF6' : '#C9C7C4',
          border: 'none',
          cursor: 'pointer',
          padding: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isActive ? 'flex-end' : 'flex-start',
          transition: 'background 0.2s ease',
        }}
        aria-label="Toggle status"
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          style={{
            display: 'block',
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        />
      </button>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: isActive ? '#1A1917' : '#A09D99',
        }}
      >
        {isActive ? 'Active' : 'Expired'}
      </span>
    </div>
  )
}
