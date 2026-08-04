import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AnimatePresence, MotiView } from '../../lib/motion'
import {
  colors,
  elevation,
  font,
  motion as motionTokens,
  radius,
} from '../../theme'

// ── Types ──────────────────────────────────────────────────────────────────

type ToastKind = 'default' | 'success' | 'error'
type ToastState = { id: string; kind: ToastKind; message: string }

type ConfirmOptions = {
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

type UiApi = {
  toast: (message: string, opts?: { kind?: ToastKind; ms?: number }) => void
  confirm: (opts: ConfirmOptions) => Promise<boolean>
}

// ── Context ────────────────────────────────────────────────────────────────

const UiContext = createContext<UiApi | null>(null)

export function useUi(): UiApi {
  const api = useContext(UiContext)
  if (!api) {
    throw new Error('useUi() must be used inside <UiProvider />')
  }
  return api
}

// Convenience hooks for the common cases.
export function useToast() {
  return useUi().toast
}
export function useConfirm() {
  return useUi().confirm
}

// ── Provider ───────────────────────────────────────────────────────────────

/**
 * Mount at the app root. Provides imperative toast + confirm APIs any
 * descendant can call — no prop drilling, no state duplication.
 *
 *   const toast = useToast()
 *   toast('Saved.', { kind: 'success' })
 *
 *   const confirm = useConfirm()
 *   if (await confirm({ title: 'Cancel Netflix?', destructive: true })) { ... }
 */
export function UiProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastState[]>([])
  const [confirmState, setConfirmState] = useState<{
    opts: ConfirmOptions
    resolve: (ok: boolean) => void
  } | null>(null)
  const idRef = useRef(0)

  const toast = useCallback<UiApi['toast']>((message, opts) => {
    const id = String(++idRef.current)
    const kind = opts?.kind ?? 'default'
    const ms = opts?.ms ?? 1800
    setToasts((prev) => [...prev, { id, kind, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, ms)
  }, [])

  const confirm = useCallback<UiApi['confirm']>((opts) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ opts, resolve })
    })
  }, [])

  const closeConfirm = useCallback((ok: boolean) => {
    setConfirmState((prev) => {
      if (prev) prev.resolve(ok)
      return null
    })
  }, [])

  const api = useMemo<UiApi>(() => ({ toast, confirm }), [toast, confirm])

  return (
    <UiContext.Provider value={api}>
      {children}
      <ToastStack toasts={toasts} />
      <ConfirmDialog
        state={confirmState}
        onCancel={() => closeConfirm(false)}
        onConfirm={() => closeConfirm(true)}
      />
    </UiContext.Provider>
  )
}

// ── Toast rendering ────────────────────────────────────────────────────────

function ToastStack({ toasts }: { toasts: ToastState[] }) {
  return (
    <View style={styles.toastStack} pointerEvents="box-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <MotiView
            key={t.id}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: 20 }}
            transition={motionTokens.base}
            style={styles.toastItem}
          >
            <View
              style={[
                styles.toastBubble,
                t.kind === 'success' && { backgroundColor: colors.success },
                t.kind === 'error' && { backgroundColor: colors.danger },
              ]}
            >
              <Text style={styles.toastText}>{t.message}</Text>
            </View>
          </MotiView>
        ))}
      </AnimatePresence>
    </View>
  )
}

// ── ConfirmDialog rendering ────────────────────────────────────────────────

function ConfirmDialog({
  state,
  onCancel,
  onConfirm,
}: {
  state: { opts: ConfirmOptions; resolve: (ok: boolean) => void } | null
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <AnimatePresence>
      {state ? (
        <>
          <MotiView
            key="cd-backdrop"
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={motionTokens.base}
            style={styles.confirmBackdrop}
          >
            <Pressable style={{ flex: 1 }} onPress={onCancel} />
          </MotiView>
          <MotiView
            key="cd-card"
            from={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={motionTokens.springSoft}
            style={styles.confirmWrap}
            pointerEvents="box-none"
          >
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>{state.opts.title}</Text>
              {state.opts.body ? (
                <Text style={styles.confirmBody}>{state.opts.body}</Text>
              ) : null}
              <View style={styles.confirmRow}>
                <Pressable
                  onPress={onCancel}
                  style={[styles.confirmBtn, styles.confirmBtnGhost]}
                >
                  <Text style={styles.confirmGhostText}>
                    {state.opts.cancelLabel ?? 'Cancel'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={onConfirm}
                  style={[
                    styles.confirmBtn,
                    state.opts.destructive
                      ? styles.confirmBtnDanger
                      : styles.confirmBtnPrimary,
                  ]}
                >
                  <Text style={styles.confirmFilledText}>
                    {state.opts.confirmLabel ?? 'Confirm'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </MotiView>
        </>
      ) : null}
    </AnimatePresence>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Toast stack sits above the bottom nav (~110pt reserved).
  toastStack: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 110,
    zIndex: 300,
    alignItems: 'center',
    gap: 8,
  },
  toastItem: {
    alignItems: 'center',
  },
  toastBubble: {
    backgroundColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    ...elevation.float,
  },
  toastText: {
    color: '#fff',
    fontFamily: font.semibold,
    fontSize: 13,
  },

  confirmBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,10,40,0.45)',
    zIndex: 200,
  },
  confirmWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 201,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: 22,
    ...elevation.sheet,
  },
  confirmTitle: {
    fontSize: 17,
    color: colors.ink,
    fontFamily: font.bold,
    letterSpacing: -0.4,
  },
  confirmBody: {
    marginTop: 8,
    fontSize: 13,
    color: colors.inkSoft,
    fontFamily: font.regular,
    lineHeight: 19,
  },
  confirmRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  confirmBtnGhost: {
    backgroundColor: '#F4F3F0',
  },
  confirmGhostText: {
    color: colors.ink,
    fontFamily: font.bold,
    fontSize: 14,
  },
  confirmBtnPrimary: {
    backgroundColor: colors.primary,
  },
  confirmBtnDanger: {
    backgroundColor: colors.danger,
  },
  confirmFilledText: {
    color: '#fff',
    fontFamily: font.bold,
    fontSize: 14,
  },
})
