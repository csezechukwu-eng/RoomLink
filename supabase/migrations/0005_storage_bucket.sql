-- renta bed — Phase 1C Storage Bucket Setup
-- Creates the property-media storage bucket with appropriate policies

-- ===========================================================================
-- CREATE STORAGE BUCKET
-- ===========================================================================

-- Insert the bucket if it doesn't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-media',
  'property-media',
  true,  -- public bucket for listing photos
  5242880,  -- 5MB max file size
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;


-- ===========================================================================
-- STORAGE POLICIES
-- ===========================================================================

-- Allow authenticated users to upload files to their own folder
-- Folder structure: {user_id}/{property_id}/...
create policy "Users can upload to own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'property-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
create policy "Users can update own files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'property-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'property-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
create policy "Users can delete own files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'property-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all files in the bucket
-- (needed for listing photos to be viewable by anyone)
create policy "Public read access for property media"
on storage.objects
for select
to public
using (bucket_id = 'property-media');
