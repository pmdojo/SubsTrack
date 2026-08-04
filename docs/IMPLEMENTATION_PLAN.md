# SubTrack — Implementation Plan

Phased, dependency-ordered delivery. Each phase produces a shippable build. Every task has an owner (implementer), acceptance criteria, and links back to the spec section that defines "done".

**Companion docs:** `PRD.md`, `UX_SPEC.md`, `TECH_SPEC.md`, `DB_SCHEMA.md`, `DESIGN_SYSTEM.md`.

**No code is written until this plan and its dependencies are approved.**

---

## 0. Legend

| Symbol | Meaning |
|---|---|
| P0 / P1 / P2 | Priority (P0 = blocks release, P2 = nice-to-have) |
| S / M / L / XL | Rough effort (½ day / 1–2 days / 3–5 days / 1–2 weeks) |
| ⛔ | Blocks other tasks |
| 🧪 | Requires QA sign-off |
| 🔒 | Involves auth or PII — extra review |
| 📸 | Visual reference must match spec |

---

## 1. Phases at a glance

| # | Phase | Goal | Wall-clock (single dev) | Ships? |
|---|---|---|---|---|
| 0 | **Approval** | Sign off specs, freeze scope | 1–3 days | — |
| 1 | **Foundation** | Design system, router, providers, empty screens | 3–5 days | Skeleton demo |
| 2 | **Data layer + auth** | Supabase project, migrations, anon auth, hooks | 3–5 days | Empty logged-in app |
| 3 | **Home dashboard** | Hero card + quick actions + upcoming list, all live | 5–7 days | Read-only demo |
| 4 | **Add + edit** | 5-step wizard, sub CRUD, optimistic writes | 4–6 days | Users can populate |
| 5 | **Detail sheet** | Full detail modal with pause/resume/cancel/delete/toggles | 4–6 days | Users can manage |
| 6 | **Reminders + calendar** | expo-notifications wiring + calendar screen | 4–6 days | Users get reminded |
| 7 | **Insights + profile** | Charts + settings screens | 4–5 days | Feature-complete v1 |
| 8 | **Polish & QA** | Empty/error/loading states, a11y, perf, e2e | 4–6 days | GA-ready |
| 9 | **Launch** | Store submission, marketing site, analytics dashboards | 2–4 days | Live |
| 10 | **v1.1** | Onboarding refresh, exports, imports, widgets | 2–3 weeks | Delight tier |

**Total to v1 GA:** ~7–9 weeks part-time, ~4–5 weeks full-time.

---

## 2. Phase 0 — Approval (blocker)

**Goal:** freeze scope; catch missing decisions before code costs anything.

| # | Task | Owner | Effort | Acceptance |
|---|---|---|---|---|
| 0.1 | Product review — walk PRD end-to-end, answer open questions §12 | Rajashri | S | Every P0 unblocked; answers written back into PRD |
| 0.2 | UX review — walk every screen in UX_SPEC | Rajashri | S | Checklist §13 all ticked |
| 0.3 | Tech review — confirm stack, storage strategy, RLS approach | Rajashri | S | Checklist in TECH_SPEC §16 all ticked |
| 0.4 | DB review — confirm schema, enums, RLS, view strategy | Rajashri | S | Checklist in DB_SCHEMA §10 all ticked |
| 0.5 | Design token audit — pixel-match reference vs. DESIGN_SYSTEM.md | Rajashri | S | Any deviation is called out with a note |
| 0.6 | Legal — privacy policy + terms drafts commissioned | Rajashri | M | Legal text lives at marketing site URL |

**Exit criterion:** all approval checklists across every spec are green. Only then does Phase 1 start.

---

## 3. Phase 1 — Foundation

**Goal:** the skeleton — every screen renders empty, navigation works, tokens are in place.

