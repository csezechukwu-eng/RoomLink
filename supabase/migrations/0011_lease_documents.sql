-- Migration: Lease Documents (landlord lease-prep workflow, Phase 1)
-- Additive. A lease document is an uploaded PDF the landlord prepares for an
-- approved applicant, with point-in-time snapshots of the terms so later edits
-- to rent/bed/etc. don't silently change a prepared lease.

create table if not exists public.lease_documents (
  id                      uuid primary key default gen_random_uuid(),
  owner_id                uuid not null,
  property_id             uuid not null references public.properties(id) on delete cascade,
  room_id                 uuid references public.rooms(id) on delete set null,
  bed_id                  uuid references public.beds(id) on delete set null,
  tenant_id               uuid references public.users(id) on delete set null,
  application_id          uuid references public.applications(id) on delete set null,

  title                   text not null,
  status                  text not null default 'draft'
                            check (status in ('draft', 'preparing', 'cancelled')),
  original_file_path      text,

  lease_start_date        date,
  lease_end_date          date,
  lease_term_type         text
                            check (lease_term_type is null or lease_term_type in
                              ('month_to_month', 'fixed_term', 'short_term_bed')),

  monthly_rent_snapshot   numeric(10, 2),
  deposit_amount_snapshot numeric(10, 2),
  property_snapshot       jsonb,
  room_snapshot           jsonb,
  bed_snapshot            jsonb,
  tenant_snapshot         jsonb,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists idx_lease_documents_owner       on public.lease_documents(owner_id);
create index if not exists idx_lease_documents_property    on public.lease_documents(property_id);
create index if not exists idx_lease_documents_application on public.lease_documents(application_id);

create or replace function update_lease_documents_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists lease_documents_updated_at on public.lease_documents;
create trigger lease_documents_updated_at
  before update on public.lease_documents
  for each row execute function update_lease_documents_updated_at();

-- RLS: owner-only. Server code additionally scopes by owner_id and verifies
-- property ownership before any write (defense in depth).
alter table public.lease_documents enable row level security;

drop policy if exists "owners_select_own_lease_docs" on public.lease_documents;
create policy "owners_select_own_lease_docs" on public.lease_documents
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists "owners_insert_own_lease_docs" on public.lease_documents;
create policy "owners_insert_own_lease_docs" on public.lease_documents
  for insert to authenticated with check (
    owner_id = auth.uid()
    and exists (
      select 1 from public.properties p
      where p.id = lease_documents.property_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "owners_update_own_lease_docs" on public.lease_documents;
create policy "owners_update_own_lease_docs" on public.lease_documents
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "owners_delete_own_lease_docs" on public.lease_documents;
create policy "owners_delete_own_lease_docs" on public.lease_documents
  for delete to authenticated using (owner_id = auth.uid());

comment on table public.lease_documents is 'Landlord-uploaded lease PDFs being prepared for approved applicants, with term snapshots.';

-- ===========================================================================
-- PRIVATE storage bucket for lease PDFs
-- ===========================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lease-documents',
  'lease-documents',
  false,            -- PRIVATE: never publicly readable
  20971520,         -- 20MB
  array['application/pdf']
)
on conflict (id) do nothing;

-- Files are stored under {owner_id}/... ; restrict every operation to the
-- owner's folder. No public read policy is created.
drop policy if exists "lease_docs_insert_own_folder" on storage.objects;
create policy "lease_docs_insert_own_folder" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'lease-documents' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "lease_docs_select_own_folder" on storage.objects;
create policy "lease_docs_select_own_folder" on storage.objects
  for select to authenticated using (
    bucket_id = 'lease-documents' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "lease_docs_update_own_folder" on storage.objects;
create policy "lease_docs_update_own_folder" on storage.objects
  for update to authenticated using (
    bucket_id = 'lease-documents' and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'lease-documents' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "lease_docs_delete_own_folder" on storage.objects;
create policy "lease_docs_delete_own_folder" on storage.objects
  for delete to authenticated using (
    bucket_id = 'lease-documents' and (storage.foldername(name))[1] = auth.uid()::text
  );
