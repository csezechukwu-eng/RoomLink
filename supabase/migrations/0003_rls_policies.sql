-- RoomLink — Phase 1B RLS Policies
-- Secure landlord data so Landlord A cannot access Landlord B's data.
--
-- Ownership model:
--   auth.users.id → properties.owner_id → related tables via property_id
--
-- All policies use `to authenticated` to ensure only logged-in users can access.
-- Public/anonymous users cannot access landlord dashboard data.

-- ===========================================================================
-- PROPERTIES — Direct ownership via owner_id = auth.uid()
-- ===========================================================================

-- SELECT: Owners can view their own properties
create policy "owners_select_own_properties"
on public.properties
for select
to authenticated
using (owner_id = auth.uid());

-- INSERT: Authenticated users can create properties where they are the owner
create policy "owners_insert_own_properties"
on public.properties
for insert
to authenticated
with check (owner_id = auth.uid());

-- UPDATE: Owners can update their own properties
create policy "owners_update_own_properties"
on public.properties
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- DELETE: Owners can delete their own properties
create policy "owners_delete_own_properties"
on public.properties
for delete
to authenticated
using (owner_id = auth.uid());


-- ===========================================================================
-- ROOMS — Ownership via property_id → properties.owner_id
-- ===========================================================================

-- SELECT: Owners can view rooms in their own properties
create policy "owners_select_own_rooms"
on public.rooms
for select
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = rooms.property_id
    and p.owner_id = auth.uid()
  )
);

-- INSERT: Owners can add rooms to their own properties
create policy "owners_insert_own_rooms"
on public.rooms
for insert
to authenticated
with check (
  exists (
    select 1 from public.properties p
    where p.id = rooms.property_id
    and p.owner_id = auth.uid()
  )
);

-- UPDATE: Owners can update rooms in their own properties
create policy "owners_update_own_rooms"
on public.rooms
for update
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = rooms.property_id
    and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.properties p
    where p.id = rooms.property_id
    and p.owner_id = auth.uid()
  )
);

-- DELETE: Owners can delete rooms in their own properties
create policy "owners_delete_own_rooms"
on public.rooms
for delete
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = rooms.property_id
    and p.owner_id = auth.uid()
  )
);


-- ===========================================================================
-- BEDS — Ownership via property_id → properties.owner_id
-- ===========================================================================

-- SELECT: Owners can view beds in their own properties
create policy "owners_select_own_beds"
on public.beds
for select
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = beds.property_id
    and p.owner_id = auth.uid()
  )
);

-- INSERT: Owners can add beds to their own properties
create policy "owners_insert_own_beds"
on public.beds
for insert
to authenticated
with check (
  exists (
    select 1 from public.properties p
    where p.id = beds.property_id
    and p.owner_id = auth.uid()
  )
);

-- UPDATE: Owners can update beds in their own properties
create policy "owners_update_own_beds"
on public.beds
for update
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = beds.property_id
    and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.properties p
    where p.id = beds.property_id
    and p.owner_id = auth.uid()
  )
);

-- DELETE: Owners can delete beds in their own properties
create policy "owners_delete_own_beds"
on public.beds
for delete
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = beds.property_id
    and p.owner_id = auth.uid()
  )
);


-- ===========================================================================
-- PROPERTY_MEMBERS — Ownership via property_id → properties.owner_id
-- ===========================================================================

-- SELECT: Owners can view members of their own properties
create policy "owners_select_own_property_members"
on public.property_members
for select
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = property_members.property_id
    and p.owner_id = auth.uid()
  )
);

-- INSERT: Owners can add members to their own properties
create policy "owners_insert_own_property_members"
on public.property_members
for insert
to authenticated
with check (
  exists (
    select 1 from public.properties p
    where p.id = property_members.property_id
    and p.owner_id = auth.uid()
  )
);

-- UPDATE: Owners can update members of their own properties
create policy "owners_update_own_property_members"
on public.property_members
for update
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = property_members.property_id
    and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.properties p
    where p.id = property_members.property_id
    and p.owner_id = auth.uid()
  )
);

-- DELETE: Owners can remove members from their own properties
create policy "owners_delete_own_property_members"
on public.property_members
for delete
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = property_members.property_id
    and p.owner_id = auth.uid()
  )
);


-- ===========================================================================
-- APPLICATIONS — Ownership via property_id → properties.owner_id
-- ===========================================================================

-- SELECT: Owners can view applications for their own properties
create policy "owners_select_own_applications"
on public.applications
for select
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = applications.property_id
    and p.owner_id = auth.uid()
  )
);

