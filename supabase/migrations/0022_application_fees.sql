-- Migration: Application Fee Settings (Phase 1)
-- Allows landlords to set application fees and manually track fee payment status.
-- Does NOT include payment processing - landlords mark fees paid/waived manually.

-- ---------------------------------------------------------------------------
-- Add application fee settings to properties table
-- ---------------------------------------------------------------------------

alter table public.properties
  add column if not exists application_fee_required boolean not null default false,
  add column if not exists application_fee_amount numeric(10, 2) check (application_fee_amount is null or application_fee_amount >= 0),
  add column if not exists application_fee_instructions text;

comment on column public.properties.application_fee_required is 'Whether an application fee is required for this property';
comment on column public.properties.application_fee_amount is 'Amount of the application fee in dollars';
comment on column public.properties.application_fee_instructions is 'Instructions for applicants on how to pay the application fee';

-- ---------------------------------------------------------------------------
-- Add application fee snapshot fields to applications table
-- These capture the fee settings at the time of application submission.
-- ---------------------------------------------------------------------------

alter table public.applications
  add column if not exists application_fee_required boolean not null default false,
  add column if not exists application_fee_amount numeric(10, 2) check (application_fee_amount is null or application_fee_amount >= 0),
  add column if not exists application_fee_status text not null default 'not_required'
    check (application_fee_status in ('not_required', 'unpaid', 'paid_manually', 'waived')),
  add column if not exists application_fee_paid_at timestamptz,
  add column if not exists application_fee_waived_at timestamptz,
  add column if not exists application_fee_notes text;

comment on column public.applications.application_fee_required is 'Snapshot of whether fee was required at time of application';
comment on column public.applications.application_fee_amount is 'Snapshot of fee amount at time of application';
comment on column public.applications.application_fee_status is 'Current fee payment status: not_required, unpaid, paid_manually, waived';
comment on column public.applications.application_fee_paid_at is 'When the fee was marked as paid';
comment on column public.applications.application_fee_waived_at is 'When the fee was waived';
comment on column public.applications.application_fee_notes is 'Landlord notes about fee payment';

-- ---------------------------------------------------------------------------
-- Index for filtering applications by fee status
-- ---------------------------------------------------------------------------

create index if not exists idx_applications_fee_status on public.applications(application_fee_status);
