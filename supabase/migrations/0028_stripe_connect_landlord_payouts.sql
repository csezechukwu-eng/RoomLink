-- Migration: Stripe Connect Landlord Payouts
-- ============================================================================
-- Adds fields needed for Stripe Connect Express accounts and marketplace payments.
-- Room Link uses destination charges with application_fee_amount for 5% host fee.
--
-- BUSINESS MODEL:
-- - Tenant pays rent through Room Link (Stripe Checkout)
-- - Room Link keeps 5% host fee via application_fee_amount
-- - Landlord receives 95% via transfer_data.destination
-- - No monthly subscription fees for landlords
-- ============================================================================

-- ============================================================================
-- Add Stripe Connect fields to users table (landlord payout readiness)
-- ============================================================================

-- Account type: express, standard, or custom (we use express)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_connect_account_type text
    CHECK (stripe_connect_account_type IS NULL OR stripe_connect_account_type IN ('express', 'standard', 'custom'));

-- Core readiness flags from Stripe account object
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_connect_details_submitted boolean NOT NULL DEFAULT false;

-- Onboarding completion flag (details_submitted + requirements met)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarding_complete boolean NOT NULL DEFAULT false;

-- Enabled flag (true when ready to receive payments)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_connect_enabled boolean NOT NULL DEFAULT false;

-- Pending requirements from Stripe (for showing progress to landlord)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_connect_requirements_due jsonb DEFAULT '[]';

-- Last sync timestamp for debugging/monitoring
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_connect_last_synced_at timestamptz;

-- ============================================================================
-- Add payment tracking fields to payments table
-- ============================================================================

-- Stripe identifiers for reconciliation
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

-- Fee breakdown (stored in cents for precision)
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS host_fee_cents integer;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS landlord_payout_cents integer;

-- The connected account that received the payout
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS connected_account_id text;

-- ============================================================================
-- Indexes for efficient lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_payments_stripe_session
  ON public.payments(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_stripe_pi
  ON public.payments(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_connected_account
  ON public.payments(connected_account_id)
  WHERE connected_account_id IS NOT NULL;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON COLUMN public.users.stripe_connect_account_type IS 'Stripe Connect account type: express (recommended), standard, or custom';
COMMENT ON COLUMN public.users.stripe_connect_charges_enabled IS 'Whether the landlord can receive charges (from Stripe account.charges_enabled)';
COMMENT ON COLUMN public.users.stripe_connect_payouts_enabled IS 'Whether the landlord can receive payouts (from Stripe account.payouts_enabled)';
COMMENT ON COLUMN public.users.stripe_connect_details_submitted IS 'Whether the landlord has submitted onboarding details (from Stripe account.details_submitted)';
COMMENT ON COLUMN public.users.stripe_connect_onboarding_complete IS 'Room Link flag: true when landlord is fully ready for payments';
COMMENT ON COLUMN public.users.stripe_connect_requirements_due IS 'Array of pending Stripe requirements (eventually_due + currently_due)';
COMMENT ON COLUMN public.users.stripe_connect_last_synced_at IS 'Last time we synced status from Stripe account.updated webhook';

COMMENT ON COLUMN public.payments.stripe_checkout_session_id IS 'Stripe Checkout Session ID for tracking';
COMMENT ON COLUMN public.payments.stripe_payment_intent_id IS 'Stripe PaymentIntent ID for reconciliation';
COMMENT ON COLUMN public.payments.host_fee_cents IS 'Room Link 5% host fee in cents';
COMMENT ON COLUMN public.payments.landlord_payout_cents IS 'Amount landlord receives (rent - host fee) in cents';
COMMENT ON COLUMN public.payments.connected_account_id IS 'Stripe Connect account ID that received payout';

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
