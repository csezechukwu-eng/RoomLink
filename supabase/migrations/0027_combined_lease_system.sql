-- =============================================================================
-- COMBINED LEASE SYSTEM MIGRATION
-- =============================================================================
-- This migration safely creates the complete lease template and prepared lease
-- system if tables do not exist. It is idempotent and can be run multiple times.
--
-- Tables created (if not exist):
--   1. lease_templates
--   2. lease_template_fields
--   3. prepared_leases
--   4. prepared_lease_fields
--
-- Columns added (if not exist):
--   - applications.stay_type
--   - applications.is_demo
--   - prepared_leases.is_demo
--   - prepared_leases.signing_token
--   - prepared_lease_fields.is_demo
--   - lease_template_fields.field_key
--   - properties.is_demo
--   - rooms.is_demo
--   - beds.is_demo
--
-- RLS policies are created safely with DROP IF EXISTS before CREATE.
-- =============================================================================

-- =============================================================================
-- PART 1: LEASE TEMPLATES TABLE
-- =============================================================================

create table if not exists public.lease_templates (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null,
  title         text not null,
  lease_category text not null
                  check (lease_category in (
                    'month_to_month_room_lease',
                    'fixed_term_lease',
                    'midterm_lease',
                    'short_term_bed_rental',
                    'crash_pad_agreement',
                    'student_housing_agreement',
                    'travel_nurse_housing_agreement',
                    'other'
                  )),
  stay_type     text not null
                  check (stay_type in (
                    'month_to_month',
                    'yearly',
                    'midterm',
                    'short_term',
                    'bed_rental',
                    'room_rental',
                    'crash_pad',
                    'student_housing',
                    'travel_nurse_housing'
                  )),
  property_id   uuid references public.properties(id) on delete set null,
  file_path     text not null,
  file_name     text not null,
  file_type     text not null default 'application/pdf',
  status        text not null default 'needs_setup'
                  check (status in ('needs_setup', 'ready', 'archived')),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_lease_templates_owner on public.lease_templates(owner_id);
create index if not exists idx_lease_templates_property on public.lease_templates(property_id);
create index if not exists idx_lease_templates_status on public.lease_templates(status);

create or replace function update_lease_templates_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists lease_templates_updated_at on public.lease_templates;
create trigger lease_templates_updated_at
  before update on public.lease_templates
  for each row execute function update_lease_templates_updated_at();

alter table public.lease_templates enable row level security;

drop policy if exists "owners_select_own_templates" on public.lease_templates;
create policy "owners_select_own_templates" on public.lease_templates
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists "owners_insert_own_templates" on public.lease_templates;
create policy "owners_insert_own_templates" on public.lease_templates
  for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "owners_update_own_templates" on public.lease_templates;
create policy "owners_update_own_templates" on public.lease_templates
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "owners_delete_own_templates" on public.lease_templates;
create policy "owners_delete_own_templates" on public.lease_templates
  for delete to authenticated using (owner_id = auth.uid());

comment on table public.lease_templates is 'Reusable lease template PDFs uploaded by landlords, tagged by category and stay type.';

-- =============================================================================
-- PART 2: LEASE TEMPLATE FIELDS TABLE
-- =============================================================================

create table if not exists public.lease_template_fields (
  id                uuid primary key default gen_random_uuid(),
  lease_template_id uuid not null references public.lease_templates(id) on delete cascade,
  owner_id          uuid not null,
  field_type        text not null
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
  label             text not null,
  required          boolean not null default true,
  assigned_to       text not null default 'tenant'
                      check (assigned_to in ('tenant', 'landlord')),
  page_number       integer,
  x                 numeric(10, 6),
  y                 numeric(10, 6),
  width             numeric(10, 6),
  height            numeric(10, 6),
  placement_note    text,
  sort_order        integer not null default 0,
  field_key         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_lease_template_fields_template
  on public.lease_template_fields(lease_template_id);
create index if not exists idx_lease_template_fields_owner
  on public.lease_template_fields(owner_id);

-- Add field_key column if table already exists without it
alter table public.lease_template_fields
  add column if not exists field_key text;

-- Add unique constraint for field_key per template (safe to run multiple times)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'lease_template_fields_template_field_key_unique'
  ) then
    alter table public.lease_template_fields
      add constraint lease_template_fields_template_field_key_unique
        unique (lease_template_id, field_key);
  end if;
end;
$$;

-- Ensure field_type constraint includes all types (drop and recreate safely)
alter table public.lease_template_fields
  drop constraint if exists lease_template_fields_field_type_check;

alter table public.lease_template_fields
  add constraint lease_template_fields_field_type_check
    check (field_type in (
      'tenant_signature',
      'tenant_initials',
      'date_signed',
      'tenant_full_name',
      'email',
      'phone',
      'text',
      'checkbox'
    ));

create or replace function update_lease_template_fields_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists lease_template_fields_updated_at on public.lease_template_fields;
create trigger lease_template_fields_updated_at
  before update on public.lease_template_fields
  for each row execute function update_lease_template_fields_updated_at();

alter table public.lease_template_fields enable row level security;

drop policy if exists "owners_select_own_template_fields" on public.lease_template_fields;
create policy "owners_select_own_template_fields" on public.lease_template_fields
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists "owners_insert_own_template_fields" on public.lease_template_fields;
create policy "owners_insert_own_template_fields" on public.lease_template_fields
  for insert to authenticated with check (
    owner_id = auth.uid()
    and exists (
      select 1 from public.lease_templates t
      where t.id = lease_template_fields.lease_template_id
        and t.owner_id = auth.uid()
    )
  );

drop policy if exists "owners_update_own_template_fields" on public.lease_template_fields;
create policy "owners_update_own_template_fields" on public.lease_template_fields
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "owners_delete_own_template_fields" on public.lease_template_fields;
create policy "owners_delete_own_template_fields" on public.lease_template_fields
  for delete to authenticated using (owner_id = auth.uid());

comment on table public.lease_template_fields is 'Reusable signing fields for lease templates.';
comment on column public.lease_template_fields.field_key is 'Unique field identifier per template (e.g., SIG-001). Used to track signatures.';

-- =============================================================================
-- PART 3: APPLICATIONS TABLE ADDITIONS
-- =============================================================================

alter table public.applications
  add column if not exists stay_type text;

-- Add or update check constraint for stay_type
do $$
begin
  -- Drop old constraint if it exists (may have different name or values)
  alter table public.applications drop constraint if exists applications_stay_type_check;
exception when others then
  null; -- Ignore if constraint doesn't exist
end;
$$;

alter table public.applications
  add constraint applications_stay_type_check
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

-- =============================================================================
-- PART 4: PREPARED LEASES TABLE
-- =============================================================================

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
  applicant_snapshot    jsonb not null default '{}'::jsonb,
  property_snapshot     jsonb,
  room_snapshot         jsonb,
  bed_snapshot          jsonb,
  rent_snapshot         jsonb,
  deposit_snapshot      jsonb,
  autofill_snapshot     jsonb not null default '{}'::jsonb,
  sent_at               timestamptz,
  viewed_at             timestamptz,
  signed_at             timestamptz,
  completed_at          timestamptz,
  cancelled_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Partial unique index: only one non-cancelled lease per application
-- NOTE: PostgreSQL does NOT support partial unique constraints inside CREATE TABLE
-- This must be created as a separate index
create unique index if not exists prepared_leases_unique_active_application
  on public.prepared_leases(application_id)
  where status <> 'cancelled';

create index if not exists idx_prepared_leases_owner on public.prepared_leases(owner_id);
create index if not exists idx_prepared_leases_application on public.prepared_leases(application_id);
create index if not exists idx_prepared_leases_template on public.prepared_leases(lease_template_id);
create index if not exists idx_prepared_leases_status on public.prepared_leases(status);
create index if not exists idx_prepared_leases_property on public.prepared_leases(property_id);
create index if not exists idx_prepared_leases_tenant on public.prepared_leases(tenant_id);

-- Add signing_token column (for secure tenant signing links)
alter table public.prepared_leases
  add column if not exists signing_token uuid default gen_random_uuid();

-- Make signing_token NOT NULL for new rows (existing null values will get a default)
update public.prepared_leases
  set signing_token = gen_random_uuid()
  where signing_token is null;

-- Now we can safely add NOT NULL constraint
do $$
begin
  alter table public.prepared_leases alter column signing_token set not null;
exception when others then
  null; -- Already NOT NULL
end;
$$;

create unique index if not exists idx_prepared_leases_signing_token
  on public.prepared_leases(signing_token);

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

-- Tenant can view their own prepared leases
drop policy if exists "tenants_select_own_prepared_leases" on public.prepared_leases;
create policy "tenants_select_own_prepared_leases" on public.prepared_leases
  for select to authenticated using (tenant_id = auth.uid());

comment on table public.prepared_leases is 'Applicant-specific leases created from templates. Created when landlord approves an application and sends a lease.';
comment on column public.prepared_leases.signing_token is 'Unguessable secret used to authorize the public tenant signing link.';

-- =============================================================================
-- PART 5: PREPARED LEASE FIELDS TABLE
-- =============================================================================

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
  value                     text,
  completed_at              timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint prepared_lease_fields_unique_prepared_key
    unique (prepared_lease_id, prepared_field_key)
);

