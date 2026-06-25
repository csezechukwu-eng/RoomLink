import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { ok, fail, type Result } from "@/lib/result";
import { todayISO } from "@/lib/bedAvailability";
import type {
  Bed,
  OccupancyType,
  Property,
  PropertyMedia,
  Room,
  RoomWithBeds,
} from "@/lib/types";

export interface AvailabilityProperty extends Property {
  totalBeds: number;
  vacantBeds: number;
  minRent: number | null;
  maxRent: number | null;
  /** Lowest deposit among vacant beds, when any require one. */
  minDeposit: number | null;
  /** Soonest date a tenant could move into a vacant bed (ISO), null if none. */
  soonestMoveIn: string | null;
  coverPhoto: PropertyMedia | null;
}

/** Public search filters applied to the listing/search page. */
export interface AvailabilitySearch {
  city?: string;
  state?: string;
  /** Occupancy policy filter; "any"/undefined = no filter. */
  occupancy?: OccupancyType | "any";
  /** Minimum number of currently-available beds. */
  minBeds?: number;
  /** Monthly rent range (USD). */
  rentMin?: number;
  rentMax?: number;
  /** Earliest move-in the tenant needs (ISO date or YYYY-MM month). */
  moveIn?: string;
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

/** Public: all properties with availability + price summary. */
export async function getAvailableProperties(
  search: AvailabilitySearch = {}
): Promise<Result<AvailabilityProperty[]>> {
  try {
    const supabase = getServiceClient();
    const { data: properties, error: pErr } = await supabase
      .from("properties")
      .select("*")
      // Public listings only — never surface hidden properties.
      .eq("is_hidden", false)
      .order("name", { ascending: true });
    if (pErr) throw pErr;

    const list = (properties ?? []) as Property[];
    if (list.length === 0) return ok([]);

    const ids = list.map((p) => p.id);
    const { data: beds, error: bErr } = await supabase
      .from("beds")
      .select("property_id, status, monthly_rent, deposit_amount, available_from")
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

    const today = todayISO();
    const byProp = new Map<
      string,
      { total: number; vacant: number; rents: number[]; deposits: number[]; moveIns: string[] }
    >();
    for (const b of beds ?? []) {
      const agg =
        byProp.get(b.property_id) ??
        { total: 0, vacant: 0, rents: [], deposits: [], moveIns: [] };
      agg.total += 1;
      if (b.status === "vacant") {
        agg.vacant += 1;
        agg.rents.push(Number(b.monthly_rent));
        agg.deposits.push(Number(b.deposit_amount));
        // null/past available_from means "open now" (today).
        const from = b.available_from && b.available_from > today ? b.available_from : today;
        agg.moveIns.push(from);
      }
      byProp.set(b.property_id, agg);
    }

    // Map cover photos by property
    const coverByProp = new Map<string, PropertyMedia>();
    for (const photo of (coverPhotos ?? []) as PropertyMedia[]) {
      coverByProp.set(photo.property_id, photo);
    }

    const mapped: AvailabilityProperty[] = list.map((p) => {
      const agg =
        byProp.get(p.id) ??
        { total: 0, vacant: 0, rents: [], deposits: [], moveIns: [] };
      const positiveDeposits = agg.deposits.filter((d) => d > 0);
      return {
        ...p,
        totalBeds: agg.total,
        vacantBeds: agg.vacant,
        minRent: agg.rents.length ? Math.min(...agg.rents) : null,
        maxRent: agg.rents.length ? Math.max(...agg.rents) : null,
        minDeposit: positiveDeposits.length ? Math.min(...positiveDeposits) : null,
        soonestMoveIn: agg.moveIns.length ? agg.moveIns.sort()[0] : null,
        coverPhoto: coverByProp.get(p.id) ?? null,
      };
    });

    return ok(filterAvailability(mapped, search));
  } catch (error) {
    return fail(error);
  }
}

/** Last calendar day of a "YYYY-MM" month, or pass through a full ISO date. */
function moveInCutoff(moveIn: string): string | null {
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(moveIn);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]); // 1-12
    // Day 0 of next month = last day of this month.
    const last = new Date(Date.UTC(year, month, 0));
    return last.toISOString().slice(0, 10);
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(moveIn) ? moveIn : null;
}

/** In-memory filtering for the public search page. Dataset is small. */
function filterAvailability(
  items: AvailabilityProperty[],
  search: AvailabilitySearch
): AvailabilityProperty[] {
  const city = search.city?.trim().toLowerCase();
  const state = search.state?.trim().toLowerCase();
  const occupancy = search.occupancy && search.occupancy !== "any" ? search.occupancy : null;
  const cutoff = search.moveIn ? moveInCutoff(search.moveIn) : null;

  return items.filter((p) => {
    if (city) {
      const haystack = [p.city, p.address].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(city)) return false;
    }
    if (state && !(p.state ?? "").toLowerCase().includes(state)) return false;
    if (occupancy) {
      const effective: OccupancyType = p.occupancy_type ?? "co_ed";
      if (effective !== occupancy) return false;
    }
    if (search.minBeds && p.vacantBeds < search.minBeds) return false;
    if (search.rentMin != null && (p.maxRent == null || p.maxRent < search.rentMin)) return false;
    if (search.rentMax != null && (p.minRent == null || p.minRent > search.rentMax)) return false;
    if (cutoff) {
      // Keep properties a tenant could move into by the cutoff date.
      if (!p.soonestMoveIn || p.soonestMoveIn > cutoff) return false;
    }
    return true;
  });
}

/** Public: one property with its rooms + beds for the availability detail page. */
export async function getAvailabilityDetail(
  propertyId: string
): Promise<Result<AvailabilityDetail | null>> {
  try {
    const supabase = getServiceClient();
    const { data: property, error: pErr } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      // Hidden properties are not publicly viewable.
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
