# SubTrack — Database Schema

Backend = **Supabase Postgres**. All tables live in `public`. Row-level security is on for every table; policies scope by `auth.uid()` or public-read where noted.

Timezone: server stores UTC (`timestamptz`); dates without time use `date`. Client renders in device timezone.

---

## 1. Enums

```sql
create type public.sub_status as enum (
  'active', 'paused', 'cancelled', 'expired'
);

create type public.billing_cycle as enum (
  'weekly', 'monthly', 'quarterly', 'yearly', 'custom'
);

create type public.card_brand as enum (
  'visa', 'mastercard', 'amex', 'discover', 'rupay', 'other'
);

create type public.payment_event_kind as enum (
  'charge', 'refund', 'skip'
);

create type public.reminder_state as enum (
  'scheduled', 'fired', 'tapped', 'dismissed', 'cancelled'
);
```

---

## 2. Tables

### 2.1 `profiles`

Mirrors `auth.users`, extends it. One row per user.

```sql
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  handle        text unique,
  currency      text not null default 'INR',                -- ISO 4217
  locale        text not null default 'en-IN',
  reminder_lead_days_default int not null default 2 check (reminder_lead_days_default between 0 and 30),
  quiet_hours_start time,                                    -- e.g. '22:00'
  quiet_hours_end   time,                                    -- e.g. '08:00'
  timezone      text not null default 'UTC',                 -- IANA
  push_token    text,                                        -- Expo push token, single device for v1
  onboarded_at  timestamptz,
  deleted_at    timestamptz,                                 -- soft-delete
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "self read" on public.profiles for select using (auth.uid() = id);
create policy "self write" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "self insert" on public.profiles for insert with check (auth.uid() = id);
```

Trigger: on `auth.users` insert, insert a profile row with `id = new.id`.

### 2.2 `categories`

Predefined + per-user custom.

```sql
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade, -- null → global preset
  slug        text not null,                                          -- 'streaming', 'productivity'
  label       text not null,                                          -- 'Streaming'
  emoji       text,                                                   -- optional icon
  color       text not null default '#4C4CE5',
  created_at  timestamptz not null default now(),
  unique (user_id, slug)                                              -- user can override a preset by slug
);

alter table public.categories enable row level security;

create policy "public presets read" on public.categories for select
  using (user_id is null or auth.uid() = user_id);
create policy "own write" on public.categories for insert
  with check (auth.uid() = user_id);
create policy "own update" on public.categories for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own delete" on public.categories for delete
  using (auth.uid() = user_id);
```

Presets seeded via `supabase/seed.sql`.

### 2.3 `payment_methods`

Card metadata only. No PAN, no CVV, ever.

```sql
create table public.payment_methods (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  brand         public.card_brand not null,
  last4         char(4) not null,
  exp_month     smallint not null check (exp_month between 1 and 12),
  exp_year      smallint not null check (exp_year between 2024 and 2099),
  nickname      text,                                        -- 'Primary', 'Business'
  is_default    boolean not null default false,
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz                                  -- soft delete: keeps historical sub → card link
);

alter table public.payment_methods enable row level security;

create policy "own all" on public.payment_methods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create unique index one_default_per_user
  on public.payment_methods (user_id) where is_default and deleted_at is null;
```

### 2.4 `subscriptions`

Core table.

