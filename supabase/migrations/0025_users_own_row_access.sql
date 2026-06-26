-- Migration: Allow users to access their own row in public.users
--
-- This adds RLS policies so authenticated users can:
-- 1. SELECT their own user row (for billing data)
-- 2. UPDATE their own user row (for saving stripe_customer_id, etc.)
-- 3. INSERT their own user row if it doesn't exist
--
-- This is required for billing to work - landlords need to read/write
-- their own subscription data without being "connected" to a property.

-- ===========================================================================
-- USERS — Self-access policies for billing and profile data
-- ===========================================================================

-- SELECT: Users can read their own row (for billing, profile data)
create policy "users_select_own_row"
on public.users
for select
to authenticated
using (id = auth.uid());

-- UPDATE: Users can update their own row (for stripe_customer_id, billing fields)
create policy "users_update_own_row"
on public.users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- INSERT: Users can create their own row if it doesn't exist
-- This allows the billing system to create a user record for billing
create policy "users_insert_own_row"
on public.users
for insert
to authenticated
with check (id = auth.uid());
