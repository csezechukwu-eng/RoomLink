# Room Link — Agent Plan & Task Checklist

Maintained by **lead-architect**. Status: `todo` / `in-progress` / `built` / `qa` / `done`.

## Reality check (audit)
The app is **already far along** — Phases 1–5 are substantially built. The
multi-agent process governs **new work and hardening** going forward, not a
greenfield rebuild.

| Phase | Area | Owner(s) | Status |
|---|---|---|---|
| 0 | Audit + agent setup | lead-architect | **done** |
| 1 | Foundation: auth, ownership, schema, RLS, public reads, app inserts | database-auth | **built** → needs QA sign-off |
| 2 | Landlord property mgmt (properties/rooms/beds/status/rent/photos) | landlord-ui | **built** → QA |
| 3 | Applications (public apply, inbox, detail, approve→reservation) | db-auth + landlord-ui + tenant-public | **built** → QA |
| 4 | Reservations & rent tracking | db-auth + landlord-ui | **built** → QA |
| 5 | Announcements, messages, maintenance | db-auth + landlord-ui + tenant-public | **built** → QA |
| 6 | Lease signing (upload → prepare → in-app sign) | all | **in-progress** |

## Phase 1 verification (database-auth-agent) — findings
- ✅ Auth: real Supabase Auth + `DEMO_MODE` bypass (non-production only).
- ✅ Ownership: `properties.owner_id`; all domain tables scoped by owner.
- ✅ Schema: migrations `0001`–`0012` (properties, rooms, beds, applications,
  reservations, rent_charges, payments, announcements, messages,
  maintenance_requests, property_media, leases [deprecated], lease_documents).
- ✅ RLS: enabled on every table with `owners_{select,insert,update,delete}_own_*`
  policies (`0003` + per-feature). Storage: `property-media` public,
  `lease-documents` private with owner-folder policies.
- ⚠️ Public availability + public application insert are mediated **server-side
  via the service role with explicit validation/scope** (not anon RLS). This is
  intentional; keep ownership checks before returning data. Action item: keep an
  eye that no service-role client is ever imported into client code.
- ⚠️ `supabase/demo-local.sql` disables RLS — **local demo only**, never prod.

## Phase 6 — active work (sequenced, NOT fully parallel; cross-cutting)
1. `database-auth` — additive migration + service: `lease_templates` table
   (blank PDF + reusable `signature_fields`), `lease_documents.lease_template_id`
   + `signed_file_path`/`signature_fields`; service/actions for template save +
   create-from-template + signature stamping (pdf-lib, server-side).
2. `landlord-ui` — "Review & Sign" preview (render PDF, place/auto-apply landlord
   signature, confirm-before-send), and template picker in Prepare Lease.
3. `tenant-public` — mirror placement on `/sign/[id]` (signed PDF + tenant box).
4. `qa-integration` — verify after each step.

## Parallelization right now (non-overlapping scopes)
- **qa-integration**: audit current build (read-only) — anytime.
- **landlord-ui**: isolated landlord polish under `(landlord)/**` + `components/host/**`.
- **tenant-public**: public availability/apply polish under `(public)/**`.
- **database-auth**: schema/service work alone when assigned.
- ❌ The lease preview/template feature is cross-cutting (DB → landlord UI →
  tenant) and must be **sequenced**, not run in parallel on the same files.

## Hard rules (all agents)
No destructive migrations / RLS disable without approval · no service-role in
client code · no fake data in prod paths · stay in scope · shared files
(`lib/types.ts`, `components/ui/**`, `components/nav/**`, `middleware.ts`,
`seed.sql`) need lead-architect sign-off · every task ends with files changed /
built / not built / how to test / risks.
