-- suibingtracker: multi-user schema, isolated in its own Postgres schema.
--
-- This does NOT touch the "public" schema at all, so it's safe to run in a
-- Supabase project that already has other apps' tables sitting in public.
-- Everything for this app lives under the "tracker" schema instead.
--
-- Run this whole file once in Supabase SQL Editor (Project → SQL Editor →
-- New query). Safe to re-run: uses "if not exists" / "or replace" everywhere
-- it can.
--
-- ⚠️ ONE MANUAL STEP THIS SCRIPT CANNOT DO FOR YOU:
-- Supabase's API (PostgREST) only serves schemas you've explicitly exposed.
-- After running this file, go to:
--   Project Settings → API → API Settings → "Exposed schemas"
-- and add "tracker" to the list (comma-separated with the existing ones,
-- e.g. "public, tracker"), then Save. Without this step the app will get
-- "The schema must be one of the following: public" errors from Supabase.

-- ============================================================
-- 0. Schema + extensions
-- ============================================================
create schema if not exists tracker;

create extension if not exists pgcrypto;

-- ============================================================
-- 1. Roles + profiles
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'user_role' and n.nspname = 'tracker'
  ) then
    create type tracker.user_role as enum ('super_admin', 'admin', 'user');
  end if;
end $$;

create table if not exists tracker.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role tracker.user_role not null default 'user',
  is_active boolean not null default true,
  features jsonb not null default '{}'::jsonb,
  daily_budget numeric(12, 2),
  monthly_budget numeric(12, 2),
  monthly_income numeric(12, 2), -- user's own setting, not admin-protected
  admin_notice text, -- admin-set message shown to this user; admin-protected
  admin_notice_set_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tracker.profiles enable row level security;

-- Keep updated_at fresh.
create or replace function tracker.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on tracker.profiles;
create trigger profiles_touch_updated_at
  before update on tracker.profiles
  for each row execute procedure tracker.touch_updated_at();

-- Every new auth user automatically gets a tracker profile row (role =
-- 'user'). Named distinctly (tracker_handle_new_user /
-- tracker_on_auth_user_created) because auth.users is shared across every
-- app in this Supabase project — a generically-named trigger here could
-- collide with one another app already installed.
create or replace function tracker.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = tracker, auth
as $$
begin
  insert into tracker.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists tracker_on_auth_user_created on auth.users;
create trigger tracker_on_auth_user_created
  after insert on auth.users
  for each row execute procedure tracker.handle_new_user();

-- SECURITY DEFINER helper so RLS policies can check role without recursive
-- policy evaluation on the profiles table itself.
create or replace function tracker.is_super_admin()
returns boolean
language sql
security definer
set search_path = tracker
stable
as $$
  select exists (
    select 1 from tracker.profiles where id = auth.uid() and role = 'super_admin'
  );
$$;

