import React, { useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { MotiView, AnimatePresence } from '../../../lib/motion'
import {
  usePaymentMethods,
  useAddPaymentMethod,
} from '../../../features/payment-methods/hooks'
import {
  brandLabel,
  type CardBrand,
  type PaymentMethod,
} from '../../../features/payment-methods/model'
import { useAuthBootstrap } from '../../../features/auth/hooks'
import {
  colors,
  elevation,
  font,
  motion as motionTokens,
  radius,
  spacing,
} from '../../../theme'
import type { Draft } from '../AddSubWizard'

type Props = {
  draft: Draft
  patch: <K extends keyof Draft>(key: K, value: Draft[K]) => void
}

const BRANDS: CardBrand[] = ['visa', 'mastercard', 'amex', 'rupay', 'other']

/**
 * Step 4 of the wizard — pick a saved card or add a new one inline.
 * Never sees a real PAN or CVV — only the last 4 + brand + expiry go over
 * the wire, which is all we're allowed to store per PRD §5.3.
 */
export default function Step4Payment({ draft, patch }: Props) {
  const { data, isLoading } = usePaymentMethods()
  const cards: PaymentMethod[] = data ?? []
  const { user } = useAuthBootstrap()
  const addCardM = useAddPaymentMethod(user?.id ?? null)

  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<{
    brand: CardBrand
    last4: string
    expMonth: string
    expYear: string
    nickname: string
  }>({
    brand: 'visa',
    last4: '',
    expMonth: '',
    expYear: '',
    nickname: '',
  })

  // If user has zero cards, auto-open the form so they don't hit a dead end.
  React.useEffect(() => {
    if (!isLoading && cards.length === 0) setAdding(true)
  }, [isLoading, cards.length])

  const selectCard = (card: PaymentMethod) => {
    patch('paymentMethodId', card.id)
  }

  const canSubmitCard = (): boolean => {
    return (
      /^\d{4}$/.test(form.last4) &&
      /^(0?[1-9]|1[0-2])$/.test(form.expMonth) &&
      /^\d{2,4}$/.test(form.expYear)
    )
  }

  const submitCard = () => {
    if (!canSubmitCard()) return
    // Normalise year — a "27" input becomes 2027.
    const yearNum = Number(form.expYear)
    const expYear = yearNum < 100 ? 2000 + yearNum : yearNum

    addCardM.mutate(
      {
        brand: form.brand,
        last4: form.last4,
        expMonth: Number(form.expMonth),
        expYear,
        nickname: form.nickname.trim() || undefined,
        makeDefault: cards.length === 0, // first card becomes default
      },
      {
        onSuccess: (created) => {
          patch('paymentMethodId', created.id)
          setAdding(false)
          setForm({
            brand: 'visa',
            last4: '',
            expMonth: '',
            expYear: '',
            nickname: '',
          })
        },
      }
    )
  }

  return (
    <View style={{ gap: spacing.xxl }}>
      <View>
        <Text style={styles.title}>How are you paying?</Text>
        <Text style={styles.subtitle}>
          Pick a saved card or add a new one. We never store the full number.
        </Text>
      </View>

      {/* Saved cards */}
      {cards.length > 0 ? (
        <View style={{ gap: 10 }}>
          {cards.map((card) => (
            <CardRow
              key={card.id}
              card={card}
              selected={draft.paymentMethodId === card.id}
              onPress={() => selectCard(card)}
            />
          ))}
        </View>
      ) : null}

      {/* Add new / inline form */}
      <AnimatePresence>
        {adding ? (
          <MotiView
            key="add-form"
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: 8 }}
            transition={motionTokens.base}
            style={styles.formCard}
          >
            <Text style={styles.formLabel}>Card brand</Text>
            <View style={styles.brandRow}>
              {BRANDS.map((b) => (
                <Pressable
                  key={b}
                  onPress={() => setForm((f) => ({ ...f, brand: b }))}
                  style={[
                    styles.brandChip,
                    form.brand === b && styles.brandChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.brandChipText,
                      form.brand === b && styles.brandChipTextActive,
                    ]}
                  >
                    {brandLabel(b)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.formLabel, { marginTop: 12 }]}>Last 4 digits</Text>
            <TextInput
              value={form.last4}
              onChangeText={(v) =>
                setForm((f) => ({
                  ...f,
                  last4: v.replace(/\D/g, '').slice(0, 4),
                }))
              }
              placeholder="4242"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              maxLength={4}
              style={styles.input}
            />

            <View style={styles.expiryRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>MM</Text>
                <TextInput
                  value={form.expMonth}
                  onChangeText={(v) =>
                    setForm((f) => ({
                      ...f,
                      expMonth: v.replace(/\D/g, '').slice(0, 2),
                    }))
                  }
                  placeholder="09"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  maxLength={2}
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>YY</Text>
                <TextInput
                  value={form.expYear}
                  onChangeText={(v) =>
                    setForm((f) => ({
                      ...f,
                      expYear: v.replace(/\D/g, '').slice(0, 4),
                    }))
                  }
                  placeholder="27"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  maxLength={4}
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={[styles.formLabel, { marginTop: 12 }]}>Nickname (optional)</Text>
            <TextInput
              value={form.nickname}
              onChangeText={(v) => setForm((f) => ({ ...f, nickname: v }))}
              placeholder="Personal / Business"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <View style={styles.formActions}>
              <Pressable
                onPress={() => setAdding(false)}
                style={[styles.formBtn, styles.formBtnGhost]}
              >
                <Text style={styles.formBtnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={submitCard}
                disabled={!canSubmitCard() || addCardM.isPending}
                style={[
                  styles.formBtn,
                  styles.formBtnPrimary,
                  (!canSubmitCard() || addCardM.isPending) && { opacity: 0.4 },
                ]}
              >
                <Text style={styles.formBtnPrimaryText}>
                  {addCardM.isPending ? 'Saving…' : 'Save card'}
                </Text>
              </Pressable>
            </View>
          </MotiView>
        ) : (
          <Pressable
            onPress={() => setAdding(true)}
            style={styles.addCta}
          >
            <Feather name="plus-circle" size={16} color={colors.primary} />
            <Text style={styles.addCtaText}>Add new card</Text>
          </Pressable>
        )}
      </AnimatePresence>

      {/* Reassurance about privacy */}
      <View style={styles.privacyNote}>
        <Feather name="shield" size={13} color={colors.muted} />
        <Text style={styles.privacyText}>
          Last 4 digits only — full card number is never sent or stored.
        </Text>
      </View>
    </View>
  )
}

// ── CardRow ──────────────────────────────────────────────────────────────

function CardRow({
  card,
  selected,
  onPress,
}: {
  card: PaymentMethod
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.cardRow, selected && styles.cardRowActive]}
    >
      <View style={styles.brandBadge}>
        <Text style={styles.brandBadgeText}>{brandLabel(card.brand)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>•••• {card.last4}</Text>
        <Text style={styles.cardMeta}>
          Exp {String(card.expMonth).padStart(2, '0')}/{String(card.expYear).slice(-2)}
          {card.nickname ? ` · ${card.nickname}` : ''}
          {card.isDefault ? ' · Default' : ''}
        </Text>
      </View>
      <View style={[styles.radio, selected && styles.radioActive]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontFamily: font.bold,
    color: colors.ink,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: font.regular,
    color: colors.muted,
    lineHeight: 18,
  },
  // ── CardRow ──
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
    ...elevation.card,
  },
  cardRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  brandBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.ink,
  },
  brandBadgeText: {
    color: '#fff',
    fontFamily: font.bold,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  cardTitle: {
    fontFamily: font.bold,
    fontSize: 15,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  cardMeta: {
    marginTop: 2,
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.muted,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  // ── Add form ──
  addCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addCtaText: {
    fontSize: 14,
    color: colors.primary,
    fontFamily: font.semibold,
  },
  formCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
    ...elevation.card,
  },
  formLabel: {
    fontSize: 11,
    fontFamily: font.medium,
    color: colors.muted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  brandRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  brandChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: '#F4F3F0',
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  brandChipText: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.ink,
  },
  brandChipTextActive: {
    color: '#fff',
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: '#F4F3F0',
    fontFamily: font.semibold,
    fontSize: 15,
    color: colors.ink,
  },
  expiryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  formActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  formBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  formBtnGhost: {
    backgroundColor: '#F4F3F0',
  },
  formBtnGhostText: {
    color: colors.ink,
    fontFamily: font.bold,
    fontSize: 13,
  },
  formBtnPrimary: {
    backgroundColor: colors.primary,
  },
  formBtnPrimaryText: {
    color: '#fff',
    fontFamily: font.bold,
    fontSize: 13,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  privacyText: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.muted,
    flex: 1,
  },
})