-- INSERT: Owners can create applications for their own properties (manual entry)
create policy "owners_insert_own_applications"
on public.applications
for insert
to authenticated
with check (
  exists (
    select 1 from public.properties p
    where p.id = applications.property_id
    and p.owner_id = auth.uid()
  )
);

-- UPDATE: Owners can update applications for their own properties
create policy "owners_update_own_applications"
on public.applications
for update
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = applications.property_id
    and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.properties p
    where p.id = applications.property_id
    and p.owner_id = auth.uid()
  )
);

-- DELETE: Owners can delete applications for their own properties
create policy "owners_delete_own_applications"
on public.applications
for delete
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = applications.property_id
    and p.owner_id = auth.uid()
  )
);


-- ===========================================================================
-- RESERVATIONS — Ownership via property_id → properties.owner_id
-- ===========================================================================

-- SELECT: Owners can view reservations for their own properties
create policy "owners_select_own_reservations"
on public.reservations
for select
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = reservations.property_id
    and p.owner_id = auth.uid()
  )
);

-- INSERT: Owners can create reservations for their own properties
create policy "owners_insert_own_reservations"
on public.reservations
for insert
to authenticated
with check (
  exists (
    select 1 from public.properties p
    where p.id = reservations.property_id
    and p.owner_id = auth.uid()
  )
);

-- UPDATE: Owners can update reservations for their own properties
create policy "owners_update_own_reservations"
on public.reservations
for update
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = reservations.property_id
    and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.properties p
    where p.id = reservations.property_id
    and p.owner_id = auth.uid()
  )
);

-- DELETE: Owners can delete reservations for their own properties
create policy "owners_delete_own_reservations"
on public.reservations
for delete
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = reservations.property_id
    and p.owner_id = auth.uid()
  )
);


-- ===========================================================================
-- RENT_CHARGES — Ownership via property_id → properties.owner_id
-- ===========================================================================

-- SELECT: Owners can view rent charges for their own properties
create policy "owners_select_own_rent_charges"
on public.rent_charges
for select
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = rent_charges.property_id
    and p.owner_id = auth.uid()
  )
);

-- INSERT: Owners can create rent charges for their own properties
create policy "owners_insert_own_rent_charges"
on public.rent_charges
for insert
to authenticated
with check (
  exists (
    select 1 from public.properties p
    where p.id = rent_charges.property_id
    and p.owner_id = auth.uid()
  )
);

-- UPDATE: Owners can update rent charges for their own properties
create policy "owners_update_own_rent_charges"
on public.rent_charges
for update
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = rent_charges.property_id
    and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.properties p
    where p.id = rent_charges.property_id
    and p.owner_id = auth.uid()
  )
);

-- DELETE: Owners can delete rent charges for their own properties
create policy "owners_delete_own_rent_charges"
on public.rent_charges
for delete
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = rent_charges.property_id
    and p.owner_id = auth.uid()
  )
);


-- ===========================================================================
-- PAYMENTS — Ownership via property_id → properties.owner_id
-- Note: property_id is nullable, so we also allow access if property_id is null
-- and the payment is linked through rent_charge or reservation to an owned property
-- ===========================================================================

-- SELECT: Owners can view payments for their own properties
create policy "owners_select_own_payments"
on public.payments
for select
to authenticated
using (
  -- Direct property ownership
  (
    property_id is not null and
    exists (
      select 1 from public.properties p
      where p.id = payments.property_id
      and p.owner_id = auth.uid()
    )
  )
  or
  -- Through rent_charge → property
  (
    property_id is null and rent_charge_id is not null and
    exists (
      select 1 from public.rent_charges rc
      join public.properties p on p.id = rc.property_id
      where rc.id = payments.rent_charge_id
      and p.owner_id = auth.uid()
    )
  )
  or
  -- Through reservation → property
  (
    property_id is null and rent_charge_id is null and reservation_id is not null and
    exists (
      select 1 from public.reservations r
      join public.properties p on p.id = r.property_id
      where r.id = payments.reservation_id
      and p.owner_id = auth.uid()
    )
  )
);

-- INSERT: Owners can create payments for their own properties
create policy "owners_insert_own_payments"
on public.payments
for insert
to authenticated
with check (
  -- Direct property ownership
  (
    property_id is not null and
    exists (
      select 1 from public.properties p
      where p.id = payments.property_id
      and p.owner_id = auth.uid()
    )
  )
  or
  -- Through rent_charge → property
  (
    property_id is null and rent_charge_id is not null and
    exists (
      select 1 from public.rent_charges rc
      join public.properties p on p.id = rc.property_id
      where rc.id = payments.rent_charge_id
      and p.owner_id = auth.uid()
    )
  )
  or
  -- Through reservation → property
  (
    property_id is null and rent_charge_id is null and reservation_id is not null and
    exists (
      select 1 from public.reservations r
      join public.properties p on p.id = r.property_id
      where r.id = payments.reservation_id
      and p.owner_id = auth.uid()
    )
  )
);