-- Broader than is_super_admin(): true for the 'admin' tier too. Both tiers
-- get full capability in this app (manage users, grant features, block or
-- delete accounts) — see profiles_update below and lib/config.ts
-- isAdminRole(). The distinction between the two roles is kept only for
-- backwards compatibility; the app's UI presents both simply as "Admin".
create or replace function tracker.is_admin_or_above()
returns boolean
language sql
security definer
set search_path = tracker
stable
as $$
  select exists (
    select 1 from tracker.profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

grant execute on function tracker.is_admin_or_above() to authenticated;

-- One-time bootstrap: the first person to sign up and hit /setup can claim
-- super_admin, but only while no super_admin exists yet in THIS app's
-- profiles table. After that this always fails, so it's safe to leave the
-- RPC reachable from the client.
create or replace function tracker.claim_super_admin()
returns tracker.profiles
language plpgsql
security definer
set search_path = tracker
as $$
declare
  result tracker.profiles;
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;
  if exists (select 1 from tracker.profiles where role = 'super_admin') then
    raise exception 'A super admin has already been set up for this workspace.';
  end if;
  update tracker.profiles
    set role = 'super_admin', is_active = true
    where id = auth.uid()
    returning * into result;
  return result;
end;
$$;

grant execute on function tracker.claim_super_admin() to authenticated;

create or replace function tracker.super_admin_exists()
returns boolean
language sql
security definer
set search_path = tracker
stable
as $$
  select exists (select 1 from tracker.profiles where role = 'super_admin');
$$;

grant execute on function tracker.super_admin_exists() to anon, authenticated;

-- Defense in depth: only a super_admin may change role / is_active /
-- features / budgets on someone else's row via a direct table update.
-- Ordinary users may still update their own full_name.
create or replace function tracker.protect_profile_fields()
returns trigger
language plpgsql
-- NOT security definer: this needs current_user to reflect the actual
-- caller (postgres for the SQL editor, service_role for admin API calls,
-- authenticated for normal signed-in users) — SECURITY DEFINER would mask
-- all of them behind the function owner instead.
set search_path = tracker
as $$
begin
  if tracker.is_admin_or_above()
     or current_user in ('service_role', 'postgres', 'supabase_admin')
  then
    return new;
  end if;

  -- Regular users may set their own daily/monthly cap from scratch, or
  -- lower an existing one — a self-imposed discipline device — but not
  -- raise one that's already set. Raising a cap requires a
  -- cap_increase_request recommendation the admin approves manually.
  if old.daily_budget is not null and new.daily_budget is not null
     and new.daily_budget > old.daily_budget then
    new.daily_budget := old.daily_budget;
  end if;
  if old.monthly_budget is not null and new.monthly_budget is not null
     and new.monthly_budget > old.monthly_budget then
    new.monthly_budget := old.monthly_budget;
  end if;

  new.role := old.role;
  new.is_active := old.is_active;
  new.features := old.features;
  new.email := old.email;
  new.admin_notice := old.admin_notice;
  new.admin_notice_set_at := old.admin_notice_set_at;
  return new;
end;
$$;

drop trigger if exists profiles_protect_fields on tracker.profiles;
create trigger profiles_protect_fields
  before update on tracker.profiles
  for each row execute procedure tracker.protect_profile_fields();

drop policy if exists profiles_select_own on tracker.profiles;
create policy profiles_select_own on tracker.profiles
  for select using (auth.uid() = id or tracker.is_admin_or_above());

drop policy if exists profiles_update on tracker.profiles;
create policy profiles_update on tracker.profiles
  for update using (auth.uid() = id or tracker.is_admin_or_above());

-- No client-side insert/delete policies: rows are created by the
-- tracker_on_auth_user_created trigger, and removed by the ON DELETE
-- CASCADE from auth.users when the admin API deletes the auth user.

-- ============================================================
-- 2. Expenses
-- ============================================================
create table if not exists tracker.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- NOT NULL added by finish_migration.sql
  spent_on date not null,
  title text not null,
  category text not null,
  payment_method text not null,
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

alter table tracker.expenses enable row level security;

drop policy if exists expenses_owner_all on tracker.expenses;
create policy expenses_owner_all on tracker.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Deliberately NO admin-read policy here: nobody but the owner can read raw
-- expense rows (titles, categories, notes, amounts), including
-- super_admin. Admin oversight is limited to the aggregate numbers exposed
-- by tracker.admin_user_overview() below — no line-item access at all.

create index if not exists expenses_user_spent_on_idx on tracker.expenses (user_id, spent_on desc);

-- ============================================================
-- 3. Budgets — the "hold users firm to their spend" tables
-- ============================================================
create table if not exists tracker.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text, -- null = overall budget across all categories
  period text not null check (period in ('daily', 'monthly')),
  limit_amount numeric(12, 2) not null check (limit_amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category, period)
);

alter table tracker.budgets enable row level security;

drop trigger if exists budgets_touch_updated_at on tracker.budgets;
create trigger budgets_touch_updated_at
  before update on tracker.budgets
  for each row execute procedure tracker.touch_updated_at();

drop policy if exists budgets_owner_all on tracker.budgets;
create policy budgets_owner_all on tracker.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- No admin-read policy here either, for the same reason as expenses above.

-- ============================================================
-- 3b. Aggregate-only admin oversight — no raw expense/budget access, ever.
-- Per-user rows carry LOGIN activity only, never spend — individual spend
-- never leaves the database in per-user form, not even in aggregate. The
-- platform-wide totals (spend today/this month across everyone) are a
-- separate function below that returns a single row with no per-user
-- breakdown at all.
-- ============================================================
create or replace function tracker.admin_user_overview()
returns table (
  id uuid,
  email text,
  full_name text,
  role tracker.user_role,
  is_active boolean,
  logins_today int,
  logins_this_month int,
  last_login_at timestamptz
)
language plpgsql
security definer
set search_path = tracker
as $$
begin
  if not tracker.is_admin_or_above() then
    raise exception 'Admin access required.';
  end if;

  return query
  select
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.is_active,
    coalesce(t.logins_today, 0)::int,
    coalesce(m.logins_this_month, 0)::int,
    l.last_login_at
  from tracker.profiles p
  left join lateral (
    select count(*) as logins_today
    from tracker.login_events le
    where le.user_id = p.id and le.created_at >= date_trunc('day', now())
  ) t on true
  left join lateral (
    select count(*) as logins_this_month
    from tracker.login_events le
    where le.user_id = p.id and le.created_at >= date_trunc('month', now())
  ) m on true
  left join lateral (
    select max(le.created_at) as last_login_at
    from tracker.login_events le
    where le.user_id = p.id
  ) l on true
  order by p.created_at asc;
end;
$$;

grant execute on function tracker.admin_user_overview() to authenticated;

