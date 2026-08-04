# SubTrack — Technical Specification

Companion to `PRD.md`, `UX_SPEC.md`, `DB_SCHEMA.md`. This document defines the software architecture, dependencies, module boundaries, data flow, non-functional requirements, and third-party integrations.

---

## 1. Stack decision

| Layer | Choice | Why |
|---|---|---|
| App runtime | **Expo 51** (React Native 0.74) + **react-native-web** | One codebase → iOS, Android, Web. Matches team competence. Vercel deploy is trivial. |
| Language | **TypeScript 5.3** | Type safety across app + backend (shared types). |
| Navigation | **expo-router 3** (file-based) | Type-safe deep-linking, tab layout, sheets. Replaces the current hand-rolled tab state in `HomeScreen`. |
| State | **Zustand** for global + **Tanstack Query v5** for server state | Zustand keeps UI state small; Query handles cache/refetch/optimistic. |
| Backend | **Supabase** (Postgres + Auth + Realtime + Storage + Edge Functions) | Single vendor covers auth, DB, realtime sync, file storage, and serverless functions. Free tier covers first ~1k users. |
| Notifications | **expo-notifications** (local + push via Expo Push Service) | Cross-platform, no separate FCM/APNs setup for v1. |
| Charts | **victory-native** (SVG-based) | Works on native + web (via react-native-svg). Recharts alternative kept as fallback for web-only builds. |
| Analytics | **PostHog** self-hosted or cloud | Product analytics + feature flags in one. |
| Crash reporting | **Sentry** | Native + web. Source-map upload in CI. |
| Animations | **Reanimated 3** + Moti-shim (already in tree) | 60fps worklet-driven animations for orbit + interactions. |
| Icons | **@expo/vector-icons** (Feather) | Already integrated. |
| Fonts | **@expo-google-fonts/dm-sans** | Already integrated. |
| Testing | **Jest** + **React Native Testing Library** + **Detox** (native e2e) + **Playwright** (web e2e) | Layered. |
| CI/CD | **GitHub Actions** + **EAS Build** for native, **Vercel** for web | Push to `main` → web auto-deploy. Nightly EAS build for testflight/internal-app-sharing. |

---

## 2. Repository layout (post-migration)

```
SubsTracker/
├── expo/
│   ├── app/                          ← expo-router file-based routes
│   │   ├── _layout.tsx               ← Root layout: providers, fonts, gradient bg
│   │   ├── (tabs)/                   ← Tab group
│   │   │   ├── _layout.tsx           ← Bottom nav (BottomNav component)
│   │   │   ├── index.tsx             ← Home
│   │   │   ├── calendar.tsx          ← Reminders
│   │   │   ├── insights.tsx
│   │   │   └── profile.tsx
│   │   ├── sub/[id].tsx              ← Detail sheet (as modal via presentation:'modal')
│   │   ├── add/                      ← Add wizard (5 steps)
│   │   │   ├── search.tsx
│   │   │   ├── amount.tsx
│   │   │   ├── cycle.tsx
│   │   │   ├── payment.tsx
│   │   │   └── reminder.tsx
│   │   ├── onboarding/
│   │   │   ├── welcome.tsx
│   │   │   ├── notifications.tsx
│   │   │   └── suggest.tsx
│   │   ├── payment-methods/
│   │   │   ├── index.tsx             ← List
│   │   │   └── add.tsx
│   │   ├── categories/
│   │   │   ├── index.tsx             ← Manage list
│   │   │   └── [id].tsx              ← Category detail (subs in it)
│   │   └── settings/                 ← Profile sub-screens
│   │       ├── currency.tsx
│   │       ├── notifications.tsx
│   │       ├── export.tsx
│   │       └── delete-account.tsx
│   │
│   ├── src/
│   │   ├── theme.ts                  ← Design tokens
│   │   ├── copy.ts                   ← All strings
│   │   ├── icons.ts                  ← Icon shortcut map
│   │   ├── components/               ← All reusable primitives (see DESIGN_SYSTEM §8)
│   │   ├── screens/                  ← Composed screens if not one-shot in app/
│   │   ├── features/                 ← Feature-scoped code (see §3)
│   │   │   ├── subscriptions/
│   │   │   │   ├── api.ts            ← Supabase queries (Tanstack Query)
│   │   │   │   ├── hooks.ts          ← useSubs, useSub(id), useUpsertSub, ...
│   │   │   │   ├── model.ts          ← Sub type + derived helpers
│   │   │   │   └── notifications.ts  ← Reminder scheduling
│   │   │   ├── metrics/
│   │   │   │   ├── compute.ts        ← Pure functions for dashboard metrics
│   │   │   │   └── hooks.ts          ← useMetrics(month)
│   │   │   ├── auth/
│   │   │   │   ├── client.ts         ← Supabase client
│   │   │   │   ├── hooks.ts          ← useAuth, useUser
│   │   │   │   └── screens/          ← SignIn, MagicLink handler
│   │   │   ├── reminders/
│   │   │   │   ├── scheduler.ts
│   │   │   │   └── channels.ts       ← Android notification channels
│   │   │   ├── categories/
│   │   │   │   └── seed.ts
│   │   │   ├── payment-methods/
│   │   │   ├── insights/
│   │   │   │   └── charts.tsx
│   │   │   └── export/
│   │   │       └── csv.ts
│   │   ├── lib/                      ← Cross-cutting utilities
│   │   │   ├── supabase.ts
│   │   │   ├── query-client.ts       ← Tanstack Query setup
│   │   │   ├── storage.ts            ← AsyncStorage/localStorage abstraction
│   │   │   ├── motion.tsx            ← Existing shim
│   │   │   ├── date.ts               ← Timezone-safe helpers
│   │   │   ├── currency.ts           ← formatMoney, splitParts
│   │   │   └── log.ts                ← Sentry + PostHog wrapper
│   │   ├── stores/                   ← Zustand slices
│   │   │   ├── ui.ts                 ← Sheets, modals, toast queue
│   │   │   └── prefs.ts              ← currency, reminderDefaults, quietHours
│   │   └── constants/
│   │       ├── categories.ts
│   │       └── app-library.ts        ← Popular apps preset for the Add wizard
│   │
│   ├── assets/
│   │   ├── fonts/                    ← DM Sans if we self-host
│   │   ├── illustrations/            ← Empty state SVGs
│   │   ├── app-icons/                ← Preset app icons (SVG/PNG)
│   │   └── lottie/                   ← Bell shake, success confetti
│   │
│   ├── App.tsx                       ← Just re-exports Expo Router entry
│   ├── app.json
│   ├── babel.config.js
│   ├── metro.config.js               ← If we need SVG/asset customization
│   ├── tsconfig.json
│   └── package.json
│
├── docs/                             ← This directory (specs)
├── supabase/                         ← Migrations, functions
│   ├── migrations/
│   │   └── 20260805000000_init.sql
│   ├── functions/                    ← Edge functions
│   │   ├── send-reminder/
│   │   └── nightly-cron/
│   └── seed.sql
└── vercel.json
```

