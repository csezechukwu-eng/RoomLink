-- Migration: Demo Data Support
-- Adds is_demo column to applications and prepared_leases for safe demo testing

-- ===========================================================================
-- 1. Add is_demo column to applications
-- ===========================================================================

alter table public.applications
  add column if not exists is_demo boolean not null default false;

create index if not exists idx_applications_is_demo
  on public.applications(is_demo)
  where is_demo = true;

comment on column public.applications.is_demo is
  'True if this application was created for demo/testing purposes';

-- ===========================================================================
-- 2. Add is_demo column to prepared_leases
-- ===========================================================================

alter table public.prepared_leases
  add column if not exists is_demo boolean not null default false;

create index if not exists idx_prepared_leases_is_demo
  on public.prepared_leases(is_demo)
  where is_demo = true;

comment on column public.prepared_leases.is_demo is
  'True if this prepared lease was created for demo/testing purposes';

-- ===========================================================================
-- 3. Add is_demo column to prepared_lease_fields
-- ===========================================================================

alter table public.prepared_lease_fields
  add column if not exists is_demo boolean not null default false;

comment on column public.prepared_lease_fields.is_demo is
  'True if this field belongs to a demo prepared lease';

-- ===========================================================================
-- Refresh PostgREST schema cache
-- ===========================================================================
notify pgrst, 'reload schema';