```sql
create table public.subscriptions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,

  -- Identity
  name              text not null,
  icon              text not null default '',
  color             text not null default '#4C4CE5',
  category_id       uuid references public.categories(id),
  plan              text,                                     -- 'Premium', 'Family'
  vendor_url        text,                                     -- deep-link for "Pay now"

  -- Money
  price             numeric(10,2) not null check (price >= 0),
  currency          text not null default 'INR',
  billing_cycle     public.billing_cycle not null default 'monthly',
  cycle_every       smallint not null default 1               -- e.g. every 3 months if 'custom'
                    check (cycle_every between 1 and 24),

  -- Schedule
  first_billing_at  date not null,                            -- start of the recurrence
  next_billing_at   date not null,                            -- computed, denormalized for query perf
  auto_renew        boolean not null default true,

  -- Payment
  payment_method_id uuid references public.payment_methods(id),

  -- Reminders
  remind_lead_days  int not null default 2 check (remind_lead_days between 0 and 30),
  reminder_enabled  boolean not null default true,

  -- Status
  status            public.sub_status not null default 'active',
  paused_at         timestamptz,
  cancelled_at      timestamptz,
  expired_at        timestamptz,

  -- Meta
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

alter table public.subscriptions enable row level security;

create policy "own all" on public.subscriptions
  for all using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

-- Fast lookups
create index sub_user_next_billing on public.subscriptions (user_id, next_billing_at)
  where deleted_at is null;
create index sub_user_status on public.subscriptions (user_id, status)
  where deleted_at is null;
```

**Triggers:**

```sql
-- Auto-update updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger touch_subscriptions
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

-- Auto-stamp lifecycle timestamps
create or replace function public.stamp_status()
returns trigger language plpgsql as $$
begin
  if new.status <> old.status then
    if new.status = 'paused'    then new.paused_at    := now();
    elsif new.status = 'cancelled' then new.cancelled_at := now();
    elsif new.status = 'expired'   then new.expired_at   := now();
    elsif new.status = 'active'    then
      new.paused_at    := null;
      new.cancelled_at := null;
      new.expired_at   := null;
    end if;
  end if;
  return new;
end $$;

create trigger stamp_subscriptions_status
  before update on public.subscriptions
  for each row execute function public.stamp_status();

-- Auto-advance next_billing_at after a charge event
create or replace function public.advance_next_billing()
returns trigger language plpgsql as $$
declare
  sub public.subscriptions%rowtype;
begin
  if new.kind = 'charge' and new.subscription_id is not null then
    select * into sub from public.subscriptions where id = new.subscription_id;
    if sub.auto_renew and sub.status = 'active' then
      update public.subscriptions
      set next_billing_at = case sub.billing_cycle
        when 'weekly'    then sub.next_billing_at + interval '1 week'  * sub.cycle_every
        when 'monthly'   then sub.next_billing_at + interval '1 month' * sub.cycle_every
        when 'quarterly' then sub.next_billing_at + interval '3 months' * sub.cycle_every
        when 'yearly'    then sub.next_billing_at + interval '1 year'  * sub.cycle_every
        else sub.next_billing_at + interval '1 month' * sub.cycle_every
      end
      where id = sub.id;
    end if;
  end if;
  return new;
end $$;

create trigger advance_after_charge
  after insert on public.payment_events
  for each row execute function public.advance_next_billing();
```

### 2.5 `payment_events`

Ledger of every charge, refund, or skip. Powers `total_spent`, previous-month deltas, and category analytics.

```sql
create table public.payment_events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  kind            public.payment_event_kind not null,
  amount          numeric(10,2) not null,
  currency        text not null default 'INR',
  occurred_at     timestamptz not null default now(),
  payment_method_id uuid references public.payment_methods(id),
  note            text,
  created_at      timestamptz not null default now()
);

alter table public.payment_events enable row level security;

create policy "own read" on public.payment_events for select using (auth.uid() = user_id);
create policy "own insert" on public.payment_events for insert with check (auth.uid() = user_id);

create index pe_user_time on public.payment_events (user_id, occurred_at desc);
create index pe_sub_time  on public.payment_events (subscription_id, occurred_at desc);
```

### 2.6 `reminders`

Notification log. One row per scheduled reminder occurrence.

```sql
create table public.reminders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  subscription_id  uuid not null references public.subscriptions(id) on delete cascade,
  fire_at          timestamptz not null,
  state            public.reminder_state not null default 'scheduled',
  local_notif_id   text,                                     -- Expo local notification identifier
  fired_at         timestamptz,
  tapped_at        timestamptz,
  dismissed_at     timestamptz,
  created_at       timestamptz not null default now()
);

alter table public.reminders enable row level security;

create policy "own all" on public.reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index rem_user_fire on public.reminders (user_id, fire_at);
create index rem_state on public.reminders (state) where state = 'scheduled';
```

