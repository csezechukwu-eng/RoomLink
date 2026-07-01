-- Migration: Update Property Types
-- ============================================================================
-- Changes property_type enum from crash_pad/co_living/midterm/room_rental
-- to house/apartment/condo
-- ============================================================================

-- Drop the old constraint
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_property_type_check;

-- Add the new constraint with updated values
ALTER TABLE public.properties
  ADD CONSTRAINT properties_property_type_check
  CHECK (property_type IN ('house', 'apartment', 'condo', 'crash_pad', 'co_living', 'midterm', 'room_rental'));

-- Update existing property_type values if needed (optional - keeps backwards compatibility)
-- UPDATE public.properties SET property_type = 'house' WHERE property_type = 'crash_pad';
-- UPDATE public.properties SET property_type = 'apartment' WHERE property_type = 'co_living';

-- Update occupancy_type constraint as well
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_occupancy_type_check;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_occupancy_type_check
  CHECK (occupancy_type IS NULL OR occupancy_type IN ('coed', 'women_only_rooms', 'women_only_house', 'women_only_rooms_available'));

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
