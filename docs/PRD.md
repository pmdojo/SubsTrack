# SubTrack — Product Requirements Document

**Owner:** Rajashri Hapse
**Status:** DRAFT — awaiting approval
**Last updated:** August 2026
**Reference:** Three-panel reminder-app screenshot bundle (Home / Subscription Detail / Reminders Calendar)

---

## 1. Vision

A calm, premium subscription tracker that turns the anxious "what am I actually paying for?" problem into a delightful once-a-day glance. Users see their true monthly spend, get quiet reminders before renewals, and can cancel or pause anything in two taps. The reference sets the visual bar: warm, tactile, and confident — never spreadsheet-y.

## 2. Problem statement

People subscribe to 10–20 services and lose track. Bank statements don't distinguish "one-off" from "recurring". Existing tools (Bobby, Subby, Truebill) are either too finance-y, too data-hungry, or too ugly to open daily. Users need:

1. A single place to see every recurring charge.
2. Advance warning before renewals (so they can cancel if unused).
3. Cost-of-inaction visibility (annual spend, "you've paid $X since 2024").
4. Frictionless management (pause, cancel, change plan) without opening the vendor's site.

## 3. Personas

### P1 — "Careful Rajashri" (primary)
25–35, designer/PM, 8–15 active subs across creative tools + streaming + productivity. Cares about waste, wants a monthly ritual to prune. Uses INR primarily.

### P2 — "Impulse Aarav"
20–28, student/early career, signs up for trials constantly, forgets to cancel. Needs aggressive reminders and a fast cancel flow.

### P3 — "Household Priya"
30–45, manages family subs (Netflix, Prime, iCloud family, phone plans). Needs multi-payer awareness, categorization, and "who's paying" clarity.

## 4. Jobs to be done

| # | JTBD | Priority |
|---|---|---|
| J1 | *When I open the app, I want to see how much I'm spending this month at a glance so I can feel in control.* | P0 |
| J2 | *When a subscription is about to renew, I want to know 2–7 days in advance so I can decide to keep, pause, or cancel it.* | P0 |
| J3 | *When I decide I don't need a subscription, I want to pause or cancel it in the app without visiting the vendor site.* | P0 |
| J4 | *When I add a new subscription, I want it to autofill from a library of common apps so I don't type everything.* | P1 |
| J5 | *When looking at a subscription, I want to see how much I've spent on it lifetime so I can judge value.* | P1 |
| J6 | *When I have multiple cards, I want to see which card is charged for what so I can plan.* | P1 |
| J7 | *When I want to justify a cut, I want to see spending broken down by category.* | P2 |
| J8 | *When I switch phones, I want my data to follow me.* | P1 (requires backend) |
| J9 | *When I want proof for taxes/expenses, I want to export a report.* | P2 |
| J10 | *When my monthly spend goes up or down, I want to see the change vs last month.* | P1 |

## 5. Scope

### 5.1 In scope — v1

**Home dashboard**
- TOTAL SPENDING hero (month-picker, split amount, delta vs prior month)
- Overlapping active-subscription icons stack + count
- Quick actions row: Add, Category, Insights, Export
- "Upcoming payments" list (subs billing in next 30 days, sorted by proximity)
- Bottom nav: Home / Calendar / Add(FAB) / Insights / Profile

**Subscription detail sheet**
- Top card with countdown chip, app info, plan detail, Pay Now, price, Cancel
- 2×2 info grid: Next payment, Billing cycle, Total spent, Category
- Payment Reminder toggle (with lead-time picker)
- Auto-Renew toggle
- Payment methods section w/ Change
- Bottom: Pause / Cancel

**Reminders / Calendar**
- Monthly grid with per-day dot indicators
- Month navigation (← / → arrows)
- Selected-date timeline of the day's reminders + adjacent day groups
- Same-day "Today" tag; N-reminder count on other days

**Add / Edit subscription flow**
- App search with a preset library (Netflix, Spotify, Figma, Adobe, etc.)
- Amount, billing cycle, next payment date, payment method, category
- Reminder lead-time (1 / 3 / 7 days)
- Auto-renew default on

