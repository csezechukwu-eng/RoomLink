-- Migration: Lease Templates (reusable lease documents for landlords)
-- A lease template is an uploaded PDF the landlord can reuse across multiple
-- applicants. Templates are tagged by category and stay type for organization.

-- Lease category enum values (not a DB enum, checked via constraint)
-- - month_to_month_room_lease
-- - fixed_term_lease
-- - midterm_lease
-- - short_term_bed_rental
-- - crash_pad_agreement
-- - student_housing_agreement
-- - travel_nurse_housing_agreement
-- - other

-- Stay type enum values
-- - month_to_month
-- - yearly
-- - midterm
-- - short_term
-- - bed_rental
-- - room_rental
-- - crash_pad
-- - student_housing
-- - travel_nurse_housing

-- Status values
-- - needs_setup: just uploaded, signature fields not placed yet
-- - ready: signature fields placed, can be used with applicants
-- - archived: no longer active but kept for records

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

-- Indexes for common queries
create index if not exists idx_lease_templates_owner on public.lease_templates(owner_id);
create index if not exists idx_lease_templates_property on public.lease_templates(property_id);
create index if not exists idx_lease_templates_status on public.lease_templates(status);

-- Auto-update updated_at trigger
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

-- RLS: owner-only access
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
