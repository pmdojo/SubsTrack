# Phase 2 — Backend Setup Checklist

The Phase 2 code is shipped. To flip from local-only AsyncStorage to cloud-backed Supabase, complete the steps below. Until then, the app keeps working exactly as it does today (AsyncStorage seed + local state) — nothing regresses.

**Estimated time:** 10 minutes.

---

## 1. Create Supabase project

1. Go to **https://supabase.com/dashboard** → **New project**.
2. Name: `subtrack-prod` (create `subtrack-staging` too if you want a separate playground).
3. Region: **ap-south-1 (Mumbai)** or nearest to your users.
4. DB password: strong, save to a password manager. You won't need it in the app.
5. Wait ~1 min for the project to boot.

## 2. Enable Anonymous Auth

1. Left sidebar → **Authentication** → **Providers**.
2. Scroll to **"Anonymous Sign-Ins"** and toggle it **On**. Save.

(Without this, the app can't create sessions and every RLS query fails with 401.)

## 3. Run the migration + seed

Two options — use whichever you're comfortable with.

### Option A — Supabase Dashboard SQL Editor (fastest)

1. Left sidebar → **SQL Editor** → **New query**.
2. Paste the entire contents of [`supabase/migrations/20260805000000_init.sql`](../supabase/migrations/20260805000000_init.sql) and click **Run**. Should complete in ~2 sec.
3. New query → paste the contents of [`supabase/seed.sql`](../supabase/seed.sql) and **Run**. Should insert 12 categories + 40 apps.

### Option B — Supabase CLI (better long-term)

```sh
brew install supabase/tap/supabase        # macOS
supabase login                            # opens browser
cd ~/Documents/SubsTracker
supabase link --project-ref <your-ref>    # copy ref from Dashboard → Settings → General
supabase db push                          # applies migrations
psql "$(supabase status | grep 'DB URL' | awk '{print $NF}')" -f supabase/seed.sql
```

## 4. Copy env values

Dashboard → **Project Settings** → **API** — copy:

- **Project URL** (e.g. `https://abcxyz.supabase.co`)
- **Project API Key → anon / public** (starts with `eyJ...`) — this is safe to ship in the client bundle.

## 5. Set env vars locally

Create `expo/.env.local` (already git-ignored):

```env
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_LOG_ENABLED=true
```

Restart Metro after editing:
```sh
pkill -f "expo start"
cd expo && npx expo start --web --port 8082
```

## 6. Set env vars on Vercel (production)

```sh
cd ~/Documents/SubsTracker
vercel env add EXPO_PUBLIC_SUPABASE_URL production
# paste URL when prompted
vercel env add EXPO_PUBLIC_SUPABASE_ANON_KEY production
# paste key when prompted
vercel env add EXPO_PUBLIC_ENV production
# type: production
```

Or via UI: **vercel.com/pmdojo/subs-track/settings/environment-variables** → add all three, scope to Production.

Then trigger a rebuild:
```sh
git commit --allow-empty -m "chore: trigger deploy with Supabase env"
git push
```

## 7. Verify

1. Open the app (local or Vercel URL).
2. Open browser DevTools → Console. On first cold start you should see:
   - `[track] signed_in { method: 'anon' }`
   - `[track] local_migrated { count: <N> }` (only if you had local subs already)
   - `[debug] realtime_subs_change …` when any sub mutates.
3. Supabase Dashboard → **Table Editor** → `subscriptions`:
   - After the auto-migration you should see your legacy subs listed under one anonymous `user_id`.
4. In-app: pause/cancel a sub, then hard-refresh — the change persists (it's coming from Supabase, not AsyncStorage).

## 8. Optional — Wire logging (Phase 8 preview)

When you're ready, provision:

- **Sentry** at https://sentry.io → project "subtrack" → copy DSN.
- **PostHog** at https://us.posthog.com → project "subtrack" → copy API key.

Add to `.env.local` + Vercel:
```env
EXPO_PUBLIC_SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
EXPO_PUBLIC_POSTHOG_KEY=phc_...
```

Then swap the console-only implementation in `src/lib/log.ts` for real SDK calls (the file has `TODO:` comments where the swap goes).

---

## What Phase 2 delivered (already committed)

| File | Purpose |
|---|---|
| `supabase/migrations/20260805000000_init.sql` | Full DB schema from `DB_SCHEMA.md` |
| `supabase/seed.sql` | 12 category presets + 40 app-library entries |
| `expo/src/lib/supabase.ts` | Env-configured client, returns null when unconfigured |
| `expo/src/lib/query-client.ts` | Tanstack QueryClient + AsyncStorage persistor + `invalidate.*` helpers |
| `expo/src/lib/log.ts` | Analytics + error logging facade (console fallback) |
| `expo/src/stores/prefs.ts` | Zustand — currency, locale, reminder default, quiet hours, migration flag |
| `expo/src/stores/ui.ts` | Zustand — active tab, sheets, wizard step, selected month |
| `expo/src/features/auth/hooks.ts` | `useAuthBootstrap` — anonymous sign-in, session, ready flag |
| `expo/src/features/subscriptions/model.ts` | DB row ↔ app `Subscription` mappers |
| `expo/src/features/subscriptions/api.ts` | Supabase CRUD (throws on error) |
| `expo/src/features/subscriptions/hooks.ts` | `useSubs / useSub / useInsertSub / useUpdateSub / useDeleteSub / useSetSubStatus` — optimistic updates + auto-invalidate |
| `expo/src/features/subscriptions/realtime.ts` | Postgres change stream → query invalidation |
| `expo/src/features/subscriptions/migrate.ts` | One-shot AsyncStorage → Supabase migration on first cloud launch |
| `expo/src/AppProviders.tsx` | Root wrapper: QueryClientProvider + Ui + AuthBootstrap + realtime + migrate |

## What's NOT wired yet (deliberately)

The existing screens (`HomeScreen`, `SubDetailSheet`, `AddSubModal`, etc.) still call the legacy `store.ts` functions that read/write AsyncStorage. Phase 3 replaces those call sites with the new hooks. Doing that migration in this phase would have blocked shipping the backend behind a single big PR — Phase 3 will migrate one screen at a time with visual sign-off between each.

Confirm cloud data is landing correctly (step 7 above), then say **continue phase 3** and I'll start migrating screens to the new hooks.