| # | Task | Priority | Effort | Depends on | Acceptance |
|---|---|---|---|---|---|
| 1.1 | Adopt `expo-router` — replace hand-rolled tab state | P0 | M | 0.3 | Tabs work; deep-links land correctly |
| 1.2 | Move `theme.ts` to full token set from DESIGN_SYSTEM.md | P0 | S | 0.5 | All existing components use tokens; no hex outside theme |
| 1.3 | Introduce `copy.ts` string catalog | P0 | S | 0.2 | No hard-coded user-facing strings outside copy.ts (verified via lint rule) |
| 1.4 | Wrap app in gradient background (`bg.gradient.*`) at root layout | P0 | S | 1.2 | Every screen sits over the same gradient |
| 1.5 | Skeleton screens for `Home`, `Calendar`, `Insights`, `Profile` | P0 | M | 1.1 | Nav switches show placeholder headers |
| 1.6 | `BottomNav` refactor: 4 tabs + FAB slot | P0 | M | 1.1 | Matches spec §9.1 📸 |
| 1.7 | `Toast` + `ConfirmDialog` primitives | P0 | S | 1.2 | Storybook example renders |
| 1.8 | `BottomSheet` primitive (grabber, backdrop, spring) | P0 | M | 1.2 | Storybook example renders |
| 1.9 | `SplitPrice` + `RollingNumber` + `AnimatedCounter` extracted, unit-tested | P0 | S | 1.2 | Jest covers currency + digit-roll |
| 1.10 | Storybook (or a `/kitchen-sink` route) for all primitives | P1 | M | 1.7,1.8,1.9 | Every component in DESIGN_SYSTEM §8 has a story |

**Ships:** an empty but structurally correct app.

---

## 4. Phase 2 — Data layer + auth

**Goal:** cloud-backed data with anonymous auth, RLS enforcing per-user isolation.

| # | Task | Priority | Effort | Depends on | Acceptance |
|---|---|---|---|---|---|
| 2.1 | Create Supabase project (staging + prod) | P0 🔒 | S | 0.6 | URLs + anon keys in Vercel env |
| 2.2 | Author initial migration `20260805000000_init.sql` from DB_SCHEMA | P0 🔒 | M | 0.4 | `supabase db reset` clean |
| 2.3 | Seed `categories` presets + `app_library` (50 apps) | P0 | M | 2.2 | Seed script re-runnable |
| 2.4 | Supabase JS client + Tanstack Query provider | P0 | S | 2.1 | Query devtools show cache |
| 2.5 | Zustand stores (`ui`, `prefs`) | P0 | S | 1.2 | Sheets/toasts driven by store |
| 2.6 | Anonymous auth on cold start; upsert `profiles` row | P0 🔒 | M | 2.4 | Every guest gets a stable `user.id` |
| 2.7 | `useSubs`, `useSub(id)` hooks over Supabase | P0 | M | 2.4 | Reads/writes hit correct RLS-scoped rows |
| 2.8 | Query persistor (AsyncStorage/localStorage) for offline reads | P0 | M | 2.7 | App shows last-known data offline |
| 2.9 | Realtime subscription — invalidate query cache on server change | P0 | M | 2.7 | Editing on device A appears on device B ≤ 1s |
| 2.10 | Migration script — copy any existing local `subtrack_subs` into Supabase on first cloud login | P1 | M | 2.6, 2.7 | Existing users don't lose data |
| 2.11 | Sentry SDK wired for JS + native | P0 🔒 | S | 2.4 | Test throw is captured |
| 2.12 | PostHog SDK wired; events from TECH_SPEC §6 | P0 🔒 | S | 2.4 | `app_open` appears in dashboard |

**Ships:** app has cloud data. No UI change vs. Phase 1 yet.

---

## 5. Phase 3 — Home dashboard

**Goal:** the reference's Home panel, wired to real data.

