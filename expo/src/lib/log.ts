/**
 * Logging + analytics facade. Console-only for now — swap the internals
 * for Sentry + PostHog SDK calls once DSN/keys are provisioned. Every
 * component should log via this module so the swap is a one-file change.
 */

const ENABLED = process.env.EXPO_PUBLIC_LOG_ENABLED !== 'false'
const IS_DEV = process.env.EXPO_PUBLIC_ENV !== 'production'

type Props = Record<string, unknown>

export const log = {
  /** Product event (funnel step, feature use). Maps to PostHog capture. */
  track(event: string, props?: Props): void {
    if (!ENABLED) return
    if (IS_DEV) {
      // eslint-disable-next-line no-console
      console.log(`[track] ${event}`, props ?? '')
    }
    // TODO: posthog?.capture(event, props)
  },

  /** Non-fatal error / caught exception. Maps to Sentry captureException. */
  error(event: string, err: unknown, props?: Props): void {
    if (!ENABLED) return
    // eslint-disable-next-line no-console
    console.warn(`[error] ${event}`, err, props ?? '')
    // TODO: Sentry.captureException(err, { extra: { event, ...props } })
  },

  /** Breadcrumb / diagnostic log. Silent in prod unless log level raised. */
  debug(event: string, props?: Props): void {
    if (!ENABLED || !IS_DEV) return
    // eslint-disable-next-line no-console
    console.log(`[debug] ${event}`, props ?? '')
    // TODO: Sentry.addBreadcrumb({ message: event, data: props })
  },
}
