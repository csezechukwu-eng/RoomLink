# Landlord Onboarding — Claude Code Build Prompts (Part 1)

Run these **in order** in Claude Code. Each prompt is self‑contained, but keep the
**Shared Context** block (Prompt 0) pasted at the top of every session so Claude
reuses the right code instead of reinventing it.

Confirmed product decisions encoded throughout:
- **Full working 6‑step flow.**
- **Guide, don't gate** — redirect new signups into onboarding, prominent
  "Save & finish later", resumable, dashboard resume banner until complete.
- **Real identity verification** via **Stripe Identity** (Stripe is already wired for
  Connect), kept separate from payout KYC.
- Calm, branded (indigo), Airbnb‑patterned. Every step has a wired‑but‑empty **hint
  slot** for Part‑2 "funny hints" — do not write that copy yet.

---

## Prompt 0 — Shared Context (paste at the top of every session)

```
You are my senior full-stack product engineer for RoomLink.

We are building Airbnb-inspired LANDLORD onboarding. Focus ONLY on landlord
onboarding. Do NOT touch tenant onboarding, tenant checkout, or rent collection.
Do NOT build unrelated features.

STACK & CONVENTIONS (reuse these — do not reinvent):
- Next.js 15 App Router, React 19, TypeScript (strict), src/ dir, "@/*" -> "./src/*".
- Tailwind v4 CSS-first (no tailwind.config.js). Brand tokens in src/app/globals.css:
  --primary indigo-600 (#6366F1); status tones emerald/amber/red/blue; bg-slate-50,
  text-slate-900, Inter font.
- UI primitives: src/components/ui/{button,card,input,textarea,select,label,badge,modal}.tsx
  and src/components/FormField.tsx. Button variants: primary|secondary|outline|ghost|danger.
- Forms = Server Actions + useActionState. Helpers in src/lib/actions/_shared.ts and
  src/lib/actions/types.ts: ActionState, initialActionState, successState, errorState,
  messageFrom, str/optionalStr/num, assertPropertyOwned, revalidateApp/revalidateLandlord.
  Use src/components/forms/SubmitButton.tsx + src/components/forms/FormAlert.tsx.
- Auth: src/lib/auth.ts -> getCurrentUser, getCurrentOwnerId, requireCurrentUser,
  isDemoMode, DEMO_OWNER_ID. Supabase clients: src/lib/supabase/{server,browser,admin}.ts
  (createAuthenticatedClient, getServiceClient, isServiceRoleConfigured, getAuthUser).
  IMPORTANT: in write actions, read owner id from supabase.auth.getUser() for RLS
  (see src/lib/actions/properties.ts createProperty), and support DEMO_MODE.
- Stepper UX reference: src/components/forms/MultiStepApplyForm.tsx (indigo circles +
  checkmarks + connectors), including its indigo "Why we ask?" hint box — reuse that
  visual style for the onboarding hint slot.

REUSE THESE EXISTING ENGINES (do not rebuild):
- Stripe Connect payouts: src/lib/actions/stripeConnect.ts
  (createStripeOnboardingLinkAction, getStripeConnectStatusAction,
  refreshStripeConnectStatusAction, createStripeDashboardLinkAction, ConnectStatusData)
  + 5% host-fee explainer UI in src/app/(landlord)/dashboard/settings/page.tsx (PricingSettings).
- Photos: src/components/PhotoUpload.tsx + src/lib/actions/media.ts (uploadMedia, plus
  the delete/set-cover actions used by the property detail page).
- Property/room/bed: src/lib/actions/properties.ts, rooms.ts, beds.ts
  (createProperty, updateProperty, togglePropertyVisibility, createRoom, createBed).
- Share Listing (View Live Listing / Copy Link / QR): src/components/host/ShareListingPanel.tsx.
- Public listing lives at /availability/[propertyId]; "publish" = properties.is_hidden=false.

ROUTE: the flow lives at /onboarding/landlord in its OWN route group with a focused
full-screen layout (NO dashboard sidebar), so it cannot be under (landlord)/dashboard.

GUARDRAILS for every change:
- Three readiness states per setup item: "Required to publish", "Required to get paid",
  "Recommended to attract tenants". Always show what's missing and why — never hide
  blocked actions without explanation.
- Drafts save and resume; never lose entered data. Progress is DERIVED from real data.
- Keep copy short, calm, clear. Leave an empty hint slot per step for Part-2 funny copy.
- After each prompt: run `pnpm run typecheck`, `pnpm run lint`, `pnpm run build` and fix
  issues. End with a short report: files changed, what to test, exact URL.
```

---

## Prompt 1 — Data model, types, and the derived onboarding-state engine