| # | Task | Priority | Effort | Depends on | Acceptance |
|---|---|---|---|---|---|
| 3.1 | `TopBar` — avatar (initials), greeting-of-day, bell w/ unread dot | P0 📸 | M | 1.4, 2.6 | Matches UX §2.2 |
| 3.2 | `HeroTotalCard` — gradient, SplitPrice, MonthPickerPill, DeltaPill, IconStackOverlap, "N active subscriptions" | P0 📸 | L | 1.9, 2.7 | Matches UX §2.3, pixel-diff vs reference |
| 3.3 | `MonthPickerSheet` — wheel picker, updates all dashboard metrics | P0 | M | 3.2 | Selecting Feb 2026 refreshes hero + Upcoming list |
| 3.4 | `useMetrics(month)` — pure derivation from cached subs + payment_events | P0 | M | 2.7 | Unit tests cover leap year, month boundaries, empty data |
| 3.5 | `DownChevronDivider` component | P0 📸 | S | 1.2 | 16×10 caret, correct opacity |
| 3.6 | `QuickActionsRow` — 4 tiles wired: Add opens wizard, others toast placeholder | P0 📸 | M | 1.7 | Matches UX §2.5 |
| 3.7 | `SectionHeader` component | P0 | S | 1.2 | Reused throughout |
| 3.8 | `SubRow` — full spec: AppIconTile, TODAY chip, meta line, SplitPrice right | P0 📸 | L | 1.9 | Matches UX §2.7; long-press reveals edit/delete rail |
| 3.9 | Home empty state (illustration + CTA + FAB pulse) | P0 | M | 3.8 | Shows when `subs.length === 0` |
| 3.10 | Home loading state (skeleton shimmer) | P0 | M | 1.10 | No spinners; matches layout |
| 3.11 | Home error state (retry banner) | P0 | S | 1.7 | Cached data still shown behind |
| 3.12 | Analytics: `detail_opened`, `month_changed`, `subscription_paused/cancelled/deleted` from Home actions | P0 | S | 2.12 | Events appear in PostHog |
| 3.13 | Web-parity verify — Home responsive at xs/sm/md/lg | P0 🧪 | S | all above | Screenshots match at each breakpoint |

**Ships:** a fully live Home dashboard.

---

## 6. Phase 4 — Add + edit wizard

**Goal:** users can populate their subs.

| # | Task | Priority | Effort | Depends on | Acceptance |
|---|---|---|---|---|---|
| 4.1 | Step chrome — StepIndicator, back handling, keyboard-safe layout | P0 📸 | M | 1.1 | Progress fills correctly on nav |
| 4.2 | Step 1 — `AppSearchGrid` reading from `app_library`; "Add manually" fallback | P0 📸 | L | 2.3 | Empty search → all popular; typing filters live |
| 4.3 | Step 2 — Amount input with SplitPrice display + currency selector | P0 📸 | M | 1.9 | Keypad-friendly on mobile |
| 4.4 | Step 3 — Billing cycle radio + native date picker for first billing | P0 📸 | M | 1.2 | Weekly/monthly/quarterly/yearly/custom all persist |
| 4.5 | Step 4 — Payment method list + inline `AddCard` sub-sheet | P0 📸 🔒 | L | 1.8, 2.7 | Only card metadata stored |
| 4.6 | Step 5 — Reminder lead-days + Auto-Renew + Category select | P0 📸 | M | 3.3 | Defaults from `profiles.reminder_lead_days_default` |
| 4.7 | Success screen — check pulse + haptic + auto-return | P1 📸 | S | 1.7 | Haptic on iOS + Android |
| 4.8 | Edit variant — reuse steps, prefill from sub | P0 | M | all above | Titles switch to "Edit subscription" |
| 4.9 | Optimistic insert with rollback on error; invalidate `['subs']` + `['metrics']` | P0 | M | 2.7 | Row visible before server confirms |
| 4.10 | Wire `payment_events` insertion on Save if `first_billing_at` in past | P0 | M | 4.9 | Total_spent reflects historic-add sub |
| 4.11 | Analytics: `subscription_added`, `payment_method_added` | P0 | S | 2.12 | Events fire once per success |

**Ships:** users can add and edit subs end-to-end.

---

## 7. Phase 5 — Detail sheet

**Goal:** everything in reference panel 2.