-- Platform-wide spend totals only — a single row, no per-user breakdown.
-- This is the only way spend numbers reach the admin at all.
-- Must DROP first: CREATE OR REPLACE can't change a function's return
-- columns, only its body.
drop function if exists tracker.admin_spend_totals();

create or replace function tracker.admin_spend_totals()
returns table (
  spend_today numeric,
  spend_this_month numeric,
  income_today numeric,
  income_this_month numeric,
  active_users int,
  total_users int
)
language plpgsql
security definer
set search_path = tracker
as $$
begin
  if not tracker.is_admin_or_above() then
    raise exception 'Admin access required.';
  end if;

  return query
  select
    coalesce((select sum(amount) from tracker.expenses where spent_on = current_date), 0),
    coalesce((select sum(amount) from tracker.expenses where spent_on >= date_trunc('month', current_date)::date), 0),
    coalesce((select sum(amount) from tracker.income_entries where received_on = current_date), 0),
    coalesce((select sum(amount) from tracker.income_entries where received_on >= date_trunc('month', current_date)::date), 0),
    (select count(*) from tracker.profiles where is_active)::int,
    (select count(*) from tracker.profiles)::int;
end;
$$;

grant execute on function tracker.admin_spend_totals() to authenticated;

-- ============================================================
-- 3c. Recommendations — user feedback to the admin, with an optional
-- 1-5 enjoyment rating. Unlike expenses/budgets, this is voluntarily
-- submitted for the admin to read, so a direct admin-read policy is
-- appropriate here (no privacy concern to route around with an RPC).
-- ============================================================
create table if not exists tracker.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  rating smallint check (rating between 1 and 5),
  type text not null default 'recommendation'
    check (type in ('recommendation', 'feature_request', 'complaint', 'cap_increase_request')),
  created_at timestamptz not null default now()
);

alter table tracker.recommendations enable row level security;

drop policy if exists recommendations_owner_all on tracker.recommendations;
create policy recommendations_owner_all on tracker.recommendations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists recommendations_admin_read on tracker.recommendations;
create policy recommendations_admin_read on tracker.recommendations
  for select using (tracker.is_admin_or_above());

drop policy if exists recommendations_admin_delete on tracker.recommendations;
create policy recommendations_admin_delete on tracker.recommendations
  for delete using (tracker.is_admin_or_above());

create index if not exists recommendations_user_idx on tracker.recommendations (user_id, created_at desc);

-- ============================================================
-- 3d. Income entries — a real, dated log of income received, exactly
-- parallel to expenses. Same privacy principle: nobody but the owner can
-- read raw entries, including admin — only the aggregate totals in
-- admin_spend_totals() below reach admin, computed from a real SUM of
-- these rows (not an estimate).
-- ============================================================
create table if not exists tracker.income_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  received_on date not null,
  source text not null,
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

alter table tracker.income_entries enable row level security;

drop policy if exists income_entries_owner_all on tracker.income_entries;
create policy income_entries_owner_all on tracker.income_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists income_entries_user_received_idx on tracker.income_entries (user_id, received_on desc);

-- ============================================================
-- 3e. Login security — event log (for the admin's login-count columns,
-- privacy-safe replacement for showing spend) and failed-attempt lockout.
-- Neither table has ANY client-facing RLS policy: they're written and read
-- exclusively by the service-role-backed /api/login route. RLS is enabled
-- with zero policies, which means default-deny for anon/authenticated —
-- only service_role (which bypasses RLS entirely) can touch them.
-- ============================================================
create table if not exists tracker.login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table tracker.login_events enable row level security;
create index if not exists login_events_user_idx on tracker.login_events (user_id, created_at desc);

create table if not exists tracker.login_attempts (
  email text primary key,
  attempt_count int not null default 0,
  last_attempt_at timestamptz not null default now(),
  locked_until timestamptz
);

alter table tracker.login_attempts enable row level security;

-- ============================================================
-- 4. Grants — a custom schema has NO default privileges, unlike "public"
-- ============================================================
grant usage on schema tracker to authenticated, anon, service_role;

grant select, insert, update, delete on all tables in schema tracker to authenticated;
grant select, insert, update, delete on all tables in schema tracker to service_role;

alter default privileges in schema tracker
  grant select, insert, update, delete on tables to authenticated, service_role;

-- ============================================================
-- Done. Next steps:
--   1. Add "tracker" to Project Settings → API → Exposed schemas (see the
--      note at the top of this file) — required, the app won't connect
--      without it.
--   2. If you have existing data in public.expenses from before this app
--      used its own schema, run supabase/migrate_from_public.sql to copy it
--      across.
--   3. Sign up the very first account at /setup — it becomes super_admin
--      automatically (via tracker.claim_super_admin()).
--   4. Run supabase/finish_migration.sql to backfill any ownerless expense
--      rows to that super admin and lock user_id to NOT NULL.
--   5. The super admin creates every other account from /admin.
-- ============================================================
