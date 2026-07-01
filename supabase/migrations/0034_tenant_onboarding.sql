-- renta bed — Tenant Onboarding Setup
-- Creates avatars storage bucket and adds tenant-specific fields to users table

-- ===========================================================================
-- CREATE AVATARS STORAGE BUCKET
-- ===========================================================================

-- Insert the avatars bucket if it doesn't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,  -- public bucket for profile photos
  5242880,  -- 5MB max file size
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- ===========================================================================
-- STORAGE POLICIES FOR AVATARS
-- ===========================================================================

-- Allow authenticated users to upload to their own folder
create policy "Users can upload own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
create policy "Users can update own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
create policy "Users can delete own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all avatars
create policy "Public read access for avatars"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

-- ===========================================================================
-- ADD TENANT ONBOARDING FIELDS TO USERS TABLE
-- ===========================================================================

-- Add role field if not exists
alter table public.users add column if not exists role text default 'landlord';

-- Add tenant-specific fields
alter table public.users add column if not exists move_in_date date;
alter table public.users add column if not exists budget_min integer;
alter table public.users add column if not exists budget_max integer;
alter table public.users add column if not exists preferred_city text;
alter table public.users add column if not exists roommate_preference text;
alter table public.users add column if not exists lifestyle text;
alter table public.users add column if not exists about_me text;

-- Payment and rules
alter table public.users add column if not exists payment_method_added boolean default false;
alter table public.users add column if not exists stripe_customer_id text;
alter table public.users add column if not exists communication_prefs_set boolean default false;
alter table public.users add column if not exists house_rules_accepted boolean default false;
alter table public.users add column if not exists house_rules_accepted_at timestamptz;

-- Tenant onboarding completion
alter table public.users add column if not exists tenant_onboarding_completed_at timestamptz;

-- Add index on role for faster queries
create index if not exists idx_users_role on public.users(role);
