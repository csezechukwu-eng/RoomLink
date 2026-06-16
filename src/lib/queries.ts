import "server-only";
import { getCurrentOwnerId } from "@/lib/auth";
import { createAuthenticatedClient } from "@/lib/supabase/server";
import { ok, fail, type Result } from "@/lib/result";
import type {
  Application,
  ApplicationStatus,
  Bed,
  BedStatusCounts,
  DashboardMetrics,
  Property,
  PropertyMedia,
  Room,
  RoomWithBeds,
} from "@/lib/types";
import {
  listApplications,
  getApplicationById,
  type ApplicationWithRefs,
} from "@/lib/services/applications";

export type { Result };

function emptyCounts(): BedStatusCounts {
  return { total: 0, vacant: 0, reserved: 0, occupied: 0, unavailable: 0 };
}

export function tallyBeds(beds: Pick<Bed, "status">[]): BedStatusCounts {
  return beds.reduce<BedStatusCounts>((acc, bed) => {
    acc.total += 1;
    acc[bed.status] += 1;
    return acc;
  }, emptyCounts());
}

/** Dashboard metrics: property/room/bed totals + bed status breakdown. */
export async function getDashboardMetrics(): Promise<Result<DashboardMetrics>> {
  try {
    const supabase = await createAuthenticatedClient();
    const ownerId = await getCurrentOwnerId();

    const { data: properties, error: pErr } = await supabase
      .from("properties")
      .select("id")
      .eq("owner_id", ownerId);
    if (pErr) throw pErr;

    const propertyIds = (properties ?? []).map((p) => p.id);
    if (propertyIds.length === 0) {
      return ok({
        totalProperties: 0,
        totalRooms: 0,
        totalBeds: 0,
        beds: emptyCounts(),
        pendingApplications: 0,
        activeReservations: 0,
        rentDue: 0,
        openMaintenance: 0,
      });
    }

    const [
      { count: roomCount, error: rErr },
      { data: beds, error: bErr },
      { count: pendingApplications, error: aErr },
      { count: activeReservations, error: resErr },
      { count: rentDue, error: rentErr },
      { count: openMaintenance, error: mErr },
    ] = await Promise.all([
      supabase
        .from("rooms")
        .select("id", { count: "exact", head: true })
        .in("property_id", propertyIds),
      supabase.from("beds").select("status").in("property_id", propertyIds),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .in("property_id", propertyIds)
        .eq("status", "pending"),
      supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .in("property_id", propertyIds)
        .eq("status", "active"),
      supabase
        .from("rent_charges")
        .select("id", { count: "exact", head: true })
        .in("property_id", propertyIds)
        .in("status", ["due", "overdue"]),
      supabase
        .from("maintenance_requests")
        .select("id", { count: "exact", head: true })
        .in("property_id", propertyIds)
        .in("status", ["open", "in_progress"]),
    ]);
    if (rErr) throw rErr;
    if (bErr) throw bErr;
    if (aErr) throw aErr;
    if (resErr) throw resErr;
    if (rentErr) throw rentErr;
    if (mErr) throw mErr;

    const counts = tallyBeds(beds ?? []);
    return ok({
      totalProperties: propertyIds.length,
      totalRooms: roomCount ?? 0,
      totalBeds: counts.total,
      beds: counts,
      pendingApplications: pendingApplications ?? 0,
      activeReservations: activeReservations ?? 0,
      rentDue: rentDue ?? 0,
      openMaintenance: openMaintenance ?? 0,
    });
  } catch (error) {
    return fail(error);
  }
}

/** All properties for the current landlord, with per-property bed counts and media. */
export async function getProperties(): Promise<
  Result<Array<Property & { roomCount: number; bedCounts: BedStatusCounts; media: PropertyMedia[] }>>
