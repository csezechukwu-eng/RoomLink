# RoomLink — Multi-Agent Build Plan & Coordination Map

> Maintained by the **lead-architect** agent. Single source of truth for
> who-owns-what, build order, and the live task checklist. Worker agents read
> this before starting. Update the checklist after every completed task; do not
> let it drift.

---

## 0. How this repo is ACTUALLY laid out (audited 2026-06-18)

The original brief assumed paths like `app/dashboard/**`, `components/landlord/**`,
`database/migrations/**`. The repo does **not** use those. Real layout:

- App Router with **route groups**, everything under `src/`:
  - `src/app/(auth)/` — `login`, `signup`
  - `src/app/(landlord)/dashboard/**` — landlord dashboard (NOT `app/dashboard/**`)
  - `src/app/(public)/**` — landing, `availability`, `availability/[propertyId]`, `apply/[bedId]`
  - `src/app/(tenant)/tenant/**` — tenant portal (minimal scaffold)
- **No `app/api/**`** — data flows through Server Actions + a services layer.
- Components are **feature-grouped / flat** under `src/components/**` (NOT
  `components/landlord|properties|rooms|beds|public|tenant`). Many are shared.
- Data layer:
  - `src/lib/supabase/{server,admin,browser}.ts` — Supabase clients
  - `src/lib/actions/**` — Server Actions (authenticated client → **RLS enforced**)
  - `src/lib/services/**` — business logic (service-role client → **RLS bypassed**)
  - `src/lib/queries.ts` — landlord reads (authenticated client)
  - `supabase/migrations/0001..0007`, `supabase/seed.sql`
- Tooling: **pnpm**. Scripts: `dev`, `build`, `start`, `lint`, `typecheck`.
  **No test script / no test runner yet.**

---

## 1. Audit findings (Phase 0)

State: **further along than the brief assumes** — roughly Phase 2 complete,
Phase 3 partially in place. This is a *verify / harden / fill gaps* effort, not
greenfield.

- **Auth** — Real Supabase Auth implemented (`src/lib/actions/auth.ts`,
  `createAuthenticatedClient`). Demo mode is safely gated: only when
  `DEMO_MODE=true` **and** `NODE_ENV !== "production"` (`src/lib/auth.ts`).
- **RLS** — Comprehensive owner-based policies exist (`0003_rls_policies.sql`):
  `owner_id = auth.uid()` on `properties`; child tables enforced via
  `property_id → properties.owner_id`. Public `anon` may SELECT
  properties/rooms/beds and INSERT applications.
