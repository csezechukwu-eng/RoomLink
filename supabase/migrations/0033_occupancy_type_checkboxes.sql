-- Migration: Occupancy Type Checkboxes
-- ============================================================================
-- Changes occupancy from single select to multi-select checkboxes
-- Adds is_coed and has_women_only_rooms boolean columns
-- ============================================================================

-- Add new boolean columns for occupancy types
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS is_coed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_women_only_rooms BOOLEAN DEFAULT false;

-- Migrate existing data from occupancy_type to new columns
UPDATE public.properties
SET is_coed = true
WHERE occupancy_type = 'coed';

UPDATE public.properties
SET has_women_only_rooms = true
WHERE occupancy_type = 'women_only_rooms';

-- Note: We keep the occupancy_type column for backwards compatibility
-- It can be removed in a future migration after confirming the new columns work

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
