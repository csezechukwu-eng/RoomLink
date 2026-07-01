-- renta bed — Phase 1 (web) schema expansion
-- Adds the shared, platform-agnostic tables that BOTH the web app and the
-- future mobile app read from. One source of truth — no web_/mobile_ split.
--
-- Builds on 0001_init.sql (properties, rooms, beds, property_members).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- users — people in the system (landlords + tenants/applicants).
-- Real auth (Supabase Auth) arrives later; for now rows are created by the app
-- (e.g. when someone applies). `verification_status` is a forward placeholder.
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id                  uuid primary key default gen_random_uuid(),
  email               text not null unique,
  full_name           text,
  phone               text,
  role                text not null default 'tenant'
                        check (role in ('owner', 'manager', 'tenant')),
  verification_status text not null default 'unverified'
                        check (verification_status in ('unverified', 'pending', 'verified')),
  created_at          timestamptz not null default now()
);

-- Forward placeholder: per-property mobile readiness flag.
alter table public.properties
  add column if not exists mobile_app_ready boolean not null default false;

-- ---------------------------------------------------------------------------
-- applications — a person applying for a specific vacant bed.
-- ---------------------------------------------------------------------------
create table if not exists public.applications (
  id                  uuid primary key default gen_random_uuid(),
  property_id         uuid not null references public.properties(id) on delete cascade,
  bed_id              uuid references public.beds(id) on delete set null,
  applicant_id        uuid references public.users(id) on delete cascade,
  full_name           text not null,
  email               text not null,
  phone               text,
  message             text,
  desired_move_in     date,
  status              text not null default 'pending'
                        check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
  agreement_status    text not null default 'not_started'   -- placeholder (DocuSign later)
                        check (agreement_status in ('not_started', 'sent', 'signed')),
  created_at          timestamptz not null default now(),
  decided_at          timestamptz
);

-- ---------------------------------------------------------------------------
-- reservations — created when an application is approved. Holds a bed for a
-- tenant and tracks deposit status.
-- ---------------------------------------------------------------------------
create table if not exists public.reservations (
  id                   uuid primary key default gen_random_uuid(),
  property_id          uuid not null references public.properties(id) on delete cascade,
  bed_id               uuid references public.beds(id) on delete set null,
  tenant_id            uuid not null references public.users(id) on delete cascade,
  application_id       uuid references public.applications(id) on delete set null,
  status               text not null default 'active'
                         check (status in ('active', 'cancelled', 'completed')),
  start_date           date,
  end_date             date,
  deposit_amount       numeric(10, 2) not null default 0 check (deposit_amount >= 0),
  deposit_status       text not null default 'unpaid'
                         check (deposit_status in ('unpaid', 'paid', 'waived', 'refunded')),
  deposit_paid_at      timestamptz,
  access_code_delivery text not null default 'pending'      -- placeholder (smart locks later)
                         check (access_code_delivery in ('pending', 'sent', 'delivered')),
  created_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- rent_charges — monthly (or per-period) rent owed by a tenant.
-- ---------------------------------------------------------------------------
create table if not exists public.rent_charges (
  id              uuid primary key default gen_random_uuid(),
  reservation_id  uuid references public.reservations(id) on delete cascade,
  tenant_id       uuid not null references public.users(id) on delete cascade,
  property_id     uuid not null references public.properties(id) on delete cascade,
  bed_id          uuid references public.beds(id) on delete set null,
  period_start    date,
  period_end      date,
  due_date        date,
  amount          numeric(10, 2) not null default 0 check (amount >= 0),
  status          text not null default 'due'
                    check (status in ('due', 'paid', 'overdue', 'waived')),
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- payments — manual payment records. `payment_provider` is a forward
-- placeholder for Stripe; for Phase 1 everything is recorded manually.
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.users(id) on delete cascade,
  reservation_id   uuid references public.reservations(id) on delete set null,
  rent_charge_id   uuid references public.rent_charges(id) on delete set null,
  property_id      uuid references public.properties(id) on delete set null,
  kind             text not null default 'rent'
                     check (kind in ('deposit', 'rent', 'other')),
  amount           numeric(10, 2) not null default 0 check (amount >= 0),
  payment_provider text not null default 'manual',          -- placeholder (Stripe later)
  status           text not null default 'recorded'
                     check (status in ('recorded', 'pending', 'failed', 'refunded')),
  recorded_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- announcements — landlord broadcasts to a property's tenants.
-- ---------------------------------------------------------------------------
create table if not exists public.announcements (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  author_id    uuid references public.users(id) on delete set null,
  title        text not null,
  body         text not null,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- messages — tenant <-> landlord thread, keyed by (property, tenant).
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  tenant_id    uuid not null references public.users(id) on delete cascade,
  sender_id    uuid references public.users(id) on delete set null,
  sender_role  text not null default 'tenant'
                 check (sender_role in ('tenant', 'owner', 'manager')),
  body         text not null,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- maintenance_requests — tenant-submitted issues, triaged by the landlord.
-- ---------------------------------------------------------------------------
create table if not exists public.maintenance_requests (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  tenant_id    uuid references public.users(id) on delete set null,
  room_id      uuid references public.rooms(id) on delete set null,
  bed_id       uuid references public.beds(id) on delete set null,
  title        text not null,
  description  text,
  priority     text not null default 'normal'
                 check (priority in ('low', 'normal', 'high', 'urgent')),
  status       text not null default 'open'
                 check (status in ('open', 'in_progress', 'resolved', 'closed')),
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);

-- ---------------------------------------------------------------------------
-- indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_applications_property   on public.applications(property_id);
create index if not exists idx_applications_bed         on public.applications(bed_id);
create index if not exists idx_applications_applicant   on public.applications(applicant_id);
create index if not exists idx_applications_status      on public.applications(status);
create index if not exists idx_reservations_property    on public.reservations(property_id);
create index if not exists idx_reservations_tenant      on public.reservations(tenant_id);
create index if not exists idx_reservations_bed         on public.reservations(bed_id);
create index if not exists idx_rent_charges_tenant      on public.rent_charges(tenant_id);
create index if not exists idx_rent_charges_property    on public.rent_charges(property_id);
create index if not exists idx_rent_charges_reservation on public.rent_charges(reservation_id);
create index if not exists idx_payments_tenant          on public.payments(tenant_id);
create index if not exists idx_announcements_property   on public.announcements(property_id);
create index if not exists idx_messages_property_tenant on public.messages(property_id, tenant_id);
create index if not exists idx_maintenance_property     on public.maintenance_requests(property_id);
create index if not exists idx_maintenance_tenant       on public.maintenance_requests(tenant_id);

-- ---------------------------------------------------------------------------
-- Row Level Security — enabled (locked down). Phase 1 accesses data
-- server-side with the service-role key, which bypasses RLS. Per-user/public
-- policies arrive with Supabase Auth in a later phase.
-- ---------------------------------------------------------------------------
alter table public.users                enable row level security;
alter table public.applications         enable row level security;
alter table public.reservations         enable row level security;
alter table public.rent_charges         enable row level security;
alter table public.payments             enable row level security;
alter table public.announcements        enable row level security;
alter table public.messages             enable row level security;
alter table public.maintenance_requests enable row level security;