**Insights**
- Monthly spend chart (last 6 months)
- Category breakdown pie/bar
- Top expensive subs list
- Savings ticker (canceled subs' annualized value)

**Profile**
- User info
- Currency setting
- Notification preferences (default reminder lead-time, quiet hours)
- Sign out / delete account

**Backend**
- Auth (email + magic link, or anonymous session with upgrade)
- Persistent storage of subs, categories, payment methods, reminder settings, payment history
- Real-time sync across devices
- Local push notifications for reminders

### 5.2 In scope — v1.1 (nice-to-have, if time permits)

- Multi-currency with live FX
- Import from email receipts (Gmail/Outlook connector)
- CSV/PDF export
- Category-based spending caps
- Widget (iOS/Android) with total spend + next renewal

### 5.3 Out of scope for v1

- Automatic bank-account/subscription-discovery (Plaid, Salt Edge). Manual entry only.
- Actual bill payment (Pay Now is a deep-link to the vendor, not a real payment).
- Group/household split billing.
- Web app parity (web is a "view-only" preview; native is primary).
- ML-based categorization or spend forecasting.
- Bill-negotiation service.

## 6. Success metrics

| Metric | Target (90 days post-launch) |
|---|---|
| Weekly active users (WAU) | ≥ 40% of installs |
| Median subs tracked per user | ≥ 8 |
| Reminder → detail-open rate | ≥ 65% |
| Cancel/pause action rate on reminder | ≥ 25% |
| Users who add ≥ 1 sub in first session | ≥ 80% |
| Store rating | ≥ 4.5 |
| Crash-free sessions | ≥ 99.5% |

## 7. Non-goals

- Being a bank. No account aggregation.
- Being a personal finance app. No budgets, savings, investments.
- Social features. No sharing, following, comments.
- Being a marketplace. No affiliate-driven sub recommendations.

## 8. Assumptions

- Users have push notifications enabled (otherwise the reminder feature loses ~70% of value; onboarding must sell this permission).
- Users understand recurring subscriptions and don't need extensive education.
- Reference-fidelity design is a competitive differentiator vs. plain grid trackers.
- Backend cost ≪ $0.10 per active user per month at v1 scale (Supabase free tier is enough for the first ~1,000 MAU).

## 9. Constraints

- Single developer, part-time. Budget-conscious.
- No native code beyond what Expo provides in SDK 51. If a feature needs custom Swift/Kotlin, defer to v2.
- Web build must not regress — it's the demo surface for portfolio and stakeholders.

## 10. Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Users don't grant notification permission → reminders useless | High | Delay ask until *after* they add first sub; explain the value in-copy; fall back to in-app red-dot indicator |
| Sub library gets stale (icons/colors wrong) | Medium | Keep the library in a JSON file the app fetches at boot; allow user override via "Change icon" |
| Split-price rendering breaks on very long currencies (e.g. "₹1,25,79,600") | Medium | Cap font-size dynamically (shrink-to-fit); ellipsize with a tooltip on tap |
| Data loss on account delete regret | High | 30-day soft delete window; keep a "Restore" option in Profile → Danger zone |
| Reference designer objects to our interpretation | Low | Ship as an inspired-by-not-copy; keep enough differentiation (2-tone gradient, INR-primary, name/typography variants) |
| Time-zone bugs in reminders (renewal in wrong day) | High | Store all dates as UTC ISO strings; render in device timezone; reminders scheduled in device timezone |

## 11. Launch checklist (gate for v1 GA)

- [ ] All P0 features shipped and verified end-to-end
- [ ] Every screen matches reference spec (see UX_SPEC)
- [ ] Design system tokens implemented as `src/theme.ts` (see DESIGN_SYSTEM)
- [ ] Reduced-motion honored throughout
- [ ] Screen-reader labels on every interactive element
- [ ] Empty states, error states, loading states designed and shipped
- [ ] Reminder notifications tested on iOS + Android
- [ ] Delete-account flow works with 30-day restore
- [ ] Privacy policy + terms live on marketing site
- [ ] Analytics events instrumented (see TECH_SPEC §Analytics)
- [ ] Crash reporting live (Sentry)
- [ ] Vercel web preview stays green

## 12. Open questions (need product decisions before implementation)

1. **Auth model:** anonymous session upgrade to email, or email required upfront? *(Recommendation: anonymous with soft-nudge upgrade after 3rd sub added.)*
2. **Currency:** default to device locale, or force selection in onboarding? *(Recommendation: default to locale, editable in Profile.)*
3. **Reminders on web:** ignore (no notification API in Expo web), show in-app red dot only? *(Recommendation: yes.)*
4. **Sub library:** ship 50 popular apps hard-coded, or hit a remote index? *(Recommendation: hard-coded for v1; remote in v1.1.)*
5. **Free vs. paid:** free-forever with a paid tier for insights + export + multi-currency? *(Deferred to post-launch.)*

Approve or annotate this doc before I move on to code.
