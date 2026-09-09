-- Run this ONCE, after supabase/schema.sql, if this Supabase project already
-- had a "public.expenses" table from before suibingtracker moved to its own
-- "tracker" schema. It copies those rows across (without an owner yet —
-- finish_migration.sql assigns them to your super admin next).
--
-- Safe to run more than once: rows are matched by id, so re-running just
-- re-copies anything still missing rather than duplicating.
--
-- This does NOT delete or modify public.expenses — once you've confirmed
-- the copy looks right in tracker.expenses, drop the old table yourself
-- with: drop table public.expenses;  (only if no other app uses it).

do $$
begin
  if to_regclass('public.expenses') is null then
    raise notice 'No public.expenses table found — nothing to migrate.';
    return;
  end if;

  insert into tracker.expenses (id, spent_on, title, category, payment_method, amount, note, created_at)
  select id, spent_on, title, category, payment_method, amount, note, created_at
  from public.expenses
  on conflict (id) do nothing;

  raise notice 'Copied % row(s) from public.expenses into tracker.expenses.',
    (select count(*) from tracker.expenses);
end $$;
