-- Migration: Add occupancy_type to properties
-- Powers the public search "occupancy type" filter:
--   co_ed             — mixed / co-ed house
--   women_only_house  — entire house is women-only
--   women_only_rooms  — house has women-only rooms available
--
-- Additive and backward compatible: existing rows default to 'co_ed'.

alter table public.properties
  add column if not exists occupancy_type text not null default 'co_ed'
    check (occupancy_type in ('co_ed', 'women_only_house', 'women_only_rooms'));

comment on column public.properties.occupancy_type is
  'Public occupancy policy for the house: co_ed, women_only_house, or women_only_rooms.';