```
Build the data foundation for landlord onboarding. No UI yet.

1) MIGRATION: create supabase/migrations/0029_landlord_onboarding.sql using the
   existing idempotent style (`alter table ... add column if not exists`). Add:
   - public.users: display_name text, landlord_type text, emergency_contact_name text,
     emergency_contact_phone text, avatar_url text, identity_verification_session_id text,
     identity_verified_at timestamptz, authority_attested_at timestamptz,
     compliance_ack_at timestamptz, onboarding_completed_at timestamptz,
     onboarding_draft_property_id uuid, onboarding_dismissed boolean not null default false.
     (Reuse the existing verification_status enum for identity; all stripe_connect_* columns
     already exist — do not duplicate.)
   - public.properties: furnished boolean not null default false,
     utilities_included boolean not null default false, wifi boolean not null default false,
     laundry text, parking text, neighborhood text.
   Do NOT run/apply the migration — I will apply it to Supabase myself.

2) TYPES: extend the User and Property interfaces in src/lib/types.ts with the new fields.

3) CONTENT CONFIG: create src/lib/onboarding/content.ts exporting an ordered STEPS array.
   Each step: { key, title, subtitle, timeEstimate, requirement: 'publish'|'payout'|'recommended',
   hint: "" }  // hint intentionally empty — Part 2 fills these in.
   Steps in order: welcome, account, identity, payouts, property, listing, publish.
   Also export per-field hint placeholders as empty strings where helpful.

4) STATE ENGINE: create src/lib/onboarding/state.ts exporting
   getLandlordOnboardingState(): reads the current user, their draft/most-recent property,
   its rooms/beds and property_media, plus Stripe Connect status and identity status, and
   returns a typed object: { steps: {key, status: 'complete'|'incomplete'|'blocked', blockers: string[]}[],
   readiness: { publishReady: bool, payoutReady: bool, recommendedRemaining: number },
   firstIncompleteStepKey, percentComplete, draftPropertyId }.
   Derive everything from real data (endowed-progress model). Support DEMO_MODE with a
   sensible mock. This is the single source of truth used later by the shell, readiness
   panel, publish gate, and dashboard banner.

Then run typecheck/lint/build and report.
```

---

## Prompt 2 — Focused layout, onboarding shell, stepper, readiness panel, routing

```
Build the onboarding shell and wire routing. Steps render as labeled placeholders for now.

1) LAYOUT: src/app/(onboarding)/layout.tsx — minimal full-screen chrome: top bar with the
   RoomLink wordmark on the left and a "Save & exit" link (-> /dashboard) on the right;
   calm bg-slate-50; centered max-w container. NO LandlordNav/sidebar.

2) PAGE: src/app/(onboarding)/onboarding/landlord/page.tsx — server component. Call
   requireCurrentUser() and getLandlordOnboardingState(). Active step from ?step= search
   param, defaulting to firstIncompleteStepKey (welcome if nothing started). Render
   <OnboardingShell/> with the state + active step.

3) COMPONENTS in src/components/onboarding/:
   - OnboardingShell.tsx (client): layout grid — left = OnboardingStepper + ReadinessPanel
     (desktop) / collapsible top progress (mobile); center = active step content + sticky
     footer (Back / Save & continue) + thin bottom progress bar. Manages active step via the
     ?step= param; "Save & continue" advances to the next step, "Save & exit" -> /dashboard.
   - OnboardingStepper.tsx: vertical list of the 6 steps with complete/current/upcoming
     states and per-step requirement badges; mirror MultiStepApplyForm's indigo circle +
     checkmark style. Mobile: "Step N of 6" + progress bar.
   - ReadinessPanel.tsx: three live buckets — Required to publish / Required to get paid /
     Recommended — each listing its items with status chips (emerald/amber/slate). Shows
     publishReady and payoutReady booleans plainly.
   - StepHintSlot.tsx: renders content.ts hint for a step (styled like the indigo
     "Why we ask?" box). Renders nothing when the hint is "". This is the Part-2 slot.
   - WelcomeScreen.tsx: value framing, "~10–12 minutes for the basics", what they'll set up
     (Account, Identity, Payouts, Property, Listing, Publish), prominent "Save & finish later",
     primary "Get started" -> ?step=account.
   - Placeholder step panels: AccountStep, IdentityStep, PayoutsStep, PropertyStep,
     ListingStep, PublishStep (each a titled Card with its StepHintSlot; real content added
     in later prompts).

4) ROUTING:
   - middleware.ts: add "/onboarding" to PROTECTED_ROUTES.
   - src/lib/actions/auth.ts: change signUp() success redirect from "/dashboard" to
     "/onboarding/landlord". Leave signIn() -> "/dashboard".

Run typecheck/lint/build. Report the URL to test (/onboarding/landlord) and confirm the
shell, stepper, readiness panel, save & exit, and step deep-linking all work.
```

