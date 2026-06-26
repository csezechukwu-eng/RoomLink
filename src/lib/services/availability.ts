import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { ok, fail, type Result } from "@/lib/result";
import type { Bed, Property, PropertyMedia, PropertyOccupancyType, Room, RoomWithBeds } from "@/lib/types";

export interface AvailabilityProperty extends Property {
  totalBeds: number;
  vacantBeds: number;
  minRent: number | null;
  maxRent: number | null;
  minDeposit: number | null;
  coverPhoto: PropertyMedia | null;
}

/** Filter options for the public search page */
export interface AvailabilityFilters {
  /** Filter by city (case-insensitive partial match) */
  city?: string;
  /** Filter by state (exact match) */
  state?: string;
  /** Filter by occupancy type */
  occupancyType?: PropertyOccupancyType;
  /** Only show properties with at least this many vacant beds */
  minBeds?: number;
  /** Filter by minimum rent */
  minRent?: number;
  /** Filter by maximum rent */
  maxRent?: number;
}

export interface AvailabilityDetail {
  property: Property;
  rooms: RoomWithBeds[];
  totalBeds: number;
  vacantBeds: number;
  media: PropertyMedia[];
}

export interface BedForApplication {
  bed: Bed;
  property: Property;
  room: Room | null;
}

/** Public: all properties with availability + price summary.
 * Only returns published properties (is_hidden = false).
 * Supports optional filters for search page.
 */
export async function getAvailableProperties(
  filters?: AvailabilityFilters
): Promise<Result<AvailabilityProperty[]>> {
  try {
    const supabase = getServiceClient();
    // Only fetch published properties (is_hidden = false)
    let query = supabase
      .from("properties")
      .select("*")
      .eq("is_hidden", false);

    // Apply filters
    if (filters?.city) {
      query = query.ilike("city", `%${filters.city}%`);
    }
    if (filters?.state) {
      query = query.eq("state", filters.state);
    }
    if (filters?.occupancyType) {
      query = query.eq("occupancy_type", filters.occupancyType);
    }

    const { data: properties, error: pErr } = await query.order("name", { ascending: true });
    if (pErr) throw pErr;

    const list = (properties ?? []) as Property[];
    if (list.length === 0) return ok([]);

    const ids = list.map((p) => p.id);
    const { data: beds, error: bErr } = await supabase
      .from("beds")
      .select("property_id, status, monthly_rent, deposit_amount")
      .in("property_id", ids);
    if (bErr) throw bErr;

    // Fetch cover photos separately - gracefully handle if table doesn't exist yet
    let coverPhotos: PropertyMedia[] = [];
    try {
      const { data: mediaData, error: mErr } = await supabase
        .from("property_media")
        .select("*")
        .in("property_id", ids)
        .eq("media_type", "property")
        .eq("is_cover", true);
      if (!mErr && mediaData) {
        coverPhotos = mediaData as PropertyMedia[];
      }
    } catch {
      // property_media table may not exist yet - ignore
    }

    const byProp = new Map<
      string,
      { total: number; vacant: number; rents: number[]; deposits: number[] }
    >();
    for (const b of beds ?? []) {
      const agg = byProp.get(b.property_id) ?? { total: 0, vacant: 0, rents: [], deposits: [] };
      agg.total += 1;
      if (b.status === "vacant") {
        agg.vacant += 1;
        agg.rents.push(Number(b.monthly_rent));
        agg.deposits.push(Number(b.deposit_amount ?? 0));
      }
      byProp.set(b.property_id, agg);
    }

    // Map cover photos by property
    const coverByProp = new Map<string, PropertyMedia>();
    for (const photo of (coverPhotos ?? []) as PropertyMedia[]) {
      coverByProp.set(photo.property_id, photo);
    }

    // Map properties with aggregated bed data
    const mapped = list.map((p) => {
      const agg = byProp.get(p.id) ?? { total: 0, vacant: 0, rents: [], deposits: [] };
      return {
        ...p,
        totalBeds: agg.total,
        vacantBeds: agg.vacant,
        minRent: agg.rents.length ? Math.min(...agg.rents) : null,
        maxRent: agg.rents.length ? Math.max(...agg.rents) : null,
        minDeposit: agg.deposits.length ? Math.min(...agg.deposits) : null,
        coverPhoto: coverByProp.get(p.id) ?? null,
      };
    });

    // Apply post-aggregation filters
    const filtered = mapped.filter((p) => {
      // Filter by minimum vacant beds
      if (filters?.minBeds && p.vacantBeds < filters.minBeds) {
        return false;
      }
      // Filter by rent range (check if any vacant bed is in range)
      if (filters?.minRent !== undefined && p.minRent !== null && p.maxRent !== null) {
        // Property's max rent must be >= filter min rent
        if (p.maxRent < filters.minRent) return false;
      }
      if (filters?.maxRent !== undefined && p.minRent !== null) {
        // Property's min rent must be <= filter max rent
        if (p.minRent > filters.maxRent) return false;
      }
      return true;
    });

    return ok(filtered);
  } catch (error) {
    return fail(error);
  }
}

/** Public: one property with its rooms + beds for the availability detail page.
 * Only returns published properties (is_hidden = false).
 */
export async function getAvailabilityDetail(
  propertyId: string
): Promise<Result<AvailabilityDetail | null>> {
  try {
    const supabase = getServiceClient();
    // Only fetch published properties
    const { data: property, error: pErr } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .eq("is_hidden", false)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!property) return ok(null);

    const [{ data: rooms, error: rErr }, { data: beds, error: bErr }] =
      await Promise.all([
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
        .order("media_type")
        .order("sort_order", { ascending: true });
      if (!mErr && mediaData) {
        media = mediaData as PropertyMedia[];
      }
    } catch {
      // property_media table may not exist yet - ignore
    }

    const allBeds = (beds ?? []) as Bed[];
    const bedsByRoom = new Map<string, Bed[]>();
    for (const bed of allBeds) {
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
      totalBeds: allBeds.length,
      vacantBeds: allBeds.filter((b) => b.status === "vacant").length,
      media: (media ?? []) as PropertyMedia[],
    });
  } catch (error) {
    return fail(error);
  }
}

/** Public: load a bed + its property/room for the apply page. */
export async function getBedForApplication(
  bedId: string
): Promise<Result<BedForApplication | null>> {
  try {
    const supabase = getServiceClient();
    const { data: bed, error: bErr } = await supabase
      .from("beds")
      .select("*")
      .eq("id", bedId)
      .maybeSingle();
    if (bErr) throw bErr;
    if (!bed) return ok(null);

    const [{ data: property, error: pErr }, { data: room, error: rErr }] =
      await Promise.all([
        supabase
          .from("properties")
          .select("*")
          .eq("id", bed.property_id)
          .maybeSingle(),
        supabase.from("rooms").select("*").eq("id", bed.room_id).maybeSingle(),
      ]);
    if (pErr) throw pErr;
    if (rErr) throw rErr;
    if (!property) return ok(null);

    return ok({
      bed: bed as Bed,
      property: property as Property,
      room: (room as Room) ?? null,
    });
  } catch (error) {
    return fail(error);
  }
}
