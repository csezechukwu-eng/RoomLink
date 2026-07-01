-- renta bed — demo seed data (Phase 1)
-- Charlotte Flight Crew Crash Pad with a full end-to-end demo:
--   • 4 rooms x 4 beds (16 beds), mixed statuses
--   • a demo landlord + two demo people (an approved tenant + a pending applicant)
--   • application -> reservation -> deposit -> rent, announcement, message, maintenance
-- Safe to re-run: clears the demo records first, then re-inserts.

-- Fixed IDs (match src/lib/auth.ts):
--   owner   d0d7c1e3-5b4a-4b9f-8c3d-1e2f3a4b5c6d  (Silvia, landlord)
--   tenant  00000000-0000-0000-0000-000000000002  (Jordan Pilot, approved)
--   appl.   00000000-0000-0000-0000-000000000003  (Alex Crew, pending)

delete from public.users where id in (
  'd0d7c1e3-5b4a-4b9f-8c3d-1e2f3a4b5c6d',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);
delete from public.properties where id = '11111111-1111-1111-1111-111111111111';

-- People -------------------------------------------------------------------
insert into public.users (id, email, full_name, phone, role, verification_status) values
  ('d0d7c1e3-5b4a-4b9f-8c3d-1e2f3a4b5c6d', 'silvia@rentabed.demo', 'Silvia Owner',  '704-555-0101', 'owner',  'verified'),
  ('00000000-0000-0000-0000-000000000002', 'jordan@rentabed.demo', 'Jordan Pilot',  '704-555-0102', 'tenant', 'verified'),
  ('00000000-0000-0000-0000-000000000003', 'alex@rentabed.demo',   'Alex Crew',     '704-555-0103', 'tenant', 'pending');

-- Property -----------------------------------------------------------------
insert into public.properties (id, owner_id, name, address, city, state, zip, property_type, description, house_rules)
values (
  '11111111-1111-1111-1111-111111111111',
  'd0d7c1e3-5b4a-4b9f-8c3d-1e2f3a4b5c6d',
  'Charlotte Flight Crew Crash Pad',
  '4821 Yorkmont Rd',
  'Charlotte',
  'NC',
  '28208',
  'crash_pad',
  'Hot-bed and cold-bed crash pad minutes from CLT. Built for flight crews and commuters — clean, quiet, and turn-key.',
  E'No smoking indoors.\nQuiet hours 10pm–6am.\nStrip your bed and take linens on checkout.\nNo guests in sleeping areas.\nKeep common areas clean.'
);

insert into public.property_members (property_id, user_id, role)
values ('11111111-1111-1111-1111-111111111111', 'd0d7c1e3-5b4a-4b9f-8c3d-1e2f3a4b5c6d', 'owner')
on conflict (property_id, user_id) do nothing;

-- Rooms --------------------------------------------------------------------
insert into public.rooms (id, property_id, name, description, max_occupancy) values
  ('22222222-0000-0000-0000-00000000000a', '11111111-1111-1111-1111-111111111111', 'Room A', 'Front bedroom, two bunks.', 4),
  ('22222222-0000-0000-0000-00000000000b', '11111111-1111-1111-1111-111111111111', 'Room B', 'Rear bedroom, two bunks.', 4),
  ('22222222-0000-0000-0000-00000000000c', '11111111-1111-1111-1111-111111111111', 'Room C', 'Upstairs bedroom, two bunks.', 4),
  ('22222222-0000-0000-0000-00000000000d', '11111111-1111-1111-1111-111111111111', 'Room D', 'Bonus room, two bunks.', 4);

-- Beds ---------------------------------------------------------------------
insert into public.beds (property_id, room_id, label, bunk_type, monthly_rent, deposit_amount, status, description) values
  ('11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-00000000000a', 'Bed 1 Top Bunk',    'top_bunk',    700, 100, 'vacant',      null),
  ('11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-00000000000a', 'Bed 1 Bottom Bunk', 'bottom_bunk', 750, 150, 'occupied',    null),
  ('11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-00000000000a', 'Bed 2 Top Bunk',    'top_bunk',    700, 100, 'reserved',    null),
  ('11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-00000000000a', 'Bed 2 Bottom Bunk', 'bottom_bunk', 750, 150, 'vacant',      null),
  ('11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-00000000000b', 'Bed 1 Top Bunk',    'top_bunk',    680, 100, 'occupied',    null),
  ('11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-00000000000b', 'Bed 1 Bottom Bunk', 'bottom_bunk', 720, 150, 'occupied',    null),
  ('11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-00000000000b', 'Bed 2 Top Bunk',    'top_bunk',    680, 100, 'vacant',      null),
  ('11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-00000000000b', 'Bed 2 Bottom Bunk', 'bottom_bunk', 720, 150, 'unavailable', 'Mattress being replaced.'),
  ('11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-00000000000c', 'Bed 1 Top Bunk',    'top_bunk',    650, 100, 'reserved',    null),
  ('11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-00000000000c', 'Bed 1 Bottom Bunk', 'bottom_bunk', 800, 150, 'vacant',      null),
  ('11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-00000000000c', 'Bed 2 Top Bunk',    'top_bunk',    650, 100, 'occupied',    null),
  ('11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-00000000000c', 'Bed 2 Bottom Bunk', 'bottom_bunk', 800, 150, 'vacant',      null),
  ('11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-00000000000d', 'Bed 1 Top Bunk',    'top_bunk',    675, 100, 'vacant',      null),
  ('11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-00000000000d', 'Bed 1 Bottom Bunk', 'bottom_bunk', 850, 150, 'reserved',    null),
  ('11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-00000000000d', 'Bed 2 Top Bunk',    'top_bunk',    675, 100, 'occupied',    null),
  ('11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-00000000000d', 'Bed 2 Bottom Bunk', 'bottom_bunk', 850, 150, 'unavailable', 'Held for maintenance.');

