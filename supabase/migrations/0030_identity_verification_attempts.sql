-- Migration: Identity Verification Attempts
-- ============================================================================
-- Adds a dedicated table for tracking Stripe Identity verification attempts.
-- Uses a state-token architecture for secure return URL handling.
-- ============================================================================

-- ============================================================================
-- Create identity_verification_attempts table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.identity_verification_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Stripe Identity session tracking
  stripe_verification_session_id text,

  -- Secure state token (hashed for storage, raw token sent in URL)
  state_token_hash text NOT NULL,

  -- Status tracking
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'pending', 'processing', 'verified', 'needs_attention', 'canceled', 'expired')),

  -- Raw Stripe status for debugging
  stripe_status text,
  stripe_last_error text,

  -- Tracking timestamps
  return_consumed_at timestamptz,
  last_synced_at timestamptz,
  expires_at timestamptz NOT NULL,

  -- Standard timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Fast lookup by state token hash (used in return route)
CREATE INDEX IF NOT EXISTS idx_identity_attempts_state_hash
  ON public.identity_verification_attempts(state_token_hash);

-- Fast lookup by user (find user's latest attempt)
CREATE INDEX IF NOT EXISTS idx_identity_attempts_user_id
  ON public.identity_verification_attempts(user_id, created_at DESC);

-- Fast lookup by Stripe session ID (used in webhooks)
CREATE INDEX IF NOT EXISTS idx_identity_attempts_stripe_session
  ON public.identity_verification_attempts(stripe_verification_session_id);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE public.identity_verification_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own attempts
CREATE POLICY "Users can view own verification attempts"
  ON public.identity_verification_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (for server-side operations)
CREATE POLICY "Service role has full access to verification attempts"
  ON public.identity_verification_attempts
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- Updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_identity_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_identity_attempts_updated_at ON public.identity_verification_attempts;
CREATE TRIGGER set_identity_attempts_updated_at
  BEFORE UPDATE ON public.identity_verification_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_identity_attempts_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.identity_verification_attempts IS 'Tracks Stripe Identity verification attempts with secure state tokens';
COMMENT ON COLUMN public.identity_verification_attempts.state_token_hash IS 'SHA-256 hash of the state token sent in return URL';
COMMENT ON COLUMN public.identity_verification_attempts.status IS 'Internal status: created, pending, processing, verified, needs_attention, canceled, expired';
COMMENT ON COLUMN public.identity_verification_attempts.stripe_status IS 'Raw status from Stripe API for debugging';
COMMENT ON COLUMN public.identity_verification_attempts.return_consumed_at IS 'When the return URL was successfully processed';
COMMENT ON COLUMN public.identity_verification_attempts.expires_at IS 'State token expiration time (typically 1 hour)';

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
