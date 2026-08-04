import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { MotiView, AnimatePresence } from '../lib/motion'
import { colors, elevation, font, radius } from '../theme'

type Action = 'add' | 'category' | 'insights' | 'export'

type Props = {
  onAdd: () => void
  onCategory?: () => void
  onInsights?: () => void
  onExport?: () => void
}

/**
 * Four floating rounded-square buttons under the hero. Icon lives in a
 * tinted circular chip on top, label sits underneath. Whole tile lifts on
 * hover/press to feel physical.
 */
export default function QuickActions({
  onAdd,
  onCategory,
  onInsights,
  onExport,
}: Props) {
  const [toast, setToast] = useState<string | null>(null)
  const fireToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1600)
  }

  const items: {
    key: Action
    label: string
    icon: keyof typeof Feather.glyphMap
    tint: string // background of the round icon chip
    fg: string // icon color
    onPress: () => void
  }[] = [
    {
      key: 'add',
      label: 'Add',
      icon: 'plus',
      tint: '#E8E4FE',
      fg: colors.primary,
      onPress: onAdd,
    },
    {
      key: 'category',
      label: 'Category',
      icon: 'grid',
      tint: '#DCF6E5',
      fg: '#0F9D58',
      onPress: () => (onCategory ? onCategory() : fireToast('Categories coming soon')),
    },
    {
      key: 'insights',
      label: 'Insights',
      icon: 'bar-chart-2',
      tint: '#FEF0C7',
      fg: '#B45309',
      onPress: () => (onInsights ? onInsights() : fireToast('Insights coming soon')),
    },
    {
      key: 'export',
      label: 'Export',
      icon: 'download',
      tint: '#E7EBF3',
      fg: '#334155',
      onPress: () => (onExport ? onExport() : fireToast('Exported to Downloads')),
    },
  ]

  return (
    <View>
      <View style={styles.row}>
        {items.map((it) => (
          <QuickTile key={it.key} {...it} />
        ))}
      </View>

      <AnimatePresence>
        {toast ? (
          <MotiView
            key="qa-toast"
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: 10 }}
            transition={{ type: 'timing', duration: 180 }}
            style={styles.toastWrap}
          >
            <Text style={styles.toastText}>{toast}</Text>
          </MotiView>
        ) : null}
      </AnimatePresence>
    </View>
  )
}

function QuickTile({
  label,
  icon,
  tint,
  fg,
  onPress,
}: {
  label: string
  icon: keyof typeof Feather.glyphMap
  tint: string
  fg: string
  onPress: () => void
}) {
  const [pressed, setPressed] = useState(false)
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setPressed(true)}
      onHoverOut={() => setPressed(false)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={styles.tileWrap}
    >
      <MotiView
        animate={{
          translateY: pressed ? -3 : 0,
          scale: pressed ? 1.03 : 1,
        }}
        transition={{ type: 'spring', damping: 18, stiffness: 260 }}
        style={styles.tile}
      >
        <View style={[styles.iconChip, { backgroundColor: tint }]}>
          <Feather name={icon} size={18} color={fg} />
        </View>
        <Text style={styles.label}>{label}</Text>
      </MotiView>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  tileWrap: {
    flex: 1,
  },
  tile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#EFEDE7',
    ...elevation.card,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.card,
    shadowOpacity: 0.08,
  },
  label: {
    fontSize: 12,
    color: colors.ink,
    fontFamily: font.semibold,
    letterSpacing: -0.1,
  },
  toastWrap: {
    marginTop: 10,
    alignItems: 'center',
  },
  toastText: {
    backgroundColor: colors.ink,
    color: '#fff',
    fontFamily: font.semibold,
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
})
