-- Migration: Extend applications table for Phase 1 Step 4
-- Adds comprehensive tenant application fields

-- First, add new status values by recreating the check constraint
alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check
  check (status in ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'waitlisted', 'withdrawn'));

-- Update existing 'pending' status to 'submitted' (they are semantically the same)
update public.applications set status = 'submitted' where status = 'pending';

-- Add new columns to applications table
alter table public.applications
  add column if not exists last_name text,
  add column if not exists desired_room_id uuid references public.rooms(id) on delete set null,
  add column if not exists length_of_stay text,
  add column if not exists commuter_status text,
  add column if not exists commuter_status_other text,
  add column if not exists employment_status text,
  add column if not exists employer_name text,
  add column if not exists monthly_income numeric(10, 2),
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists current_address text,
  add column if not exists referral_source text,
  add column if not exists preferred_payment_method text,
  add column if not exists vehicle_info text,
  add column if not exists pet_info text,
  add column if not exists smoking_status text,
  add column if not exists government_id_status text,
  add column if not exists background_check_consent boolean default false,
  add column if not exists reason_for_stay text,
  add column if not exists tenant_notes text,
  add column if not exists internal_notes text,
  add column if not exists updated_at timestamptz not null default now();

-- Rename full_name to first_name for clarity (full_name becomes first_name)
-- We'll keep full_name for backwards compatibility but add first_name
alter table public.applications
  add column if not exists first_name text;

-- Copy existing full_name to first_name if not already set
update public.applications
  set first_name = full_name
  where first_name is null and full_name is not null;

-- Add commuter_status check constraint
alter table public.applications add constraint applications_commuter_status_check
  check (commuter_status is null or commuter_status in (
    'local_resident',
    'travel_nurse',
    'airline_crew',
    'student',
    'contract_worker',
    'out_of_state_commuter',
    'weekly_commuter',
    'temporary_relocation',
    'other'
  ));

-- Add employment_status check constraint
alter table public.applications add constraint applications_employment_status_check
  check (employment_status is null or employment_status in (
    'employed_full_time',
    'employed_part_time',
    'self_employed',
    'unemployed',
    'student',
    'retired',
    'other'
  ));

-- Add government_id_status check constraint
alter table public.applications add constraint applications_government_id_status_check
  check (government_id_status is null or government_id_status in (
    'uploaded',
    'not_uploaded',
    'pending'
  ));

-- Add smoking_status check constraint
alter table public.applications add constraint applications_smoking_status_check
  check (smoking_status is null or smoking_status in (
    'non_smoker',
    'smoker',
    'former_smoker',
    'vaper'
  ));

-- Create indexes for common queries
create index if not exists idx_applications_status on public.applications(status);
create index if not exists idx_applications_commuter_status on public.applications(commuter_status);
create index if not exists idx_applications_created_at on public.applications(created_at desc);
create index if not exists idx_applications_updated_at on public.applications(updated_at desc);
create index if not exists idx_applications_desired_room_id on public.applications(desired_room_id);

-- Add trigger to update updated_at timestamp
create or replace function update_applications_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists applications_updated_at on public.applications;
create trigger applications_updated_at
  before update on public.applications
  for each row
  execute function update_applications_updated_at();

-- Add comment explaining the table
comment on table public.applications is 'Tenant applications for room/bed rentals with comprehensive applicant information';
comment on column public.applications.commuter_status is 'Type of commuter: local_resident, travel_nurse, airline_crew, student, contract_worker, out_of_state_commuter, weekly_commuter, temporary_relocation, other';
comment on column public.applications.internal_notes is 'Private notes visible only to landlord/admin';