---

## Prompt 3 — Step 1: Account Setup (profile + photo)

```
Implement Step 1 "Account Setup" (Required to publish).

1) ACTION: in a new src/lib/actions/onboarding.ts add updateLandlordProfileAction
   (ActionState signature). Upsert the public.users row (pattern: see signature.ts upsert)
   with full_name (legal name), display_name, phone, landlord_type
   (individual|company|property_manager), emergency_contact_name, emergency_contact_phone.
   Read owner id from supabase.auth.getUser() for RLS; support DEMO_MODE. Validate required
   fields (full_name, phone, landlord_type) with fieldErrors. revalidateApp() on success.

2) UI: build AccountStep.tsx using FormField + Input/Select, useActionState +
   updateLandlordProfileAction + SubmitButton + FormAlert. Email shows read-only with a
   confirmation badge derived from the auth user's email_confirmed_at. Profile photo is
   RECOMMENDED (not required) — provide an upload that stores to users.avatar_url (reuse the
   property-media storage bucket under a {user_id}/avatar/ path; add a small server action if
   needed and confirm the storage policy allows the {user_id}/ prefix). Mark required vs
   recommended fields visibly. Include the StepHintSlot.

Run typecheck/lint/build. Report what to test on ?step=account.
```

---

## Prompt 4 — Step 2: Identity & Authority (real Stripe Identity)

```
Implement Step 2 "Identity & Authority" (Required to publish) with REAL Stripe Identity.
Reuse the existing Stripe SDK setup from src/lib/stripe/connect.ts. Mirror the defensive,
DEMO_MODE-aware patterns in src/lib/actions/stripeConnect.ts. Never fake a verified state.

1) src/lib/stripe/identity.ts: createIdentityVerificationSession(userId, returnUrl) using
   stripe.identity.verificationSessions.create({ type: 'document', metadata, return_url });
   getIdentityVerificationStatus(sessionId). Return the hosted session url + status.

2) src/lib/actions/identity.ts: createIdentityVerificationAction (creates/reuses a session,
   stores users.identity_verification_session_id, returns the url), refreshIdentityStatusAction
   (pulls status from Stripe, maps to verification_status unverified|pending|verified, sets
   identity_verified_at), getIdentityStatusAction. Graceful errors if Identity isn't enabled
   on the account; mock in DEMO_MODE.

3) RETURN ROUTE: src/app/api/identity/return/route.ts — mirror app/api/stripe-connect/return:
   refresh status, then redirect to /onboarding/landlord?step=identity.

4) WEBHOOK: extend src/app/api/webhooks/stripe/route.ts to handle
   identity.verification_session.{verified,requires_input,canceled}: update users
   verification_status + identity_verified_at by stored session id.

5) UI: IdentityStep.tsx — a "Verify your identity" card with a plain-English status chip
   (Not started / Pending / Verified / Action needed) and a button that calls
   createIdentityVerificationAction then redirects to the hosted url; on return show refreshed
   status. Plus an AUTHORITY ATTESTATION checkbox ("I own or am authorized to manage this
   property and will list it lawfully") -> saveAuthorityAttestationAction sets
   authority_attested_at. Both feed the publish-readiness blockers. Include StepHintSlot.

Run typecheck/lint/build. Report what to test on ?step=identity (use Stripe test mode).
```

---

## Prompt 5 — Step 3: Pricing & Payouts (reuse Stripe Connect)

```
Implement Step 3 "Pricing & Payouts" (Required to get paid) by REUSING the existing Stripe
Connect engine — do not rebuild it.

Build PayoutsStep.tsx that uses getStripeConnectStatusAction / createStripeOnboardingLinkAction
/ refreshStripeConnectStatusAction / createStripeDashboardLinkAction from
src/lib/actions/stripeConnect.ts, and reuses the 5% host-fee explainer + status-card UI from
PricingSettings in src/app/(landlord)/dashboard/settings/page.tsx (extract a shared component
if cleaner). Show plain-English status: Not connected / Action needed / Pending review / Ready.
This blocks payout-readiness only, NOT publish — make that explicit in the readiness panel.
Include the StepHintSlot.

Run typecheck/lint/build. Report what to test on ?step=payouts.
```

---

## Prompt 6 — Step 4: Property Basics & Monthly Offer