-- UPDATE: Owners can update payments for their own properties
create policy "owners_update_own_payments"
on public.payments
for update
to authenticated
using (
  (
    property_id is not null and
    exists (
      select 1 from public.properties p
      where p.id = payments.property_id
      and p.owner_id = auth.uid()
    )
  )
  or
  (
    property_id is null and rent_charge_id is not null and
    exists (
      select 1 from public.rent_charges rc
      join public.properties p on p.id = rc.property_id
      where rc.id = payments.rent_charge_id
      and p.owner_id = auth.uid()
    )
  )
  or
  (
    property_id is null and rent_charge_id is null and reservation_id is not null and
    exists (
      select 1 from public.reservations r
      join public.properties p on p.id = r.property_id
      where r.id = payments.reservation_id
      and p.owner_id = auth.uid()
    )
  )
)
with check (
  (
    property_id is not null and
    exists (
      select 1 from public.properties p
      where p.id = payments.property_id
      and p.owner_id = auth.uid()
    )
  )
  or
  (
    property_id is null and rent_charge_id is not null and
    exists (
      select 1 from public.rent_charges rc
      join public.properties p on p.id = rc.property_id
      where rc.id = payments.rent_charge_id
      and p.owner_id = auth.uid()
    )
  )
  or
  (
    property_id is null and rent_charge_id is null and reservation_id is not null and
    exists (
      select 1 from public.reservations r
      join public.properties p on p.id = r.property_id
      where r.id = payments.reservation_id
      and p.owner_id = auth.uid()
    )
  )
);

-- DELETE: Owners can delete payments for their own properties
create policy "owners_delete_own_payments"
on public.payments
for delete
to authenticated
using (
  (
    property_id is not null and
    exists (
      select 1 from public.properties p
      where p.id = payments.property_id
      and p.owner_id = auth.uid()
    )
  )
  or
  (
    property_id is null and rent_charge_id is not null and
    exists (
      select 1 from public.rent_charges rc
      join public.properties p on p.id = rc.property_id
      where rc.id = payments.rent_charge_id
      and p.owner_id = auth.uid()
    )
  )
  or
  (
    property_id is null and rent_charge_id is null and reservation_id is not null and
    exists (
      select 1 from public.reservations r
      join public.properties p on p.id = r.property_id
      where r.id = payments.reservation_id
      and p.owner_id = auth.uid()
    )
  )
);


-- ===========================================================================
-- ANNOUNCEMENTS — Ownership via property_id → properties.owner_id
-- ===========================================================================

-- SELECT: Owners can view announcements for their own properties
create policy "owners_select_own_announcements"
on public.announcements
for select
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = announcements.property_id
    and p.owner_id = auth.uid()
  )
);

-- INSERT: Owners can create announcements for their own properties
create policy "owners_insert_own_announcements"
on public.announcements
for insert
to authenticated
with check (
  exists (
    select 1 from public.properties p
    where p.id = announcements.property_id
    and p.owner_id = auth.uid()
  )
);

-- UPDATE: Owners can update announcements for their own properties
create policy "owners_update_own_announcements"
on public.announcements
for update
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = announcements.property_id
    and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.properties p
    where p.id = announcements.property_id
    and p.owner_id = auth.uid()
  )
);

-- DELETE: Owners can delete announcements for their own properties
create policy "owners_delete_own_announcements"
on public.announcements
for delete
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = announcements.property_id
    and p.owner_id = auth.uid()
  )
);


-- ===========================================================================
-- MESSAGES — Ownership via property_id → properties.owner_id
-- ===========================================================================

-- SELECT: Owners can view messages for their own properties
create policy "owners_select_own_messages"
on public.messages
for select
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = messages.property_id
    and p.owner_id = auth.uid()
  )
);

-- INSERT: Owners can send messages for their own properties
create policy "owners_insert_own_messages"
on public.messages
for insert
to authenticated
with check (
  exists (
    select 1 from public.properties p
    where p.id = messages.property_id
    and p.owner_id = auth.uid()
  )
);

-- UPDATE: Owners can update messages for their own properties
create policy "owners_update_own_messages"
on public.messages
for update
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = messages.property_id
    and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.properties p
    where p.id = messages.property_id
    and p.owner_id = auth.uid()
  )
);

-- DELETE: Owners can delete messages for their own properties
create policy "owners_delete_own_messages"
on public.messages
for delete
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = messages.property_id
    and p.owner_id = auth.uid()
  )
);


