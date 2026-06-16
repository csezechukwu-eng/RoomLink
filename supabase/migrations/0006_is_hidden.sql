-- Migration: Add is_hidden column to properties table
-- Allows landlords to hide/show properties from public listings

alter table public.properties
  add column if not exists is_hidden boolean not null default false;

-- Add comment explaining the column
comment on column public.properties.is_hidden is 'When true, property is hidden from public listings';
