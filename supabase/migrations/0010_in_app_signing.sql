-- Migration: In-App Signing — Phase 4b
-- Adds signature storage for landlords (saved in user settings) and
-- signature fields on leases for both landlord and tenant signatures.
-- Replaces DocuSign with native in-app e-signing.

-- ---------------------------------------------------------------------------
-- Add signature storage to users table
-- Stores base64-encoded PNG signature data for landlords
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists signature_data text,
  add column if not exists signature_updated_at timestamptz;

-- ---------------------------------------------------------------------------
-- Add signature fields to leases table
-- ---------------------------------------------------------------------------
alter table public.leases
  add column if not exists landlord_signature_data text,
  add column if not exists landlord_signed_at timestamptz,
  add column if not exists tenant_signature_data text,
  add column if not exists tenant_signed_at timestamptz;

-- Update provider default for new leases (in-app instead of docusign)
-- Note: existing leases retain their provider value
comment on column public.leases.provider is 'Signing provider: docusign or inapp';

comment on column public.users.signature_data is 'Base64-encoded PNG of the user signature (for landlords to pre-sign leases)';
comment on column public.leases.landlord_signature_data is 'Base64-encoded PNG of the landlord signature on this lease';
comment on column public.leases.tenant_signature_data is 'Base64-encoded PNG of the tenant signature on this lease';