-- Applications -------------------------------------------------------------
-- Jordan: approved (drives the reservation below). Alex: pending (landlord can act).
insert into public.applications (id, property_id, bed_id, applicant_id, full_name, email, phone, message, desired_move_in, status, decided_at) values
  ('a0000000-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111',
   (select id from public.beds where property_id = '11111111-1111-1111-1111-111111111111' and room_id = '22222222-0000-0000-0000-00000000000a' and label = 'Bed 2 Top Bunk'),
   '00000000-0000-0000-0000-000000000002', 'Jordan Pilot', 'jordan@rentabed.demo', '704-555-0102',
   'Regional FO based at CLT, need a reliable cold bed.', current_date - 20, 'approved', now() - interval '18 days'),
  ('a0000000-0000-0000-0000-000000000002',
   '11111111-1111-1111-1111-111111111111',
   (select id from public.beds where property_id = '11111111-1111-1111-1111-111111111111' and room_id = '22222222-0000-0000-0000-00000000000a' and label = 'Bed 1 Top Bunk'),
   '00000000-0000-0000-0000-000000000003', 'Alex Crew', 'alex@rentabed.demo', '704-555-0103',
   'Flight attendant commuting from ORD a few nights a week.', current_date + 7, 'submitted', null);

-- Reservation (from Jordan's approved application) -------------------------
insert into public.reservations (id, property_id, bed_id, tenant_id, application_id, status, start_date, deposit_amount, deposit_status, deposit_paid_at) values
  ('b0000000-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111',
   (select id from public.beds where property_id = '11111111-1111-1111-1111-111111111111' and room_id = '22222222-0000-0000-0000-00000000000a' and label = 'Bed 2 Top Bunk'),
   '00000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
   'active', date_trunc('month', current_date)::date, 100, 'paid', now() - interval '15 days');

-- Rent charges (one paid last month, one due this month) --------------------
insert into public.rent_charges (id, reservation_id, tenant_id, property_id, bed_id, period_start, period_end, due_date, amount, status, paid_at) values
  ('c0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   (select id from public.beds where property_id = '11111111-1111-1111-1111-111111111111' and room_id = '22222222-0000-0000-0000-00000000000a' and label = 'Bed 2 Top Bunk'),
   (date_trunc('month', current_date) - interval '1 month')::date,
   (date_trunc('month', current_date) - interval '1 day')::date,
   (date_trunc('month', current_date) - interval '1 month')::date,
   700, 'paid', now() - interval '20 days'),
  ('c0000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   (select id from public.beds where property_id = '11111111-1111-1111-1111-111111111111' and room_id = '22222222-0000-0000-0000-00000000000a' and label = 'Bed 2 Top Bunk'),
   date_trunc('month', current_date)::date,
   (date_trunc('month', current_date) + interval '1 month' - interval '1 day')::date,
   date_trunc('month', current_date)::date,
   700, 'due', null);

-- Payments (manual records: deposit + the paid rent charge) -----------------
insert into public.payments (tenant_id, reservation_id, rent_charge_id, property_id, kind, amount, payment_provider, status) values
  ('00000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', null, '11111111-1111-1111-1111-111111111111', 'deposit', 100, 'manual', 'recorded'),
  ('00000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'rent', 700, 'manual', 'recorded');

-- Announcement -------------------------------------------------------------
insert into public.announcements (property_id, author_id, title, body, created_at) values
  ('11111111-1111-1111-1111-111111111111', 'd0d7c1e3-5b4a-4b9f-8c3d-1e2f3a4b5c6d',
   'Parking + new linens',
   E'Two crew permits are now in the kitchen drawer — first come first served.\nFresh linens are stocked in the hall closet. Welcome aboard!',
   now() - interval '3 days');

-- Message thread (tenant -> landlord, then a reply) -------------------------
insert into public.messages (property_id, tenant_id, sender_id, sender_role, body, read_at, created_at) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'tenant',
   'Hi! Is there a spot to leave a bike in the garage?', now() - interval '2 days', now() - interval '2 days'),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 'd0d7c1e3-5b4a-4b9f-8c3d-1e2f3a4b5c6d', 'owner',
   'Yes — rack on the left wall. I labeled a hook with your bed number.', null, now() - interval '1 day');

-- Maintenance request ------------------------------------------------------
insert into public.maintenance_requests (property_id, tenant_id, room_id, bed_id, title, description, priority, status) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002',
   '22222222-0000-0000-0000-00000000000a',
   (select id from public.beds where property_id = '11111111-1111-1111-1111-111111111111' and room_id = '22222222-0000-0000-0000-00000000000a' and label = 'Bed 2 Top Bunk'),
   'AC not cooling in Room A', 'The room stays warm overnight even on the lowest setting.', 'high', 'open');
