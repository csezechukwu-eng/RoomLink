-- Migration: Landlord Onboarding
-- ============================================================================
-- Adds fields needed for the landlord onboarding flow.
-- Supports identity verification, authority attestation, and onboarding progress.
-- ============================================================================

-- ============================================================================
-- Add onboarding fields to users table
-- ============================================================================

-- Profile fields
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS display_name text;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS landlord_type text
    CHECK (landlord_type IS NULL OR landlord_type IN ('individual', 'company', 'property_manager'));

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS emergency_contact_name text;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Identity verification fields (Stripe Identity)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS identity_verification_session_id text;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS identity_verified_at timestamptz;

-- Authority attestation
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS authority_attested_at timestamptz;

-- Compliance acknowledgement
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS compliance_ack_at timestamptz;

-- Onboarding completion tracking
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_draft_property_id uuid;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_dismissed boolean NOT NULL DEFAULT false;

-- ============================================================================
-- Add listing fields to properties table
-- ============================================================================

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS furnished boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS utilities_included boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS wifi boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS laundry text;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS parking text;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS neighborhood text;

-- ============================================================================
-- Add foreign key constraint for draft property (if not exists)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_onboarding_draft_property_id_fkey'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_onboarding_draft_property_id_fkey
      FOREIGN KEY (onboarding_draft_property_id)
      REFERENCES public.properties(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON COLUMN public.users.display_name IS 'Display name shown to tenants (can differ from legal name)';
COMMENT ON COLUMN public.users.landlord_type IS 'Type of landlord: individual, company, or property_manager';
COMMENT ON COLUMN public.users.emergency_contact_name IS 'Emergency contact name for the landlord';
COMMENT ON COLUMN public.users.emergency_contact_phone IS 'Emergency contact phone for the landlord';
COMMENT ON COLUMN public.users.avatar_url IS 'URL to the landlord profile photo';
COMMENT ON COLUMN public.users.identity_verification_session_id IS 'Stripe Identity verification session ID';
COMMENT ON COLUMN public.users.identity_verified_at IS 'When identity was verified via Stripe Identity';
COMMENT ON COLUMN public.users.authority_attested_at IS 'When landlord attested authority to manage property';
COMMENT ON COLUMN public.users.compliance_ack_at IS 'When landlord acknowledged compliance requirements';
COMMENT ON COLUMN public.users.onboarding_completed_at IS 'When landlord completed the onboarding flow';
COMMENT ON COLUMN public.users.onboarding_draft_property_id IS 'Draft property being created during onboarding';
COMMENT ON COLUMN public.users.onboarding_dismissed IS 'Whether landlord dismissed the onboarding banner';

COMMENT ON COLUMN public.properties.furnished IS 'Whether the property is furnished';
COMMENT ON COLUMN public.properties.utilities_included IS 'Whether utilities are included in rent';
COMMENT ON COLUMN public.properties.wifi IS 'Whether WiFi is included';
COMMENT ON COLUMN public.properties.laundry IS 'Laundry facilities description';
COMMENT ON COLUMN public.properties.parking IS 'Parking availability description';
COMMENT ON COLUMN public.properties.neighborhood IS 'Neighborhood and transit information';

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
