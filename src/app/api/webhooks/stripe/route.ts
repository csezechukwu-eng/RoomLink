import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * Stripe webhook handler for Room Link.
 *
 * BUSINESS MODEL (June 2025):
 * Room Link uses a transaction-fee model. Landlords do not pay subscriptions.
 * This webhook is prepared for future Stripe Connect marketplace payments.
 *
 * Future events to handle:
 * - checkout.session.completed (tenant booking payment)
 * - payment_intent.succeeded (monthly rent payment)
 * - payment_intent.payment_failed
 * - charge.refunded
 * - account.updated (Stripe Connect onboarding)
 *
 * REMOVED: Subscription-related handlers (customer.subscription.*)
 * These were for landlord SaaS billing which is no longer used.
 */

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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
        // Future: Handle Stripe Connect account updates
        console.log("[webhook] Connected account updated:", (event.data.object as Stripe.Account).id);
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
 * Future: Process tenant booking payments through Stripe Connect.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("[webhook] Checkout completed:", session.id);

  // Future implementation for marketplace payments:
  // 1. Verify this is a booking/rent payment (check metadata)
  // 2. Update reservation/booking status in database
  // 3. Record payment in database
  // 4. Trigger any post-payment workflows (notifications, etc.)

  const billingType = session.metadata?.billing_type;

  // Skip legacy subscription checkouts (should not occur anymore)
  if (billingType === "roomlink_platform_subscription") {
    console.log("[webhook] Ignoring legacy subscription checkout");
    return;
  }

  // Future: Handle marketplace booking payments
  if (billingType === "booking_payment" || billingType === "rent_payment") {
    console.log("[webhook] Marketplace payment - implementation pending");
    // TODO: Implement when Stripe Connect is ready
  }
}
