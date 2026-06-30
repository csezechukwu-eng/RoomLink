import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

/**
 * Stripe webhook handler for Room Link.
 *
 * BUSINESS MODEL (June 2025):
 * Room Link uses a transaction-fee model. Landlords do not pay subscriptions.
 * This webhook handles Stripe Checkout completion for tenant rent payments.
 *
 * Events handled:
 * - checkout.session.completed (tenant rent payment)
 * - account.updated (Stripe Connect onboarding status sync)
 * - identity.verification_session.verified (landlord ID verification complete)
 * - identity.verification_session.requires_input (verification needs action)
 * - identity.verification_session.canceled (verification canceled)
 *
 * Future events:
 * - payment_intent.payment_failed
 * - charge.refunded
 *
 * REMOVED: Subscription-related handlers (customer.subscription.*)
 * These were for landlord SaaS billing which is no longer used.
 */

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Create a Supabase client for webhook operations.
 * Uses service role key to bypass RLS.
 */
function getWebhookSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase not configured for webhook");
  }

  return createClient(url, serviceKey);
}

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    console.error("[webhook] Stripe not configured");
    return NextResponse.json(
      { error: "Stripe webhook not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("[webhook] Missing stripe-signature header");
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  console.log(`[webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      // =======================================================================
      // FUTURE: Marketplace Payment Events (Stripe Connect)
      // =======================================================================

      case "checkout.session.completed":
        // Future: Handle tenant booking payment completion
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "payment_intent.succeeded":
        // Future: Handle successful rent payment
        console.log("[webhook] Payment succeeded:", (event.data.object as Stripe.PaymentIntent).id);
        break;

      case "payment_intent.payment_failed":
        // Future: Handle failed rent payment
        console.log("[webhook] Payment failed:", (event.data.object as Stripe.PaymentIntent).id);
        break;

      case "charge.refunded":
        // Future: Handle refunds
        console.log("[webhook] Charge refunded:", (event.data.object as Stripe.Charge).id);
        break;

      case "account.updated":
        // Stripe Connect account status changed (onboarding progress, verification, etc.)
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      // =======================================================================
      // Identity Verification Events (Stripe Identity)
      // =======================================================================

      case "identity.verification_session.verified":
        // Landlord identity verification completed successfully
        await handleIdentityVerified(event.data.object as Stripe.Identity.VerificationSession);
        break;

      case "identity.verification_session.processing":
        // Stripe is reviewing the verification (documents submitted)
        await handleIdentityProcessing(event.data.object as Stripe.Identity.VerificationSession);
        break;

      case "identity.verification_session.requires_input":
        // Verification needs user action (e.g., clearer photo needed)
        await handleIdentityRequiresInput(event.data.object as Stripe.Identity.VerificationSession);
        break;

      case "identity.verification_session.canceled":
        // Verification was canceled
        await handleIdentityCanceled(event.data.object as Stripe.Identity.VerificationSession);
        break;

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[webhook] Error handling ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout session completion.
 * Updates the pending payment record and marks the rent charge as paid.
 *
 * Idempotency (replay-safe convergence):
 * - pending + unpaid  -> update both
 * - recorded + unpaid -> repair rent charge only (don't duplicate payment update)
 * - pending + paid    -> repair payment only (don't duplicate rent charge update)
 * - recorded + paid   -> no-op, already complete
 *
 * Failed/refunded payments are NOT overwritten - webhook logs warning and returns.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("[webhook] Checkout completed:", session.id);

  // ---------------------------------------------------------------------------
  // 1. Extract metadata
  // ---------------------------------------------------------------------------
  const metadata = session.metadata ?? {};
  const paymentType = metadata.payment_type;
  const paymentId = metadata.payment_id;
  const rentChargeId = metadata.rent_charge_id;

  // Skip legacy subscription checkouts
  if (metadata.billing_type === "roomlink_platform_subscription") {
    console.log("[webhook] Ignoring legacy subscription checkout");
    return;
  }

  // Only handle rent payments
  if (paymentType !== "rent") {
    console.log("[webhook] Ignoring non-rent payment type:", paymentType);
    return;
  }

  // Must have rent_charge_id at minimum
  if (!rentChargeId) {
    console.error("[webhook] Missing rent_charge_id in session metadata");
    return;
  }

  console.log("[webhook] Processing rent payment:", {
    sessionId: session.id,
    paymentId: paymentId ?? "(none)",
    rentChargeId,
  });

  // ---------------------------------------------------------------------------
  // 2. Get Supabase client
  // ---------------------------------------------------------------------------
  let supabase;
  try {
    supabase = getWebhookSupabaseClient();
  } catch (error) {
    console.error("[webhook] Supabase not configured:", error);
    return;
  }

  // ---------------------------------------------------------------------------
  // 3. Find the payment record (pending OR recorded for replay handling)
  // ---------------------------------------------------------------------------
  let payment;

  if (paymentId) {
    // Prefer lookup by payment_id (includes already-recorded for replay)
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();

    if (error) {
      console.error("[webhook] Error fetching payment by id:", error);
      return;
    }
    payment = data;
  }

  if (!payment && rentChargeId) {
    // Fall back to rent_charge_id lookup for Stripe payments (pending or recorded)
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("rent_charge_id", rentChargeId)
      .eq("payment_provider", "stripe")
      .in("status", ["pending", "recorded"])
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[webhook] Error fetching payment by rent_charge_id:", error);
      return;
    }
    payment = data;
  }

  if (!payment) {
    console.error("[webhook] No matching payment record found for session:", session.id);
    return;
  }

  // ---------------------------------------------------------------------------
  // 4. Validate payment record
  // ---------------------------------------------------------------------------
  // Check provider
  if (payment.payment_provider !== "stripe") {
    console.error("[webhook] Payment provider mismatch:", payment.payment_provider);
    return;
  }

  // Verify rent_charge_id matches
  if (payment.rent_charge_id !== rentChargeId) {
    console.error("[webhook] rent_charge_id mismatch:", {
      paymentRentChargeId: payment.rent_charge_id,
      sessionRentChargeId: rentChargeId,
    });
    return;
  }

  // Handle failed/refunded - do NOT overwrite these states
  if (payment.status === "failed" || payment.status === "refunded") {
    console.warn("[webhook] Payment is already failed/refunded, not overwriting:", {
      paymentId: payment.id,
      status: payment.status,
    });
    return;
  }

  // ---------------------------------------------------------------------------
  // 5. Fetch rent charge to check current state
  // ---------------------------------------------------------------------------
  const { data: rentCharge, error: rentChargeError } = await supabase
    .from("rent_charges")
    .select("id, status")
    .eq("id", rentChargeId)
    .maybeSingle();

  if (rentChargeError) {
    console.error("[webhook] Error fetching rent charge:", rentChargeError);
    return;
  }

  if (!rentCharge) {
    console.error("[webhook] Rent charge not found:", rentChargeId);
    return;
  }

  // ---------------------------------------------------------------------------
  // 6. Determine current state and what needs updating
  // ---------------------------------------------------------------------------
  const paymentIsRecorded = payment.status === "recorded";
  const rentChargeIsPaid = rentCharge.status === "paid";

  console.log("[webhook] Current state:", {
    paymentStatus: payment.status,
    rentChargeStatus: rentCharge.status,
    paymentIsRecorded,
    rentChargeIsPaid,
  });

  // If BOTH are already in final state, no-op
  if (paymentIsRecorded && rentChargeIsPaid) {
    console.log("[webhook] Already fully processed, skipping:", {
      paymentId: payment.id,
      rentChargeId,
    });
    return;
  }

  // ---------------------------------------------------------------------------
  // 7. Extract Stripe Connect fee data from metadata (if present)
  // ---------------------------------------------------------------------------
  const hostFeeCentsStr = metadata.host_fee_cents;
  const landlordPayoutCentsStr = metadata.landlord_payout_cents;
  const connectedAccountIdFromMeta = metadata.connected_account_id;

  const hostFeeCents = hostFeeCentsStr ? parseInt(hostFeeCentsStr, 10) : null;
  const landlordPayoutCents = landlordPayoutCentsStr ? parseInt(landlordPayoutCentsStr, 10) : null;

  // ---------------------------------------------------------------------------
  // 8. Update payment record to "recorded" (if not already)
  // ---------------------------------------------------------------------------
  if (!paymentIsRecorded) {
    const updateData: Record<string, unknown> = {
      status: "recorded",
      recorded_at: new Date().toISOString(),
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
    };

    // Add fee data if present
    if (hostFeeCents != null) {
      updateData.host_fee_cents = hostFeeCents;
    }
    if (landlordPayoutCents != null) {
      updateData.landlord_payout_cents = landlordPayoutCents;
    }
    if (connectedAccountIdFromMeta) {
      updateData.connected_account_id = connectedAccountIdFromMeta;
    }

    const { error: paymentUpdateError } = await supabase
      .from("payments")
      .update(updateData)
      .eq("id", payment.id);

    if (paymentUpdateError) {
      console.error("[webhook] Error updating payment:", paymentUpdateError);
      return;
    }

    console.log("[webhook] Payment marked as recorded:", payment.id);
  } else {
    console.log("[webhook] Payment already recorded, skipping payment update:", payment.id);
  }

  // ---------------------------------------------------------------------------
  // 9. Update rent charge to "paid" (if not already)
  // ---------------------------------------------------------------------------
  if (!rentChargeIsPaid) {
    const { error: rentUpdateError } = await supabase
      .from("rent_charges")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", rentChargeId);

    if (rentUpdateError) {
      console.error("[webhook] Error updating rent charge:", rentUpdateError);
      return;
    }

    console.log("[webhook] Rent charge marked as paid:", rentChargeId);
  } else {
    console.log("[webhook] Rent charge already paid, skipping rent charge update:", rentChargeId);
  }

  console.log("[webhook] Checkout session processing complete:", session.id);
}

/**
 * Handle Stripe Connect account.updated webhook.
 * Syncs the landlord's payout readiness status to the database.
 *
 * This is called when:
 * - Landlord completes onboarding steps
 * - Stripe verifies the landlord's identity
 * - Account capabilities change
 * - Requirements are updated
 */
async function handleAccountUpdated(account: Stripe.Account) {
  console.log("[webhook] Account updated:", account.id);

  // ---------------------------------------------------------------------------
  // 1. Get Supabase client
  // ---------------------------------------------------------------------------
  let supabase;
  try {
    supabase = getWebhookSupabaseClient();
  } catch (error) {
    console.error("[webhook] Supabase not configured:", error);
    return;
  }

  // ---------------------------------------------------------------------------
  // 2. Find the landlord with this Stripe account ID
  // ---------------------------------------------------------------------------
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_account_id", account.id)
    .maybeSingle();

  if (userError) {
    console.error("[webhook] Error finding user for account:", userError);
    return;
  }

  if (!user) {
    console.log("[webhook] No user found for Stripe account:", account.id);
    return;
  }

  // ---------------------------------------------------------------------------
  // 3. Extract account status
  // ---------------------------------------------------------------------------
  const chargesEnabled = account.charges_enabled ?? false;
  const payoutsEnabled = account.payouts_enabled ?? false;
  const detailsSubmitted = account.details_submitted ?? false;

  // Combine requirements
  const requirementsDue = [
    ...(account.requirements?.currently_due ?? []),
    ...(account.requirements?.eventually_due ?? []),
  ];
  const uniqueRequirements = [...new Set(requirementsDue)];

  // Calculate onboarding complete
  const onboardingComplete = chargesEnabled && payoutsEnabled;

  console.log("[webhook] Account status:", {
    accountId: account.id,
    userId: user.id,
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted,
    onboardingComplete,
    requirementsCount: uniqueRequirements.length,
  });

  // ---------------------------------------------------------------------------
  // 4. Update user record
  // ---------------------------------------------------------------------------
  const { error: updateError } = await supabase
    .from("users")
    .update({
      stripe_connect_charges_enabled: chargesEnabled,
      stripe_connect_payouts_enabled: payoutsEnabled,
      stripe_connect_details_submitted: detailsSubmitted,
      stripe_connect_onboarding_complete: onboardingComplete,
      stripe_connect_requirements_due: uniqueRequirements,
      stripe_connect_enabled: onboardingComplete,
      stripe_connect_last_synced_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("[webhook] Error updating user:", updateError);
    return;
  }

  console.log("[webhook] User payout status synced:", {
    userId: user.id,
    onboardingComplete,
  });
}

// =============================================================================
// Identity Verification Event Handlers
// =============================================================================

/**
 * Update identity verification status in both users and attempts tables.
 * This is the common handler for all identity events.
 */
async function updateIdentityVerificationStatus(
  session: Stripe.Identity.VerificationSession,
  status: string,
  setVerifiedAt: boolean
) {
  console.log("[webhook] Updating identity status to:", status);
  console.log("[webhook] Session ID:", session.id);
  console.log("[webhook] Session metadata:", session.metadata);

  let supabase;
  try {
    supabase = getWebhookSupabaseClient();
  } catch (error) {
    console.error("[webhook] Supabase not configured:", error);
    return;
  }

  const userId = session.metadata?.user_id;
  const attemptId = session.metadata?.attempt_id;
  const now = new Date().toISOString();

  // Prepare update data for users table
  const userUpdateData: Record<string, unknown> = {
    verification_status: status,
  };

  if (setVerifiedAt) {
    userUpdateData.identity_verified_at = now;
  }

  // Update users table
  if (userId) {
    const { error: userError, data: userResult } = await supabase
      .from("users")
      .update(userUpdateData)
      .eq("id", userId)
      .select("id, verification_status");

    if (userError) {
      console.error("[webhook] Error updating user:", userError);
    } else {
      console.log("[webhook] User updated:", userResult);
    }
  } else {
    // Fallback: find user by session ID
    const { error: userError, data: userResult } = await supabase
      .from("users")
      .update(userUpdateData)
      .eq("identity_verification_session_id", session.id)
      .select("id, verification_status");

    if (userError) {
      console.error("[webhook] Error updating user by session ID:", userError);
    } else if (!userResult || userResult.length === 0) {
      console.log("[webhook] No user found with session ID:", session.id);
    } else {
      console.log("[webhook] User updated by session ID:", userResult);
    }
  }

  // Update identity_verification_attempts table
  const attemptUpdateData: Record<string, unknown> = {
    status,
    stripe_status: session.status,
    stripe_last_error: session.last_error?.reason || null,
    last_synced_at: now,
  };

  if (attemptId) {
    // Update by attempt ID from metadata
    const { error: attemptError } = await supabase
      .from("identity_verification_attempts")
      .update(attemptUpdateData)
      .eq("id", attemptId);

    if (attemptError) {
      console.error("[webhook] Error updating attempt by ID:", attemptError);
    } else {
      console.log("[webhook] Attempt updated by ID:", attemptId);
    }
  } else {
    // Fallback: update by Stripe session ID
    const { error: attemptError } = await supabase
      .from("identity_verification_attempts")
      .update(attemptUpdateData)
      .eq("stripe_verification_session_id", session.id);

    if (attemptError) {
      console.error("[webhook] Error updating attempt by session ID:", attemptError);
    } else {
      console.log("[webhook] Attempt updated by session ID:", session.id);
    }
  }
}

/**
 * Handle identity verification completed successfully.
 */
async function handleIdentityVerified(session: Stripe.Identity.VerificationSession) {
  console.log("[webhook] ===== IDENTITY VERIFIED =====");
  await updateIdentityVerificationStatus(session, "verified", true);
}

/**
 * Handle identity verification processing.
 */
async function handleIdentityProcessing(session: Stripe.Identity.VerificationSession) {
  console.log("[webhook] ===== IDENTITY PROCESSING =====");
  await updateIdentityVerificationStatus(session, "processing", false);
}

/**
 * Handle identity verification requiring additional input.
 */
async function handleIdentityRequiresInput(session: Stripe.Identity.VerificationSession) {
  console.log("[webhook] ===== IDENTITY REQUIRES INPUT =====");
  console.log("[webhook] Last error:", session.last_error);

  // Determine status based on whether there's an error
  const hasError = !!session.last_error;
  const status = hasError ? "needs_attention" : "pending";

  await updateIdentityVerificationStatus(session, status, false);
}

/**
 * Handle identity verification canceled.
 */
async function handleIdentityCanceled(session: Stripe.Identity.VerificationSession) {
  console.log("[webhook] ===== IDENTITY CANCELED =====");
  await updateIdentityVerificationStatus(session, "canceled", false);
}
