import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { ok, fail, type Result } from "@/lib/result";
import type { Reservation } from "@/lib/types";

export interface ReservationWithRefs extends Reservation {
  property_name: string | null;
  room_name: string | null;
  bed_label: string | null;
  tenant_name: string | null;
  tenant_email: string | null;
}

async function enrich(
  reservations: Reservation[]
): Promise<ReservationWithRefs[]> {
  if (reservations.length === 0) return [];
  const supabase = getServiceClient();

  const propertyIds = [...new Set(reservations.map((r) => r.property_id))];
  const bedIds = [
    ...new Set(reservations.map((r) => r.bed_id).filter(Boolean)),
  ] as string[];
  const tenantIds = [...new Set(reservations.map((r) => r.tenant_id))];

  const [{ data: props }, { data: beds }, { data: users }] = await Promise.all([
    supabase.from("properties").select("id, name").in("id", propertyIds),
    bedIds.length
      ? supabase.from("beds").select("id, label, room_id").in("id", bedIds)
      : Promise.resolve({ data: [] as { id: string }[] }),
    supabase.from("users").select("id, full_name, email").in("id", tenantIds),
  ]);

  const roomIds = [
    ...new Set(
      (beds ?? []).map((b) => (b as { room_id?: string }).room_id).filter(Boolean)
    ),
  ] as string[];
  const { data: rooms } = roomIds.length
    ? await supabase.from("rooms").select("id, name").in("id", roomIds)
    : { data: [] as { id: string; name: string }[] };

  const propName = new Map((props ?? []).map((p) => [p.id, p.name]));
  const bedMap = new Map(
    (beds ?? []).map((b) => [
      (b as { id: string }).id,
      b as { label: string; room_id: string },
    ])
  );
  const roomName = new Map((rooms ?? []).map((r) => [r.id, r.name]));
  const userMap = new Map(
    (users ?? []).map((u) => [
      (u as { id: string }).id,
      u as { full_name: string | null; email: string },
    ])
  );

  return reservations.map((r) => {
    const bed = r.bed_id ? bedMap.get(r.bed_id) : undefined;
    const user = userMap.get(r.tenant_id);
    return {
      ...r,
      property_name: propName.get(r.property_id) ?? null,
      bed_label: bed?.label ?? null,
      room_name: bed?.room_id ? roomName.get(bed.room_id) ?? null : null,
      tenant_name: user?.full_name ?? null,
      tenant_email: user?.email ?? null,
    };
  });
}

/** Landlord: list reservations (optionally scoped to a property). */
export async function listReservations(opts: {
  ownerId?: string;
  propertyId?: string;
}): Promise<Result<ReservationWithRefs[]>> {
  try {
    const supabase = getServiceClient();

    let propertyIds: string[] = [];
    if (opts.propertyId) {
      propertyIds = [opts.propertyId];
    } else if (opts.ownerId) {
      const { data: props, error: pErr } = await supabase
        .from("properties")
        .select("id")
        .eq("owner_id", opts.ownerId);
      if (pErr) throw pErr;
      propertyIds = (props ?? []).map((p) => p.id);
    }
    if (propertyIds.length === 0) return ok([]);

    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return ok(await enrich((data ?? []) as Reservation[]));
  } catch (error) {
    return fail(error);
  }
}

/** Tenant portal: the tenant's most recent active reservation. */
export async function getTenantReservation(
  tenantId: string
): Promise<Result<ReservationWithRefs | null>> {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    const list = (data ?? []) as Reservation[];
    if (list.length === 0) return ok(null);
    const [enriched] = await enrich(list);
    return ok(enriched);
  } catch (error) {
    return fail(error);
  }
}

/** Landlord: manually mark a reservation's deposit as paid (records a payment). */
export async function markDepositPaid(
  reservationId: string
): Promise<Result<null>> {
  try {
    const supabase = getServiceClient();
    const { data: reservation, error: rErr } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", reservationId)
      .maybeSingle();
    if (rErr) throw rErr;
    if (!reservation) return fail("Reservation not found.");
    if (reservation.deposit_status === "paid")
      return fail("Deposit is already marked paid.");

    const { error: updErr } = await supabase
      .from("reservations")
      .update({
        deposit_status: "paid",
        deposit_paid_at: new Date().toISOString(),
      })
      .eq("id", reservationId);
    if (updErr) throw updErr;

    const { error: payErr } = await supabase.from("payments").insert({
      tenant_id: reservation.tenant_id,
      reservation_id: reservation.id,
      property_id: reservation.property_id,
      kind: "deposit",
      amount: reservation.deposit_amount,
      payment_provider: "manual",
      status: "recorded",
    });
    if (payErr) throw payErr;

    return ok(null);
  } catch (error) {
    return fail(error);
  }
}
