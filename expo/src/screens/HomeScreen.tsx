import React, { useEffect, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MotiView } from '../lib/motion'
import Header from '../components/Header'
import DuePaymentCard from '../components/DuePaymentCard'
import ActiveSubsHeroCard from '../components/ActiveSubsHeroCard'
import SpendingOverview from '../components/SpendingOverview'
import SubList from '../components/SubList'
import AddSubModal from '../components/AddSubModal'
import BottomNav, { NavTab } from '../components/BottomNav'
import SubDetailSheet from '../components/SubDetailSheet'
import {
  getSubs,
  addSub as addSubStore,
  deleteSub as deleteSubStore,
  updateSub as updateSubStore,
} from '../lib/store'
import type { Subscription } from '../lib/types'
import { colors, spacing } from '../theme'

export default function HomeScreen() {
  const { width } = useWindowDimensions()
  // Below 480px we stack. At 480+ we use the layered overlap composition.
  const useOverlap = width >= 480
  const wideContainer = width >= 768

  const [subs, setSubs] = useState<Subscription[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editSub, setEditSub] = useState<Subscription | null>(null)
  const [detailSub, setDetailSub] = useState<Subscription | null>(null)
  const [tab, setTab] = useState<NavTab>('home')

  useEffect(() => {
    getSubs().then(setSubs)
  }, [])

  const handleAdd = (sub: Subscription) => {
    setSubs((prev) => [sub, ...prev])
    void addSubStore(sub)
  }

  const handleDelete = (id: string) => {
    setSubs((prev) => prev.filter((s) => s.id !== id))
    void deleteSubStore(id)
  }

  const handleEdit = (sub: Subscription) => {
    setEditSub(sub)
    setDetailSub(null)
    setModalOpen(true)
  }

  const handleEditSave = (sub: Subscription) => {
    setSubs((prev) => prev.map((s) => (s.id === sub.id ? sub : s)))
    void updateSubStore(sub)
    setEditSub(null)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditSub(null)
  }

  return (
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
          <SpendingOverview subs={subs} />
        </Section>

        <Section delay={240}>
          <SubList
            subs={subs}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onSelect={setDetailSub}
          />
        </Section>

        {tab !== 'home' && (
          <View style={styles.tabPlaceholder}>
            <Text style={styles.tabPlaceholderText}>
              {tab === 'subs'
                ? 'All Subscriptions'
                : tab === 'analytics'
                  ? 'Analytics'
                  : tab === 'calendar'
                    ? 'Calendar'
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
        onAdd={() => {
          setEditSub(null)
          setModalOpen(true)
        }}
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
        onClose={() => setDetailSub(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </SafeAreaView>
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
    backgroundColor: colors.bg,
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
