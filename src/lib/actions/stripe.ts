"use server";

import { getServiceClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/auth";
import { createRentCheckoutSession } from "@/lib/stripe/checkout";
import { calculateHostFee } from "@/lib/stripe/connect";
import type { ActionState } from "@/lib/actions/types";
import { errorState, successState } from "@/lib/actions/_shared";
import type { RentCharge, Payment } from "@/lib/types";

/**
 * Server action to create a Stripe Checkout Session for tenant rent payment.
 *
 * Security:
 * - Requires authenticated tenant
 * - Verifies rent charge belongs to the tenant
 * - Fetches amount from database (never trusts client)
 * - Creates/reuses pending payment record to prevent duplicates
 *
 * Stripe Connect:
 * - Checks if landlord has charges_enabled
 * - Calculates 5% host fee (Room Link keeps this)
 * - Routes 95% to landlord via destination charge
 *
 * Does NOT:
 * - Mark rent_charges as paid (webhook does that)
 * - Process live payments (test mode only)
 */
export async function createRentCheckoutSessionAction(
  rentChargeId: string
): Promise<ActionState> {
  // ---------------------------------------------------------------------------
  // 1. Validate input
  // ---------------------------------------------------------------------------
  if (!rentChargeId || typeof rentChargeId !== "string") {
    return errorState("Missing rent charge ID.");
  }

  // ---------------------------------------------------------------------------
  // 2. Authenticate tenant
  // ---------------------------------------------------------------------------
  const tenantId = await getCurrentTenantId();
  if (!tenantId) {
    return errorState("Not authenticated. Please sign in.");
  }

  // ---------------------------------------------------------------------------
  // 3. Fetch rent charge from database
  // ---------------------------------------------------------------------------
  const supabase = getServiceClient();

  const { data: rentCharge, error: chargeError } = await supabase
    .from("rent_charges")
    .select("*")
    .eq("id", rentChargeId)
    .maybeSingle();

  if (chargeError) {
    console.error("[createRentCheckoutSessionAction] DB error:", chargeError);
    return errorState("Unable to load rent charge. Please try again.");
  }

  if (!rentCharge) {
    return errorState("Rent charge not found.");
  }

  const charge = rentCharge as RentCharge;

  // ---------------------------------------------------------------------------
  // 4. Verify rent charge belongs to this tenant
  // ---------------------------------------------------------------------------
  if (charge.tenant_id !== tenantId) {
    // Security: Don't reveal the charge exists to unauthorized users
    return errorState("Rent charge not found.");
  }

  // ---------------------------------------------------------------------------
  // 5. Check rent charge is not already paid/waived
  // ---------------------------------------------------------------------------
  if (charge.status === "paid") {
    return errorState("This rent charge has already been paid.");
  }

  if (charge.status === "waived") {
    return errorState("This rent charge has been waived and cannot be paid.");
  }

  // ---------------------------------------------------------------------------
  // 6. Validate amount
  // ---------------------------------------------------------------------------
  const amountCents = Math.round(Number(charge.amount) * 100);

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return errorState(
      "Payment amount is not configured for this rent charge. Please contact your landlord."
    );
  }

  // ---------------------------------------------------------------------------
  // 7. Get landlord and their Stripe Connect status
  // ---------------------------------------------------------------------------
  let landlordId: string | null = null;
  let connectedAccountId: string | null = null;
  let landlordChargesEnabled = false;

  const { data: property } = await supabase
    .from("properties")
    .select("owner_id")
    .eq("id", charge.property_id)
    .maybeSingle();

  if (property) {
    landlordId = property.owner_id;

    // Fetch landlord's Stripe Connect status
    const { data: landlord } = await supabase
      .from("users")
      .select("stripe_account_id, stripe_connect_charges_enabled")
      .eq("id", property.owner_id)
      .maybeSingle();

    if (landlord) {
      connectedAccountId = landlord.stripe_account_id;
      landlordChargesEnabled = landlord.stripe_connect_charges_enabled ?? false;
    }
  }

  // ---------------------------------------------------------------------------
  // 8. Check if host is ready to receive payments
  // ---------------------------------------------------------------------------
  // If landlord has a connected account but charges aren't enabled, block payment
  if (connectedAccountId && !landlordChargesEnabled) {
    return errorState(
      "This host is still setting up payouts. Please check back soon or contact support."
    );
  }

  // ---------------------------------------------------------------------------
  // 9. Calculate host fee (only if landlord has connected account)
  // ---------------------------------------------------------------------------
  let hostFeeCents: number | null = null;
  let landlordPayoutCents: number | null = null;

  if (connectedAccountId && landlordChargesEnabled) {
    const feeBreakdown = calculateHostFee(amountCents);
    hostFeeCents = feeBreakdown.hostFeeCents;
    landlordPayoutCents = feeBreakdown.landlordPayoutCents;
  }

  // ---------------------------------------------------------------------------
  // 10. Check for existing pending payment (prevent duplicates)
  // ---------------------------------------------------------------------------
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("*")
    .eq("rent_charge_id", rentChargeId)
    .eq("status", "pending")
    .maybeSingle();

  let paymentId: string;

  if (existingPayment) {
    // Reuse existing pending payment
    paymentId = (existingPayment as Payment).id;

    // Update existing payment with latest fee info if it changed
    if (connectedAccountId && landlordChargesEnabled) {
      await supabase
        .from("payments")
        .update({
          host_fee_cents: hostFeeCents,
          landlord_payout_cents: landlordPayoutCents,
          connected_account_id: connectedAccountId,
        })
        .eq("id", paymentId);
    }
  } else {
    // ---------------------------------------------------------------------------
    // 11. Create new pending payment record
    // ---------------------------------------------------------------------------
    const { data: newPayment, error: insertError } = await supabase
      .from("payments")
      .insert({
        tenant_id: tenantId,
        reservation_id: charge.reservation_id,
        rent_charge_id: rentChargeId,
        property_id: charge.property_id,
        kind: "rent",
        amount: charge.amount,
        payment_provider: "stripe",
        status: "pending",
        // Stripe Connect fields
        host_fee_cents: hostFeeCents,
        landlord_payout_cents: landlordPayoutCents,
        connected_account_id: connectedAccountId,
      })
      .select("id")
      .single();

    if (insertError || !newPayment) {
      console.error("[createRentCheckoutSessionAction] Payment insert error:", insertError);
      return errorState("Unable to initialize payment. Please try again.");
    }

    paymentId = newPayment.id;
  }

  // ---------------------------------------------------------------------------
  // 12. Create Stripe Checkout Session
  // ---------------------------------------------------------------------------
  try {
    const result = await createRentCheckoutSession({
      rentChargeId,
      tenantId,
      landlordId,
      propertyId: charge.property_id,
      bedId: charge.bed_id,
      amountCents,
      paymentId,
      description: charge.period_start
        ? `Rent Payment - ${new Date(charge.period_start).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
        : "Rent Payment",
      // Stripe Connect fields (only if landlord is connected)
      connectedAccountId: landlordChargesEnabled ? connectedAccountId : null,
      hostFeeCents: landlordChargesEnabled ? hostFeeCents : null,
      landlordPayoutCents: landlordChargesEnabled ? landlordPayoutCents : null,
    });

    return successState("Checkout session created.", {
      sessionId: result.sessionId,
      url: result.url,
    });
  } catch (error) {
    console.error("[createRentCheckoutSessionAction] Checkout error:", error);

    // Handle Stripe not configured
    if (error instanceof Error && error.message.includes("not configured")) {
      return errorState(
        "Payment system is not configured. Please contact support."
      );
    }

    // Generic error (don't expose Stripe internals)
    return errorState("Unable to create checkout session. Please try again.");
  }
}
