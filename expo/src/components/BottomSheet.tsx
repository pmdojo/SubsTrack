import React, { ReactNode, useEffect } from 'react'
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native'
import { MotiView, AnimatePresence } from '../lib/motion'
import { colors, elevation, motion as motionTokens, radius } from '../theme'

type Props = {
  /** Controls visibility. When false the sheet unmounts after exit anim. */
  visible: boolean
  onClose: () => void
  /** Sheet body — usually a header + ScrollView. */
  children: ReactNode
  /** Height as a viewport fraction (0.5, 0.9, etc). Defaults to 0.9. */
  heightFraction?: number
  /** Max width on tablet/desktop. Defaults to 520. */
  maxWidth?: number
  /** Show the top grabber pill. Default true. */
  showGrabber?: boolean
  /** Trap taps on the backdrop (don't close). Rare — use for confirm-required flows. */
  dismissOnBackdrop?: boolean
}

/**
 * Reusable bottom sheet. Handles:
 *  - Backdrop fade
 *  - Spring translateY from off-screen bottom
 *  - Grabber (visual only for now — swipe-to-dismiss lives in a follow-up)
 *  - Escape key on web
 *  - Max-width cap on wide viewports (sits centered)
 *
 * All the interior layout is the caller's responsibility. Use it like:
 *
 *   <BottomSheet visible={open} onClose={() => setOpen(false)}>
 *     <MyHeader />
 *     <ScrollView>...</ScrollView>
 *   </BottomSheet>
 */
export default function BottomSheet({
  visible,
  onClose,
  children,
  heightFraction = 0.9,
  maxWidth = 520,
  showGrabber = true,
  dismissOnBackdrop = true,
}: Props) {
  const { height: winH } = useWindowDimensions()

  // Escape-to-close on web keyboards.
  useEffect(() => {
    if (!visible || typeof document === 'undefined') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [visible, onClose])

  return (
    <AnimatePresence>
      {visible ? (
        <>
          <MotiView
            key="bs-backdrop"
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={motionTokens.base}
            style={styles.backdrop}
          >
            {dismissOnBackdrop ? (
              <Pressable style={{ flex: 1 }} onPress={onClose} />
            ) : (
              <View style={{ flex: 1 }} pointerEvents="none" />
            )}
          </MotiView>

          <MotiView
            key="bs-sheet"
            from={{ translateY: winH }}
            animate={{ translateY: 0 }}
            exit={{ translateY: winH }}
            transition={motionTokens.springFirm}
            style={styles.sheetWrap}
          >
            <View
              style={[
                styles.sheet,
                { height: `${heightFraction * 100}%` as any, maxWidth },
              ]}
            >
              {showGrabber ? <View style={styles.grabber} /> : null}
              {children}
            </View>
          </MotiView>
        </>
      ) : null}
    </AnimatePresence>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,10,40,0.45)',
    zIndex: 90,
  },
  sheetWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'flex-end',
    pointerEvents: 'box-none' as any,
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxxl + 2,
    borderTopRightRadius: radius.xxxl + 2,
    paddingTop: 10,
    paddingHorizontal: 22,
    paddingBottom: 28,
    flexDirection: 'column',
    ...elevation.sheet,
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E1DED8',
    marginBottom: 14,
  },
})
