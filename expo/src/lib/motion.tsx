import React, {
  forwardRef,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native'

/**
 * Minimal Moti-compatible shim over React Native's Animated API.
 * Supports the subset actually used in this app:
 *   props:  from, animate, transition, style, children
 *   types:  'timing' (duration, delay, loop) and 'spring' (damping, stiffness)
 *   fields: opacity, translateX, translateY, scale, marginLeft, shadowOpacity
 * `exit` is accepted but ignored — AnimatePresence is a passthrough.
 */

type NumMap = Record<string, number>

type Transition = {
  type?: 'timing' | 'spring'
  duration?: number
  delay?: number
  loop?: boolean
  damping?: number
  stiffness?: number
}

type MotiViewProps = {
  from?: NumMap
  animate?: NumMap
  exit?: NumMap
  transition?: Transition
  style?: StyleProp<ViewStyle>
  children?: ReactNode
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only'
  onLayout?: any
}

const TRANSFORM_KEYS = new Set(['translateX', 'translateY', 'scale', 'rotate'])

function runAnim(
  value: Animated.Value,
  toValue: number,
  transition: Transition | undefined,
  onDone?: () => void
): Animated.CompositeAnimation {
  const t = transition ?? {}
  if (t.type === 'spring') {
    return Animated.spring(value, {
      toValue,
      damping: t.damping ?? 15,
      stiffness: t.stiffness ?? 200,
      mass: 1,
      useNativeDriver: false,
      delay: t.delay,
    } as any)
  }
  return Animated.timing(value, {
    toValue,
    duration: t.duration ?? 300,
    delay: t.delay,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: false,
  })
}

export const MotiView = forwardRef<any, MotiViewProps>(function MotiView(
  { from, animate, transition, style, children, ...rest },
  ref
) {
  const keys = useMemo(() => {
    const set = new Set<string>()
    for (const k of Object.keys(from ?? {})) set.add(k)
    for (const k of Object.keys(animate ?? {})) set.add(k)
    return Array.from(set)
  }, [from, animate])

  // Persistent Animated.Value per animated key. First render seeds from `from` (or `animate`).
  const valuesRef = useRef<Record<string, Animated.Value>>({})
  const initialized = useRef(false)
  if (!initialized.current) {
    for (const k of keys) {
      const seed = from?.[k] ?? animate?.[k] ?? 0
      valuesRef.current[k] = new Animated.Value(seed)
    }
    initialized.current = true
  } else {
    // Add any new keys introduced after mount.
    for (const k of keys) {
      if (!valuesRef.current[k]) {
        valuesRef.current[k] = new Animated.Value(from?.[k] ?? animate?.[k] ?? 0)
      }
    }
  }

  // Serialize animate targets so useEffect diffs value-by-value, not by object identity.
  const animateKey = animate
    ? keys.map((k) => `${k}:${animate[k] ?? ''}`).join('|')
    : ''

  useEffect(() => {
    if (!animate) return
    const anims: Animated.CompositeAnimation[] = []
    for (const k of keys) {
      const target = animate[k]
      if (target == null) continue
      const v = valuesRef.current[k]
      if (transition?.loop) {
        // Ping-pong loop between `from` and `animate` for the pulse effect.
        const start = from?.[k] ?? 0
        anims.push(
          Animated.loop(
            Animated.sequence([
              runAnim(v, target, transition),
              runAnim(v, start, transition),
            ])
          )
        )
      } else {
        anims.push(runAnim(v, target, transition))
      }
    }
    const composite = Animated.parallel(anims)
    composite.start()
    return () => composite.stop()
  }, [animateKey, transition?.type, transition?.duration, transition?.loop])

  // Build animated style: split transform keys out.
  const animatedStyle: any = {}
  const transforms: any[] = []
  for (const k of keys) {
    const v = valuesRef.current[k]
    if (TRANSFORM_KEYS.has(k)) {
      transforms.push({ [k]: v })
    } else {
      animatedStyle[k] = v
    }
  }
  if (transforms.length) animatedStyle.transform = transforms

  return (
    <Animated.View ref={ref} style={[style, animatedStyle]} {...rest}>
      {children}
    </Animated.View>
  )
})

/**
 * Passthrough. Enter animations still play (MotiView handles those on mount);
 * exit animations are dropped. Children unmount immediately when their parent
 * removes them, which is fine for this app's usage (list delete, tab swap, toast).
 */
export function AnimatePresence({
  children,
}: {
  children: ReactNode
  exitBeforeEnter?: boolean
  initial?: boolean
}) {
  return <>{children}</>
}
