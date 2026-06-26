-- Migration: Prepared Leases Signing Token
-- This migration adds:
-- 1. signing_token column for secure tenant signing access
-- 2. RLS policy for tenants to select their own prepared_leases

-- ===========================================================================
-- 1. Add signing_token to prepared_leases
-- ===========================================================================

alter table public.prepared_leases
  add column if not exists signing_token uuid not null default gen_random_uuid();

create unique index if not exists idx_prepared_leases_signing_token
  on public.prepared_leases(signing_token);

comment on column public.prepared_leases.signing_token is
  'Unguessable secret used to authorize the public tenant signing link. Never expose except in the link sent to the intended signer.';

-- ===========================================================================
-- 2. Add RLS policy for tenants to select their own prepared_leases
-- ===========================================================================

drop policy if exists "tenants_select_own_prepared_leases" on public.prepared_leases;
create policy "tenants_select_own_prepared_leases" on public.prepared_leases
  for select to authenticated using (tenant_id = auth.uid());

-- ===========================================================================
-- Refresh PostgREST schema cache
-- ===========================================================================
notify pgrst, 'reload schema';