> {
  try {
    const supabase = await createAuthenticatedClient();
    const ownerId = await getCurrentOwnerId();

    const { data: properties, error: pErr } = await supabase
      .from("properties")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: true });
    if (pErr) throw pErr;

    const list = (properties ?? []) as Property[];
    if (list.length === 0) return ok([]);

    const ids = list.map((p) => p.id);
    const [{ data: rooms, error: rErr }, { data: beds, error: bErr }] =
      await Promise.all([
        supabase.from("rooms").select("id, property_id").in("property_id", ids),
        supabase
          .from("beds")
          .select("status, property_id")
          .in("property_id", ids),
      ]);
    if (rErr) throw rErr;
    if (bErr) throw bErr;

    // Fetch media for all properties - gracefully handle if table doesn't exist
    let allMedia: PropertyMedia[] = [];
    try {
      const { data: mediaData, error: mErr } = await supabase
        .from("property_media")
        .select("*")
        .in("property_id", ids)
        .eq("owner_id", ownerId)
        .order("sort_order", { ascending: true });
      if (!mErr && mediaData) {
        allMedia = mediaData as PropertyMedia[];
      }
    } catch {
      // property_media table may not exist yet - ignore
    }

    const roomsByProp = new Map<string, number>();
    for (const r of rooms ?? []) {
      roomsByProp.set(r.property_id, (roomsByProp.get(r.property_id) ?? 0) + 1);
    }
    const bedsByProp = new Map<string, Pick<Bed, "status">[]>();
    for (const b of beds ?? []) {
      const arr = bedsByProp.get(b.property_id) ?? [];
      arr.push({ status: b.status });
      bedsByProp.set(b.property_id, arr);
    }
    const mediaByProp = new Map<string, PropertyMedia[]>();
    for (const m of allMedia) {
      const arr = mediaByProp.get(m.property_id) ?? [];
      arr.push(m);
      mediaByProp.set(m.property_id, arr);
    }

    return ok(
      list.map((p) => ({
        ...p,
        roomCount: roomsByProp.get(p.id) ?? 0,
        bedCounts: tallyBeds(bedsByProp.get(p.id) ?? []),
        media: mediaByProp.get(p.id) ?? [],
      }))
    );
  } catch (error) {
    return fail(error);
  }
}

export interface PropertyDetail {
  property: Property;
  rooms: RoomWithBeds[];
  bedCounts: BedStatusCounts;
  media: PropertyMedia[];
}

/** A single property with its rooms and beds (grouped) for the detail page. */
export async function getPropertyDetail(
  propertyId: string
): Promise<Result<PropertyDetail | null>> {
  try {
    const supabase = await createAuthenticatedClient();
    const ownerId = await getCurrentOwnerId();

    const { data: property, error: pErr } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!property) return ok(null);

    const [
      { data: rooms, error: rErr },
      { data: beds, error: bErr },
    ] = await Promise.all([
      supabase
        .from("rooms")
        .select("*")
        .eq("property_id", propertyId)
        .order("name", { ascending: true }),
      supabase
        .from("beds")
        .select("*")
        .eq("property_id", propertyId)
        .order("label", { ascending: true }),
    ]);
    if (rErr) throw rErr;
    if (bErr) throw bErr;

    // Fetch media separately - gracefully handle if table doesn't exist yet
    let media: PropertyMedia[] = [];
    try {
      const { data: mediaData, error: mErr } = await supabase
        .from("property_media")
        .select("*")
        .eq("property_id", propertyId)
        .eq("owner_id", ownerId)
        .order("media_type")
        .order("sort_order", { ascending: true });
      if (!mErr && mediaData) {
        media = mediaData as PropertyMedia[];
      }
    } catch {
      // property_media table may not exist yet - ignore
    }

    const bedsByRoom = new Map<string, Bed[]>();
    for (const bed of (beds ?? []) as Bed[]) {
      const arr = bedsByRoom.get(bed.room_id) ?? [];
      arr.push(bed);
      bedsByRoom.set(bed.room_id, arr);
    }

    const roomsWithBeds: RoomWithBeds[] = ((rooms ?? []) as Room[]).map(
      (room) => ({ ...room, beds: bedsByRoom.get(room.id) ?? [] })
    );

    return ok({
      property: property as Property,
      rooms: roomsWithBeds,
      bedCounts: tallyBeds((beds ?? []) as Bed[]),
      media: (media ?? []) as PropertyMedia[],
    });
  } catch (error) {
    return fail(error);
  }
}

