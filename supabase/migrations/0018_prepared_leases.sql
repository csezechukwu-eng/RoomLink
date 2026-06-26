-- Migration: Prepared Leases (applicant-specific leases created from templates)
-- This migration adds:
-- 1. stay_type column to applications (links application to lease template)
-- 2. prepared_leases table (the applicant-specific lease)
-- 3. prepared_lease_fields table (copied fields from template)

-- ===========================================================================
-- 1. Add stay_type to applications table
-- ===========================================================================

alter table public.applications
  add column if not exists stay_type text
    check (stay_type is null or stay_type in (
      'month_to_month',
      'yearly',
      'midterm',
      'short_term',
      'bed_rental',
      'room_rental',
      'crash_pad',
      'student_housing',
      'travel_nurse_housing'
    ));

create index if not exists idx_applications_stay_type on public.applications(stay_type);

comment on column public.applications.stay_type is 'The rental/stay type for this application. Links to lease_templates.stay_type for automatic lease matching.';

-- ===========================================================================
-- 2. Create prepared_leases table
-- ===========================================================================

create table if not exists public.prepared_leases (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null,
  application_id        uuid not null references public.applications(id) on delete cascade,
  lease_template_id     uuid not null references public.lease_templates(id) on delete restrict,
  property_id           uuid references public.properties(id) on delete set null,
  room_id               uuid references public.rooms(id) on delete set null,
  bed_id                uuid references public.beds(id) on delete set null,
  tenant_id             uuid,
  rental_type           text,
  status                text not null default 'sent'
                          check (status in ('sent', 'viewed', 'signed', 'completed', 'cancelled')),
  -- Snapshots capture data at time of lease creation
  applicant_snapshot    jsonb not null,
  property_snapshot     jsonb,
  room_snapshot         jsonb,
  bed_snapshot          jsonb,
  rent_snapshot         jsonb,
  deposit_snapshot      jsonb,
  autofill_snapshot     jsonb not null default '{}'::jsonb,
  -- Timestamps
  sent_at               timestamptz,
  viewed_at             timestamptz,
  signed_at             timestamptz,
  completed_at          timestamptz,
  cancelled_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Partial unique index: only one non-cancelled lease per application
-- (PostgreSQL does not support partial unique constraints in CREATE TABLE)
create unique index if not exists prepared_leases_unique_active_application
  on public.prepared_leases(application_id)
  where status <> 'cancelled';

-- Indexes
create index if not exists idx_prepared_leases_owner on public.prepared_leases(owner_id);
create index if not exists idx_prepared_leases_application on public.prepared_leases(application_id);
create index if not exists idx_prepared_leases_template on public.prepared_leases(lease_template_id);
create index if not exists idx_prepared_leases_status on public.prepared_leases(status);
create index if not exists idx_prepared_leases_property on public.prepared_leases(property_id);
create index if not exists idx_prepared_leases_tenant on public.prepared_leases(tenant_id);

-- Auto-update updated_at trigger
create or replace function update_prepared_leases_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists prepared_leases_updated_at on public.prepared_leases;
create trigger prepared_leases_updated_at
  before update on public.prepared_leases
  for each row execute function update_prepared_leases_updated_at();

-- RLS: owner-only access
alter table public.prepared_leases enable row level security;

drop policy if exists "owners_select_own_prepared_leases" on public.prepared_leases;
create policy "owners_select_own_prepared_leases" on public.prepared_leases
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists "owners_insert_own_prepared_leases" on public.prepared_leases;
create policy "owners_insert_own_prepared_leases" on public.prepared_leases
  for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "owners_update_own_prepared_leases" on public.prepared_leases;
create policy "owners_update_own_prepared_leases" on public.prepared_leases
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "owners_delete_own_prepared_leases" on public.prepared_leases;
create policy "owners_delete_own_prepared_leases" on public.prepared_leases
  for delete to authenticated using (owner_id = auth.uid());

comment on table public.prepared_leases is 'Applicant-specific leases created from templates. Created when landlord approves an application and sends a lease.';

-- ===========================================================================
-- 3. Create prepared_lease_fields table
-- ===========================================================================

create table if not exists public.prepared_lease_fields (
  id                        uuid primary key default gen_random_uuid(),
  prepared_lease_id         uuid not null references public.prepared_leases(id) on delete cascade,
  lease_template_field_id   uuid references public.lease_template_fields(id) on delete set null,
  template_field_key        text not null,
  prepared_field_key        text not null,
  signature_instance_key    text,
  field_type                text not null
                              check (field_type in (
                                'tenant_signature',
                                'tenant_initials',
                                'date_signed',
                                'tenant_full_name',
                                'email',
                                'phone',
                                'text',
                                'checkbox'
                              )),
  label                     text not null,
  required                  boolean not null default true,
  assigned_to               text not null default 'tenant'
                              check (assigned_to in ('tenant', 'landlord')),
  page_number               integer,
  x                         numeric(10, 6),
  y                         numeric(10, 6),
  width                     numeric(10, 6),
  height                    numeric(10, 6),
  placement_note            text,
  sort_order                integer default 0,
  -- Field value and completion status
  value                     text,
  completed_at              timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  -- Ensure unique keys within a prepared lease
  constraint prepared_lease_fields_unique_prepared_key
    unique (prepared_lease_id, prepared_field_key)
);

-- Indexes
create index if not exists idx_prepared_lease_fields_lease on public.prepared_lease_fields(prepared_lease_id);
create index if not exists idx_prepared_lease_fields_template_field on public.prepared_lease_fields(lease_template_field_id);
create index if not exists idx_prepared_lease_fields_type on public.prepared_lease_fields(field_type);
create index if not exists idx_prepared_lease_fields_signature_key on public.prepared_lease_fields(signature_instance_key);

-- Auto-update updated_at trigger
create or replace function update_prepared_lease_fields_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists prepared_lease_fields_updated_at on public.prepared_lease_fields;
create trigger prepared_lease_fields_updated_at
  before update on public.prepared_lease_fields
  for each row execute function update_prepared_lease_fields_updated_at();

-- RLS: access through prepared_lease ownership
alter table public.prepared_lease_fields enable row level security;

drop policy if exists "owners_select_own_prepared_lease_fields" on public.prepared_lease_fields;
create policy "owners_select_own_prepared_lease_fields" on public.prepared_lease_fields
  for select to authenticated using (
    exists (
      select 1 from public.prepared_leases pl
      where pl.id = prepared_lease_fields.prepared_lease_id
        and pl.owner_id = auth.uid()
    )
  );

drop policy if exists "owners_insert_own_prepared_lease_fields" on public.prepared_lease_fields;
create policy "owners_insert_own_prepared_lease_fields" on public.prepared_lease_fields
  for insert to authenticated with check (
    exists (
      select 1 from public.prepared_leases pl
      where pl.id = prepared_lease_fields.prepared_lease_id
        and pl.owner_id = auth.uid()
    )
  );

drop policy if exists "owners_update_own_prepared_lease_fields" on public.prepared_lease_fields;
create policy "owners_update_own_prepared_lease_fields" on public.prepared_lease_fields
  for update to authenticated using (
    exists (
      select 1 from public.prepared_leases pl
      where pl.id = prepared_lease_fields.prepared_lease_id
        and pl.owner_id = auth.uid()
    )
  );

drop policy if exists "owners_delete_own_prepared_lease_fields" on public.prepared_lease_fields;
create policy "owners_delete_own_prepared_lease_fields" on public.prepared_lease_fields
  for delete to authenticated using (
    exists (
      select 1 from public.prepared_leases pl
      where pl.id = prepared_lease_fields.prepared_lease_id
        and pl.owner_id = auth.uid()
    )
  );

comment on table public.prepared_lease_fields is 'Fields copied from lease_template_fields into a prepared lease. Each field gets a unique signature_instance_key.';

-- ===========================================================================
-- Refresh PostgREST schema cache
-- ===========================================================================
notify pgrst, 'reload schema';
