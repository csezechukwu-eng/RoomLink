-- Migration: Add is_demo support to properties, rooms, and beds
-- This enables full demo property hierarchy for testing

-- Add is_demo column to properties
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- Add is_demo column to rooms
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- Add is_demo column to beds
ALTER TABLE public.beds
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- Create indexes for demo data filtering
CREATE INDEX IF NOT EXISTS idx_properties_is_demo ON public.properties (is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_rooms_is_demo ON public.rooms (is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_beds_is_demo ON public.beds (is_demo) WHERE is_demo = true;

-- Add comment for documentation
COMMENT ON COLUMN public.properties.is_demo IS 'Flag to identify demo/test properties created via Demo Test Center';
COMMENT ON COLUMN public.rooms.is_demo IS 'Flag to identify demo/test rooms created via Demo Test Center';
COMMENT ON COLUMN public.beds.is_demo IS 'Flag to identify demo/test beds created via Demo Test Center';
