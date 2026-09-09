-- Run this AFTER you've signed up your super admin account at /setup (and,
-- if relevant, after supabase/migrate_from_public.sql). It assigns any
-- ownerless expense rows to the super admin, then locks the column down so
-- every future row must have an owner.
--
-- Safe to run more than once.

do $$
declare
  admin_id uuid;
  orphan_count int;
begin
  select id into admin_id from tracker.profiles where role = 'super_admin' limit 1;

  if admin_id is null then
    raise exception 'No super_admin found yet — sign up at /setup first, then re-run this script.';
  end if;

  select count(*) into orphan_count from tracker.expenses where user_id is null;

  if orphan_count > 0 then
    update tracker.expenses set user_id = admin_id where user_id is null;
    raise notice 'Assigned % pre-existing expense row(s) to super admin %', orphan_count, admin_id;
  end if;
end $$;

alter table tracker.expenses alter column user_id set not null;
