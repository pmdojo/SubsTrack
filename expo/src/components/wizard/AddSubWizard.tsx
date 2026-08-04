import React, { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import BottomSheet from '../BottomSheet'
import StepIndicator from './StepIndicator'
import Step1Search from './steps/Step1Search'
import Step2Amount from './steps/Step2Amount'
import Step3Cycle from './steps/Step3Cycle'
import Step4Reminder from './steps/Step4Reminder'
import { colors, elevation, font, radius, spacing } from '../../theme'
import { useInsertSub } from '../../features/subscriptions/hooks'
import { useAuthBootstrap } from '../../features/auth/hooks'
import { useToast } from '../ui/UiProvider'
import { copy, t } from '../../lib/copy'
import type { Subscription, SubStatus } from '../../lib/types'

type Props = {
  visible: boolean
  onClose: () => void
}

// Draft state accumulated across the 5 steps. Assembled into a full
// Subscription at Save time. `undefined` fields become defaults.
export type Draft = {
  name: string
  icon: string
  color: string
  plan: string
  price: number | null
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  firstBillingAt: string // YYYY-MM-DD
  categorySlug: string
  categoryLabel: string
  remindLeadDays: number
  autoRenew: boolean
  status: SubStatus
}

const EMPTY_DRAFT: Draft = {
  name: '',
  icon: '',
  color: colors.primary,
  plan: '',
  price: null,
  billingCycle: 'monthly',
  firstBillingAt: toIsoDate(addDays(new Date(), 30)),
  categorySlug: 'utility',
  categoryLabel: 'Utilities',
  remindLeadDays: 2,
  autoRenew: true,
  status: 'active',
}

const TOTAL_STEPS = 4 // Payment methods (step 4 in spec) deferred to a later slice

/**
 * Multi-step Add Subscription flow. Renders inside a full-height BottomSheet,
 * manages draft state across steps, calls useInsertSub on save.
 */
export default function AddSubWizard({ visible, onClose }: Props) {
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)

  const { user } = useAuthBootstrap()
  const insertSubM = useInsertSub(user?.id ?? null)
  const toast = useToast()

  // Reset state whenever the wizard opens fresh.
  React.useEffect(() => {
    if (visible) {
      setStep(1)
      setDraft(EMPTY_DRAFT)
    }
  }, [visible])

  const patch = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const canAdvance = (): boolean => {
    switch (step) {
      case 1:
        return draft.name.trim().length > 0
      case 2:
        return (draft.price ?? 0) > 0
      case 3:
        return !!draft.firstBillingAt
      case 4:
        return true
      default:
        return false
    }
  }

  const goNext = () => {
    if (!canAdvance()) return
    if (step === TOTAL_STEPS) {
      handleSave()
    } else {
      setStep((s) => (s + 1) as typeof step)
    }
  }

  const goBack = () => {
    if (step === 1) {
      onClose()
    } else {
      setStep((s) => (s - 1) as typeof step)
    }
  }

  const handleSave = () => {
    const sub: Subscription = {
      id: crypto.randomUUID(),
      name: draft.name.trim(),
      icon: draft.icon || draft.name.trim().charAt(0).toUpperCase(),
      color: draft.color,
      price: draft.price ?? 0,
      cardLast4: '',
      billingDate: draft.firstBillingAt,
      status: draft.status,
      category: draft.categoryLabel,
      plan: draft.plan || undefined,
      autoRenew: draft.autoRenew,
    }
    insertSubM.mutate(sub)
    toast(t(copy.toast.added, { name: sub.name }), { kind: 'success' })
    onClose()
  }

  const ctaLabel = step === TOTAL_STEPS ? 'Add Subscription' : 'Continue'

  return (
    <BottomSheet visible={visible} onClose={onClose} heightFraction={0.92}>
      {/* Header: back + step indicator + close */}
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.iconBtn} hitSlop={10}>
          <Feather
            name={step === 1 ? 'x' : 'arrow-left'}
            size={20}
            color={colors.ink}
          />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 14 }}>
          <StepIndicator total={TOTAL_STEPS} current={step} />
        </View>
        {/* Balance the layout — placeholder for a "Skip" affordance in later slice */}
        <View style={{ width: 40, height: 40 }} />
      </View>

      {/* Step body */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && <Step1Search draft={draft} patch={patch} />}
        {step === 2 && <Step2Amount draft={draft} patch={patch} />}
        {step === 3 && <Step3Cycle draft={draft} patch={patch} />}
        {step === 4 && <Step4Reminder draft={draft} patch={patch} />}
      </ScrollView>

      {/* Sticky CTA */}
      <Pressable
        onPress={goNext}
        disabled={!canAdvance()}
        style={({ pressed }) => [
          styles.cta,
          !canAdvance() && { opacity: 0.4 },
          pressed && canAdvance() && { transform: [{ translateY: -1 }] },
        ]}
      >
        <Text style={styles.ctaText}>{ctaLabel}</Text>
      </Pressable>
    </BottomSheet>
  )
}

// ── Utils ──────────────────────────────────────────────────────────────────

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4F3F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingBottom: 96, // leaves room for sticky CTA
    gap: spacing.lg,
  },
  cta: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 22,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    ...elevation.fab,
  },
  ctaText: {
    color: '#FFFFFF',
    fontFamily: font.bold,
    fontSize: 15,
    letterSpacing: -0.2,
  },
})
