# RoomLink

Property management for **crash pads, co-living, travel-nurse / airline-crew
housing, and rent-by-bed shared living** — not generic apartment software.

**Phase 1 (this repo): the responsive web app**, built backend-first so a future
mobile app reuses the exact same database and business logic — one source of
truth, no duplicated data.

It covers three audiences:

- **Public** — live availability + online applications
- **Tenant portal** — application/reservation/deposit/rent status, announcements,
  messages, and maintenance requests
- **Landlord dashboard** — properties, rooms, beds, applications (approve →
  reservation), deposit + rent tracking, announcements, messages, maintenance

## Stack

| Concern        | Choice                                  |
| -------------- | --------------------------------------- |
| Framework      | Next.js 15 (App Router) + React 19      |
| Language       | TypeScript (strict)                     |
| Styling        | Tailwind CSS v4                          |
| UI             | Hand-rolled shadcn-style primitives     |
| Icons          | lucide-react                            |
| Database       | Supabase (Postgres)                     |
| Package manager| pnpm                                    |

### Mobile-reusable architecture

All business logic lives in a **platform-agnostic services layer**
(`src/lib/services/*`): availability, applications, reservations, rent,
announcements, messages, maintenance, users, beds. Web Server Actions
(`src/lib/actions/*`) and pages are thin wrappers over these services. The
future mobile app calls the **same** services and database (later via thin
`/api` route handlers). Tables use clean shared names (`properties`, `rooms`,
`beds`, `applications`, `reservations`, `rent_charges`, `payments`,
`announcements`, `messages`, `maintenance_requests`) — never `web_*` / `mobile_*`.

All data access runs **server-side** with the Supabase service-role key (never
shipped to the browser). RLS is **enabled** on every table; per-user/public
policies arrive with Supabase Auth in a later phase. Until then a demo landlord
stub and a cookie-based demo tenant session stand in (`src/lib/auth.ts`).

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in your Supabase values
pnpm dev                     # http://localhost:3000
```

The app runs without Supabase configured — pages render a friendly
"Supabase is not configured" state instead of crashing.

### Database setup

```bash
supabase db push                      # applies supabase/migrations/*
psql "$DATABASE_URL" -f supabase/seed.sql
```

Or paste the migrations (`0001_init.sql` then `0002_phase1.sql`) and then
`seed.sql` into the Supabase SQL Editor.

Required env vars (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY` (server only), `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Scripts

```bash
pnpm dev        # start dev server
pnpm build      # production build
pnpm start      # serve the production build
pnpm lint       # eslint
pnpm typecheck  # tsc --noEmit
```

## Routes

**Public**

| Route                       | Screen                                   |
| --------------------------- | ---------------------------------------- |
| `/`                         | Landing + featured availability          |
| `/availability`             | Live availability across properties      |
| `/availability/[propertyId]`| Property detail — rooms, beds, apply CTAs |
| `/apply/[bedId]`            | Application form for a vacant bed        |

**Tenant portal**

| Route                    | Screen                                       |
| ------------------------ | -------------------------------------------- |
| `/tenant`                | Overview                                     |
| `/tenant/status`         | Application + reservation + deposit + bed    |
| `/tenant/rent`           | Rent charges + balance                       |
| `/tenant/announcements`  | Host announcements                           |
| `/tenant/messages`       | Message thread with the host                 |
| `/tenant/maintenance`    | Submit + track maintenance requests          |

**Landlord dashboard**

| Route                                  | Screen                              |
| -------------------------------------- | ----------------------------------- |
| `/dashboard`                           | Overview metrics                    |
| `/dashboard/properties`                | Properties list / create            |
| `/dashboard/properties/[propertyId]`   | Rooms + beds manager                |
| `/dashboard/applications`              | Review + approve/reject             |
| `/dashboard/reservations`              | Reservations + mark deposit paid    |
| `/dashboard/rent`                      | Rent tracker                        |
| `/dashboard/announcements`             | Send announcements                  |
| `/dashboard/messages`                  | Tenant message inbox                |
| `/dashboard/maintenance`               | Triage maintenance requests         |

## Project structure

```
supabase/
  migrations/0001_init.sql   # properties, rooms, beds, property_members
  migrations/0002_phase1.sql # users, applications, reservations, rent_charges,
                             #   payments, announcements, messages,
                             #   maintenance_requests (+ placeholders) + RLS
  seed.sql                   # full demo: apply -> approve -> reserve -> rent
src/
  app/
    (public)/   (tenant)/   (landlord)/   # route groups, per-area responsive nav
  components/                # StatusBadge/Pill, cards, forms, nav, ui/, …
  lib/
    services/                # platform-agnostic business logic (mobile reuses)
    actions/                 # web Server Action wrappers over services
    queries.ts               # property/dashboard reads
    auth.ts                  # demo landlord + cookie-based demo tenant
    types.ts  constants.ts  result.ts  utils.ts
    supabase/server.ts       # service-role client
```

## Forward placeholders (built but not active in Phase 1)

`agreement_status` (applications), `verification_status` (users),
`payment_provider` (payments), `access_code_delivery` (reservations),
`mobile_app_ready` (properties).

## Intentionally NOT built yet

Native mobile app, App Store deployment, DocuSign, background checks, smart
locks, Stripe live payments, notarization, SaaS subscription billing, and a
cross-landlord marketplace search.
