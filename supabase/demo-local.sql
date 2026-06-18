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

-- Grant permissions to all roles (required even with RLS disabled)
grant all privileges on all tables in schema public to anon;
grant all privileges on all tables in schema public to authenticated;
grant all privileges on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon;
grant usage, select on all sequences in schema public to authenticated;
grant usage, select on all sequences in schema public to service_role;

-- Make sure the demo owner owns the seeded property data (idempotent).
update public.properties
  set owner_id = 'd0d7c1e3-5b4a-4b9f-8c3d-1e2f3a4b5c6d';

select 'RLS disabled and permissions granted for local demo.' as note;
