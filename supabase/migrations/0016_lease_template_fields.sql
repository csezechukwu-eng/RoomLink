-- Migration: Lease Template Fields (reusable signing fields for lease templates)
-- Fields define what the tenant/landlord must fill out when signing a lease
-- from this template. Fields are saved once per template and reused.

-- field_type values:
-- - tenant_signature: tenant's signature
-- - tenant_initials: tenant's initials
-- - date_signed: date when signed
-- - tenant_full_name: tenant's printed full name
-- - text: generic text field

-- assigned_to values:
-- - tenant: field for the tenant to fill
-- - landlord: field for the landlord to fill

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
                        'text'
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
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists idx_lease_template_fields_template
  on public.lease_template_fields(lease_template_id);
create index if not exists idx_lease_template_fields_owner
  on public.lease_template_fields(owner_id);

-- Auto-update updated_at trigger
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

-- RLS: owner-only access, must own the parent lease template
alter table public.lease_template_fields enable row level security;

-- Select: owner can view fields for their own templates
drop policy if exists "owners_select_own_template_fields" on public.lease_template_fields;
create policy "owners_select_own_template_fields" on public.lease_template_fields
  for select to authenticated using (owner_id = auth.uid());

-- Insert: owner can add fields to their own templates
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

-- Update: owner can update fields on their own templates
drop policy if exists "owners_update_own_template_fields" on public.lease_template_fields;
create policy "owners_update_own_template_fields" on public.lease_template_fields
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Delete: owner can delete fields from their own templates
drop policy if exists "owners_delete_own_template_fields" on public.lease_template_fields;
create policy "owners_delete_own_template_fields" on public.lease_template_fields
  for delete to authenticated using (owner_id = auth.uid());

comment on table public.lease_template_fields is 'Reusable signing fields for lease templates. Defines what tenant/landlord must fill when signing.';
