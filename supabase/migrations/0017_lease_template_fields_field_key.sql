-- Migration: Add field_key to lease_template_fields
-- Each field needs a unique identifier like SIG-001, INIT-001, etc.
-- This key is stable and used to track signatures across template copies.

-- Add field_key column
alter table public.lease_template_fields
  add column if not exists field_key text;

-- Add new field types: email, phone, checkbox
-- Drop the existing constraint first
alter table public.lease_template_fields
  drop constraint if exists lease_template_fields_field_type_check;

-- Re-add with expanded field types
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

-- Create unique constraint: field_key must be unique per template
alter table public.lease_template_fields
  add constraint lease_template_fields_template_field_key_unique
    unique (lease_template_id, field_key);

-- Generate field_keys for any existing fields without one
-- This uses a DO block to generate keys based on field_type
do $$
declare
  r record;
  prefix text;
  counter integer;
begin
  -- Process each template separately
  for r in (
    select distinct lease_template_id
    from public.lease_template_fields
    where field_key is null
  ) loop
    -- Generate keys for each field type
    counter := 1;
    for prefix in (select unnest(array['SIG', 'INIT', 'DATE', 'NAME', 'EMAIL', 'PHONE', 'TEXT', 'CHECK'])) loop
      update public.lease_template_fields f
      set field_key = prefix || '-' || lpad(
        row_number() over (order by created_at)::text,
        3, '0'
      )
      where f.lease_template_id = r.lease_template_id
        and f.field_key is null
        and f.field_type = case prefix
          when 'SIG' then 'tenant_signature'
          when 'INIT' then 'tenant_initials'
          when 'DATE' then 'date_signed'
          when 'NAME' then 'tenant_full_name'
          when 'EMAIL' then 'email'
          when 'PHONE' then 'phone'
          when 'TEXT' then 'text'
          when 'CHECK' then 'checkbox'
        end;
    end loop;
  end loop;
end;
$$;

-- Simpler backfill approach: generate sequential keys per template
update public.lease_template_fields f
set field_key = (
  select
    case f.field_type
      when 'tenant_signature' then 'SIG'
      when 'tenant_initials' then 'INIT'
      when 'date_signed' then 'DATE'
      when 'tenant_full_name' then 'NAME'
      when 'email' then 'EMAIL'
      when 'phone' then 'PHONE'
      when 'text' then 'TEXT'
      when 'checkbox' then 'CHECK'
    end || '-' || lpad(
      (
        select count(*) + 1
        from public.lease_template_fields f2
        where f2.lease_template_id = f.lease_template_id
          and f2.field_type = f.field_type
          and f2.created_at < f.created_at
      )::text,
      3, '0'
    )
)
where f.field_key is null;

-- Now make field_key not null for future inserts
-- (existing nulls should all be filled by now)
-- Skip this for safety - let the app handle it
-- alter table public.lease_template_fields alter column field_key set not null;

comment on column public.lease_template_fields.field_key is 'Unique field identifier per template (e.g., SIG-001, INIT-002). Used to track signatures.';
