-- SubTrack — initial schema
-- Sourced from docs/DB_SCHEMA.md. Idempotent-safe (uses IF NOT EXISTS where possible).
-- Run in Supabase SQL editor or via `supabase db push`.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Extensions
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Enums
-- ═══════════════════════════════════════════════════════════════════════════

do $$ begin
  create type public.sub_status as enum ('active','paused','cancelled','expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.billing_cycle as enum ('weekly','monthly','quarterly','yearly','custom');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.card_brand as enum ('visa','mastercard','amex','discover','rupay','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_event_kind as enum ('charge','refund','skip');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.reminder_state as enum ('scheduled','fired','tapped','dismissed','cancelled');
exception when duplicate_object then null; end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Tables
-- ═══════════════════════════════════════════════════════════════════════════

-- 3.1 profiles ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  handle        text unique,
  currency      text not null default 'INR',
  locale        text not null default 'en-IN',
  reminder_lead_days_default int not null default 2 check (reminder_lead_days_default between 0 and 30),
  quiet_hours_start time,
  quiet_hours_end   time,
  timezone      text not null default 'UTC',
  push_token    text,
  onboarded_at  timestamptz,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "self read"   on public.profiles;
drop policy if exists "self write"  on public.profiles;
drop policy if exists "self insert" on public.profiles;

create policy "self read"   on public.profiles for select using (auth.uid() = id);
create policy "self write"  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "self insert" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create a profile row on new auth.users insert
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3.2 categories ────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade, -- null → global preset
  slug        text not null,
  label       text not null,
  emoji       text,
  color       text not null default '#4C4CE5',
  created_at  timestamptz not null default now(),
  unique (user_id, slug)
);

alter table public.categories enable row level security;

drop policy if exists "public presets read" on public.categories;
drop policy if exists "own write"           on public.categories;
drop policy if exists "own update"          on public.categories;
drop policy if exists "own delete"          on public.categories;

create policy "public presets read" on public.categories for select
  using (user_id is null or auth.uid() = user_id);
create policy "own write"  on public.categories for insert with check (auth.uid() = user_id);
create policy "own update" on public.categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own delete" on public.categories for delete using (auth.uid() = user_id);