---

## 3. Feature-scoped architecture

Every feature lives under `src/features/{name}/` and exports **only** through its `index.ts`. Cross-feature calls go through this barrel.

Contract per feature:
- `api.ts` — Tanstack Query hooks wrapping Supabase calls.
- `hooks.ts` — Feature-scoped React hooks (`useSub(id)`, `useUpcomingRenewals()`).
- `model.ts` — Pure types + derivation functions (no side effects).
- Screens under `screens/` (only if the feature owns a full screen not covered by `app/`).

**Rationale:** keeps the file tree shallow at the screen layer, and lets Cursor/AI edit narrowly without touching unrelated code.

---

## 4. Data flow

### 4.1 High-level

```
UI component
    │
    ▼
useSubs() hook  ────────►  Tanstack Query cache  ────────►  Supabase JS client
    │                             │                                │
    │                             │                                ▼
    │                             │                        Postgres (RLS scoped to auth.uid())
    │                             │                                │
    │                             │◄── Realtime WS ──── Postgres logical replication
    │                             │
    │                             ▼
    ▼                        AsyncStorage/localStorage (offline persist)
Metrics hooks (pure fn)
```

- **Reads** go through Tanstack Query hooks. Cache key includes `userId + month` where applicable.
- **Writes** are optimistic: local cache mutates → Supabase call → on error, roll back + toast.
- **Realtime**: Supabase subscription per authenticated user on the `subscriptions` table. On any INSERT/UPDATE/DELETE, invalidate the relevant query keys.
- **Offline**: Tanstack Query persistor writes to AsyncStorage (native) / localStorage (web). App works read-only offline; writes are queued and flushed on reconnect (v1.1; for v1 we show "You're offline" banner and disable writes).

### 4.2 Metrics computation

All metrics are pure derivations from `Subscription[]` and `Date`. No metric is stored — it's always recomputed. Rationale: single source of truth, no cache invalidation of derived values.

Functions in `src/features/metrics/compute.ts`:

```ts
function monthlySpend(subs: Subscription[]): number
function annualSpend(subs: Subscription[]): number
function upcomingRenewals(subs: Subscription[], withinDays: number): Subscription[]
function cancelledInMonth(subs: Subscription[], month: Date): Subscription[]
function savedInYear(subs: Subscription[], year: number): number
function spendByCategory(subs: Subscription[]): Record<Category, number>
function deltaVsPreviousMonth(now: number, prev: number): { pct: number, direction: 'up'|'down'|'flat' }
```

