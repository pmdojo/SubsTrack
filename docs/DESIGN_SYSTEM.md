# SubTrack — Design System

**Source of truth:** the three-panel reminder-app reference (Home / Subscription Detail / Reminders Calendar) that opens with "Good Morning · uix.vikram" and $274.84 total spending. Every token below is reverse-engineered from those frames.

## 1. Color

### 1.1 Semantic palette

| Token | Hex | Usage |
|---|---|---|
| `bg.gradient.top` | `#FBF7F1` | Warm cream, top of app background gradient |
| `bg.gradient.mid` | `#F4EFF7` | Lavender midpoint |
| `bg.gradient.bottom` | `#EDE7F5` | Deeper lavender at bottom |
| `surface` | `#FFFFFF` | All cards, tiles, sheet backgrounds |
| `surface.muted` | `#F4EFEA` | Subtle secondary surface (tile borders, inactive states) |
| `ink` | `#1A1917` | Primary text |
| `ink.soft` | `#3F3D3A` | Secondary text |
| `muted` | `#8B887F` | Metadata, timestamps, labels |
| `border` | `#EFEDE7` | Card borders, dividers |
| `primary` | `#4C4CE5` | CTAs, active nav, primary buttons, "Pay Now", month picker pill |
| `primary.dark` | `#3535D6` | Pressed state |
| `primary.tint` | `#EDE9FE` | Active tab background pill, icon chip tint |
| `success` | `#0F9D58` | "12% less" delta, active status pill text |
| `success.bg` | `#DCF6E5` | Success chip background |
| `warn` | `#B45309` | "TODAY / N DAYS" chip text, warn accents |
| `warn.bg` | `#FEF3C7` | Amber chip background |
| `danger` | `#DC2626` | Cancel button, expired badge, delete |
| `danger.bg` | `#FDECEC` | Danger chip background |
| `pause` | `#F97316` | Pause button orange |
| `neutral` | `#57534E` | Cancelled/inactive text |
| `neutral.bg` | `#EEEBE4` | Cancelled chip background |

### 1.2 App/brand accent colors (per subscription)

Rendered as the fill of the app-icon rounded-square tile. Never used as UI chrome.

| Brand | Hex |
|---|---|
| Netflix | `#E50914` |
| Spotify | `#1DB954` |
| Figma | `#F24E1E` |
| Adobe | `#FA0F00` |
| Framer | `#0055FF` |
| ChatGPT | `#10A37F` |
| Claude | `#D97757` |
| YouTube | `#FF0000` |
| Notion | `#111111` |
| Discord | `#5865F2` |
| Apple | `#111111` |
| iCloud | `#3B82F6` |
| GitHub | `#111111` |
| HBO Max | `#7C3AED` |
| Canva | `#00C4CC` |
| Microsoft | `#0078D4` |
| Prime Video | `#00A8E1` |
| Disney+ | `#0E47A1` |

### 1.3 Timeline dot colors (Calendar)

Reference shows two distinct colors per date; represents "distinct card"/"category" grouping.

| Token | Hex | Meaning |
|---|---|---|
| `dot.primary` | `#4C4CE5` | Card ending 0977 renewals |
| `dot.secondary` | `#F97316` | Card ending 1142 renewals |
| `dot.tertiary` | `#22C55E` | Free / trial |

## 2. Typography

Font family: **DM Sans** (Google Fonts, weights 400/500/600/700).

| Style | Size / Line height | Weight | Letter-spacing | Example use |
|---|---|---|---|---|
| `display.xl` | 56 / 60 | 700 | −2.0 | Hero total spending (whole part) |
| `display.md` | 32 / 36 | 700 | −1.2 | Detail sheet next-charge amount |
| `heading.lg` | 22 / 28 | 700 | −0.6 | Screen title ("Reminders", section headers) |
| `heading.md` | 18 / 24 | 700 | −0.4 | "Upcoming payments", "Payment methods" |
| `title.md` | 15 / 20 | 700 | −0.3 | Sub row name ("Figma {Professional}", "Netflix") |
| `body.md` | 14 / 20 | 500 | −0.2 | Detail meta rows, action row labels |
| `body.sm` | 13 / 18 | 400 | 0 | "Renews May 12, 2026", meta lines |
| `caption` | 11 / 16 | 500 | 0.4 | "TOTAL SPENDING" all-caps, tile labels |
| `micro` | 9 / 12 | 700 | 1.0 | "TODAY", "2 DAYS" chip labels (all-caps) |
| `numeric.split.whole` | 44 / 48 | 700 | −1.8 | The big part of a split price ("274") |
| `numeric.split.cents` | 20 / 24 | 700 | −0.4 | The small part (".84") |