create index if not exists idx_prepared_lease_fields_lease on public.prepared_lease_fields(prepared_lease_id);
create index if not exists idx_prepared_lease_fields_template_field on public.prepared_lease_fields(lease_template_field_id);
create index if not exists idx_prepared_lease_fields_type on public.prepared_lease_fields(field_type);
create index if not exists idx_prepared_lease_fields_signature_key on public.prepared_lease_fields(signature_instance_key);

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

comment on table public.prepared_lease_fields is 'Fields copied from lease_template_fields into a prepared lease.';

-- =============================================================================
-- PART 6: DEMO DATA SUPPORT (is_demo columns)
-- =============================================================================

-- Add is_demo to applications
alter table public.applications
  add column if not exists is_demo boolean not null default false;

create index if not exists idx_applications_is_demo
  on public.applications(is_demo)
  where is_demo = true;

comment on column public.applications.is_demo is
  'True if this application was created for demo/testing purposes';

-- Add is_demo to prepared_leases
alter table public.prepared_leases
  add column if not exists is_demo boolean not null default false;

create index if not exists idx_prepared_leases_is_demo
  on public.prepared_leases(is_demo)
  where is_demo = true;

comment on column public.prepared_leases.is_demo is
  'True if this prepared lease was created for demo/testing purposes';