/** All rooms with their beds, grouped by property for the rooms page. */
export async function getAllRoomsWithBeds(): Promise<
  Result<Array<{
    property: Property;
    rooms: RoomWithBeds[];
  }>>
> {
  try {
    const supabase = await createAuthenticatedClient();
    const ownerId = await getCurrentOwnerId();

    // Get all properties
    const { data: properties, error: pErr } = await supabase
      .from("properties")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: true });
    if (pErr) throw pErr;

    const list = (properties ?? []) as Property[];
    if (list.length === 0) return ok([]);

    const ids = list.map((p) => p.id);

    // Get all rooms and beds for these properties
    const [{ data: rooms, error: rErr }, { data: beds, error: bErr }] =
      await Promise.all([
        supabase
          .from("rooms")
          .select("*")
          .in("property_id", ids)
          .order("name", { ascending: true }),
        supabase
          .from("beds")
          .select("*")
          .in("property_id", ids)
          .order("label", { ascending: true }),
      ]);
    if (rErr) throw rErr;
    if (bErr) throw bErr;

    // Group beds by room
    const bedsByRoom = new Map<string, Bed[]>();
    for (const bed of (beds ?? []) as Bed[]) {
      const arr = bedsByRoom.get(bed.room_id) ?? [];
      arr.push(bed);
      bedsByRoom.set(bed.room_id, arr);
    }

    // Group rooms by property with their beds
    const roomsByProperty = new Map<string, RoomWithBeds[]>();
    for (const room of (rooms ?? []) as Room[]) {
      const arr = roomsByProperty.get(room.property_id) ?? [];
      arr.push({ ...room, beds: bedsByRoom.get(room.id) ?? [] });
      roomsByProperty.set(room.property_id, arr);
    }

    // Build result
    return ok(
      list.map((property) => ({
        property,
        rooms: roomsByProperty.get(property.id) ?? [],
      }))
    );
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// Application Queries — Step 4
// ---------------------------------------------------------------------------

export type { ApplicationWithRefs };

/** Get all applications for the current landlord with filters. */
export async function getApplications(opts?: {
  status?: ApplicationStatus;
  search?: string;
}): Promise<Result<ApplicationWithRefs[]>> {
  try {
    const ownerId = await getCurrentOwnerId();
    return listApplications({
      ownerId,
      status: opts?.status,
      search: opts?.search,
    });
  } catch (error) {
    return fail(error);
  }
}

/** Get application counts by status for the dashboard. */
export async function getApplicationCounts(): Promise<
  Result<Record<ApplicationStatus | "total", number>>
> {
  try {
    const ownerId = await getCurrentOwnerId();
    const result = await listApplications({ ownerId });
    if (result.error !== null) return fail(result.error);

    const counts: Record<ApplicationStatus | "total", number> = {
      draft: 0,
      submitted: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
      waitlisted: 0,
      withdrawn: 0,
      total: 0,
    };

    for (const app of result.data) {
      counts[app.status]++;
      counts.total++;
    }

    return ok(counts);
  } catch (error) {
    return fail(error);
  }
}

/** Get a single application by ID for the detail page. */
export async function getApplicationDetail(
  applicationId: string
): Promise<Result<ApplicationWithRefs | null>> {
  try {
    // Verify the landlord owns this application's property
    const ownerId = await getCurrentOwnerId();
    const result = await getApplicationById(applicationId);
    if (result.error !== null) return fail(result.error);
    if (!result.data) return ok(null);

    // TODO: Verify property ownership when needed
    // For now, we rely on landlord session being valid

    return ok(result.data);
  } catch (error) {
    return fail(error);
  }
}
