import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { ok, fail, type Result } from "@/lib/result";
import type { Bed, Property, Room, RoomWithBeds } from "@/lib/types";

export interface AvailabilityProperty extends Property {
  totalBeds: number;
  vacantBeds: number;
  minRent: number | null;
  maxRent: number | null;
}

export interface AvailabilityDetail {
  property: Property;
  rooms: RoomWithBeds[];
  totalBeds: number;
  vacantBeds: number;
}

export interface BedForApplication {
  bed: Bed;
  property: Property;
  room: Room | null;
}

/** Public: all properties with availability + price summary. */
export async function getAvailableProperties(): Promise<
  Result<AvailabilityProperty[]>
> {
  try {
    const supabase = getServiceClient();
    const { data: properties, error: pErr } = await supabase
      .from("properties")
      .select("*")
      .order("name", { ascending: true });
    if (pErr) throw pErr;

    const list = (properties ?? []) as Property[];
    if (list.length === 0) return ok([]);

    const ids = list.map((p) => p.id);
    const { data: beds, error: bErr } = await supabase
      .from("beds")
      .select("property_id, status, monthly_rent")
      .in("property_id", ids);
    if (bErr) throw bErr;

    const byProp = new Map<
      string,
      { total: number; vacant: number; rents: number[] }
    >();
    for (const b of beds ?? []) {
      const agg = byProp.get(b.property_id) ?? { total: 0, vacant: 0, rents: [] };
      agg.total += 1;
      if (b.status === "vacant") {
        agg.vacant += 1;
        agg.rents.push(Number(b.monthly_rent));
      }
      byProp.set(b.property_id, agg);
    }

    return ok(
      list.map((p) => {
        const agg = byProp.get(p.id) ?? { total: 0, vacant: 0, rents: [] };
        return {
          ...p,
          totalBeds: agg.total,
          vacantBeds: agg.vacant,
          minRent: agg.rents.length ? Math.min(...agg.rents) : null,
          maxRent: agg.rents.length ? Math.max(...agg.rents) : null,
        };
      })
    );
  } catch (error) {
    return fail(error);
  }
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
