-- Migration: Room Link Subscription Billing Foundation
-- Adds fields for landlords to pay Room Link (Stripe Customer).
-- This is SEPARATE from Stripe Connect (stripe_account_id) for rent collection.
--
-- Two distinct Stripe relationships:
-- Flow A: stripe_account_id - Landlord's Stripe Connect account to receive tenant rent (future)
-- Flow B: stripe_customer_id - Landlord as Stripe Customer paying Room Link (this migration)

-- ---------------------------------------------------------------------------
-- Add subscription billing fields to users table
-- These track the landlord's subscription to Room Link platform
-- ---------------------------------------------------------------------------

alter table public.users
  -- Stripe Customer ID (for paying Room Link)
  add column if not exists stripe_customer_id text unique,

  -- Stripe Subscription fields
  add column if not exists stripe_subscription_id text unique,
  add column if not exists stripe_subscription_status text
    check (stripe_subscription_status is null or stripe_subscription_status in (
      'incomplete', 'incomplete_expired', 'trialing', 'active',
      'past_due', 'canceled', 'unpaid', 'paused'
    )),
  add column if not exists stripe_price_id text,
  add column if not exists stripe_current_period_start timestamptz,
  add column if not exists stripe_current_period_end timestamptz,
  add column if not exists stripe_cancel_at_period_end boolean default false,

  -- Billing email (may differ from account email)
  add column if not exists billing_email text,

  -- Plan tracking (free, starter, pro, enterprise)
  add column if not exists subscription_plan text not null default 'free'
    check (subscription_plan in ('free', 'starter', 'pro', 'enterprise')),

  -- Timestamps for billing events
  add column if not exists subscription_started_at timestamptz,
  add column if not exists subscription_canceled_at timestamptz,

  -- Future: Stripe Connect for rent collection (not implemented yet)
  -- add column if not exists stripe_account_id text unique,
  -- add column if not exists stripe_account_status text,
  add column if not exists stripe_connect_enabled boolean not null default false;

-- Comments for documentation
comment on column public.users.stripe_customer_id is 'Stripe Customer ID - landlord paying Room Link for platform subscription';
comment on column public.users.stripe_subscription_id is 'Stripe Subscription ID for Room Link platform access';
comment on column public.users.stripe_subscription_status is 'Current subscription status from Stripe webhooks';
comment on column public.users.stripe_price_id is 'Stripe Price ID for current subscription tier';
comment on column public.users.stripe_current_period_start is 'Start of current billing period';
comment on column public.users.stripe_current_period_end is 'End of current billing period';
comment on column public.users.stripe_cancel_at_period_end is 'Whether subscription cancels at period end';
comment on column public.users.billing_email is 'Email for billing communications (may differ from account email)';
comment on column public.users.subscription_plan is 'Current plan tier: free, starter, pro, enterprise';
comment on column public.users.subscription_started_at is 'When the user first subscribed to a paid plan';
comment on column public.users.subscription_canceled_at is 'When the user canceled their subscription';
comment on column public.users.stripe_connect_enabled is 'Placeholder for future Stripe Connect rent collection feature';

-- ---------------------------------------------------------------------------
-- Indexes for common queries
-- ---------------------------------------------------------------------------

create index if not exists idx_users_stripe_customer on public.users(stripe_customer_id) where stripe_customer_id is not null;
create index if not exists idx_users_subscription_status on public.users(stripe_subscription_status) where stripe_subscription_status is not null;
create index if not exists idx_users_subscription_plan on public.users(subscription_plan);
