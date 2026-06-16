import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { ok, fail, type Result } from "@/lib/result";
import type {
  AccessCodeDelivery,
  AgreementStatus,
  DepositStatus,
  Reservation,
  ReservationStatus,
  RentCharge,
  RentStatus,
} from "@/lib/types";

export interface RosterCharge {
  id: string;
  amount: number;
  status: RentStatus;
  due_date: string | null;
}

/** A current/scheduled tenant placement, enriched for the landlord roster. */
export interface RosterEntry {
  reservationId: string;
  reservationStatus: ReservationStatus;
  tenantId: string;
  tenantName: string | null;
  tenantEmail: string | null;
  tenantPhone: string | null;
  propertyId: string;
  propertyName: string | null;
  bedId: string | null;
  bedLabel: string | null;
  roomName: string | null;
  startDate: string | null;
  endDate: string | null;
  depositStatus: DepositStatus;
  depositAmount: number;
  accessCodeDelivery: AccessCodeDelivery;
  agreementStatus: AgreementStatus | null;
  /** Rolled-up rent state across this reservation's charges. */
  rentStatus: "paid" | "due" | "overdue" | "none";
  charges: RosterCharge[];
}

function rollupRent(charges: RosterCharge[]): RosterEntry["rentStatus"] {
  if (charges.length === 0) return "none";
  if (charges.some((c) => c.status === "overdue")) return "overdue";
  if (charges.some((c) => c.status === "due")) return "due";
  return "paid";
}

/**
 * Landlord tenant roster: active reservations (current + scheduled move-ins)
 * joined to tenant, bed/room, deposit, lease dates, rent state, and lease
 * (agreement) status. Scope by a single property or by owner.
 */
export async function listRoster(opts: {
  ownerId?: string;
  propertyId?: string;
}): Promise<Result<RosterEntry[]>> {
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

    const { data: reservationRows, error: rErr } = await supabase
      .from("reservations")
      .select("*")
      .in("property_id", propertyIds)
      .eq("status", "active")
      .order("start_date", { ascending: true });
    if (rErr) throw rErr;
    const reservations = (reservationRows ?? []) as Reservation[];
    if (reservations.length === 0) return ok([]);

    const propIds = [...new Set(reservations.map((r) => r.property_id))];
    const bedIds = [
      ...new Set(reservations.map((r) => r.bed_id).filter(Boolean)),
    ] as string[];
    const tenantIds = [...new Set(reservations.map((r) => r.tenant_id))];
    const reservationIds = reservations.map((r) => r.id);
    const applicationIds = [
      ...new Set(reservations.map((r) => r.application_id).filter(Boolean)),
    ] as string[];

    const [
      { data: props },
      { data: beds },
      { data: users },
      { data: charges },
      { data: applications },
    ] = await Promise.all([
      supabase.from("properties").select("id, name").in("id", propIds),
      bedIds.length
        ? supabase.from("beds").select("id, label, room_id").in("id", bedIds)
        : Promise.resolve({ data: [] as { id: string }[] }),
      supabase.from("users").select("id, full_name, email, phone").in("id", tenantIds),
      supabase
        .from("rent_charges")
        .select("id, reservation_id, amount, status, due_date")
        .in("reservation_id", reservationIds),
      applicationIds.length
        ? supabase
            .from("applications")
            .select("id, agreement_status")
            .in("id", applicationIds)
        : Promise.resolve({ data: [] as { id: string }[] }),
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
        u as { full_name: string | null; email: string; phone: string | null },
      ])
    );
    const agreementByApp = new Map(
      (applications ?? []).map((a) => [
        (a as { id: string }).id,
        (a as { agreement_status: AgreementStatus }).agreement_status,
      ])
    );

    const chargesByReservation = new Map<string, RosterCharge[]>();
    for (const c of (charges ?? []) as Array<RentCharge & { reservation_id: string }>) {
      if (!c.reservation_id) continue;
      const list = chargesByReservation.get(c.reservation_id) ?? [];
      list.push({
        id: c.id,
        amount: Number(c.amount ?? 0),
        status: c.status,
        due_date: c.due_date,
      });
      chargesByReservation.set(c.reservation_id, list);
    }

    return ok(
      reservations.map((r) => {
        const bed = r.bed_id ? bedMap.get(r.bed_id) : undefined;
        const user = userMap.get(r.tenant_id);
        const entryCharges = (chargesByReservation.get(r.id) ?? []).sort((a, b) =>
          (a.due_date ?? "").localeCompare(b.due_date ?? "")
        );
        return {
          reservationId: r.id,
          reservationStatus: r.status,
          tenantId: r.tenant_id,
          tenantName: user?.full_name ?? null,
          tenantEmail: user?.email ?? null,
          tenantPhone: user?.phone ?? null,
          propertyId: r.property_id,
          propertyName: propName.get(r.property_id) ?? null,
          bedId: r.bed_id,
          bedLabel: bed?.label ?? null,
          roomName: bed?.room_id ? roomName.get(bed.room_id) ?? null : null,
          startDate: r.start_date,
          endDate: r.end_date,
          depositStatus: r.deposit_status,
          depositAmount: Number(r.deposit_amount ?? 0),
          accessCodeDelivery: r.access_code_delivery,
          agreementStatus: r.application_id
            ? agreementByApp.get(r.application_id) ?? null
            : null,
          rentStatus: rollupRent(entryCharges),
          charges: entryCharges,
        };
      })
    );
  } catch (error) {
    return fail(error);
  }
}
