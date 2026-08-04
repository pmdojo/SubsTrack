import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { MotiView } from '../lib/motion'
import { colors, elevation } from '../theme'

// 4 tabs (2 left + FAB slot + 2 right) — symmetric around the centered FAB
// so the plus button never overlaps a label.
export type NavTab = 'home' | 'subs' | 'analytics' | 'profile'

type Props = {
  active: NavTab
  onSelect: (t: NavTab) => void
  onAdd: () => void
}

const TABS: {
  key: NavTab
  label: string
  icon: keyof typeof Feather.glyphMap
}[] = [
  { key: 'home',      label: 'Home',  icon: 'home' },
  { key: 'subs',      label: 'Subs',  icon: 'list' },
  { key: 'analytics', label: 'Stats', icon: 'bar-chart-2' },
  { key: 'profile',   label: 'You',   icon: 'user' },
]

export default function BottomNav({ active, onSelect, onAdd }: Props) {
  const left = TABS.slice(0, 2)
  const right = TABS.slice(2)
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.bar}>
        {left.map((t) => (
          <NavItem
            key={t.key}
            tab={t}
            active={active === t.key}
            onPress={() => onSelect(t.key)}
          />
        ))}

        {/* Spacer for the FAB slot */}
        <View style={{ width: 64 }} />

        {right.map((t) => (
          <NavItem
            key={t.key}
            tab={t}
            active={active === t.key}
            onPress={() => onSelect(t.key)}
          />
        ))}
      </View>

      {/* Center floating action button */}
      <Pressable
        onPress={onAdd}
        accessibilityLabel="Add subscription"
        style={({ pressed }) => [
          styles.fab,
          pressed && { transform: [{ scale: 0.94 }] },
        ]}
      >
        <MotiView
          from={{ scale: 0.94 }}
          animate={{ scale: 1 }}
          transition={{ type: 'timing', duration: 1600, loop: true }}
          style={styles.fabInner}
        >
          <Feather name="plus" size={26} color="#fff" />
        </MotiView>
      </Pressable>
    </View>
  )
}

function NavItem({
  tab,
  active,
  onPress,
}: {
  tab: { key: NavTab; label: string; icon: keyof typeof Feather.glyphMap }
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.item}
      accessibilityLabel={tab.label}
    >
      <View
        style={[
          styles.iconWrap,
          active && styles.iconWrapActive,
        ]}
      >
        <Feather
          name={tab.icon}
          size={22}
          color={active ? colors.primary : '#B5B2A8'}
        />
      </View>
      {active && <View style={styles.activeDot} />}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingBottom: 14,
    paddingHorizontal: 14,
    zIndex: 40,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EFEDE8',
    width: '100%',
    maxWidth: 480,
    ...elevation.float,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Active icon sits in a soft lavender circle — subtle "selected" cue
  iconWrapActive: {
    backgroundColor: '#EDE9FE',
  },
  activeDot: {
    position: 'absolute',
    bottom: -3,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  fab: {
    position: 'absolute',
    top: -22,
    alignSelf: 'center',
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    // Deeper primary-tinted shadow → looks like it glows above the bar
    shadowColor: colors.primary,
    shadowOpacity: 0.55,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
    borderWidth: 4,
    borderColor: '#FBF7F1', // matches the top of the app background gradient
  },
  fabInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