- **🔴 CRITICAL — split data layer (#1 risk):**
  - `src/lib/actions/*` (properties, rooms, beds, media, auth) + `queries.ts`
    use the **authenticated client → RLS enforced**. ✅ correct pattern.
  - `src/lib/services/*` (applications, reservations, rent, messages,
    announcements, maintenance, availability, users) use **`getServiceClient()`
    → BYPASSES RLS**, relying on app-level `owner_id` filtering instead.
    `getServiceClient` is marked `@deprecated`.
  - Not necessarily a live data leak, but RLS is **not** the enforcement
    boundary for those tables → fragile. Reconciliation (move services onto the
    authenticated client) requires a plan + approval. **No migration without
    explicit approval.**
- **🟢 Mock data** — Clean. Only the gated demo mode and a clearly-labeled
  landlord "Preview Mode" page (`dashboard/applications/preview`). No fake data
  powering real pages.
- **🟡 Rule conflict** — `src/app/(landlord)/dashboard/rooms/` (a standalone
  Rooms page) already exists, conflicting with the "no separate Rooms & Beds
  sidebar page" rule. **Decision needed:** remove/redirect into property detail,
  or keep.
- **Extra pages beyond MVP** already present: `dashboard/tenants`,
  `dashboard/reports`, `dashboard/settings`. Verify none are powered by stubs.

---

## 2. Ownership map (canonical — map scopes to these REAL paths)

| Area | Owner | Primary paths |
| --- | --- | --- |
| DB schema / RLS / migrations / seed | **database-auth-agent** | `supabase/**` |
| Supabase clients | **database-auth-agent** | `src/lib/supabase/**` |
| Services (business logic) | **database-auth-agent** | `src/lib/services/**` |
| Server actions (data mutations) | **database-auth-agent** | `src/lib/actions/*.ts` |
| Landlord reads | **database-auth-agent** | `src/lib/queries.ts` |
| DB row types | **database-auth-agent** (primary) | `src/lib/types.ts` |
| Landlord dashboard routes | **landlord-ui-agent** | `src/app/(landlord)/**` |
| Auth pages (login/signup UI) | **landlord-ui-agent** | `src/app/(auth)/**` |
| Landlord-only components | **landlord-ui-agent** | `PropertyCard`, `RoomAccordionCard`, `RoomSection`, `BedCard`, `PhotoUpload`, `PropertyPhotosSection`, `nav/LandlordNav`, `nav/Sidebar`, `components/{applications,reservations,rent,maintenance,messages}/**`, landlord form modals (`PropertyFormModal`, `RoomFormModal`, `BedFormModal`, `AnnouncementFormModal`, `InlineStatusSelect`, `BedStatusSelect`, `InlineActionButton`, `ConfirmDeleteButton`, `MessageComposer`) |
| Public + tenant routes | **tenant-public-agent** | `src/app/(public)/**`, `src/app/(tenant)/**` |
| Public/tenant components | **tenant-public-agent** | `availability/AvailabilityCard`, `nav/PublicNav`, `nav/TenantNav`, public forms (`ApplyForm`, `MultiStepApplyForm`, `ApplicationForm`, `TenantMaintenanceForm`) |
| Review / checks (read-only) | **qa-integration-agent** | entire repo, no writes |

---

## 3. Shared / hotspot files — **lead-architect coordination REQUIRED**

Any change to these needs a heads-up to lead-architect first (two agents are
likely to want them):

- Design primitives: `src/components/ui/**`
- Cross-area display: `StatusBadge`, `StatusPill`, `EmptyState`, `ErrorState`,
  `LoadingState`, `PageHeader`, `FormField`, `SummaryCard`
- Shared libs: `src/lib/types.ts`, `src/lib/constants.ts`, `src/lib/result.ts`,
  `src/lib/utils.ts`, `src/lib/actions/_shared.ts`, `src/lib/actions/types.ts`
- Root: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/error.tsx`,
  `src/app/not-found.tsx`
- Seams used by two areas: `ApplicationForm` (public submit + landlord preview),
  `src/lib/actions/applications.ts` (UI ↔ data)

**Rule:** Need a file outside your primary scope, or any file above? STOP. Post
the request to lead-architect. Do not edit it unilaterally.

---

## 4. Phase plan + status

| Phase | Scope | Status |
| --- | --- | --- |
| 0 — Audit & agent setup | inspect, create agents, build order | ✅ done |
| 1 — Foundation (backend) | auth, ownership, schema, RLS, public reads, app insert | 🟢 mostly built — needs **verification** + RLS-split decision |
| 2 — Landlord property mgmt | property/room/bed CRUD, statuses, photos | 🟢 substantially built — needs verification + polish |
| 3 — Applications | public form, submission, inbox, detail, approve/deny | 🟡 partially built |
| 4 — Reservations & rent | reservation status, deposit, rent due, paid/unpaid | ⏸️ pages exist; do NOT extend until 1–3 pass QA |
| 5 — Comms & maintenance | announcements, messages, maintenance | ⏸️ pages exist; gated behind Phase 4 |
| 6 — Lease signing (DocuSign-style) | upload, fillable fields, sign, download | ⛔ not started; treat legal/notary separately |

---

## 5. Live task checklist

### Phase 1 — Foundation verification (database-auth-agent)
- [ ] Confirm Supabase Auth end-to-end (signup → session → dashboard).
- [ ] Confirm ownership model `owner_id = auth.uid()` holds across all tables.
- [ ] Confirm RLS policies present & correct (done at audit; re-verify live).
- [ ] **Decide + plan** the service-role → authenticated-client reconciliation
      for `src/lib/services/*`. Migration only **after approval**.
- [ ] Confirm public availability reads expose **safe** columns only.
- [ ] Confirm anonymous application INSERT path is safe (no privilege bleed).
- [ ] Output: files changed, migration summary, RLS summary, risks, test steps.

### Phase 0 — Agent setup
- [x] Repo audited.
- [x] `.claude/agents/*` created (5 agents).
- [x] Ownership map + build order produced.

---

## 6. What can run in parallel RIGHT NOW

- ✅ **database-auth-agent** — Phase 1 verification (read-only first; the
  reconciliation migration waits for approval).
- ✅ **qa-integration-agent** — baseline health (`pnpm lint`, `pnpm typecheck`,
  `pnpm build`), mock-data scan, route/link inventory.
- ⏸️ **landlord-ui-agent** & **tenant-public-agent** — may read + draft mini-plans
  in parallel, but **no writes** until Phase 1 verification confirms the data
  contracts. They depend on the backend, so building now risks rework.

These two read-only workstreams do not overlap on any writable file → safe to
run together.
