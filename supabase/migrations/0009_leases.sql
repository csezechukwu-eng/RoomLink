-- Migration: Leases (DocuSign eSignature) — Phase 4
-- Additive. Tracks one lease/agreement per tenant placement, the DocuSign
-- envelope behind it, and a snapshot of the terms sent for signature.

create table if not exists public.leases (
  id              uuid primary key default gen_random_uuid(),
  property_id     uuid not null references public.properties(id) on delete cascade,
  room_id         uuid references public.rooms(id) on delete set null,
  bed_id          uuid references public.beds(id) on delete set null,
  tenant_id       uuid references public.users(id) on delete set null,
  application_id  uuid references public.applications(id) on delete set null,
  reservation_id  uuid references public.reservations(id) on delete set null,

  -- 'template' = filled from a reusable DocuSign template; 'upload' = the
  -- landlord's own document sent for signature.
  source          text not null default 'template'
                    check (source in ('template', 'upload')),

  provider        text not null default 'docusign',
  envelope_id     text,
  status          text not null default 'draft'
                    check (status in ('draft', 'sent', 'delivered', 'completed', 'declined', 'voided')),

  -- Snapshot of the terms at send time (so the record is self-describing).
  tenant_name     text,
  tenant_email    text,
  monthly_rent    numeric(10, 2),
  deposit_amount  numeric(10, 2),
  lease_start     date,
  lease_end       date,

  signed_pdf_url  text,
  sent_at         timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_leases_property    on public.leases(property_id);
create index if not exists idx_leases_application  on public.leases(application_id);
create index if not exists idx_leases_reservation  on public.leases(reservation_id);
create index if not exists idx_leases_bed          on public.leases(bed_id);
create index if not exists idx_leases_envelope     on public.leases(envelope_id);

alter table public.leases enable row level security;

create or replace function update_leases_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists leases_updated_at on public.leases;
create trigger leases_updated_at
  before update on public.leases
  for each row execute function update_leases_updated_at();

comment on table public.leases is 'Lease/agreement records and their DocuSign envelope status.';
