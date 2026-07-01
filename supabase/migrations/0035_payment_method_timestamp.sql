-- renta bed — Add payment method timestamp
-- Adds timestamp for when payment method was added

-- Add payment_method_added_at column
alter table public.users add column if not exists payment_method_added_at timestamptz;

-- Comment for documentation
comment on column public.users.payment_method_added_at is 'Timestamp when the tenant added their payment method via Stripe';