```
Implement Step 4 "Property Basics & Monthly Offer" (Required to publish). Reuse the property/
room/bed actions; create a minimum viable listing (1 property + 1 room + 1 bed).

1) On first save, create the draft property via createProperty (or update if it exists), and
   store users.onboarding_draft_property_id (add a small action in onboarding.ts if needed).
   Collect: listing title (properties.name), property_type, address/city/state/zip,
   occupancy_type, description, and amenity indicators (furnished, utilities_included, wifi,
   laundry, parking) + move-in default_min_stay_days. Add updatePropertyListingAction in
   onboarding.ts for the new amenity/neighborhood columns (or extend updateProperty).
2) Create one room (createRoom) and one bed (createBed) capturing monthly_rent,
   deposit_amount, available_from, min/max stay. Keep it light — multi-room setup stays in the
   dashboard.
3) UI: PropertyStep.tsx with FormField/Input/Select/Textarea, useActionState, SubmitButton,
   FormAlert. Required-to-publish: name, property_type, address, and at least one bed with
   monthly_rent. Show required vs recommended. Resumes from saved draft. Include StepHintSlot.

Run typecheck/lint/build. Report what to test on ?step=property.
```

---

## Prompt 7 — Step 5: Listing Content (reuse PhotoUpload)

```
Implement Step 5 "Listing Content". Cover photo + minimum photos are Required to publish; the
rest is Recommended.

Build ListingStep.tsx reusing src/components/PhotoUpload.tsx wired to the media actions in
src/lib/actions/media.ts (mediaType "property", using the draft property id). Gate: require a
cover photo + at least 3 photos before publish (surface this in the readiness blockers).
Add fields: title (properties.name), description, neighborhood/transit (properties.neighborhood),
and suitability/atmosphere (recommended). Provide calm, short inline writing/photo guidance and
include the StepHintSlot for Part-2 funnies. Persist via updatePropertyListingAction.

Run typecheck/lint/build. Report what to test on ?step=listing.
```

---

## Prompt 8 — Step 6: Rules & Publish + Completion + Dashboard resume banner

```
Implement Step 6 "Rules, Safety & Publish", the completion screen, and the dashboard resume
banner.

1) PublishStep.tsx:
   - House rules: a few common toggles (quiet hours, smoking, pets, guest policy) that compose
     into properties.house_rules text, plus a free-text area. A compliance acknowledgement
     checkbox -> saveComplianceAckAction sets users.compliance_ack_at.
   - Review: a tenant-facing preview link to /availability/[draftPropertyId], a readiness meter
     (required vs recommended) and an explicit blockers list from getLandlordOnboardingState().
   - Publish button: enabled ONLY when all required-to-publish items pass. publishListingAction
     (onboarding.ts) re-checks the gate server-side, calls togglePropertyVisibility(is_hidden=false),
     and sets users.onboarding_completed_at. If blocked, show exactly which items remain.
   - After publish, render the existing src/components/host/ShareListingPanel.tsx
     (View Live Listing / Copy Link / Create QR Code). If not yet published, show it disabled
     with the reason.

2) CompletionPanel.tsx ("What happens next"): live status, payout readiness, share actions,
   ranked Recommended improvements, and a single clear "next best action", then "Go to dashboard".

3) Dashboard resume banner: in src/app/(landlord)/dashboard/page.tsx, when
   onboarding_completed_at is null and onboarding_dismissed is false, show a calm checklist
   banner (driven by getLandlordOnboardingState) linking to /onboarding/landlord at the first
   incomplete step, with a "dismiss" that calls dismissOnboardingAction.

Run typecheck/lint/build. Report what to test on ?step=publish and on /dashboard.
```

---

## Prompt 9 — Final QA pass

```
Do a full QA pass on landlord onboarding. Run `pnpm run typecheck`, `pnpm run lint`, and
`pnpm run build`; fix everything. Then, with DEMO_MODE=true, walk /onboarding/landlord end to
end and verify:
- Welcome -> all 6 steps -> publish -> completion.
- Stepper %/chips and the three readiness buckets update correctly.
- Save & exit then return resumes at the right step with no data loss.
- Publish stays blocked until identity + attestation + property basics + a bed with rent +
  cover photo + >=3 photos exist, and the blockers list says exactly why.
- Share panel + QR appear after publish; dashboard shows the resume banner before completion
  and the activation/next-best-action state after.
- Stripe Connect and Stripe Identity both degrade gracefully when unconfigured.
Report a short pass/fail checklist and any follow-ups for Part 2 (funny-hint copy only).
```

---

### Notes
- Path differs from the source PDF (`/dashboard/onboarding/landlord`): we use
  `/onboarding/landlord` so the flow gets Airbnb-style full-screen chrome (a `/dashboard/*`
  route inherits the sidebar). Swap back by moving the route under `(landlord)/dashboard` and
  conditionally hiding `LandlordNav` if you prefer the original.
- Apply `supabase/migrations/0029_landlord_onboarding.sql` to your Supabase project before
  testing the steps that read/write the new columns.
- Part 2 = fill in the `hint` strings in `src/lib/onboarding/content.ts`. No layout changes.
```