| # | Task | Priority | Effort | Depends on | Acceptance |
|---|---|---|---|---|---|
| 5.1 | Route `/sub/[id]` as modal presentation | P0 | S | 1.1 | Deep-link opens sheet |
| 5.2 | Sheet chrome (grabber, header, close X, spring in) | P0 📸 | M | 1.8 | Matches UX §4.1 |
| 5.3 | Countdown card (N DAYS chip, icon, plan detail, Pay now, price, Cancel) | P0 📸 | L | 3.8 | Matches UX §4.2 exactly |
| 5.4 | 2×2 InfoTile grid (Next payment, Billing cycle, Total spent, Category) | P0 📸 | M | 1.2 | Values live from queries + views |
| 5.5 | Payment Reminder ToggleRow + inline lead-days picker | P0 📸 | M | 6.2 | Persist to sub + reschedule notification |
| 5.6 | Auto-Renew ToggleRow | P0 📸 | S | 5.4 | Persists + updates copy |
| 5.7 | Payment methods change row → sheet | P0 📸 | M | 4.5 | Change reflects in card sub-row |
| 5.8 | Bottom action bar — Pause / Cancel; contextual variants (paused/cancelled/expired) | P0 📸 | M | 5.3 | Matches UX §4.3 |
| 5.9 | ConfirmDialogs for Cancel + Delete permanently | P0 | S | 1.7 | Copy per UX §4.4 |
| 5.10 | Toasts on every state change per UX §4.5 | P0 | S | 1.7 | Auto-dismiss 1.8s |
| 5.11 | Live sync: pausing on device A updates open sheet on device B | P1 🧪 | S | 2.9 | Realtime patch flows through |
| 5.12 | Analytics: pause/resume/cancel/delete + reminder-toggle events | P0 | S | 2.12 | Events show up |

**Ships:** users can manage every subscription's lifecycle.

---

## 8. Phase 6 — Reminders + calendar

**Goal:** users get reminded at the right time; calendar screen matches reference panel 3.

| # | Task | Priority | Effort | Depends on | Acceptance |
|---|---|---|---|---|---|
| 6.1 | Wire `expo-notifications` — request permission, register push token, save to `profiles.push_token` | P0 🔒 📸 | M | 2.6 | iOS + Android grant flow works |
| 6.2 | `Scheduler` module — schedule / cancel / reschedule reminders on sub mutations | P0 | M | 6.1, 5.5 | Editing lead-days re-schedules cleanly |
| 6.3 | Cold-start reconciliation — `rescheduleAll()` on app open | P0 | S | 6.2 | Zero orphaned / missed reminders |
| 6.4 | Tap-handling — deep-link into `/sub/[id]` when reminder tapped | P0 | M | 6.1 | Notification tap opens correct sheet |
| 6.5 | `CalendarGrid` — 6-week layout w/ weekday header, out-of-month styling, today ring, selected pill | P0 📸 | L | 1.2 | Matches UX §6.3 |
| 6.6 | Dot indicators — colored per category, 1 or 2 dots per date | P0 📸 | M | 6.5, 2.3 | Matches reference dots exactly |
| 6.7 | `MonthNavArrows` — ← / → with haptic on month change; swipe gesture | P0 📸 | M | 6.5 | Both interactions animate |
| 6.8 | `ReminderTimelineGroup` — date header + vertical line + items | P0 📸 | M | 1.2 | Matches UX §6.4 |
| 6.9 | `ReminderTimelineItem` — ring marker + sub summary + SplitPrice | P0 📸 | M | 6.8 | Times formatted per timezone |
| 6.10 | Selecting date scrolls timeline to that day (spring, 400ms) | P0 | S | 6.5, 6.8 | Smooth on both platforms |
| 6.11 | Empty state for months with no reminders | P0 | S | 1.10 | "You're all clear this month." |
| 6.12 | FAB on Calendar defaults to "Add reminder" (pre-fills billing date) | P1 | S | 4.4 | Long-press day cell also opens Add |
| 6.13 | Analytics: `reminder_scheduled`, `reminder_tapped` | P0 | S | 2.12 | Events appear |
| 6.14 | Reduced-motion path — swap animations for fades; disable haptics if OS pref set | P0 | S | all above | `prefers-reduced-motion` honored |

**Ships:** reminder loop closed. This is the "wow" moment.

---

## 9. Phase 7 — Insights + profile

**Goal:** feature-complete v1.

### Insights

