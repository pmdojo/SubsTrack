import React, { useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from '../lib/motion'
import Header from '../components/Header'
import DuePaymentCard from '../components/DuePaymentCard'
import ActiveSubsHeroCard from '../components/ActiveSubsHeroCard'
import MetricsBar from '../components/MetricsBar'
import QuickActions from '../components/QuickActions'
import SpendingOverview from '../components/SpendingOverview'
import SubList from '../components/SubList'
import AddSubModal from '../components/AddSubModal'
import AddSubWizard from '../components/wizard/AddSubWizard'
import BottomNav, { NavTab } from '../components/BottomNav'
import SubDetailSheet from '../components/SubDetailSheet'
import {
  useSubs,
  useInsertSub,
  useUpdateSub,
  useDeleteSub,
  useSetSubStatus,
} from '../features/subscriptions/hooks'
import { useAuthBootstrap } from '../features/auth/hooks'
import { useToast } from '../components/ui/UiProvider'
import { t, copy } from '../lib/copy'
import type { Subscription } from '../lib/types'
import { colors, spacing } from '../theme'

export default function HomeScreen() {
  const { width } = useWindowDimensions()
  // Below 480px we stack. At 480+ we use the layered overlap composition.
  const useOverlap = width >= 480
  const wideContainer = width >= 768

  // ── Server state ──────────────────────────────────────────────────────
  // useSubs pulls from Supabase when configured, falls back to the legacy
  // AsyncStorage store otherwise. Every mutation below is optimistic — the
  // cache updates before the network round-trip, so metrics + list + orbit
  // re-render in the same frame.
  const { user } = useAuthBootstrap()
  const { data: subs = [] } = useSubs()
  const insertSubM = useInsertSub(user?.id ?? null)
  const updateSubM = useUpdateSub()
  const deleteSubM = useDeleteSub()
  const setStatusM = useSetSubStatus()
  const toast = useToast()

  // ── Local UI state ────────────────────────────────────────────────────
  // `wizardOpen` drives the new 5-step Add flow (opened from the FAB and
  // QuickActions "Add"). `modalOpen` still hosts the legacy single-form
  // Edit modal — editing a sub keeps its lighter-weight UX for now.
  const [wizardOpen, setWizardOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editSub, setEditSub] = useState<Subscription | null>(null)
  // Track the OPEN sub by id, not by snapshot — the sheet re-derives
  // `detailSub` from the fresh `subs` array on every render, so pause /
  // resume / cancel inside the sheet reflect instantly.
  const [detailSubId, setDetailSubId] = useState<string | null>(null)
  const detailSub = detailSubId
    ? subs.find((s) => s.id === detailSubId) ?? null
    : null
  const [tab, setTab] = useState<NavTab>('home')

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleAdd = (sub: Subscription) => {
    insertSubM.mutate(sub)
    toast(t(copy.toast.added, { name: sub.name }), { kind: 'success' })
  }

  const handleDelete = (id: string) => {
    const name = subs.find((s) => s.id === id)?.name ?? 'Subscription'
    deleteSubM.mutate(id)
    toast(t(copy.toast.deleted, { name }))
  }

  const handlePause = (id: string) => {
    const name = subs.find((s) => s.id === id)?.name ?? 'Subscription'
    setStatusM.mutate({ id, status: 'paused' })
    toast(t(copy.toast.paused, { name }))
  }

  const handleResume = (id: string) => {
    const name = subs.find((s) => s.id === id)?.name ?? 'Subscription'
    setStatusM.mutate({ id, status: 'active' })
    toast(t(copy.toast.resumed, { name }))
  }

  const handleCancel = (id: string) => {
    const name = subs.find((s) => s.id === id)?.name ?? 'Subscription'
    setStatusM.mutate({ id, status: 'cancelled' })
    toast(t(copy.toast.cancelled, { name }))
  }

  const handleToggleAutoRenew = (sub: Subscription, autoRenew: boolean) => {
    updateSubM.mutate({ ...sub, autoRenew })
    toast(autoRenew ? copy.toast.autoRenewOn : copy.toast.autoRenewOff)
  }

  const handleEdit = (sub: Subscription) => {
    setEditSub(sub)
    setDetailSubId(null)
    setModalOpen(true)
  }

  const handleEditSave = (sub: Subscription) => {
    updateSubM.mutate(sub)
    toast(t(copy.toast.updated, { name: sub.name }), { kind: 'success' })
    setEditSub(null)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditSub(null)
  }

  return (
    <LinearGradient
      colors={colors.bgGradient as unknown as [string, string, string]}
      locations={[0, 0.55, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          wideContainer && styles.containerWide,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Section delay={0}>
          <Header subs={subs} />
        </Section>

        <Section delay={80}>
          <View
            style={[styles.heroRow, !useOverlap && styles.heroRowStacked]}
          >
            <View style={styles.heroSlot}>
              <DuePaymentCard subs={subs} />
            </View>
            <View style={styles.heroSlot}>
              <ActiveSubsHeroCard
                subs={subs}
                onOpen={() => setTab('subs')}
              />
            </View>
          </View>
        </Section>

        <Section delay={160}>
          <MetricsBar subs={subs} />
        </Section>

        <Section delay={200}>
          <QuickActions onAdd={() => setWizardOpen(true)} />
        </Section>

        <Section delay={240}>
          <SpendingOverview subs={subs} />
        </Section>

        <Section delay={280}>
          <SubList
            subs={subs}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onSelect={(s) => setDetailSubId(s.id)}
          />
        </Section>

        {tab !== 'home' && (
          <View style={styles.tabPlaceholder}>
            <Text style={styles.tabPlaceholderText}>
              {tab === 'subs'
                ? 'All Subscriptions'
                : tab === 'analytics'
                  ? 'Analytics'
                  : 'Profile'}
            </Text>
            <Text style={styles.tabPlaceholderSub}>
              Coming soon. Home is the fully-built screen for this pass.
            </Text>
          </View>
        )}
      </ScrollView>

      <BottomNav
        active={tab}
        onSelect={setTab}
        onAdd={() => setWizardOpen(true)}
      />

      <AddSubWizard
        visible={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />

      <AddSubModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onAdd={handleAdd}
        onEdit={handleEditSave}
        editSub={editSub}
      />

      <SubDetailSheet
        sub={detailSub}
        onClose={() => setDetailSubId(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPause={handlePause}
        onResume={handleResume}
        onCancel={handleCancel}
        onToggleAutoRenew={handleToggleAutoRenew}
      />
    </SafeAreaView>
    </LinearGradient>
  )
}

function Section({
  delay,
  children,
}: {
  delay: number
  children: React.ReactNode
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 460, delay }}
    >
      {children}
    </MotiView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent', // gradient sits behind
  },
  container: {
    maxWidth: 520,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 18,
    paddingTop: spacing.md,
    paddingBottom: 180,
    gap: 22,
  },
  // ≥768px: widen the whole page so two 320-height hero cards read as a
  // real two-column layout rather than a cramped side-by-side.
  containerWide: {
    maxWidth: 960,
    paddingHorizontal: 32,
    gap: 28,
  },
  // ── Hero row ───────────────────────────────────────────────────────────
  // Clean side-by-side at ≥480, stacked below. No overlap, no z-index games.
  heroRow: {
    flexDirection: 'row',
    alignItems: 'stretch', // equal heights, top edges aligned
    gap: 24,
  },
  heroRowStacked: {
    flexDirection: 'column',
  },
  heroSlot: {
    flex: 1,
    minWidth: 0,
  },
  tabPlaceholder: {
    marginTop: 30,
    padding: 30,
    backgroundColor: '#fff',
    borderRadius: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEDE7',
  },
  tabPlaceholderText: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: colors.ink,
    letterSpacing: -0.4,
  },
  tabPlaceholderSub: {
    marginTop: 6,
    fontSize: 12,
    color: colors.muted,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
  },
})