-- ===========================================================================
-- MAINTENANCE_REQUESTS — Ownership via property_id → properties.owner_id
-- ===========================================================================

-- SELECT: Owners can view maintenance requests for their own properties
create policy "owners_select_own_maintenance_requests"
on public.maintenance_requests
for select
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = maintenance_requests.property_id
    and p.owner_id = auth.uid()
  )
);

-- INSERT: Owners can create maintenance requests for their own properties
create policy "owners_insert_own_maintenance_requests"
on public.maintenance_requests
for insert
to authenticated
with check (
  exists (
    select 1 from public.properties p
    where p.id = maintenance_requests.property_id
    and p.owner_id = auth.uid()
  )
);

-- UPDATE: Owners can update maintenance requests for their own properties
create policy "owners_update_own_maintenance_requests"
on public.maintenance_requests
for update
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = maintenance_requests.property_id
    and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.properties p
    where p.id = maintenance_requests.property_id
    and p.owner_id = auth.uid()
  )
);

-- DELETE: Owners can delete maintenance requests for their own properties
create policy "owners_delete_own_maintenance_requests"
on public.maintenance_requests
for delete
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = maintenance_requests.property_id
    and p.owner_id = auth.uid()
  )
);


-- ===========================================================================
-- USERS — Public tenant/applicant profiles
-- For Phase 1B, landlords can view users who are connected to their properties
-- through applications, reservations, or messages.
-- Full tenant auth policies will be added in a later phase.
-- ===========================================================================

-- SELECT: Owners can view users connected to their properties
create policy "owners_select_connected_users"
on public.users
for select
to authenticated
using (
  -- User has an application for owner's property
  exists (
    select 1 from public.applications a
    join public.properties p on p.id = a.property_id
    where a.applicant_id = users.id
    and p.owner_id = auth.uid()
  )
  or
  -- User has a reservation for owner's property
  exists (
    select 1 from public.reservations r
    join public.properties p on p.id = r.property_id
    where r.tenant_id = users.id
    and p.owner_id = auth.uid()
  )
  or
  -- User has messages with owner's property
  exists (
    select 1 from public.messages m
    join public.properties p on p.id = m.property_id
    where m.tenant_id = users.id
    and p.owner_id = auth.uid()
  )
);

-- INSERT: Allow authenticated users to create user profiles
-- (for now, landlords may create tenant records manually)
create policy "authenticated_insert_users"
on public.users
for insert
to authenticated
with check (true);

-- UPDATE: Owners can update users connected to their properties
create policy "owners_update_connected_users"
on public.users
for update
to authenticated
using (
  exists (
    select 1 from public.applications a
    join public.properties p on p.id = a.property_id
    where a.applicant_id = users.id
    and p.owner_id = auth.uid()
  )
  or
  exists (
    select 1 from public.reservations r
    join public.properties p on p.id = r.property_id
    where r.tenant_id = users.id
    and p.owner_id = auth.uid()
  )
);

-- DELETE: Owners can delete users connected only to their properties
-- (careful: only if user has no connections to other properties)
create policy "owners_delete_own_connected_users"
on public.users
for delete
to authenticated
using (
  -- User must be connected to at least one of owner's properties
  (
    exists (
      select 1 from public.applications a
      join public.properties p on p.id = a.property_id
      where a.applicant_id = users.id
      and p.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from public.reservations r
      join public.properties p on p.id = r.property_id
      where r.tenant_id = users.id
      and p.owner_id = auth.uid()
    )
  )
  -- AND user must not be connected to any other owner's properties
  and not exists (
    select 1 from public.applications a
    join public.properties p on p.id = a.property_id
    where a.applicant_id = users.id
    and p.owner_id != auth.uid()
  )
  and not exists (
    select 1 from public.reservations r
    join public.properties p on p.id = r.property_id
    where r.tenant_id = users.id
    and p.owner_id != auth.uid()
  )
);


-- ===========================================================================
-- PUBLIC ACCESS POLICIES FOR AVAILABILITY PAGE
-- Allow anonymous users to view public property/bed listings
-- ===========================================================================

-- Properties: Public can view properties (for availability page)
create policy "public_select_properties"
on public.properties
for select
to anon
using (true);

-- Rooms: Public can view rooms (for availability page)
create policy "public_select_rooms"
on public.rooms
for select
to anon
using (true);

-- Beds: Public can view beds (for availability page)
create policy "public_select_beds"
on public.beds
for select
to anon
using (true);

-- Applications: Public can submit applications
create policy "public_insert_applications"
on public.applications
for insert
to anon
with check (true);
