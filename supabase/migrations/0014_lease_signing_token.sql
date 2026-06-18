-- Migration: Lease signing token
-- Additive. Adds an unguessable per-document token so the public tenant signing
-- link (/sign/[id]?token=...) and the PDF proxy can authorize a signer without
-- a login. Previously the lease id ALONE granted access to view and sign a
-- lease, and to fetch any lease PDF via /api/pdf. Existing rows are backfilled
-- automatically by the column default.

alter table public.lease_documents
  add column if not exists signing_token uuid not null default gen_random_uuid();

create unique index if not exists idx_lease_documents_signing_token
  on public.lease_documents(signing_token);

comment on column public.lease_documents.signing_token is
  'Unguessable secret used to authorize the public tenant signing link and PDF access. Never expose except in the link sent to the intended signer.';
