# SubTrack — Specification Bundle

**Status:** DRAFT — awaiting your approval before any code is written.
**Source of truth:** the three-panel reminder-app reference (Home / Subscription Detail / Reminders Calendar) with "Good Morning · uix.vikram · $274.84" opened above.

Every document below is designed to be read once, marked up, and either approved or challenged. Only after every doc is approved do I begin implementation.

## Read in this order

| # | Doc | What it answers |
|---|---|---|
| 1 | [`PRD.md`](./PRD.md) | Why this product exists, who it's for, what's in / out of scope, success metrics. |
| 2 | [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | Every design token — color, typography, spacing, radius, elevation, motion, component inventory. |
| 3 | [`UX_SPEC.md`](./UX_SPEC.md) | Every screen, state, interaction, animation, and copy string, mapped to reference. |
| 4 | [`TECH_SPEC.md`](./TECH_SPEC.md) | Stack, module boundaries, data flow, auth, offline, notifications, testing, deploy. |
| 5 | [`DB_SCHEMA.md`](./DB_SCHEMA.md) | Postgres/Supabase tables, enums, RLS, indexes, triggers, views, sample queries. |
| 6 | [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) | Phased delivery plan with tasks, dependencies, acceptance criteria, effort. |

## How to approve

- Reply with **"approved"** in chat to accept everything as-is.
- Or annotate individual docs (add comments/edits) — I'll iterate, re-post, and re-request approval on the affected doc(s).
- Each doc ends with an "Approval checklist" — walking through those boxes is the fastest review.

## What happens after approval

Phase 1 of `IMPLEMENTATION_PLAN.md` starts. I'll surface each phase as a set of PRs. No feature ships until the acceptance criteria in the plan are met and the reference-fidelity screenshot check (📸) passes.

## What won't happen

- No code changes to the existing app until every doc is approved.
- No reinterpretation of the reference — every design decision links back to a spec section that maps to a reference element.
- No scope creep — the "In Scope" list in `PRD.md §5.1` is the v1 boundary. Anything else is v1.1 or later.