| # | Task | Priority | Effort | Depends on | Acceptance |
|---|---|---|---|---|---|
| 7.1 | Summary strip — reuse MetricsBar variant with delta pill | P0 📸 | M | 3.2 | 4 tiles: Monthly / Annual / Upcoming / Saved |
| 7.2 | Monthly trend chart — victory-native bars, 6 months, tap-to-drilldown | P0 📸 | L | 2.7 | Reads from `monthly_spend` view |
| 7.3 | Category breakdown — donut + right-side legend | P0 📸 | L | 2.7 | Reads from `payment_events` |
| 7.4 | Top expensive list — SubRow variant | P0 | M | 3.8 | Sorted by monthly price desc |
| 7.5 | Savings ticker — big number + "You've saved ₹X this year" | P1 | S | 3.4 | Computes from cancelled subs |
| 7.6 | Empty state | P0 | S | 1.10 | Shown when < 3 subs |
| 7.7 | Analytics: `insights_viewed` | P0 | S | 2.12 | |

### Profile

| # | Task | Priority | Effort | Depends on | Acceptance |
|---|---|---|---|---|---|
| 7.8 | Header — avatar + name + email | P0 📸 | S | 2.6 | Shows anon vs. email visually |
| 7.9 | Account section — Sign out, Delete account (30-day soft delete) | P0 🔒 📸 | M | 2.6 | Delete flow moves `deleted_at`; hard delete cron runs |
| 7.10 | Preferences — Currency, Default reminder lead-time, Quiet hours | P0 📸 | M | 2.5 | Changes persist to `profiles` |
| 7.11 | Notifications settings — master toggle + per-category | P0 📸 | M | 6.1 | Master off cancels all scheduled reminders |
| 7.12 | Payment methods — list + Add / Edit / Delete flows | P0 📸 🔒 | L | 4.5 | Default flag enforced (partial unique index) |
| 7.13 | Data & privacy — export (v1: JSON download; CSV in v1.1) | P1 | M | 2.7 | Downloads all user rows |
| 7.14 | About — version, rate app, feedback link | P0 | S | 1.2 | Version from `app.json` |
| 7.15 | Sign-in upgrade — from anon to email (magic link) | P1 🔒 | M | 2.6 | Anon data preserved across upgrade |

**Ships:** feature-complete v1.

---

## 10. Phase 8 — Polish & QA

**Goal:** GA-ready across a11y, perf, e2e.

| # | Task | Priority | Effort | Depends on | Acceptance |
|---|---|---|---|---|---|
| 8.1 | Empty/error/loading states audit — every screen | P0 🧪 | M | all above | Checklist walkthrough passes |
| 8.2 | A11y audit — screen reader, contrast, tap targets, focus rings | P0 🧪 | M | all above | axe-native + manual VoiceOver/TalkBack pass |
| 8.3 | Reduced-motion path — verified everywhere | P0 🧪 | S | 6.14 | Toggle in OS mirrors app behavior |
| 8.4 | Perf budgets — verify against TECH_SPEC §8 | P0 🧪 | M | all above | Cold start, memory, bundle size all within targets |
| 8.5 | Web responsive audit — pixel-diff at 375 / 414 / 768 / 1024 / 1440 | P0 🧪 📸 | M | all above | Screenshots in `docs/screenshots/*` refreshed |
| 8.6 | E2E — Detox happy paths (add, cancel, view calendar, sign in) | P0 🧪 | L | all above | Runs green in CI |
| 8.7 | E2E — Playwright web happy paths | P0 🧪 | L | all above | Runs green in CI |
| 8.8 | Visual regression baseline (Percy) | P1 🧪 | M | 8.5 | New commits diffed on every PR |
| 8.9 | Crash reporting sample rate calibration | P0 🔒 | S | 2.11 | 100% dev, 25% prod |
| 8.10 | Copy proofread — every string in `copy.ts` | P0 | S | 1.3 | No typos, consistent voice |

**Ships:** GA candidate.

---

## 11. Phase 9 — Launch

