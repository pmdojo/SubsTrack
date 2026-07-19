import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { MotiView } from '../lib/motion'
import { colors, elevation, font, radius } from '../theme'

export type NavTab = 'home' | 'subs' | 'analytics' | 'calendar' | 'profile'

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
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'subs', label: 'Subs', icon: 'list' },
  { key: 'analytics', label: 'Stats', icon: 'bar-chart-2' },
  { key: 'calendar', label: 'Cal', icon: 'calendar' },
  { key: 'profile', label: 'You', icon: 'user' },
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
    <Pressable onPress={onPress} style={styles.item}>
      <Feather
        name={tab.icon}
        size={20}
        color={active ? colors.primary : '#9C9990'}
      />
      <Text
        style={[
          styles.label,
          { color: active ? colors.primary : '#9C9990' },
        ]}
      >
        {tab.label}
      </Text>
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
    backgroundColor: 'rgba(255,255,255,0.94)',
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
    paddingVertical: 6,
    position: 'relative',
  },
  label: {
    marginTop: 3,
    fontSize: 10,
    fontFamily: font.semibold,
    letterSpacing: -0.1,
  },
  activeDot: {
    position: 'absolute',
    bottom: -1,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  fab: {
    position: 'absolute',
    top: -18,
    alignSelf: 'center',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.hero,
    shadowColor: colors.primary,
  },
  fabInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
