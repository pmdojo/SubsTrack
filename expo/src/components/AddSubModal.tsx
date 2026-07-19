import React, { useEffect, useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { AnimatePresence, MotiView } from '../lib/motion'
import { BlurView } from 'expo-blur'
import { colors, radius } from '../theme'
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

const COLOR_SWATCHES = [
  '#7B6EF6',
  '#FF3A30',
  '#1DB954',
  '#10A37F',
  '#FF0000',
  '#0078D4',
  '#FF9500',
  '#AF52DE',
]

function genId(): string {
  return 'sub-' + Math.random().toString(36).slice(2, 10)
}

function validDateStr(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s)
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

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const handleSubmit = () => {
    const priceNum = Number(form.price)
    if (!form.name.trim()) return setError('Please enter an app name')
    if (!form.icon.trim()) return setError('Please add an icon')
    if (!form.price.trim() || Number.isNaN(priceNum) || priceNum <= 0)
      return setError('Enter a valid monthly price')
    if (!/^\d{4}$/.test(form.cardLast4))
      return setError('Card last 4 must be 4 digits')
    if (!validDateStr(form.billingDate))
      return setError('Billing date must be YYYY-MM-DD')

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

  return (
    <>
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView
            intensity={30}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
          />
        </Pressable>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
          pointerEvents="box-none"
        >
          <MotiView
            from={{ translateY: 60, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={styles.sheet}
          >
            <View style={styles.header}>
              <Text style={styles.title}>
                {isEditMode ? 'Edit Subscription' : 'Add Subscription'}
              </Text>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeTxt}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: 520 }}
              contentContainerStyle={{ paddingBottom: 8 }}
              keyboardShouldPersistTaps="handled"
            >
              <Field label="APP NAME">
                <TextInput
                  value={form.name}
                  onChangeText={(v) => set('name', v)}
                  placeholder="Netflix, Spotify…"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />
              </Field>

              <Field label="ICON">
                <TextInput
                  value={form.icon}
                  onChangeText={(v) => set('icon', v)}
                  placeholder="Paste emoji ▶ ♪ ✳"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />
              </Field>

              <Field label="ICON COLOR">
                <View style={styles.colorRow}>
                  <View style={styles.swatchRow}>
                    {COLOR_SWATCHES.map((c) => {
                      const selected = form.color.toUpperCase() === c.toUpperCase()
                      return (
                        <Pressable
                          key={c}
                          onPress={() => set('color', c)}
                          style={[
                            styles.swatch,
                            { backgroundColor: c },
                            selected && styles.swatchSelected,
                          ]}
                        />
                      )
                    })}
                  </View>
                  <TextInput
                    value={form.color}
                    onChangeText={(v) => set('color', v)}
                    placeholder="#7B6EF6"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="characters"
                    style={[styles.input, { marginTop: 6 }]}
                  />
                </View>
              </Field>

              <Field label="MONTHLY PRICE (₹)">
                <TextInput
                  value={form.price}
                  onChangeText={(v) => set('price', v.replace(/[^0-9]/g, ''))}
                  placeholder="649"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </Field>

              <Field label="CARD LAST 4">
                <TextInput
                  value={form.cardLast4}
                  onChangeText={(v) =>
                    set('cardLast4', v.replace(/[^0-9]/g, '').slice(0, 4))
                  }
                  placeholder="0977"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  maxLength={4}
                  style={styles.input}
                />
              </Field>

              <Field label="BILLING DATE (YYYY-MM-DD)">
                <TextInput
                  value={form.billingDate}
                  onChangeText={(v) => set('billingDate', v)}
                  placeholder="2025-05-12"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  style={styles.input}
                />
              </Field>

              <Field label="STATUS">
                <StatusToggle
                  value={form.status}
                  onChange={(v) => set('status', v)}
                />
              </Field>

              {error && <Text style={styles.error}>{error}</Text>}

              <Pressable
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.submit,
                  pressed && { backgroundColor: colors.primaryDark, transform: [{ translateY: -1 }] },
                ]}
              >
                <Text style={styles.submitText}>
                  {isEditMode ? 'Save Changes' : 'Add Subscription'}
                </Text>
              </Pressable>
            </ScrollView>
          </MotiView>
        </KeyboardAvoidingView>
      </Modal>

      <AnimatePresence>
        {toast && (
          <MotiView
            key="toast"
            from={{ translateY: 20, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: 20, opacity: 0 }}
            transition={{ type: 'timing', duration: 250 }}
            style={styles.toast}
          >
            <Text style={styles.toastText}>{toast}</Text>
          </MotiView>
        )}
      </AnimatePresence>
    </>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Pressable
        onPress={() => onChange(isActive ? 'expired' : 'active')}
        style={[
          styles.toggle,
          { backgroundColor: isActive ? colors.primary : '#C9C7C4' },
        ]}
      >
        <MotiView
          animate={{ translateX: isActive ? 26 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          style={styles.toggleThumb}
        />
      </Pressable>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: isActive ? colors.ink : colors.muted,
          fontFamily: 'DMSans_500Medium',
        }}
      >
        {isActive ? 'Active' : 'Expired'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingTop: 24,
    paddingBottom: 28,
    maxWidth: 460,
    alignSelf: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -12 },
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.8,
    fontFamily: 'DMSans_700Bold',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: {
    fontSize: 18,
    color: colors.ink,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 5,
    fontFamily: 'DMSans_500Medium',
  },
  input: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAF9F7',
    fontSize: 14,
    color: colors.ink,
    fontFamily: 'DMSans_400Regular',
  },
  colorRow: {
    gap: 6,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: colors.ink,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 10,
    fontFamily: 'DMSans_500Medium',
  },
  submit: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  toggle: {
    width: 58,
    height: 32,
    borderRadius: 999,
    padding: 3,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  toast: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    backgroundColor: colors.ink,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  toastText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'DMSans_500Medium',
  },
})
