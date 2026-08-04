# SubTrack — UX Specification

Screen-by-screen breakdown. Every element in the reference is enumerated with position, size, state, and interaction. Reference is the source of truth — this document translates it to implementation-ready detail.

**Companion docs:** `DESIGN_SYSTEM.md` (tokens), `TECH_SPEC.md` (data + logic), `DB_SCHEMA.md` (backend).

---

## 0. Information architecture

```
Root
├─ Onboarding (first launch only)
│  ├─ Welcome
│  ├─ Notification permission
│  ├─ (Optional) Sign in with email
│  └─ Seed suggestions (Popular apps you might use)
│
├─ Main tab: Home            ← default landing
│  └─ Modal: Subscription Detail Sheet
│     └─ Sub-flow: Change Plan (opens Edit Modal)
│     └─ Sub-flow: Change Payment Method
│     └─ Sub-flow: Confirm Cancel
│     └─ Sub-flow: Confirm Delete
│
├─ Main tab: Reminders (calendar)
│  └─ Detail Sheet (shared with Home)
│
├─ Global FAB (+): Add Subscription flow (5 steps)
│  1. Search / pick app
│  2. Amount + currency
│  3. Billing cycle + first billing date
│  4. Payment method
│  5. Reminder + auto-renew defaults → Save
│
├─ Main tab: Insights
│  ├─ Monthly spend chart (last 6 months)
│  ├─ Category breakdown
│  └─ Top expensive subs
│
└─ Main tab: Profile
   ├─ Account (email, sign out, delete)
   ├─ Currency
   ├─ Notification preferences
   ├─ Data & privacy (export, delete)
   └─ About (version, terms, privacy policy)
```

**Nav order left → right on the bar:** Home · Reminders · (FAB) · Insights · Profile.

---

## 1. Onboarding

**When it shows:** first launch (no auth session, no local `subs` seed).

### 1.1 Welcome screen
- Full-screen gradient background (`bg.gradient.*`).
- Centered stack:
  - App logo (Claude-style asterisk in `primary`), 96×96.
  - `heading.lg` — "Track every subscription in one place."
  - `body.md` — Two-line sub: "Know what you're paying for. Get reminded before renewals. Cancel with two taps."
  - Primary button — "Get started" (full-width pill, `primary`).
  - Ghost button — "I already have an account" (opens email sign-in sheet).
- Bottom: tiny `caption` — "Free forever · No credit card".

### 1.2 Notifications permission
- Illustration: bell icon with soft glow (custom SVG or Lottie).
- `heading.lg` — "Never miss a renewal."
- `body.md` — "We'll ping you 2 days before each subscription renews. You can change this anytime."
- Primary button — "Enable notifications" → triggers OS permission prompt.
- Secondary button — "Maybe later" (skips; user can turn on later in Profile).

### 1.3 Suggest popular apps
- `heading.lg` — "Which of these do you use?"
- Grid (2 cols mobile, 3 tablet): each cell = app icon tile + name + "Add" toggle chip.
- Selecting toggles the app; selected state shows check + primary tint.
- Sticky footer: "Continue" primary button (`n selected` label).

Skipping this screen is allowed — footer becomes "Skip for now".

---

## 2. Home screen

Matches reference panel 1 exactly.

### 2.1 Layout — top-down

