-- renta bed — Phase 1A schema
-- Properties, Rooms, Beds, and a future-proof membership table.
-- Crash-pad / rent-by-room inventory model.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------------
create table if not exists public.properties (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null,
  name          text not null,
  address       text,
  city          text,
  state         text,
  zip           text,
  property_type text not null default 'crash_pad'
                  check (property_type in ('crash_pad', 'co_living', 'midterm', 'room_rental')),
  description   text,
  house_rules   text,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- rooms  (a property has many rooms)
-- ---------------------------------------------------------------------------
create table if not exists public.rooms (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references public.properties(id) on delete cascade,
  name          text not null,
  description   text,
  max_occupancy integer not null default 1 check (max_occupancy >= 0),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- beds  (a room has many beds; each bed belongs to one room + one property)
-- ---------------------------------------------------------------------------
create table if not exists public.beds (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references public.properties(id) on delete cascade,
  room_id        uuid not null references public.rooms(id) on delete cascade,
  label          text not null,
  bunk_type      text not null default 'single'
                   check (bunk_type in ('top_bunk', 'bottom_bunk', 'single', 'other')),
  monthly_rent   numeric(10, 2) not null default 0 check (monthly_rent >= 0),
  deposit_amount numeric(10, 2) not null default 0 check (deposit_amount >= 0),
  status         text not null default 'vacant'
                   check (status in ('vacant', 'reserved', 'occupied', 'unavailable')),
  description    text,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- property_members  (future-proofing: owner / manager / tenant access)
-- Not used by Phase 1A UI yet, but the table exists for later phases.
-- ---------------------------------------------------------------------------
create table if not exists public.property_members (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id     uuid not null,
  role        text not null default 'tenant'
                check (role in ('owner', 'manager', 'tenant')),
  created_at  timestamptz not null default now(),
  unique (property_id, user_id)
);

-- ---------------------------------------------------------------------------
-- indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_properties_owner        on public.properties(owner_id);
create index if not exists idx_rooms_property           on public.rooms(property_id);
create index if not exists idx_beds_property            on public.beds(property_id);
create index if not exists idx_beds_room                on public.beds(room_id);
create index if not exists idx_beds_status              on public.beds(status);
create index if not exists idx_property_members_property on public.property_members(property_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Enabled (locked down by default). Phase 1A accesses data server-side with
-- the service-role key, which bypasses RLS. Real per-user auth policies will
-- be added alongside Supabase Auth in a later phase.
-- ---------------------------------------------------------------------------
alter table public.properties       enable row level security;
alter table public.rooms            enable row level security;
alter table public.beds             enable row level security;
alter table public.property_members enable row level security;
