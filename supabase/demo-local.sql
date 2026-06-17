-- LOCAL DEMO ONLY — never run this on a real/production database.
--
-- In DEMO_MODE the app has no real Supabase auth session, so the anon-key
-- client used for landlord reads is blocked by row-level security. This script
-- disables RLS on the local public tables so the seeded demo data is visible
-- when clicking through the app locally. It also (re)confirms the demo owner.
--
-- Run after `supabase start`:
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/demo-local.sql

do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I disable row level security', t.tablename);
  end loop;
end $$;

-- Make sure the demo owner owns the seeded property data (idempotent).
update public.properties
  set owner_id = 'd0d7c1e3-5b4a-4b9f-8c3d-1e2f3a4b5c6d';

select 'RLS disabled for local demo. Sign in is bypassed via DEMO_MODE.' as note;
