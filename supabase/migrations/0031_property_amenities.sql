-- Migration: Property Amenities
-- ============================================================================
-- Adds comprehensive amenity fields to properties table for detailed listings.
-- Matches the amenity categories from industry-standard rental platforms.
-- ============================================================================

-- ============================================================================
-- Property Details
-- ============================================================================

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS num_bedrooms integer CHECK (num_bedrooms IS NULL OR num_bedrooms >= 0);

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS num_bathrooms integer CHECK (num_bathrooms IS NULL OR num_bathrooms >= 0);

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS sqft integer CHECK (sqft IS NULL OR sqft >= 0);

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS wifi_speed text;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS couples_allowed boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS lgbtq_friendly boolean NOT NULL DEFAULT false;

-- ============================================================================
-- Bathroom & Laundry Amenities
-- ============================================================================

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_dryer boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_paid_laundry boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS toilet_paper_provided boolean NOT NULL DEFAULT false;

-- ============================================================================
-- Comfort Amenities
-- ============================================================================

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_air_conditioning boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_balcony boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_heating boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS linen_provided boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_blackout_blinds boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS bedroom_essentials boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS bedroom_door_lock boolean NOT NULL DEFAULT false;

-- ============================================================================
-- Community Amenities
-- ============================================================================

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_chill_out_area boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_shared_living_area boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_bbq_area boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_dining_area boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_dishwasher boolean NOT NULL DEFAULT false;

-- ============================================================================
-- Outdoors Amenities
-- ============================================================================

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_outdoor_space boolean NOT NULL DEFAULT false;

-- ============================================================================
-- Services Amenities
-- ============================================================================

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS common_area_cleaning boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS room_cleaning boolean NOT NULL DEFAULT false;

-- ============================================================================
-- Transport & Access Amenities
-- ============================================================================

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_bicycles boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_free_street_parking boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_on_site_parking boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_paid_parking boolean NOT NULL DEFAULT false;

-- ============================================================================
-- Wellness & Recreation Amenities
-- ============================================================================

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_gym boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_yoga_space boolean NOT NULL DEFAULT false;

-- ============================================================================
-- Work Amenities
-- ============================================================================

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_high_speed_wifi boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_meeting_rooms boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_private_call_room boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_workspace boolean NOT NULL DEFAULT false;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_desk_workspace boolean NOT NULL DEFAULT false;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON COLUMN public.properties.num_bedrooms IS 'Number of bedrooms in the property';
COMMENT ON COLUMN public.properties.num_bathrooms IS 'Number of bathrooms in the property';
COMMENT ON COLUMN public.properties.sqft IS 'Square footage of the property';
COMMENT ON COLUMN public.properties.wifi_speed IS 'WiFi speed description (e.g., 1000↓ / 35↑ Mbps)';
COMMENT ON COLUMN public.properties.couples_allowed IS 'Whether couples are allowed';
COMMENT ON COLUMN public.properties.lgbtq_friendly IS 'Whether property is LGBTQ+ friendly';

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