`useMetrics(monthDate)` hook returns all of these keyed by the month picker in the hero.

**Previous-month figures** require historical data. Approach:
- Every renewal fires a `payment_events` row (see `DB_SCHEMA.md`) — so historical spend is derivable from actual event data, not price × months guessed.
- If no history (new user), previous-month = 0 and delta pill hides.

### 4.3 Auth flow

Two modes supported:

1. **Anonymous session** (default): `supabase.auth.signInAnonymously()` on first launch. `user.id` becomes the RLS row scope. Data lives locally to Supabase, but there's no way to log in from another device.
2. **Upgrade to email**: `supabase.auth.linkIdentity({provider: 'email'})` → magic-link email. Anonymous data is preserved (rows already have `user_id`).

Signed-out → signed-in on second device: cold start hits `getUser()` → shows sign-in screen if no session.

---

## 5. Notifications

### 5.1 Local vs. push
- **Local scheduled notifications** (via `expo-notifications`) for reminders. Scheduled at add/edit time, cancelled + rescheduled on any relevant change.
- **Push notifications** (via Expo Push Service) reserved for cross-device events (e.g. "You cancelled Netflix on your other device").

### 5.2 Reminder scheduling

`src/features/reminders/scheduler.ts` exposes:

```ts
async function scheduleReminderFor(sub: Subscription): Promise<void>
async function cancelReminderFor(subId: string): Promise<void>
async function rescheduleAll(): Promise<void>
```

Logic:
1. Compute the fire date: `sub.billingDate - sub.remindLeadDays`.
2. Use device local timezone.
3. If fire date is in the past, no-op.
4. Store the local notification ID in a Map keyed by subscription ID for later cancellation.

On app cold start, we `rescheduleAll()` to reconcile with any renewals that happened while the app was closed.

Handling:
- Tapping a reminder → deep link to `sub/{id}` (detail sheet).
- Dismissing without tapping → no server-side effect (matches Bobby/Truebill).

### 5.3 Android channels
- Channel `reminders` — importance high, sound default, vibration [0,300,200,300].
- Channel `system` — importance low (for app updates, offline notices).

---

## 6. Analytics

Events fired via `src/lib/log.ts` → PostHog.

| Event | When | Properties |
|---|---|---|
| `app_open` | cold start | platform, appVersion, isFirstOpen |
| `signed_in` | auth success | method (anon/email) |
| `subscription_added` | Add wizard success | app, monthlyCost, category, cycle |
| `subscription_edited` | Edit save | fields changed |
| `subscription_paused` | Pause action | id, monthlyCost |
| `subscription_resumed` | Resume action | id |
| `subscription_cancelled` | Cancel confirmed | id, monthlyCost, ageInDays |
| `subscription_deleted` | Delete confirmed | id, monthlyCost |
| `reminder_scheduled` | on sub add/edit | subId, leadDays, fireDate |
| `reminder_tapped` | user taps a fired reminder | subId, hoursBeforeRenewal |
| `month_changed` | picker change | month, year |
| `detail_opened` | sheet open | subId |
| `insights_viewed` | tab open | |
| `export_started` | Export button | format |
| `payment_method_added` | Add card success | |
| `error` | any caught error | code, message, screen |

PII rule: never send email, card numbers, or auth tokens. `subId` is a UUID — no PII.

---

## 7. Error handling

- **Tanstack Query** onError callbacks feed `useUi().toast('error', msg)`.
- **Sentry** captures uncaught throws.
- **Guarded features** show fallback UI when they fail (e.g. Insights chart errored → shows "Couldn't build insights right now").
- **Retry policy**: automatic 3 retries with exponential backoff for GETs; no retry for POSTs (avoids double-charging illusions).

---

## 8. Performance targets

| Metric | Target |
|---|---|
| Cold start (native) to first paint | ≤ 900ms |
| Cold start (web) to first meaningful paint | ≤ 1.5s |
| Home render with 50 subs | 60fps scroll |
| Detail sheet open | ≤ 250ms perceived |
| Optimistic write reflect in UI | < 16ms |
| Memory (30-min session) | ≤ 180 MB |
| Bundle size (web, gzipped) | ≤ 480 KB initial JS |

### Techniques
- Route-level code splitting via expo-router.
- Suspense boundaries per section — hero renders before list.
- Recharts → victory-native swap (smaller bundle on native).
- Lazy-load Insights + Profile screens.
- Memoize expensive metric computations via `useMemo`.
- Virtualize the "See All" list via `FlashList` when > 30 items.

---

## 9. Security

