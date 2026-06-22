-- Migration: Lease Reference Tracking
-- This migration adds unique reference numbers for leases and signature fields
-- to enable comprehensive audit trails and lookup capabilities.

-- ===========================================================================
-- 1. Add lease_reference_number to prepared_leases
-- ===========================================================================

-- Add the column as nullable first (for existing rows)
alter table public.prepared_leases
  add column if not exists lease_reference_number text;

-- Create a function to generate lease reference numbers
create or replace function generate_lease_reference_number()
returns text as $$
declare
  v_year text;
  v_sequence bigint;
  v_ref text;
begin
  v_year := to_char(now(), 'YYYY');

  -- Get the next sequence number for this year
  -- Count existing leases with reference numbers from this year
  select coalesce(max(
    nullif(regexp_replace(lease_reference_number, '^RL-LEASE-' || v_year || '-', ''), lease_reference_number)::integer
  ), 0) + 1
  into v_sequence
  from public.prepared_leases
  where lease_reference_number like 'RL-LEASE-' || v_year || '-%';

  v_ref := 'RL-LEASE-' || v_year || '-' || lpad(v_sequence::text, 6, '0');
  return v_ref;
end;
$$ language plpgsql;

-- Backfill existing rows with lease reference numbers
do $$
declare
  v_row record;
  v_counter integer := 0;
  v_year text;
begin
  for v_row in
    select id, created_at
    from public.prepared_leases
    where lease_reference_number is null
    order by created_at asc
  loop
    v_counter := v_counter + 1;
    v_year := to_char(v_row.created_at, 'YYYY');

    update public.prepared_leases
    set lease_reference_number = 'RL-LEASE-' || v_year || '-' || lpad(v_counter::text, 6, '0')
    where id = v_row.id;
  end loop;
end;
$$;

-- Now make the column not null and unique
alter table public.prepared_leases
  alter column lease_reference_number set not null;

alter table public.prepared_leases
  add constraint prepared_leases_lease_reference_number_unique
    unique (lease_reference_number);

-- Create index for faster lookups
create index if not exists idx_prepared_leases_reference_number
  on public.prepared_leases(lease_reference_number);

comment on column public.prepared_leases.lease_reference_number is
  'Unique reference number for the lease in format: RL-LEASE-YYYY-NNNNNN';

-- ===========================================================================
-- 2. Add signature tracking columns to prepared_lease_fields
-- ===========================================================================

-- Add signature_reference_number column
alter table public.prepared_lease_fields
  add column if not exists signature_reference_number text;

-- Add signing metadata columns
alter table public.prepared_lease_fields
  add column if not exists signed_by_user_id uuid;

alter table public.prepared_lease_fields
  add column if not exists signed_by_name text;

alter table public.prepared_lease_fields
  add column if not exists signed_by_email text;

alter table public.prepared_lease_fields
  add column if not exists signed_at timestamptz;

-- Create a function to generate signature reference numbers based on field type
create or replace function get_signature_field_type_prefix(field_type text)
returns text as $$
begin
  case field_type
    when 'tenant_signature' then return 'SIGN';
    when 'landlord_signature' then return 'SIGN';
    when 'tenant_initials' then return 'INIT';
    when 'landlord_initials' then return 'INIT';
    when 'date_signed' then return 'DATE';
    when 'tenant_full_name' then return 'NAME';
    when 'landlord_full_name' then return 'NAME';
    else return null;
  end case;
end;
$$ language plpgsql immutable;

-- Backfill existing signature fields with reference numbers
do $$
declare
  v_lease record;
  v_field record;
  v_counter integer;
  v_year text;
  v_lease_seq text;
  v_prefix text;
begin
  -- Process each prepared lease
  for v_lease in
    select id, lease_reference_number
    from public.prepared_leases
    order by created_at asc
  loop
    -- Extract the year and sequence from the lease reference number
    -- Format: RL-LEASE-YYYY-NNNNNN
    v_year := substring(v_lease.lease_reference_number from 10 for 4);
    v_lease_seq := substring(v_lease.lease_reference_number from 15 for 6);

    v_counter := 0;

    -- Update each signature-related field in this lease
    for v_field in
      select id, field_type
      from public.prepared_lease_fields
      where prepared_lease_id = v_lease.id
        and signature_reference_number is null
        and field_type in ('tenant_signature', 'landlord_signature', 'tenant_initials',
                          'landlord_initials', 'date_signed', 'tenant_full_name', 'landlord_full_name')
      order by sort_order asc, created_at asc
    loop
      v_counter := v_counter + 1;
      v_prefix := get_signature_field_type_prefix(v_field.field_type);

      update public.prepared_lease_fields
      set signature_reference_number = 'RL-' || v_prefix || '-' || v_year || '-' || v_lease_seq || '-' || lpad(v_counter::text, 3, '0')
      where id = v_field.id;
    end loop;
  end loop;
end;
$$;

-- Add unique constraint on signature_reference_number (allowing nulls for non-signature fields)
alter table public.prepared_lease_fields
  add constraint prepared_lease_fields_signature_reference_number_unique
    unique (signature_reference_number);

-- Create indexes for faster lookups
create index if not exists idx_prepared_lease_fields_signature_ref
  on public.prepared_lease_fields(signature_reference_number)
  where signature_reference_number is not null;

create index if not exists idx_prepared_lease_fields_signed_at
  on public.prepared_lease_fields(signed_at)
  where signed_at is not null;

-- Comments
comment on column public.prepared_lease_fields.signature_reference_number is
  'Unique reference number for signature fields in format: RL-{TYPE}-YYYY-NNNNNN-NNN where TYPE is SIGN/INIT/DATE/NAME';

comment on column public.prepared_lease_fields.signed_by_user_id is
  'UUID of the user who signed this field (if authenticated)';

comment on column public.prepared_lease_fields.signed_by_name is
  'Name of the person who signed this field';

comment on column public.prepared_lease_fields.signed_by_email is
  'Email of the person who signed this field';

comment on column public.prepared_lease_fields.signed_at is
  'Timestamp when this field was signed';

-- ===========================================================================
-- 3. Add RLS policies for tenants to update their own signature fields
-- ===========================================================================

-- Allow tenants to select their own prepared lease fields (via tenant_id on prepared_leases)
drop policy if exists "tenants_select_own_prepared_lease_fields" on public.prepared_lease_fields;
create policy "tenants_select_own_prepared_lease_fields" on public.prepared_lease_fields
  for select to authenticated using (
    exists (
      select 1 from public.prepared_leases pl
      where pl.id = prepared_lease_fields.prepared_lease_id
        and pl.tenant_id = auth.uid()
    )
  );

-- Allow tenants to update their own signature fields (for signing)
drop policy if exists "tenants_update_own_prepared_lease_fields" on public.prepared_lease_fields;
create policy "tenants_update_own_prepared_lease_fields" on public.prepared_lease_fields
  for update to authenticated using (
    exists (
      select 1 from public.prepared_leases pl
      where pl.id = prepared_lease_fields.prepared_lease_id
        and pl.tenant_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.prepared_leases pl
      where pl.id = prepared_lease_fields.prepared_lease_id
        and pl.tenant_id = auth.uid()
    )
  );

-- ===========================================================================
-- Refresh PostgREST schema cache
-- ===========================================================================
notify pgrst, 'reload schema';
