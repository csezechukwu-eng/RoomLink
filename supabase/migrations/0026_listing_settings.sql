-- Migration: Listing Settings for Monthly-Stay Marketplace
--
-- Room Link is a marketplace for minimum 30-day monthly stays.
-- This migration adds listing-specific fields for public property listings.
--
-- EXISTING FIELDS REUSED (not created here):
-- - properties.is_hidden → used as inverse of "listing enabled" (is_hidden=false means published)
-- - properties.description → used as listing description
-- - properties.house_rules → already exists
-- - properties.city, state, zip, address → already exist
-- - properties.name → used as listing title
-- - beds.monthly_rent → rent is per-bed, already exists
-- - beds.deposit_amount → deposit is per-bed, already exists
-- - beds.min_stay_days → already exists on beds
-- - beds.status → used for availability (vacant/reserved/occupied/unavailable)
-- - rooms.max_occupancy → room capacity already exists
--
-- NEW FIELDS ADDED (only what doesn't exist):
-- - properties.occupancy_type → coed, women_only_house, women_only_rooms_available
-- - properties.checkout_photo_required → whether tenants must upload checkout photos
-- - properties.default_min_stay_days → default for new beds (30 = monthly)
-- - rooms.occupancy_type → room-level override (coed, women_only)

-- ===========================================================================
-- PROPERTY-LEVEL LISTING SETTINGS
-- ===========================================================================

-- Occupancy type for the whole property
-- Hosts are responsible for complying with fair housing laws
alter table public.properties
  add column if not exists occupancy_type text
    check (occupancy_type is null or occupancy_type in (
      'coed',
      'women_only_house',
      'women_only_rooms_available'
    ));

comment on column public.properties.occupancy_type is
  'Property occupancy preference: coed, women_only_house, or women_only_rooms_available. Hosts must comply with applicable laws.';

-- Checkout photo requirement
-- When true, tenants should upload photos at move-out (feature to be built)
alter table public.properties
  add column if not exists checkout_photo_required boolean not null default true;

comment on column public.properties.checkout_photo_required is
  'Whether tenants are required to upload move-out photos. Default true.';

-- Default minimum stay for new beds (30 days = monthly stay)
-- Individual beds can override this via beds.min_stay_days
alter table public.properties
  add column if not exists default_min_stay_days integer not null default 30
    check (default_min_stay_days >= 1);

comment on column public.properties.default_min_stay_days is
  'Default minimum stay in days for new beds. Room Link requires minimum 30-day stays.';

-- ===========================================================================
-- ROOM-LEVEL OCCUPANCY OVERRIDE
-- ===========================================================================

-- Room-level occupancy type (for "women-only rooms available" scenario)
alter table public.rooms
  add column if not exists occupancy_type text
    check (occupancy_type is null or occupancy_type in ('coed', 'women_only'));

comment on column public.rooms.occupancy_type is
  'Room-level occupancy override: coed or women_only. Used when property has mixed occupancy.';

-- ===========================================================================
-- INDEXES
-- ===========================================================================

-- Index for filtering public listings by occupancy type
create index if not exists idx_properties_occupancy_type on public.properties(occupancy_type)
  where occupancy_type is not null;

-- ===========================================================================
-- NOTE ON EXISTING FIELDS
-- ===========================================================================
-- The following fields already exist and are reused for listing settings:
--
-- properties.is_hidden (boolean, default false)
--   → When false, property is published/visible in public listings
--   → When true, property is hidden from public listings
--   → UI shows this as "Publish listing: Yes/No"
--
-- properties.description (text, nullable)
--   → Used as the public listing description
--
-- properties.house_rules (text, nullable)
--   → Displayed on public listing detail page
--
-- beds.monthly_rent (numeric, default 0)
--   → Per-bed monthly rent, shown on listing cards
--
-- beds.deposit_amount (numeric, default 0)
--   → Per-bed security deposit
--
-- beds.min_stay_days (integer, nullable)
--   → Per-bed minimum stay override
--
-- beds.status (text: vacant, reserved, occupied, unavailable)
--   → Used to compute available beds for listing card