### 2.7 `app_library` (public reference table)

Presets shown in Add wizard step 1. Not per-user.

```sql
create table public.app_library (
  slug          text primary key,           -- 'netflix', 'spotify'
  name          text not null,              -- 'Netflix'
  color         text not null,              -- brand hex
  icon          text,                       -- glyph or short label
  category_slug text references public.categories(slug),
  vendor_url    text,                       -- deep link
  suggested_plans jsonb,                    -- [{"label":"Basic","price":149},{"label":"Premium","price":649}]
  popularity_rank int
);

alter table public.app_library enable row level security;
create policy "public read" on public.app_library for select using (true);
```

Seeded via `seed.sql` with ~50 apps.

---

## 3. Views (denormalized reads)

### 3.1 `subscription_with_meta`

Combines the sub row with derived days-until, chip text, and joined category/plan info.

```sql
create or replace view public.subscription_with_meta as
select
  s.*,
  extract(day from (s.next_billing_at::timestamptz - now()))::int as days_until,
  case
    when s.status <> 'active' then null
    when s.next_billing_at <= current_date then 'TODAY'
    when s.next_billing_at = current_date + 1 then '1 DAY'
    when s.next_billing_at <= current_date + 7 then (s.next_billing_at - current_date) || ' DAYS'
    else null
  end as day_chip,
  c.label as category_label,
  c.slug  as category_slug,
  pm.brand as payment_brand,
  pm.last4 as payment_last4
from public.subscriptions s
left join public.categories c    on c.id = s.category_id
left join public.payment_methods pm on pm.id = s.payment_method_id
where s.deleted_at is null;
```

### 3.2 `monthly_spend`

Per-user, per-month totals from `payment_events`.

```sql
create or replace view public.monthly_spend as
select
  user_id,
  date_trunc('month', occurred_at) as month,
  currency,
  sum(case kind when 'charge' then amount when 'refund' then -amount else 0 end) as total
from public.payment_events
group by 1, 2, 3;
```

### 3.3 `active_stats` (materialized, refreshed every 5 min via pg_cron)

```sql
create materialized view public.active_stats as
select
  user_id,
  count(*) filter (where status = 'active') as active_count,
  sum(price) filter (where status = 'active') as monthly_active_spend,
  count(*) filter (where status = 'active' and next_billing_at <= current_date + 30) as upcoming_count
from public.subscriptions
where deleted_at is null
group by user_id;

create unique index on public.active_stats (user_id);
```

Refresh via pg_cron every 5 min. Reads are microseconds.

---

## 4. Edge functions

### 4.1 `send-reminder` (v1.1)
Triggered by pg_cron every 5 min. Finds `reminders` where `fire_at <= now() and state='scheduled'`, sends Expo push, marks state=`fired`.

### 4.2 `soft-delete-cron` (v1)
Daily. Hard-deletes rows where `deleted_at < now() - interval '30 days'`.

### 4.3 `export-data` (v1.1)
Called from Profile → Export. Streams a CSV of the user's subs + payment_events.

---

## 5. RLS policy summary

| Table | Read | Write |
|---|---|---|
| profiles | self | self |
| categories | self OR global preset | self only |
| payment_methods | self | self |
| subscriptions | self (not deleted) | self |
| payment_events | self | self insert only (edge fn for updates) |
| reminders | self | self |
| app_library | public | none (seeded by admin) |

All tables use `user_id = auth.uid()` predicate. `app_library` and preset `categories` are public-read.

---

## 6. Storage buckets

| Bucket | Contents | ACL |
|---|---|---|
| `avatars` | Profile pictures | Public read, self-write path `{user_id}/*` |
| `exports` | Generated CSV/PDF exports | Private, signed URLs, TTL 24 h |

---

## 7. Sample queries the app uses

