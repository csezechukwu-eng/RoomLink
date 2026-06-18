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
| 6 — Lease signing (DocuSign-style) | upload, fillable fields, sign, download | 🟡 **spec'd in §7**; **NO code in this branch yet** — treat legal/notary separately |

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

---

## 7. Phase 6 — E-signature pipeline (detailed spec)

> Status: **not implemented in this branch.** Any local debugging the owner has
> done is not pushed here. These agents either debug that code once pushed, or
> build the feature fresh against this spec. Legal/notary is explicitly out.

### Goal (owner's words, restated)
Landlord uploads a scannable lease → drag-and-drops signature/initial/date/text
fields onto it and assigns them to the tenant → the landlord's own uploaded
signature auto-fills landlord fields (no manual re-signing) → the layout
auto-saves as a **reusable template** that keeps the **placeholders only, not the
tenant signature** → a tenant signs their fields → a final flattened PDF is
produced for the landlord to view/download.

### Steps → agents
1. Upload + render scannable doc ┐
2. Drag-drop fields + assign      ├─ **esign-template-builder-agent**
3. Auto-save reusable template   ┘
4. Reusable landlord signature ──── **esign-signature-agent**
5. Tenant signing experience ────── **esign-signing-agent**
6. Flatten/merge + view/download ── **esign-render-export-agent**
Schema/RLS/storage for all of the above ── **database-auth-agent** (sole DB owner)
Coordination + sequencing ── **lead-architect** · Verification ── **qa-integration-agent**

### THE integration contract — coordinate system (prevents the #1 bug)
Every field is stored normalized, **top-left origin**, as fractions of its page:
`{ page_index, x, y, width, height }` in `[0,1]`. Render = multiply by displayed
page size. Export (pdf-lib, **bottom-left** origin, points): flip Y →
`pdfX = x*W`, `pdfY = H - (y+h)*H`, `w = width*W`, `h = height*H`. Never store raw
pixels at a specific zoom. **A drag-drop signature that "lands in the wrong
place / is flipped" is almost always a violation of this contract.**

### Data model (owned by database-auth-agent; draft — confirm before migrating)
- `documents` — uploaded source file (owner_id, storage_path, page_count, …)
- `document_templates` — reusable: references a `document`, holds recipient roles
  and the **placeholder** field set. **No tenant data.**
- `document_fields` — per template/instance: `template_id` (or `signing_request_id`),
  `page_index`, normalized `x,y,width,height`, `type` (signature|initial|date|text),
  `recipient_role` (landlord|tenant), `required`
- `signatures` — landlord's reusable signatures (owner-private; image in private bucket)
- `signing_requests` — a per-tenant INSTANCE of a template: `token`, `status`,
  signer identity, expiry. Holds the tenant's field **values** (instance-only).
- `signed_documents` — the final flattened PDF (storage_path, completed_at, audit)

### Storage + RLS rules (database-auth-agent)
- Buckets are **private**; access via short-lived signed URLs only.
- Landlord signature images: owner-scoped, never public, never reused across owners.
- Tenant signing access: by validated `signing_requests.token` (server-side) or
  tenant RLS — a signer reads only their own request. No cross-tenant access.
- Tenant signature is written to the signing instance / final doc only — **never**
  to `document_templates` or `signatures`.

### Recommended libraries (decision — override if you prefer)
- Render: `pdfjs-dist` (or `react-pdf`). Manipulate/flatten: `pdf-lib`.
- Signature capture: `signature_pad` (or a small hand-rolled canvas).
- Drag: pointer/drag events are enough; a DnD lib is optional, not required.

### Ownership additions + scope carve-outs
- `src/app/(landlord)/dashboard/documents/**` → **esign-template-builder-agent**
  (carved OUT of landlord-ui-agent). Final-doc download piece → render-export.
- `src/app/(public)/sign/[token]/**` → **esign-signing-agent** (carved OUT of
  tenant-public-agent).
- `src/components/documents/**`: `builder/**` (builder), `viewer/**` (builder,
  **SHARED**), `signature/**` (signature), `signing/**` (signing).
- `src/lib/esign/**`: pure feature logic only (coords, render, flatten, export,
  signature normalization) — **no Supabase calls**. All table reads/writes are
  database-auth-agent's `src/lib/{services,actions}/documents.ts`.
- `src/lib/esign/types.ts` → **SHARED hotspot** (the field/recipient/template/
  instance types) — lead-architect coordinates changes.

### Parallelization for Phase 6
- **First, serially:** database-auth-agent lands the schema + storage + RLS +
  data-access stubs (everything else depends on it), with approval before any
  migration. In parallel during this, the e-sign agents may read + draft
  mini-plans, no writes.
- **Then, in parallel (non-overlapping files):** builder (`builder/**`+`viewer/**`),
  signature (`signature/**`), render-export (`flatten/export`). signing
  (`signing/**`) can start once `viewer/**` exposes a stable read-only API.
- qa-integration-agent gates each merge with the e-sign security checks below.

### E-sign QA checks (add to qa-integration-agent's review)
- A field placed at zoom A renders correctly at zoom B and after reload.
- Exported PDF places every signature correctly on single- AND multi-page docs
  (Y-flip correct).
- Saving a template persists placeholders only — assert no tenant signature/value.
- A wrong/expired token (or other tenant) cannot load a signing request.
- Signature images are not publicly reachable (no public URL; signed-URL only).

### If debugging existing code: look here first
Classic failure modes for this exact feature, in order of likelihood:
1. **Coordinate mismatch / missing Y-flip** — placed in DOM (top-left px) but
   exported in PDF points (bottom-left) → offset/flipped signatures.
2. **Zoom/scale drift** — overlay uses a different scale than the pdf.js viewport.
3. **Stale React state on auto-save** — saving before field state commits →
   empty/duplicated placeholders, or accidentally capturing a tenant value.
4. **Storage/RLS** — expired or public signed URL → 403/blank when stamping the
   signature image.

### Phase 6 checklist (live)
- [ ] database-auth-agent: schema + storage + RLS + data-access (approval-gated)
- [ ] esign-template-builder-agent: upload + render + place + assign + auto-save template
- [ ] esign-signature-agent: capture + private storage + reusable library + landlord auto-fill
- [ ] esign-signing-agent: token-guarded tenant signing, instance-only signature
- [ ] esign-render-export-agent: flatten/merge + view/download + completion metadata
- [ ] qa-integration-agent: e-sign security + coordinate-accuracy pass
