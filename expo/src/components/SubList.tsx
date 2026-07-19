import React, { useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AnimatePresence, MotiView } from '../lib/motion'
import { colors, radius } from '../theme'
import type { Subscription } from '../lib/types'
import { formatINR } from '../lib/store'

type Props = {
  subs: Subscription[]
  onDelete: (id: string) => void
  onEdit: (sub: Subscription) => void
  onSelect?: (sub: Subscription) => void
}

function formatExpiryLabel(billingDate: string): string {
  const d = new Date(billingDate)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function SubList({ subs, onDelete, onEdit, onSelect }: Props) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Active Subscriptions</Text>
        <Pressable>
          <Text style={styles.link}>See All →</Text>
        </Pressable>
      </View>

      <View style={{ gap: 12 }}>
        <AnimatePresence>
          {subs.map((sub, i) => (
            <SubRow
              key={sub.id}
              sub={sub}
              index={i}
              onDelete={onDelete}
              onEdit={onEdit}
              onSelect={onSelect}
            />
          ))}
        </AnimatePresence>
      </View>
    </View>
  )
}

function SubRow({
  sub,
  index,
  onDelete,
  onEdit,
  onSelect,
}: {
  sub: Subscription
  index: number
  onDelete: (id: string) => void
  onEdit: (sub: Subscription) => void
  onSelect?: (sub: Subscription) => void
}) {
  const [pressed, setPressed] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isActive = sub.status === 'active'

  const startPress = () => {
    setPressed(true)
    if (pressTimer.current) clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(() => setActionsOpen(true), 500)
  }
  const cancelPress = () => {
    setPressed(false)
    if (pressTimer.current) clearTimeout(pressTimer.current)
    pressTimer.current = null
  }

  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      exit={{ opacity: 0, translateX: 20 }}
      transition={{
        type: 'spring',
        damping: 28,
        stiffness: 320,
        delay: index * 40,
      }}
    >
      <Pressable
        onPress={() => onSelect?.(sub)}
        onPressIn={startPress}
        onPressOut={cancelPress}
        onLongPress={() => setActionsOpen(true)}
        delayLongPress={500}
        style={[
          styles.row,
          pressed && {
            transform: [{ translateY: -2 }],
            shadowOpacity: 0.12,
            shadowRadius: 20,
          },
        ]}
      >
        <HoveringIcon
          color={sub.color}
          icon={sub.icon}
          index={index}
          pressed={pressed}
        />

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {sub.name}
          </Text>
          <View style={styles.detailRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>Card **** {sub.cardLast4}</Text>
            </View>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isActive ? colors.successBg : colors.dangerBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: isActive ? colors.success : colors.danger },
                ]}
              >
                {isActive ? 'Active Subscription' : 'Expired'}
              </Text>
            </View>
          </View>
          <Text style={styles.expiry} numberOfLines={1}>
            {isActive ? 'Renews: ' : 'Expired: '}
            {formatExpiryLabel(sub.billingDate)}
          </Text>
        </View>

        <View style={styles.right}>
          <Text style={styles.price}>
            {formatINR(sub.price, { withCents: false })}
          </Text>
          <Text style={styles.priceMo}>/month</Text>
        </View>

        <AnimatePresence>
          {actionsOpen && (
            <MotiView
              from={{ translateX: 40, opacity: 0 }}
              animate={{ translateX: 0, opacity: 1 }}
              exit={{ translateX: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 340 }}
              style={styles.actions}
            >
              <Pressable
                onPress={() => {
                  setActionsOpen(false)
                  onEdit(sub)
                }}
                style={styles.editBtn}
              >
                <Text style={styles.editText}>Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setActionsOpen(false)
                  onDelete(sub.id)
                }}
                style={styles.delBtn}
              >
                <Text style={styles.delText}>Delete</Text>
              </Pressable>
              <Pressable
                onPress={() => setActionsOpen(false)}
                style={styles.closeBtn}
                hitSlop={8}
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </MotiView>
          )}
        </AnimatePresence>
      </Pressable>
    </MotiView>
  )
}

/**
 * Continuously bobs the app tile up/down with a subtle scale + shadow pulse
 * so the icons feel like they're floating over the row. Each row is
 * staggered via `index` so the group never moves in unison.
 */
function HoveringIcon({
  color,
  icon,
  index,
  pressed,
}: {
  color: string
  icon: string
  index: number
  pressed: boolean
}) {
  // Alternate direction per row so neighbors sway opposite ways.
  const up = index % 2 === 0 ? -5 : 5
  const down = -up
  return (
    <MotiView
      from={{ translateY: 0, scale: 1 }}
      animate={{
        translateY: pressed ? -8 : up,
        scale: pressed ? 1.1 : 1,
      }}
      transition={
        pressed
          ? { type: 'spring', damping: 12, stiffness: 260 }
          : { type: 'timing', duration: 1600 + (index % 3) * 200, loop: true }
      }
      style={styles.iconShadow}
    >
      <MotiView
        from={{ translateY: 0 }}
        animate={{ translateY: pressed ? 0 : down }}
        transition={{
          type: 'timing',
          duration: 1600 + (index % 3) * 200,
          loop: true,
          delay: index * 120,
        }}
        style={[styles.iconTile, { backgroundColor: color }]}
      >
        <Text style={styles.iconText}>{icon}</Text>
      </MotiView>
    </MotiView>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.5,
    fontFamily: 'DMSans_700Bold',
  },
  link: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'DMSans_500Medium',
  },
  row: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1EFEA',
  },
  iconShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  iconText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'DMSans_700Bold',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
    fontFamily: 'DMSans_700Bold',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: colors.chip,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  chipText: {
    fontSize: 10,
    color: '#6E6B67',
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
  },
  expiry: {
    marginTop: 6,
    fontSize: 10,
    color: colors.muted,
    fontFamily: 'DMSans_400Regular',
  },
  right: {
    alignItems: 'flex-end',
    gap: 0,
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.4,
    fontFamily: 'DMSans_700Bold',
  },
  priceMo: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '500',
    fontFamily: 'DMSans_400Regular',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'DMSans_700Bold',
  },
  actions: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.primaryTint,
  },
  editBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  editText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
  },
  delBtn: {
    backgroundColor: '#FF3A30',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  delText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
  },
  closeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  closeText: {
    color: '#6E6B67',
    fontSize: 16,
  },
})