- Supabase RLS enforces per-user isolation. Every table has `user_id uuid` FK + policy.
- No secrets in the client bundle beyond the anon key (safe by design).
- Card details are **never** stored full — we save `brand + last4 + expMonth + expYear`. Full PAN never touches our servers.
- Rate limits at the edge (Supabase built-in). Extra rate limit on `send-reminder` function.
- Delete account: 30-day soft delete via `deleted_at` column; hard-delete after 30 days by a scheduled function.
- CSP on web build to prevent XSS. Set via `vercel.json` headers.

---

## 10. Third-party integrations

| Integration | Purpose | v1 or later |
|---|---|---|
| Supabase | Backend | v1 |
| Expo Push | Push notifications | v1 (local + push wired but only local used) |
| PostHog | Analytics | v1 |
| Sentry | Crash reporting | v1 |
| Stripe | Payment (only if we monetize with Pro tier) | v2 |
| Plaid / Salt Edge | Auto-discover subs from bank | v2 (out of scope for v1) |
| Google/Apple sign-in | Auth alternative | v1.1 |

---

## 11. Environment configuration

`app.json → expo.extra` reads from `.env` at build time via `expo-constants`.

```
# .env.local (never committed)
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_POSTHOG_KEY=phc_...
EXPO_PUBLIC_SENTRY_DSN=https://...
EXPO_PUBLIC_ENV=development   # dev|staging|production
```

Vercel env vars (Web preview + prod): same, sourced from Vercel Dashboard.

---

## 12. Testing strategy

| Layer | Framework | Coverage target |
|---|---|---|
| Unit — pure functions (metrics, date, currency) | Jest | ≥ 90% |
| Component — snapshot + interaction | RNTL | ≥ 70% of components |
| Integration — feature hooks with mocked Supabase | Jest + MSW | key user flows |
| E2E — native | Detox | 4 happy paths: add sub, cancel sub, view calendar, sign in |
| E2E — web | Playwright | same 4 paths + responsive breakpoints |
| Visual regression — web | Percy or Chromatic | every commit to main |

CI matrix:
- Node 20, macOS runner
- iOS 17 simulator
- Android API 34 emulator

---

## 13. Deployment

- **Web (Vercel)**: on push to `main`, `expo export --platform web` → serve `dist/` from Vercel CDN. Preview URL per PR.
- **Native (EAS)**:
  - Preview build: on every PR (via `eas build --profile preview`), TestFlight + internal-app-sharing.
  - Production build: on git tag `v*.*.*`, `eas build --profile production`, submit via `eas submit`.
- **Supabase migrations**: `supabase db push` in CI when files in `supabase/migrations/` change on `main`.

---

## 14. Observability

- Sentry dashboards for JS/native crashes and web errors.
- PostHog funnels: Onboarding → Add first sub → Detail opened → Cancel/Pause action.
- Supabase log-drain to a Grafana Cloud stack (or Better Stack).
- Vercel Analytics for Web Core Web Vitals.
- Custom health-check endpoint on Supabase edge (`/health`) polled by an uptime service.

---

## 15. Migration from current codebase

Current state (as of last commit `4197e0f`):
- Static seed in `src/lib/data.ts`; storage in AsyncStorage/localStorage.
- Home + detail sheet + nav + orbit + metrics all implemented.
- No auth, no backend, no notifications.

Phases:
1. **Zustand + Tanstack Query**: keep AsyncStorage backend; introduce hooks in features. No UX change.
2. **Supabase auth (anonymous)**: sign users in silently on cold start. Data still local (Supabase used only for identity).
3. **Migrate data to Supabase**: move `subs` array to `public.subscriptions`. Local AsyncStorage becomes Tanstack Query persistor only.
4. **Realtime sync**: subscribe to changes.
5. **Notifications**: schedule locally, per-sub.
6. **Route with expo-router**: replace current `HomeScreen` mega-file with `app/(tabs)/...`.
7. **Onboarding + add wizard + calendar screens**: new features.
8. **Insights + profile**: new features.
9. **Auth upgrade (email)**: add magic-link screen.
10. **v1.1 features**: export, imports, widgets.

Each phase is a shippable branch; the app remains usable throughout.

---

## 16. Approval checklist

- [ ] Confirm Supabase for backend (vs. Firebase / custom Node).
- [ ] Confirm expo-router (vs. React Navigation direct).
- [ ] Confirm Tanstack Query + Zustand split.
- [ ] Confirm victory-native for charts.
- [ ] Confirm PostHog + Sentry for observability.
- [ ] Confirm anonymous auth default (not email-required).
- [ ] Confirm no Stripe in v1 (payment button is a deep-link only).
- [ ] Confirm 30-day soft delete window.
- [ ] Confirm bundle-size + perf targets are acceptable.