```
┌──────────────────────────────────────────┐
│  TopBar                                  │  56px h
│  ┌─Avatar─┐  Good Morning ☀             │
│  │  RS    │  Rajashri                    │
│  └────────┘                       🔔 (dot)│
│                                          │
│  HeroTotalCard                           │  auto (240 nominal)
│  ┌────────────────────────────────────┐  │
│  │ TOTAL SPENDING          May,2026 ▼│  │
│  │                                    │  │
│  │ $ 274.84                           │  │
│  │                                    │  │
│  │ ↑ 12% less than April, 2026        │  │
│  │                                    │  │
│  │              [F][A][F] 8 active    │  │
│  │                       subscriptions│  │
│  └────────────────────────────────────┘  │
│              ▾  (DownChevronDivider)     │  16px w
│                                          │
│  QuickActionsRow                         │  auto (110)
│  [Add] [Category] [Insights] [Export]    │
│                                          │
│  SectionHeader                           │
│  Upcoming payments        [See all →]    │
│                                          │
│  SubRow × N (scrollable, bottom-padded)  │
│  ┌────────────────────────────────────┐  │
│  │ [F] Figma {Professional} [TODAY]  │  │
│  │     Plan · Renews May 12, 2026    │  │
│  │                          $15.84   │  │
│  │                          per month│  │
│  └────────────────────────────────────┘  │
│  … more rows …                           │
│                                          │
│  (BottomNav overlays absolute)           │
└──────────────────────────────────────────┘
```

