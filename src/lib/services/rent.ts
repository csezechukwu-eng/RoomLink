import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { ok, fail, type Result } from "@/lib/result";
import type { RentCharge, RentStatus } from "@/lib/types";

export interface RentChargeWithRefs extends RentCharge {
  property_name: string | null;
  bed_label: string | null;
  tenant_name: string | null;
}

async function enrich(charges: RentCharge[]): Promise<RentChargeWithRefs[]> {
  if (charges.length === 0) return [];
  const supabase = getServiceClient();

  const propertyIds = [...new Set(charges.map((c) => c.property_id))];
  const bedIds = [
    ...new Set(charges.map((c) => c.bed_id).filter(Boolean)),
  ] as string[];
  const tenantIds = [...new Set(charges.map((c) => c.tenant_id))];

  const [{ data: props }, { data: beds }, { data: users }] = await Promise.all([
    supabase.from("properties").select("id, name").in("id", propertyIds),
    bedIds.length
      ? supabase.from("beds").select("id, label").in("id", bedIds)
      : Promise.resolve({ data: [] as { id: string }[] }),
    supabase.from("users").select("id, full_name").in("id", tenantIds),
  ]);

  const propName = new Map((props ?? []).map((p) => [p.id, p.name]));
  const bedLabel = new Map(
    (beds ?? []).map((b) => [(b as { id: string }).id, (b as { label: string }).label])
  );
  const userName = new Map(
    (users ?? []).map((u) => [
      (u as { id: string }).id,
      (u as { full_name: string | null }).full_name,
    ])
  );

  return charges.map((c) => ({
    ...c,
    property_name: propName.get(c.property_id) ?? null,
    bed_label: c.bed_id ? bedLabel.get(c.bed_id) ?? null : null,
    tenant_name: userName.get(c.tenant_id) ?? null,
  }));
}

/** Landlord: list rent charges (optionally scoped to a property). */
export async function listRentCharges(opts: {
  ownerId?: string;
  propertyId?: string;
}): Promise<Result<RentChargeWithRefs[]>> {
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
      .from("rent_charges")
      .select("*")
      .in("property_id", propertyIds)
      .order("due_date", { ascending: false });
    if (error) throw error;
    return ok(await enrich((data ?? []) as RentCharge[]));
  } catch (error) {
    return fail(error);
  }
}

/** Tenant portal: a tenant's rent charges, newest first. */
export async function getTenantRent(
  tenantId: string
): Promise<Result<RentChargeWithRefs[]>> {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("rent_charges")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("due_date", { ascending: false });
    if (error) throw error;
    return ok(await enrich((data ?? []) as RentCharge[]));
  } catch (error) {
    return fail(error);
  }
}

/** Landlord: manually set a rent charge's status. Records a payment when paid. */
export async function setRentChargeStatus(
  chargeId: string,
  status: RentStatus
): Promise<Result<null>> {
  try {
    const supabase = getServiceClient();
    const { data: charge, error: cErr } = await supabase
      .from("rent_charges")
      .select("*")
      .eq("id", chargeId)
      .maybeSingle();
    if (cErr) throw cErr;
    if (!charge) return fail("Rent charge not found.");

    const wasPaid = charge.status === "paid";
    const { error: updErr } = await supabase
      .from("rent_charges")
      .update({
        status,
        paid_at: status === "paid" ? new Date().toISOString() : null,
      })
      .eq("id", chargeId);
    if (updErr) throw updErr;

    // Record a manual payment the first time it transitions to paid.
    if (status === "paid" && !wasPaid) {
      const { error: payErr } = await supabase.from("payments").insert({
        tenant_id: charge.tenant_id,
        reservation_id: charge.reservation_id,
        rent_charge_id: charge.id,
        property_id: charge.property_id,
        kind: "rent",
        amount: charge.amount,
        payment_provider: "manual",
        status: "recorded",
      });
      if (payErr) throw payErr;
    }
    return ok(null);
  } catch (error) {
    return fail(error);
  }
}
