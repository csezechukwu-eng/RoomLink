-- Migration: Unify lease signing onto lease_documents (in-app signing)
-- Adds native e-signature fields + signing lifecycle statuses to the canonical
-- lease_documents table. The older `leases` table is now deprecated (left in
-- place to preserve any data, but no longer written/read by the app).

alter table public.lease_documents
  add column if not exists landlord_signature_data text,
  add column if not exists landlord_signed_at timestamptz,
  add column if not exists tenant_signature_data text,
  add column if not exists tenant_signed_at timestamptz,
  add column if not exists sent_at timestamptz,
  add column if not exists completed_at timestamptz;

-- Expand the status lifecycle: draft -> preparing -> out_for_signature -> completed
-- (cancelled from any non-completed state).
alter table public.lease_documents drop constraint if exists lease_documents_status_check;
alter table public.lease_documents add constraint lease_documents_status_check
  check (status in ('draft', 'preparing', 'out_for_signature', 'completed', 'cancelled'));

comment on column public.lease_documents.landlord_signature_data is 'Base64 PNG of the landlord signature on this lease.';
comment on column public.lease_documents.tenant_signature_data is 'Base64 PNG of the tenant signature on this lease.';
comment on table public.leases is 'DEPRECATED: superseded by lease_documents. Retained for historical data only.';