### 2.2 TopBar
- Left cluster:
  - Avatar 48×48, `radius.pill`, gradient (`primary → indigo`), initials in white 15pt bold.
  - Text block:
    - Line 1: "Good Morning ☀" — `caption`, `muted`.
    - Line 2: "Rajashri" — `heading.md`, `ink`. (User's first name / handle.)
- Right cluster:
  - Notification bell, 44×44 white rounded-square (`radius.md`), `elev.card`. Red 8×8 dot at top-right when `unreadReminders > 0`.
- Greeting logic: "Good Morning" (< 12), "Good Afternoon" (12–17), "Good Evening" (≥ 17), based on device local time.

### 2.3 HeroTotalCard

Reference: purple gradient rounded card with the big total.

- Background: `LinearGradient(['#5B5CE6', '#4C4CE5', '#3535D6'])` diagonal top-left → bottom-right.
- Padding: 24 (`space.xxl`) all sides, 22 top.
- `radius.xxxl` (34).
- `elev.hero` shadow (primary-tinted).
- **Row 1**: label + month picker.
  - "TOTAL SPENDING" `caption`, letter-spaced, white 70% opacity.
  - MonthPickerPill on right: white `#FFFFFF` bg, primary text, chevron-down, opens `MonthPickerSheet`. Default label: current month + year ("May, 2026").
- **Row 2**: SplitPrice.
  - Currency symbol (₹/$) at 24pt, baseline aligned with cap-height of the whole part.
  - Whole part: `numeric.split.whole` — 44/48/700 white.
  - Cents: `numeric.split.cents` — 20/24/700 white, aligned above baseline.
- **Row 3**: DeltaPill.
  - Semi-transparent white pill w/ green tint. Content: `↑ 12% less than {previous month}` — read from `metrics.deltaVsPrev`. Green if less, red-orange if more.
- **Right column overlay** (absolute in the card, right-aligned):
  - IconStackOverlap: 3 overlapping 36×36 app icons (rightmost = top z), from top-3 active subs by monthly cost.
  - Under it: `caption` "8 active subscriptions" — right-aligned.

**Interactions:**
- Tapping the card opens Insights (`/insights` tab).
- Tapping the MonthPickerPill opens a bottom sheet with a month/year wheel; changing scrolls the entire dashboard's data to that month.
- Long-press on the amount → tooltip "Includes N subs. Excludes cancelled." (dismiss on release).

### 2.4 DownChevronDivider
- Purpose: signal the hero flows into the quick-action row.
- Small caret pointing down, 16×10, `ink` at 30% opacity. Centered horizontally.
- Margin: 8 top, 8 bottom.

### 2.5 QuickActionsRow
- Row of 4 tiles, flex 1 each, 12px gap.
- Each tile: `surface`, `radius.lg`, 14pt vertical padding, centered content, `elev.card`.
- Icon chip on top (40×40, `radius.pill`) — tinted background, glyph in tinted foreground:
  - Add — `primary.tint` bg, `primary` fg, plus icon.
  - Category — `#DCF6E5` bg, `success` fg, grid icon.
  - Insights — `#FEF3C7` bg, `warn` fg, bar-chart icon.
  - Export — `#E7EBF3` bg, `#334155` fg, download icon.
- Label under: `body.md`/12pt semibold, `ink`.
- Press feedback: `motion.spring.soft`, `translateY -3, scale 1.03`.

**Actions:**
- Add → opens Add Subscription flow (see §5).
- Category → opens Categories management (see §7).
- Insights → deep-links to Insights tab.
- Export → opens export sheet (v1: toast "Coming soon", CSV in v1.1).

### 2.6 SectionHeader ("Upcoming payments")
- Left: `heading.md` — "Upcoming payments".
- Right: pill button — "See all →" in primary. Opens the full sub list (see §3).
- Margin below: 12.

### 2.7 SubRow (upcoming payments variant)

Each row card:
- `surface`, `radius.xl`, padding 16.
- `elev.card`, 1px `border` outline.
- 12px `gap` between rows.

Layout (row: icon 56 | content flex-1 | price auto):
- **AppIconTile** 56×56, `radius.md`, brand color bg, initial letter (or emoji) 22pt white bold, `elev.tile`.
- **Content column** (flex 1):
  - Name row (flex row, gap 8): app name (`title.md`) + chip.
    - If billing in 0 days → "TODAY" chip (amber).
    - If 1–7 days → "N DAYS" chip (amber).
    - If > 7 days → hide chip; render StatusChip if not active (paused/cancelled/expired).
  - Meta line (`body.sm`, `muted`): `${plan} · Renews ${date}` — e.g. "Premium · Renews May 12, 2026".
- **Price column** (right aligned):
  - SplitPrice — currency + whole + cents. Whole at `title.md`, cents at 60% of that.
  - Under: "per month" — `caption`, `muted`.

**Sorting:** by `daysUntil(billingDate)` ascending. Cancelled/expired subs are excluded from Upcoming; they render on the "See all" screen instead.

**Interactions:**
- Tap → opens Subscription Detail Sheet (§4).
- Long-press → shows inline Edit / Delete slide-in actions (persist previous behavior).

### 2.8 Empty state (no subs)
- Illustration: three floating semi-transparent app icons.
- `heading.md` — "Nothing tracked yet."
- `body.sm` `muted` — "Tap the + button to add your first subscription."
- Bounce animation on the FAB (spring pulse every 3s until user adds something).

---

## 3. See All (Subscriptions list) — sub-screen

Opens from "See all →" or from the Subs tab.

- Header: back button + title "All Subscriptions" + right icon `filter` (opens FilterSheet).
- Segmented control: `Active` / `Paused` / `Cancelled` / `Expired`. Default = Active.
- Sort dropdown top-right of the list: "Next renewal" (default) / "Price high → low" / "Alphabetical" / "Recently added".
- List: SubRow × N (same component as Home).
- Pull-to-refresh (native pattern).
- Empty state (per tab): "No {status} subscriptions" + illustration.

---

## 4. Subscription Detail Sheet

Modal bottom sheet — matches reference panel 2 exactly.

### 4.1 Sheet chrome
- Backdrop: `rgba(15,10,40,0.45)`, fades in `motion.base`.
- Sheet: bottom-anchored, `radius.xxxl` top corners, height 90 % of viewport, `elev.sheet`.
- Grabber: 44×5 pill, `#E1DED8`, centered 14pt from top.
- Enter: `motion.spring.firm` translateY from 800 → 0.
- Dismiss: tap backdrop, swipe down > 60pt, or tap X.

### 4.2 Content (top → bottom)

**Header row** (fixed at top):
- Back arrow left (only if opened from a full-screen surface; otherwise omit).
- Centered title "SUBSCRIPTION" `heading.md` — reference uses uppercase caption style — TBD, match reference: `caption` letter-spaced.
- Bell icon top-right (opens notification prefs for this sub).

**Countdown card** (immediately below header):
- Rounded card, `surface`, `radius.xxl`, padding 20.
- Row: "N DAYS" amber chip (`warn.bg` + `warn` text). Position: top-left.
- Row: AppIconTile 60×60 + right-side "Pay now ↗" primary pill.
- App name: `heading.md`.
- Plan detail: `body.sm` `muted` — e.g. "Premium · 4k UHD · 4 screens".
- Divider (subtle) inside card.
- SplitPrice + " / per month" — flex row. Right side: Cancel red pill w/ ×.

**DownChevronDivider** between countdown card and info grid.

**Info grid** — 2×2:
- Each InfoTile: `surface`, `radius.xl`, padding 16, `elev.card`.
- Icon chip 32×32 top-left (tinted `primary.tint`).
- Label uppercase `caption` `muted`.
- Value `heading.md` `ink`.
- Subtext `body.sm` `muted`.
- Grid content:
  - NEXT PAYMENT — calendar icon, `Jun 14, 2026`, `in next month`
  - BILLING CYCLE — refresh icon, `Monthly`, `Since Nov, 2024`
  - TOTAL SPENT — clock icon, `$309.80`, `Over 20 months`
  - CATEGORY — grid icon, `Streaming`, `Entertainment`

**Toggle rows**:
- **Payment Reminder** — icon chip (bell), title "Payment Reminder", subtitle "Notify me 2 days before" (dynamic based on `remindLeadDays`), Switch on right.
- **Auto-Renew** — icon chip (refresh-cw), title "Auto - Renew", subtitle "Renew automatically each month", Switch.

Each row: 12pt vertical padding, divider between (1px `border`).

Tapping the subtitle of Payment Reminder opens a small sheet to pick lead days (1 / 3 / 7).

**Payment methods** row:
- Left: label "Payment methods" `heading.md`.
- Right: pill "Change >" primary text on `primary.tint` bg.
- Below (optional preview): the current card row — VISA/MC/AMEX brand mark + `•••• 0977` + "Default" small chip.
- Tap Change → opens Payment Method sheet (§8).

**Bottom action bar** (sticky):
- Two full-width buttons, side-by-side, 12pt gap:
  - **Pause II** — orange (`pause`) pill, white text + pause glyph.
  - **Cancel ×** — red (`danger`) pill, white text + × glyph.
- Fixed 24pt above bottom safe-area.

### 4.3 Contextual variants
- If status = `paused`: Pause button becomes "Resume ▶" green.
- If status = `cancelled`: entire bottom bar collapses to a single "Reactivate" primary button.
- If status = `expired`: bottom bar shows "Renew Now" primary + "Delete permanently" red ghost.

### 4.4 Confirmations
- **Cancel** → ConfirmDialog: title "Cancel Netflix?", body "Access continues until the current cycle ends. You can reactivate anytime.", buttons: Keep (ghost) + Cancel it (red).
- **Delete permanently** → ConfirmDialog: title "Delete Netflix?", body "This removes it from your list forever. Total-spent history is lost.", buttons: Keep + Delete (red).

### 4.5 Toasts
- After Pause: "Paused Netflix. We'll stop counting it."
- After Resume: "Netflix is active again."
- After Reminder toggle off: "Reminder off. We won't ping you."

---

## 5. Add Subscription flow (5-step wizard)

Full-screen modal, slides up. Each step: back button + step indicator + primary CTA.

### 5.1 Step indicator
- Top of screen: 5 pill segments, filled left-to-right based on progress. Current step = primary; done = primary at 60%; upcoming = `border`.

### 5.2 Step 1 — Search / pick app
- Search input at top: text field, `radius.pill`, search icon.
- Below: grid of recent + suggested apps (2 cols mobile). Each cell = AppIconTile + name.
- Bottom sticky: "Can't find it? Add manually" ghost button → skips to step 2 with blank fields.

### 5.3 Step 2 — Amount
- Big centered SplitPrice input. Numeric keypad.
- Currency selector below (default = user's currency).
- Continue button sticky bottom.

### 5.4 Step 3 — Billing cycle + first date
- Radio-style cards: Monthly / Yearly / Quarterly / Weekly / Custom.
- Below: "First billing date" — date picker (native).
- Continue.

### 5.5 Step 4 — Payment method
- List of user's saved cards (from Profile). Radio-select.
- Bottom: "+ Add new card" ghost row → opens Add Card sheet.
- Continue.

### 5.6 Step 5 — Reminder & category
- Reminder lead-days: 1 / 3 / 7 (segmented control). Default = 3.
- Auto-Renew toggle. Default on.
- Category select (dropdown or bottom sheet of pre-defined + custom).
- Sticky footer: "Add subscription" primary button.

### 5.7 Success
- Full-screen success (0.6s): green check pulse + "Added!". Toast + haptic. Auto-returns to Home.

**Edit vs. Add:** the same flow, pre-filled. Header title switches to "Edit subscription" and the CTA reads "Save changes".

---

## 6. Reminders / Calendar screen

Matches reference panel 3.

### 6.1 Header
- Back arrow left + "Reminders" `heading.lg`.
- Right: two circle buttons `← →` (MonthNavArrows).

### 6.2 Month header
- Left: selected date "May 12, 2026" `heading.md`.
- Right: "8 active subscriptions" `body.sm` `muted`. Two-line if narrow.

### 6.3 CalendarGrid
- Weekday row: `SUN MON TUE WED THU FRI SAT` — `caption` uppercase `muted`.
- 6-week grid of DayCells.
- Cell = number `title.md` + optional dots below.
- Dots:
  - 1 dot when 1 renewal that day.
  - 2 dots when 2+ renewals that day. Second dot slightly overlapping (matches reference).
- Colors of dots follow §1.3 (by billing card or by category — decision: **by category** so the calendar feels informative).
- Selected date pill: filled `primary` circle w/ white number.
- Today's date: white number with `primary` border ring (only when not selected).
- Out-of-month dates: muted (30% opacity).

### 6.4 Day timeline (below calendar)
- For selected date and adjacent upcoming dates, render a ReminderTimelineGroup per date:
  - Date header: `TUESDAY 12, 2026` (uppercase) + right meta ("Today" or "N reminders").
  - Vertical line 2px `border` running through markers.
  - Each ReminderTimelineItem: 12×12 ring marker (colored per category) + SubRow-style content — app icon, name, time + "Monthly renewal" meta, SplitPrice on right.
- Groups sorted chronologically. Display next 7 upcoming dates that have events.

### 6.5 Interactions
- Tap DayCell → change selected date; timeline scrolls to that date's group at top.
- Swipe left/right on calendar → advance month (haptic on month change).
- Long-press DayCell → quick-add reminder for that date (opens Add sheet with date prefilled).
- FAB (+) bottom-right in this screen defaults to "Add reminder" mode (subscription with `remindLeadDays=0`).

### 6.6 Empty state
- If no reminders in visible month: illustration + "You're all clear this month." + "Enjoy the peace ✌️".

---

## 7. Insights tab

Two-column responsive layout at ≥ md, single column below.

### 7.1 Summary strip (top)
- 4 stat tiles (uses MetricsBar with reduced set):
  - Monthly Spend + delta pill (see reference).
  - Annual Spend.
  - Upcoming (next 30 days).
  - Saved this Year.

### 7.2 Monthly trend chart
- Card with 6-month bar chart (Jan…Jun), tap a bar to see that month's breakdown below.
- Selected bar highlighted `primary`; others `border`.
- Tooltip on tap: month + amount.

### 7.3 Category breakdown
- Donut chart center = total; legend list on right with % and $ per category.
- Tap a slice → drill into a filtered sub list.

### 7.4 Top expensive
- List: SubRow variant sorted by monthly cost descending.
- Shows "Top 5 costing you $X/mo".

### 7.5 Savings ticker (nice-to-have)
- Big number: "You've saved $X this year by cancelling." — computed from `cancelledAt` × `remaining months in year`.

---

## 8. Profile tab

- Header: user avatar + name + email (if authenticated).
- Sections (each is a card):
  1. **Account** — email, "Sign out", "Delete account" (red, opens 30-day soft-delete flow).
  2. **Preferences** — Currency, Default reminder lead-time, Quiet hours (start/end).
  3. **Notifications** — Master toggle, per-category toggles.
  4. **Payment methods** — list of saved cards, "+ Add new".
  5. **Data & privacy** — Export data (JSON/CSV), Privacy policy, Terms.
  6. **About** — Version, "Rate the app", "Send feedback".

---

## 9. Global elements

### 9.1 BottomNav
- Fixed bottom, 24pt from safe-area bottom.
- White pill container 88pt tall, `radius.xxl`, `elev.float`.
- 4 icon slots + 1 FAB slot centered.
- Icons: `home`, `calendar`, (FAB), `bar-chart-2`, `user`.
- Active state: lavender `primary.tint` circle behind icon + tiny 5px `primary` dot 3pt below.
- FAB: 66×66 `primary` circle, `elev.fab` glow, 4pt `bg.gradient.top` rim, white + glyph inside.
- FAB tap: opens Add Subscription flow OR expands into a radial menu on long-press (v1.1).

### 9.2 Bell (notification icon)
- Small red dot when any upcoming reminder is due within `remindLeadDays`.
- Tap → opens a `NotificationsSheet` listing unread reminders and past 7 days of activity.

### 9.3 Toast
- Bottom center, 24pt above nav.
- Dark pill (`ink` bg) with white text, `body.sm`.
- Auto-dismiss 1.8s. Slides up on enter, fades on exit.
- Success variant: green check prefix. Error variant: red icon prefix.

### 9.4 ConfirmDialog
- Centered modal card, max-width 380, padding 22, `radius.xxl`, `elev.sheet`.
- Title `heading.md`.
- Body `body.md` `inkSoft` (2–3 lines).
- Button row: two buttons flex-1, 10pt gap. Ghost + Destructive (or Ghost + Primary).

---

## 10. States (every screen must handle)

For each screen the following states are designed and must be implemented:

| State | Definition |
|---|---|
| Loading | Data fetching (auth resolving, subs loading). Show skeleton shimmer of the layout (not spinners). |
| Empty | User has zero data of the type shown. Illustrated empty state + primary CTA to fix it. |
| Error | Fetch failed / offline. Card with `refresh-cw` icon + "Couldn't load. Retry." button. Cached data still shown behind if available. |
| Success | Normal data-loaded state. |
| Partial | Some data loaded, some errored (e.g. sub list loaded but insights failed). Section-scoped error banner. |

---

## 11. Interactions & animations catalog

| Interaction | Trigger | Feedback |
|---|---|---|
| Tile press | any QuickActionTile, InfoTile, SubRow | Spring lift `translateY: -3, scale: 1.03` (motion.spring.soft) |
| Sheet open | Detail, Add wizard, Confirms | Backdrop fade + spring translateY (motion.spring.firm) |
| FAB press | tap | scale down to 0.94 (100ms), release scales to 1.0 spring |
| Toggle switch | tap | native switch animation + haptic light (mobile) |
| Delta computed | dashboard load / month change | RollingNumber tween + delta pill fade |
| Chart tap | Insights bar / donut slice | Bar/slice grows scale 1.05 + tooltip fade |
| Long-press SubRow | Home / Subs | Slide-in Edit / Delete rail from right |
| Swipe SubRow left (mobile) | any list row | Reveal quick Pause / Delete actions |
| Calendar day tap | new selection | Filled pill scales in; timeline scrolls to new group (400ms) |
| Reminder fire | scheduled time | Push notification (native) + red dot on Bell (in-app) |
| Cancel confirmed | ConfirmDialog | Row animates opacity 0.3 + status pill flips red |
| Delete confirmed | ConfirmDialog | Row slides out horizontally + list re-flows (spring) |
| Pull to refresh | any list | Native indicator + fetch |
| Reduced motion | prefers-reduced-motion | Skip springs; use fade only; disable orbit |

---

## 12. Copy library (all user-facing strings, in English v1)

Kept in `src/lib/copy.ts`. Extract from here — never hard-code in components.

```
greeting.morning = "Good Morning"
greeting.afternoon = "Good Afternoon"
greeting.evening = "Good Evening"

hero.totalSpending.label = "TOTAL SPENDING"
hero.dueToday = "Due Today"
hero.dueTomorrow = "Due Tomorrow"
hero.dueInDays = "Due in {n} days"

section.upcoming = "Upcoming payments"
section.active = "Active Subscriptions"
section.seeAll = "See all →"
section.manage = "Manage →"

quickActions.add = "Add"
quickActions.category = "Category"
quickActions.insights = "Insights"
quickActions.export = "Export"

chip.today = "TODAY"
chip.dayN = "{n} DAYS"
chip.day1 = "1 DAY"
chip.active = "Active"
chip.paused = "Paused"
chip.cancelled = "Cancelled"
chip.expired = "Expired"

detail.nextPayment = "NEXT PAYMENT"
detail.billingCycle = "BILLING CYCLE"
detail.totalSpent = "TOTAL SPENT"
detail.category = "CATEGORY"
detail.paymentReminder = "Payment Reminder"
detail.autoRenew = "Auto - Renew"
detail.paymentMethods = "Payment methods"
detail.change = "Change >"

action.payNow = "Pay now ↗"
action.pause = "Pause II"
action.resume = "Resume ▶"
action.cancel = "Cancel ×"
action.reactivate = "Reactivate"
action.renewNow = "Renew Now"
action.deletePermanently = "Delete permanently"

confirm.cancel.title = "Cancel {name}?"
confirm.cancel.body = "Access continues until the current cycle ends. You can reactivate anytime."
confirm.delete.title = "Delete {name}?"
confirm.delete.body = "This removes it from your list forever. Total-spent history is lost."
confirm.keep = "Keep"
confirm.confirmCancel = "Cancel it"
confirm.confirmDelete = "Delete"

toast.paused = "Paused {name}. We'll stop counting it."
toast.resumed = "{name} is active again."
toast.cancelled = "{name} cancelled."
toast.deleted = "{name} deleted."
toast.added = "Added {name}."
toast.reminderOff = "Reminder off. We won't ping you."
toast.exportSoon = "Export is coming soon."

emptyState.subs.title = "Nothing tracked yet."
emptyState.subs.body = "Tap the + button to add your first subscription."
emptyState.reminders.title = "You're all clear this month."
emptyState.reminders.body = "Enjoy the peace ✌️"
```

---

## 13. Approval checklist before code

- [ ] Confirm greeting shows user's first name from account (not "Rajashri" hard-coded).
- [ ] Confirm month picker on hero drives ALL dashboard metrics (not just the amount).
- [ ] Confirm calendar dots color by category (v1) — swap for card in v1.1 if data allows.
- [ ] Confirm 5-step Add wizard is the way (vs. single-form modal).
- [ ] Confirm reduced-motion respects orbit disabled.
- [ ] Confirm bottom nav is 4 tabs + FAB (not 5).
- [ ] Confirm currency default = device locale.
- [ ] Confirm reminders "N days before" defaults to 2 (matches reference subtitle).

Once these boxes are checked, freeze the spec and I move to `TECH_SPEC.md` / `DB_SCHEMA.md` / `IMPLEMENTATION_PLAN.md` implementation.