-- 3.3 payment_methods ───────────────────────────────────────────────────────
create table if not exists public.payment_methods (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  brand         public.card_brand not null,
  last4         char(4) not null,
  exp_month     smallint not null check (exp_month between 1 and 12),
  exp_year      smallint not null check (exp_year between 2024 and 2099),
  nickname      text,
  is_default    boolean not null default false,
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

alter table public.payment_methods enable row level security;

drop policy if exists "own all" on public.payment_methods;
create policy "own all" on public.payment_methods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create unique index if not exists one_default_per_user
  on public.payment_methods (user_id) where is_default and deleted_at is null;

-- 3.4 subscriptions ─────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  name              text not null,
  icon              text not null default '',
  color             text not null default '#4C4CE5',
  category_id       uuid references public.categories(id),
  plan              text,
  vendor_url        text,
  price             numeric(10,2) not null check (price >= 0),
  currency          text not null default 'INR',
  billing_cycle     public.billing_cycle not null default 'monthly',
  cycle_every       smallint not null default 1 check (cycle_every between 1 and 24),
  first_billing_at  date not null,
  next_billing_at   date not null,
  auto_renew        boolean not null default true,
  payment_method_id uuid references public.payment_methods(id),
  remind_lead_days  int not null default 2 check (remind_lead_days between 0 and 30),
  reminder_enabled  boolean not null default true,
  status            public.sub_status not null default 'active',
  paused_at         timestamptz,
  cancelled_at      timestamptz,
  expired_at        timestamptz,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

alter table public.subscriptions enable row level security;

drop policy if exists "own all" on public.subscriptions;
create policy "own all" on public.subscriptions
  for all using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

create index if not exists sub_user_next_billing
  on public.subscriptions (user_id, next_billing_at) where deleted_at is null;
create index if not exists sub_user_status
  on public.subscriptions (user_id, status) where deleted_at is null;

-- Triggers: touch updated_at + stamp lifecycle timestamps
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists touch_subscriptions on public.subscriptions;
create trigger touch_subscriptions
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

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

drop trigger if exists stamp_subscriptions_status on public.subscriptions;
create trigger stamp_subscriptions_status
  before update on public.subscriptions
  for each row execute function public.stamp_status();

-- 3.5 payment_events ────────────────────────────────────────────────────────
create table if not exists public.payment_events (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  subscription_id   uuid references public.subscriptions(id) on delete set null,
  kind              public.payment_event_kind not null,
  amount            numeric(10,2) not null,
  currency          text not null default 'INR',
  occurred_at       timestamptz not null default now(),
  payment_method_id uuid references public.payment_methods(id),
  note              text,
  created_at        timestamptz not null default now()
);

alter table public.payment_events enable row level security;

drop policy if exists "own read"   on public.payment_events;
drop policy if exists "own insert" on public.payment_events;
create policy "own read"   on public.payment_events for select using (auth.uid() = user_id);
create policy "own insert" on public.payment_events for insert with check (auth.uid() = user_id);

create index if not exists pe_user_time on public.payment_events (user_id, occurred_at desc);
create index if not exists pe_sub_time  on public.payment_events (subscription_id, occurred_at desc);

-- Auto-advance next_billing_at after a charge event
create or replace function public.advance_next_billing()
returns trigger language plpgsql as $$
declare sub public.subscriptions%rowtype;
begin
  if new.kind = 'charge' and new.subscription_id is not null then
    select * into sub from public.subscriptions where id = new.subscription_id;
    if sub.auto_renew and sub.status = 'active' then
      update public.subscriptions
      set next_billing_at = case sub.billing_cycle
        when 'weekly'    then sub.next_billing_at + (interval '1 week'   * sub.cycle_every)
        when 'monthly'   then sub.next_billing_at + (interval '1 month'  * sub.cycle_every)
        when 'quarterly' then sub.next_billing_at + (interval '3 months' * sub.cycle_every)
        when 'yearly'    then sub.next_billing_at + (interval '1 year'   * sub.cycle_every)
        else sub.next_billing_at + (interval '1 month' * sub.cycle_every)
      end
      where id = sub.id;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists advance_after_charge on public.payment_events;
create trigger advance_after_charge
  after insert on public.payment_events
  for each row execute function public.advance_next_billing();

-- 3.6 reminders ─────────────────────────────────────────────────────────────
create table if not exists public.reminders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  subscription_id  uuid not null references public.subscriptions(id) on delete cascade,
  fire_at          timestamptz not null,
  state            public.reminder_state not null default 'scheduled',
  local_notif_id   text,
  fired_at         timestamptz,
  tapped_at        timestamptz,
  dismissed_at     timestamptz,
  created_at       timestamptz not null default now()
);

alter table public.reminders enable row level security;

drop policy if exists "own all" on public.reminders;
create policy "own all" on public.reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists rem_user_fire on public.reminders (user_id, fire_at);
create index if not exists rem_state on public.reminders (state) where state = 'scheduled';

-- 3.7 app_library (public read) ─────────────────────────────────────────────
create table if not exists public.app_library (
  slug            text primary key,
  name            text not null,
  color           text not null,
  icon            text,
  category_slug   text,
  vendor_url      text,
  suggested_plans jsonb,
  popularity_rank int
);

alter table public.app_library enable row level security;

drop policy if exists "public read" on public.app_library;
create policy "public read" on public.app_library for select using (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Views
-- ═══════════════════════════════════════════════════════════════════════════

create or replace view public.subscription_with_meta as
select
  s.*,
  greatest(0, (s.next_billing_at - current_date))::int as days_until,
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

create or replace view public.monthly_spend as
select
  user_id,
  date_trunc('month', occurred_at) as month,
  currency,
  sum(case kind when 'charge' then amount when 'refund' then -amount else 0 end) as total
from public.payment_events
group by 1, 2, 3;

-- Materialized view for hot-path dashboard reads
drop materialized view if exists public.active_stats;
create materialized view public.active_stats as
select
  user_id,
  count(*) filter (where status = 'active') as active_count,
  coalesce(sum(price) filter (where status = 'active'), 0) as monthly_active_spend,
  count(*) filter (where status = 'active' and next_billing_at <= current_date + 30) as upcoming_count
from public.subscriptions
where deleted_at is null
group by user_id;

create unique index if not exists active_stats_user on public.active_stats (user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. Realtime — publish subscriptions changes so clients can subscribe
-- ═══════════════════════════════════════════════════════════════════════════

do $$ begin
  execute 'alter publication supabase_realtime add table public.subscriptions';
exception when duplicate_object then null;
         when others then null;
end $$;
