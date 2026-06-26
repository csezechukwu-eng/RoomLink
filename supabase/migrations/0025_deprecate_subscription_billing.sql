-- Migration: Deprecate Landlord Subscription Billing
-- ===========================================================================
-- This migration documents the deprecation of landlord subscription billing.
-- Room Link has pivoted from a SaaS subscription model to a marketplace
-- transaction-fee model where landlords pay a 5% host fee only when tenants
-- pay rent through the platform.
--
-- BUSINESS MODEL CHANGE:
-- OLD MODEL: Landlord pays Room Link $30/month or $280/year subscription
-- NEW MODEL: Landlord pays 5% host fee on each monthly rent payment
--
-- This migration does NOT drop columns to preserve any existing data.
-- Columns are marked as deprecated via comments for future cleanup.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Update column comments to mark as deprecated
-- ---------------------------------------------------------------------------

comment on column public.users.stripe_customer_id is
  'DEPRECATED: Was used for landlord subscription billing. Room Link now uses transaction fees.';

comment on column public.users.stripe_subscription_id is
  'DEPRECATED: Was used for landlord subscription billing. Room Link now uses transaction fees.';

comment on column public.users.stripe_subscription_status is
  'DEPRECATED: Was used for landlord subscription billing. Room Link now uses transaction fees.';

comment on column public.users.stripe_price_id is
  'DEPRECATED: Was used for landlord subscription billing. Room Link now uses transaction fees.';

comment on column public.users.stripe_current_period_start is
  'DEPRECATED: Was used for landlord subscription billing. Room Link now uses transaction fees.';

comment on column public.users.stripe_current_period_end is
  'DEPRECATED: Was used for landlord subscription billing. Room Link now uses transaction fees.';

comment on column public.users.stripe_cancel_at_period_end is
  'DEPRECATED: Was used for landlord subscription billing. Room Link now uses transaction fees.';

comment on column public.users.billing_email is
  'DEPRECATED: Was used for landlord subscription billing. Room Link now uses transaction fees.';

comment on column public.users.subscription_plan is
  'DEPRECATED: Was used for landlord subscription billing. Room Link now uses transaction fees.';

comment on column public.users.subscription_interval is
  'DEPRECATED: Was used for landlord subscription billing. Room Link now uses transaction fees.';

comment on column public.users.subscription_amount is
  'DEPRECATED: Was used for landlord subscription billing. Room Link now uses transaction fees.';

comment on column public.users.subscription_started_at is
  'DEPRECATED: Was used for landlord subscription billing. Room Link now uses transaction fees.';

comment on column public.users.subscription_canceled_at is
  'DEPRECATED: Was used for landlord subscription billing. Room Link now uses transaction fees.';

comment on column public.users.subscription_ended_at is
  'DEPRECATED: Was used for landlord subscription billing. Room Link now uses transaction fees.';

comment on column public.users.trial_started_at is
  'DEPRECATED: Was used for landlord subscription billing. Room Link now uses transaction fees.';

comment on column public.users.trial_ends_at is
  'DEPRECATED: Was used for landlord subscription billing. Room Link now uses transaction fees.';

comment on column public.users.trial_used is
  'DEPRECATED: Was used for landlord subscription billing. Room Link now uses transaction fees.';

comment on column public.users.billing_payment_method_summary is
  'DEPRECATED: Was used for landlord subscription billing. Room Link now uses transaction fees.';

comment on column public.users.billing_updated_at is
  'DEPRECATED: Was used for landlord subscription billing. Room Link now uses transaction fees.';

-- ---------------------------------------------------------------------------
-- Update stripe_connect_enabled comment (still in use)
-- ---------------------------------------------------------------------------

comment on column public.users.stripe_connect_enabled is
  'Whether Stripe Connect is enabled for receiving rent payouts. Used for marketplace payments.';

-- ---------------------------------------------------------------------------
-- Add new column for future Stripe Connect account ID
-- ---------------------------------------------------------------------------

alter table public.users
  add column if not exists stripe_account_id text unique;

comment on column public.users.stripe_account_id is
  'Stripe Connect account ID for receiving rent payouts. Used for marketplace payments.';

-- Index for Stripe Connect accounts
create index if not exists idx_users_stripe_account on public.users(stripe_account_id) where stripe_account_id is not null;

-- ---------------------------------------------------------------------------
-- Notify PostgREST to reload schema
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';