### Home — upcoming payments

```sql
select * from subscription_with_meta
where user_id = auth.uid()
  and status = 'active'
  and next_billing_at <= current_date + 30
order by next_billing_at asc
limit 20;
```

### Home — hero total for selected month

```sql
select coalesce(sum(amount), 0) as total
from payment_events
where user_id = auth.uid()
  and date_trunc('month', occurred_at) = date_trunc('month', $1)  -- $1 = selected month
  and kind = 'charge';
```

### Detail — total spent lifetime

```sql
select coalesce(sum(amount), 0) as total,
       min(occurred_at) as first_charge
from payment_events
where subscription_id = $1
  and kind = 'charge';
```

### Insights — by category

```sql
select c.label, sum(pe.amount) as total
from payment_events pe
join subscriptions s on s.id = pe.subscription_id
left join categories c on c.id = s.category_id
where pe.user_id = auth.uid()
  and pe.kind = 'charge'
  and date_trunc('month', pe.occurred_at) = date_trunc('month', $1)
group by c.label
order by total desc;
```

### Calendar — dots for a month

```sql
select next_billing_at, count(*) as event_count,
       array_agg(distinct c.color) as dot_colors
from subscription_with_meta s
left join categories c on c.slug = s.category_slug
where s.user_id = auth.uid()
  and s.status = 'active'
  and s.next_billing_at >= date_trunc('month', $1)
  and s.next_billing_at <  date_trunc('month', $1) + interval '1 month'
group by next_billing_at;
```

---

## 8. Migration file (initial)

Path: `supabase/migrations/20260805000000_init.sql`

Contents: everything above concatenated in order (enums → tables → indexes → triggers → views → materialized views → RLS policies → seed presets).

Local dev flow:
```
supabase start
supabase db reset          # applies migrations + seed
supabase gen types typescript --local > expo/src/lib/db.types.ts
```

`db.types.ts` regen is a build step so client code has typed access.

---

## 9. Data-flow examples

### Adding a subscription

1. Client calls `useAddSubscription({...})`.
2. Optimistic cache: prepend to Tanstack Query `['subs']`.
3. Supabase insert into `subscriptions` (RLS validated).
4. On success: insert first `payment_events` row (charge, at `first_billing_at`) — if `first_billing_at` in past, we skip; if in future, defer to reminder + trigger.
5. Schedule local reminder via `expo-notifications`.
6. Invalidate `['metrics', currentMonth]` — hero + metrics recompute.
7. Toast success.
8. On error: rollback optimistic cache, toast fail.

### Cancelling a subscription

1. `useCancelSubscription(id)` → optimistic `status='cancelled'`.
2. Update Supabase `subscriptions.status='cancelled'` (trigger stamps `cancelled_at`).
3. Cancel pending reminders for that sub in `expo-notifications` and mark `reminders.state='cancelled'`.
4. Invalidate metrics + upcoming queries.
5. Sheet re-derives from cache → status pill flips, action label becomes "Reactivate".
6. Toast "Netflix cancelled."

### Renewal fires (background)

1. On device: local reminder shows at `fire_at`.
2. User taps → deep link opens `/sub/{id}`.
3. If they tap "Pay now" → deep link to `vendor_url`.
4. When actual charge happens (assumed on `billing_at`), no automated capture in v1. We rely on the user marking paid (v1.1) or trust the schedule (v1: we advance `next_billing_at` optimistically on the calendar day).

---

## 10. Approval checklist

- [ ] Confirm every table's RLS strategy.
- [ ] Confirm keeping `payment_events` as source of truth for money math.
- [ ] Confirm 30-day soft delete window on `subscriptions` and `payment_methods`.
- [ ] Confirm materialized view refresh cadence (5 min).
- [ ] Confirm `app_library` is DB-backed and not just a JSON file in the client bundle.
- [ ] Confirm the enum values (`sub_status`, `billing_cycle`, etc.).
- [ ] Confirm currency = per-subscription (not per-user only) — enables multi-currency in v1.1.