Split-price rendering rule: whole and cents share the same baseline; cents' baseline aligns to the whole's cap-height (offset ≈ 6px above the whole's baseline).

## 3. Spacing scale

4-pt base grid.

| Token | px |
|---|---|
| `space.xs` | 4 |
| `space.sm` | 8 |
| `space.md` | 12 |
| `space.lg` | 16 |
| `space.xl` | 20 |
| `space.xxl` | 28 |
| `space.xxxl` | 40 |
| `space.gutter` | 24 (default screen horizontal padding) |
| `space.section` | 28 (between major sections vertically) |
| `space.card.inner` | 20–24 |

## 4. Radius

| Token | px | Usage |
|---|---|---|
| `radius.xs` | 6 | Chips |
| `radius.sm` | 10 | Icon chips |
| `radius.md` | 14 | Info tile inside detail sheet |
| `radius.lg` | 18 | Quick-action tile, day cell |
| `radius.xl` | 22 | Standard cards |
| `radius.xxl` | 28 | Hero card, detail-sheet top card |
| `radius.xxxl` | 34 | Bottom sheet top corners |
| `radius.pill` | 999 | Buttons, chips, month picker |

## 5. Elevation / shadows

Multi-layer soft shadows characteristic of the reference:

| Token | Spec |
|---|---|
| `elev.card` | `0 4 12 rgba(0,0,0,0.06)` |
| `elev.tile` | `0 6 16 rgba(0,0,0,0.08)` |
| `elev.hero` | `0 18 32 rgba(76,76,229,0.14)` (primary-tinted) |
| `elev.float` | `0 10 20 rgba(0,0,0,0.12)` (bottom nav, FAB base) |
| `elev.fab` | `0 12 24 rgba(76,76,229,0.55)` (primary glow) |
| `elev.sheet` | `0 -8 40 rgba(0,0,0,0.25)` (bottom sheet) |

Every card also gets a hairline border `1px solid border` to reinforce edges against the warm background.

## 6. Iconography

- **Set:** Feather Icons (via `@expo/vector-icons`). 24px default stroke; scale down to 18 in tight spots.
- **Directional accents:** ↗ used on "Pay now" (external-launch feel), → on "See all", "Tap to Manage", "Change".
- **Emoji reserved for greeting** ("👋", "☀️", "🟢"). Not used inside data rows.

Icon-chip pattern (used in quick actions, info tiles, detail action rows, calendar avatars):

```
┌──────────────────────────┐
│  ○ (icon chip 40×40)     │   round chip, tinted bg, feather glyph inside
│  Label (12/16, semibold) │   under or beside
└──────────────────────────┘
```

## 7. Motion

Framework: React Native `Animated` (with a Moti-compatible shim already in the codebase) + `react-native-reanimated` for anything demanding.

| Token | Duration | Easing | Usage |
|---|---|---|---|
| `motion.fast` | 150 ms | `easeOut(cubic)` | Hover/press feedback, chip pop |
| `motion.base` | 220 ms | `easeOut(cubic)` | Fade in, opacity swaps |
| `motion.slow` | 380 ms | `easeOut(cubic)` | Sheet open, drawer slide |
| `motion.spring.soft` | — | `spring(damping 18, stiffness 260)` | Tile press-lift, tap-scale |
| `motion.spring.firm` | — | `spring(damping 26, stiffness 320)` | Bottom sheet open |
| `motion.orbit` | 18 s linear loop | `linear` | Icon orbit in hero |
| `motion.counter` | 900 ms | `easeOut(cubic)` | Number tween (whole values) |
| `motion.roll` | 900 ms per digit | `easeOut(cubic)` | Per-digit "rolling counter" (single-digit rolls, longer for higher digits, +60 ms stagger) |

**Standard press feedback (all pressable tiles):** `translateY: -3, scale: 1.03` on press-in via spring.soft. Reverses on press-out.

**Standard sheet enter:** slides from bottom (`translateY: viewportHeight → 0`) with backdrop fade `0 → 1` over `motion.slow`.

**Section entry:** staggered on mount (`80 ms` per section), each section `opacity: 0, translateY: 20 → 1, 0` over `motion.slow`.

## 8. Component inventory

Every reusable primitive that composes the reference. All components live in `src/components/`.

| Component | Purpose |
|---|---|
| `Avatar` | Circular gradient avatar with initials, pulse-ring animation |
| `Bell` | Notification icon w/ optional red-dot indicator |
| `TopBar` | Greeting + avatar + notification button (Home only) |
| `ScreenHeader` | Back button + title + optional right action (Detail, Reminders, etc.) |
| `HeroTotalCard` | Purple gradient card with "TOTAL SPENDING", month picker, split amount, delta pill, overlapping app icons stack |
| `MonthPickerPill` | Purple pill with month/year + chevron; opens `MonthPickerSheet` |
| `SplitPrice` | Reusable — renders currency symbol + big whole + small decimal + suffix |
| `DeltaPill` | Tiny pill with arrow + "N% less/more than $prev-period" |
| `IconStackOverlap` | Row of overlapping circular app icons with count label |
| `DownChevronDivider` | Small caret pointing down between hero and next section |
| `QuickActionTile` | Square white tile with round icon chip on top + label below (Add/Category/Insights/Export) |
| `SectionHeader` | Big left title + right pill button ("See all →" / "Manage →") |
| `SubRow` | Row card: app-icon tile + name + chip (TODAY/N DAYS/status) + meta line + SplitPrice on right |
| `AppIconTile` | Rounded-square with brand color, initial letter or emoji glyph, subtle shadow |
| `StatusChip` | Amber (upcoming) / green (active) / neutral (cancelled) / red (expired) |
| `InfoTile` | Rounded card w/ icon chip top-left + uppercase label + big value + subtext (2×2 grid on detail) |
| `ToggleRow` | Icon chip + title + subtitle + native switch |
| `ChangeRow` | Section label + right pill "Change >" |
| `ActionButton` | Full-width pill: primary purple, orange (Pause), red (Cancel), grey (Ghost) variants |
| `ActionRow` | Icon chip + label + chevron; used in the action list inside detail sheet |
| `BottomNav` | 4 icon-only tabs + centered floating FAB with primary glow |
| `Fab` | 66px purple circle with white + glyph, cream rim, spring on tap |
| `CalendarGrid` | 6-week monthly grid with weekday header, dot indicators, selectable dates |
| `DayCell` | Individual date cell — number + optional dot(s), selected-pill state |
| `ReminderTimelineGroup` | Date-label header + right meta ("Today", "2 reminders") + vertical timeline w/ items |
| `ReminderTimelineItem` | Vertical connector + ring marker + SubRow-style summary |
| `MonthNavArrows` | ← / → pair for previous/next month |
| `BottomSheet` | Reusable draggable sheet w/ grabber, backdrop, spring in/out |
| `ConfirmDialog` | Modal card w/ title, body, Keep + destructive buttons |
| `Toast` | Bottom pill message, 1.8s auto-dismiss |
| `RollingNumber` | Per-digit slot-machine counter |
| `AnimatedCounter` | Simple numeric tween |
| `OrbitStage` | Circular animated icon orbit (hero card 2, if kept) |

## 9. Layout grid & breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| `xs` | < 480 | Single column; all cards full-width; sub rows stack |
| `sm` | 480 – 767 | Single column; larger horizontal padding (24 → 20) |
| `md` | 768 – 1023 | Container widens to 640 max; two-col hero if applicable |
| `lg` | ≥ 1024 | Container widens to 960 max; layout otherwise identical to md |

Reference is a mobile-first design; > sm just re-hosts the same layout in a centered narrow column.

## 10. Accessibility rules

- **Contrast:** all text meets WCAG AA (`ink` on `surface`, `primary` on `primary.tint` verified).
- **Tap targets:** minimum 44×44 pt (Feather icon buttons wrap 40 icon in 44 hit slop).
- **Focus rings:** on Web build, all interactive elements get a 2px `primary` focus ring at 2px offset.
- **Screen reader:** `accessibilityLabel` on every icon-only button (bell, nav tabs, FAB, back).
- **Motion:** honor `prefers-reduced-motion` (skip orbit, disable spring; use `motion.base` fades only).
- **Numeric labels:** RollingNumber falls back to plain `<Text>` under reduced motion.

## 11. Content voice

- Sentence case for titles.
- All-caps + letter-spaced for section labels ("TOTAL SPENDING", "TUESDAY 12, 2026").
- Currency symbols precede the amount (`$`, `₹`). No trailing currency codes.
- Dates written as "May 12, 2026" (Month DD, YYYY). Never abbreviated to "5/12".
- Chip copy is imperative or urgent: "TODAY", "2 DAYS", "Due Today", "Renewing Soon".
