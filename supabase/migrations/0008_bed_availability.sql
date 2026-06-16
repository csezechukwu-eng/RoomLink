-- Migration: Live Availability (Phase 1) — dates only
-- Additive, fully backward compatible. All new columns are nullable, so every
-- existing bed keeps working unchanged (NULL available_from = "open now").
--
-- Pricing is intentionally NOT touched here: availability uses the existing
-- beds.monthly_rent. Multi-term pricing is a planned fast-follow.

alter table public.beds
  -- When a vacant bed actually becomes available. NULL/past = available now;
  -- a future date means "opens on <date>".
  add column if not exists available_from date,
  -- Optional stay-length guardrails to support short / mid / long filtering.
  add column if not exists min_stay_days integer check (min_stay_days is null or min_stay_days > 0),
  add column if not exists max_stay_days integer check (max_stay_days is null or max_stay_days > 0);

-- Helps the public availability page and landlord dashboards filter/sort by
-- upcoming open dates.
create index if not exists idx_beds_available_from on public.beds(available_from);

comment on column public.beds.available_from is
  'Date a vacant bed becomes available. NULL or past = available now; future = opens on this date.';
comment on column public.beds.min_stay_days is 'Optional minimum stay length in days (short/mid/long filtering).';
comment on column public.beds.max_stay_days is 'Optional maximum stay length in days (short/mid/long filtering).';
