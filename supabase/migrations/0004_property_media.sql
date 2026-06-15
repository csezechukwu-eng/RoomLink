-- RoomLink — Phase 1C Property Media
-- Add support for property, room, and bed photos using Supabase Storage

-- ===========================================================================
-- PROPERTY_MEDIA TABLE
-- Stores metadata for uploaded property/room/bed images
-- ===========================================================================

create table if not exists public.property_media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete cascade,
  bed_id uuid references public.beds(id) on delete cascade,
  media_type text not null check (media_type in ('property', 'room', 'bed')),
  storage_bucket text not null default 'property-media',
  storage_path text not null,
  public_url text,
  alt_text text,
  caption text,
  is_cover boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists idx_property_media_owner on public.property_media(owner_id);
create index if not exists idx_property_media_property on public.property_media(property_id);
create index if not exists idx_property_media_room on public.property_media(room_id);
create index if not exists idx_property_media_bed on public.property_media(bed_id);
create index if not exists idx_property_media_type on public.property_media(media_type);
create index if not exists idx_property_media_cover on public.property_media(property_id, is_cover) where is_cover = true;

-- Ensure only one cover photo per property
create unique index if not exists idx_property_media_single_cover
  on public.property_media(property_id, media_type)
  where is_cover = true and media_type = 'property';

-- Enable RLS
alter table public.property_media enable row level security;


-- ===========================================================================
-- RLS POLICIES FOR PROPERTY_MEDIA
-- ===========================================================================

-- SELECT: Owners can view their own media
create policy "owners_select_own_media"
on public.property_media
for select
to authenticated
using (owner_id = auth.uid());

-- INSERT: Owners can add media to their own properties
create policy "owners_insert_own_media"
on public.property_media
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.properties p
    where p.id = property_media.property_id
    and p.owner_id = auth.uid()
  )
);

-- UPDATE: Owners can update their own media
create policy "owners_update_own_media"
on public.property_media
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- DELETE: Owners can delete their own media
create policy "owners_delete_own_media"
on public.property_media
for delete
to authenticated
using (owner_id = auth.uid());

-- SELECT: Public users can view media for public listings
-- (needed for availability pages)
create policy "public_select_listing_media"
on public.property_media
for select
to anon
using (true);


-- ===========================================================================
-- STORAGE BUCKET SETUP
-- Note: Storage bucket and policies are created via Supabase dashboard or CLI
-- This is documented here for reference
-- ===========================================================================

-- Create the storage bucket (run via Supabase CLI or dashboard):
-- supabase storage create property-media --public

-- Storage policies should allow:
-- 1. Authenticated users can upload to their own folder (userId/...)
-- 2. Authenticated users can delete their own files
-- 3. Public can read all files (since these are listing photos)

-- Example storage policies (created via dashboard):
--
-- INSERT policy: "Users can upload to own folder"
-- ((bucket_id = 'property-media'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))
--
-- DELETE policy: "Users can delete own files"
-- ((bucket_id = 'property-media'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))
--
-- SELECT policy: "Public read access"
-- (bucket_id = 'property-media'::text)


-- ===========================================================================
-- TRIGGER: Update updated_at on changes
-- ===========================================================================

create or replace function public.update_property_media_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger property_media_updated_at
  before update on public.property_media
  for each row
  execute function public.update_property_media_updated_at();