| # | Task | Priority | Effort | Depends on | Acceptance |
|---|---|---|---|---|---|
| 9.1 | Marketing site (`subtrack.app` or similar) — landing + privacy + terms | P0 | M | 0.6 | Vercel deploy |
| 9.2 | App Store submission (iOS) via EAS Submit — screenshots, description, review notes | P0 🔒 | M | 8.6, 8.9 | Approved |
| 9.3 | Play Store submission (Android) — same | P0 🔒 | M | 8.6, 8.9 | Approved |
| 9.4 | Push tokens flowing to Supabase in prod build | P0 🔒 | S | 6.1 | Verified via test notification |
| 9.5 | Analytics dashboards — funnels, retention cohorts | P0 | M | 2.12 | Shared with stakeholders |
| 9.6 | Monitoring alerts — Sentry issues, uptime, Supabase quota | P0 🔒 | S | 2.11 | On-call rotation defined |
| 9.7 | Public GitHub `pmdojo/SubsTrack` README refresh with GA URL | P1 | S | all above | README shows Store badges |
| 9.8 | Announcement (Twitter/X + Product Hunt) | P1 | S | 9.7 | Launch day scheduled |

**Ships:** SubTrack v1.0.0.

---

## 12. Phase 10 — v1.1 (post-launch, ~30 days later)

Highest-signal deltas from launch feedback + originally-deferred items.

| # | Item | Effort |
|---|---|---|
| 10.1 | Onboarding polish — animated Welcome + notification-permission sell | M |
| 10.2 | CSV / PDF export | M |
| 10.3 | Email receipt importer (Gmail/Outlook OAuth) | XL |
| 10.4 | iOS/Android widget — Home total + next renewal | L |
| 10.5 | Multi-currency with live FX | M |
| 10.6 | Categories with spending caps + notifications | M |
| 10.7 | Google + Apple sign-in | S |
| 10.8 | Realtime multi-device sync verified end-to-end | M |

---

## 13. Risks specific to the plan

| Risk | Phase | Mitigation |
|---|---|---|
| expo-router migration breaks existing screens | 1 | Land in a branch, keep old `HomeScreen.tsx` as a fallback route until parity confirmed |
| Supabase quota surprises | 2, 9 | Alert at 50% / 75% / 90%; Pro upgrade at 60% |
| Reference-fidelity slips as we scale | 3–7 | Every 📸 task requires a side-by-side screenshot in PR |
| Notification permission denial rate high | 6 | Postpone the ask; in-app red dot as fallback |
| Anon → email migration loses data | 7.15 | Test with 5 seeded users on staging before shipping |
| Charts library adds too much bundle | 7 | Measure at 7.2 completion; swap for hand-rolled SVG if > 80 KB gzipped |
| App-store rejection for placeholder actions ("Export coming soon") | 9 | Either hide until 10.2 or make them functional (JSON download) |

---

## 14. Definition of done (per task)

Every task ticket must satisfy:

1. **Behaviour matches spec** — the spec section referenced in "Acceptance" is walked step-by-step and passes.
2. **Code follows repo conventions** — token usage, `copy.ts` strings, feature-folder placement.
3. **Tests written** — unit for pure code; RNTL for components; e2e added when a user-visible flow is completed.
4. **Analytics wired** — if the task adds a tracked event, PostHog dashboard shows it in staging.
5. **A11y checked** — screen-reader label, contrast, tap target, focus ring.
6. **Reduced-motion path** — animation-heavy tasks include a fallback.
7. **Both platforms verified** — iOS + Android + Web screenshots in the PR description for 📸 tasks.
8. **PR reviewed** — self-review checklist filled; if paired, second approval.

---

## 15. Approval to start

Signing this document authorises Phase 1 to begin. Any task can only be started after all its `Depends on` tasks are done and marked accepted.

Before I write a single line of code beyond the specs, please approve:

- [ ] `DESIGN_SYSTEM.md`
- [ ] `PRD.md`
- [ ] `UX_SPEC.md`
- [ ] `TECH_SPEC.md`
- [ ] `DB_SCHEMA.md`
- [ ] `IMPLEMENTATION_PLAN.md` (this file)

Reply with "approved" or annotate any doc with change requests. I'll iterate before code.