-- Add is_demo to prepared_lease_fields
alter table public.prepared_lease_fields
  add column if not exists is_demo boolean not null default false;

comment on column public.prepared_lease_fields.is_demo is
  'True if this field belongs to a demo prepared lease';

-- Add is_demo to properties
alter table public.properties
  add column if not exists is_demo boolean not null default false;

create index if not exists idx_properties_is_demo
  on public.properties(is_demo)
  where is_demo = true;

comment on column public.properties.is_demo is
  'Flag to identify demo/test properties created via Demo Test Center';

-- Add is_demo to rooms
alter table public.rooms
  add column if not exists is_demo boolean not null default false;

create index if not exists idx_rooms_is_demo
  on public.rooms(is_demo)
  where is_demo = true;

comment on column public.rooms.is_demo is
  'Flag to identify demo/test rooms created via Demo Test Center';

-- Add is_demo to beds
alter table public.beds
  add column if not exists is_demo boolean not null default false;

create index if not exists idx_beds_is_demo
  on public.beds(is_demo)
  where is_demo = true;

comment on column public.beds.is_demo is
  'Flag to identify demo/test beds created via Demo Test Center';

-- =============================================================================
-- PART 7: REFRESH POSTGREST SCHEMA CACHE
-- =============================================================================

notify pgrst, 'reload schema';

-- =============================================================================
-- VERIFICATION QUERIES (run these after to confirm success)
-- =============================================================================
-- select to_regclass('public.lease_templates') as lease_templates;
-- select to_regclass('public.lease_template_fields') as lease_template_fields;
-- select to_regclass('public.prepared_leases') as prepared_leases;
-- select to_regclass('public.prepared_lease_fields') as prepared_lease_fields;
--
-- All four should return their table names, not null.
-- =============================================================================
