import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { ok, fail, type Result } from "@/lib/result";
import type { RentCharge, RentStatus, Payment } from "@/lib/types";

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

// -----------------------------------------------------------------------------
// Landlord Payment Visibility
// -----------------------------------------------------------------------------

export interface PaymentWithRefs extends Payment {
  property_name: string | null;
  bed_label: string | null;
  tenant_name: string | null;
  rent_charge_due_date: string | null;
  rent_charge_period_start: string | null;
  rent_charge_period_end: string | null;
}

/**
 * Landlord: list all payments received for their properties.
 * Includes Stripe Connect fee breakdown when available.
 */
export async function listLandlordPayments(
  ownerId: string
): Promise<Result<PaymentWithRefs[]>> {
  try {
    const supabase = getServiceClient();

    // Get landlord's property IDs
    const { data: props, error: pErr } = await supabase
      .from("properties")
      .select("id")
      .eq("owner_id", ownerId);
    if (pErr) throw pErr;
    const propertyIds = (props ?? []).map((p) => p.id);
    if (propertyIds.length === 0) return ok([]);

    // Fetch payments for landlord's properties
    const { data: payments, error: payErr } = await supabase
      .from("payments")
      .select("*")
      .in("property_id", propertyIds)
      .eq("status", "recorded")
      .order("recorded_at", { ascending: false });
    if (payErr) throw payErr;
    if (!payments || payments.length === 0) return ok([]);

    // Enrich with property, bed, tenant, and rent charge info
    const bedIds = [
      ...new Set(payments.map((p) => p.bed_id).filter(Boolean)),
    ] as string[];
    const tenantIds = [...new Set(payments.map((p) => p.tenant_id))];
    const rentChargeIds = [
      ...new Set(payments.map((p) => p.rent_charge_id).filter(Boolean)),
    ] as string[];

    const [{ data: propsData }, { data: beds }, { data: users }, { data: charges }] =
      await Promise.all([
        supabase.from("properties").select("id, name").in("id", propertyIds),
        bedIds.length
          ? supabase.from("beds").select("id, label").in("id", bedIds)
          : Promise.resolve({ data: [] as { id: string; label: string }[] }),
        supabase.from("users").select("id, full_name").in("id", tenantIds),
        rentChargeIds.length
          ? supabase
              .from("rent_charges")
              .select("id, due_date, period_start, period_end")
              .in("id", rentChargeIds)
          : Promise.resolve({
              data: [] as {
                id: string;
                due_date: string | null;
                period_start: string | null;
                period_end: string | null;
              }[],
            }),
      ]);

    const propName = new Map((propsData ?? []).map((p) => [p.id, p.name]));
    const bedLabel = new Map((beds ?? []).map((b) => [b.id, b.label]));
    const userName = new Map(
      (users ?? []).map((u) => [
        (u as { id: string }).id,
        (u as { full_name: string | null }).full_name,
      ])
    );
    const chargeInfo = new Map(
      (charges ?? []).map((c) => [
        c.id,
        {
          due_date: c.due_date,
          period_start: c.period_start,
          period_end: c.period_end,
        },
      ])
    );

    return ok(
      (payments as Payment[]).map((p) => {
        const charge = p.rent_charge_id ? chargeInfo.get(p.rent_charge_id) : null;
        return {
          ...p,
          property_name: p.property_id ? propName.get(p.property_id) ?? null : null,
          bed_label: (p as unknown as { bed_id?: string }).bed_id
            ? bedLabel.get((p as unknown as { bed_id: string }).bed_id) ?? null
            : null,
          tenant_name: userName.get(p.tenant_id) ?? null,
          rent_charge_due_date: charge?.due_date ?? null,
          rent_charge_period_start: charge?.period_start ?? null,
          rent_charge_period_end: charge?.period_end ?? null,
        };
      })
    );
  } catch (error) {
    return fail(error);
  }
}

export interface LandlordPaymentStats {
  totalRentCents: number;
  totalHostFeeCents: number;
  totalLandlordPayoutCents: number;
  stripePaymentCount: number;
  manualPaymentCount: number;
}

/**
 * Calculate payment stats for landlord dashboard.
 */
export async function getLandlordPaymentStats(
  ownerId: string
): Promise<Result<LandlordPaymentStats>> {
  try {
    const supabase = getServiceClient();

    // Get landlord's property IDs
    const { data: props, error: pErr } = await supabase
      .from("properties")
      .select("id")
      .eq("owner_id", ownerId);
    if (pErr) throw pErr;
    const propertyIds = (props ?? []).map((p) => p.id);
    if (propertyIds.length === 0) {
      return ok({
        totalRentCents: 0,
        totalHostFeeCents: 0,
        totalLandlordPayoutCents: 0,
        stripePaymentCount: 0,
        manualPaymentCount: 0,
      });
    }

    // Fetch all recorded payments
    const { data: payments, error: payErr } = await supabase
      .from("payments")
      .select("amount, payment_provider, host_fee_cents, landlord_payout_cents")
      .in("property_id", propertyIds)
      .eq("status", "recorded");
    if (payErr) throw payErr;

    let totalRentCents = 0;
    let totalHostFeeCents = 0;
    let totalLandlordPayoutCents = 0;
    let stripePaymentCount = 0;
    let manualPaymentCount = 0;

    for (const p of payments ?? []) {
      const amountCents = Math.round((p.amount ?? 0) * 100);
      totalRentCents += amountCents;

      if (p.payment_provider === "stripe") {
        stripePaymentCount++;
        totalHostFeeCents += p.host_fee_cents ?? 0;
        totalLandlordPayoutCents += p.landlord_payout_cents ?? amountCents;
      } else {
        manualPaymentCount++;
        // Manual payments: landlord keeps 100%
        totalLandlordPayoutCents += amountCents;
      }
    }

    return ok({
      totalRentCents,
      totalHostFeeCents,
      totalLandlordPayoutCents,
      stripePaymentCount,
      manualPaymentCount,
    });
  } catch (error) {
    return fail(error);
  }
}
