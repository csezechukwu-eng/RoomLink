-- Migration: Room Link Subscription Trial Support
-- Adds trial tracking and extended billing fields for SaaS subscription.
--
-- Plans:
-- - Monthly: $30/month with 30-day free trial
-- - Yearly: $280/year with 30-day free trial

-- ---------------------------------------------------------------------------
-- Add trial and extended billing fields to users table
-- ---------------------------------------------------------------------------

alter table public.users
  -- Subscription interval tracking
  add column if not exists subscription_interval text
    check (subscription_interval is null or subscription_interval in ('month', 'year')),

  -- Subscription amount in cents
  add column if not exists subscription_amount integer,

  -- Trial tracking
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists trial_used boolean not null default false,

  -- Payment method summary (e.g., "Visa ending in 4242")
  add column if not exists billing_payment_method_summary text,

  -- Billing update timestamp
  add column if not exists billing_updated_at timestamptz,

  -- Subscription ended timestamp (different from canceled - when access actually ends)
  add column if not exists subscription_ended_at timestamptz;

-- Update subscription_plan constraint to include monthly/yearly
-- First drop the existing constraint, then add new one
alter table public.users drop constraint if exists users_subscription_plan_check;
alter table public.users add constraint users_subscription_plan_check
  check (subscription_plan in ('free', 'monthly', 'yearly', 'starter', 'pro', 'enterprise'));

-- Comments for documentation
comment on column public.users.subscription_interval is 'Billing interval: month or year';
comment on column public.users.subscription_amount is 'Subscription amount in cents (3000 = $30)';
comment on column public.users.trial_started_at is 'When the free trial started';
comment on column public.users.trial_ends_at is 'When the free trial ends';
comment on column public.users.trial_used is 'Whether user has already used their free trial (prevent repeat trials)';
comment on column public.users.billing_payment_method_summary is 'Summary of payment method (e.g., Visa ending in 4242)';
comment on column public.users.billing_updated_at is 'Last time billing data was updated from webhook';
comment on column public.users.subscription_ended_at is 'When subscription access actually ended';
