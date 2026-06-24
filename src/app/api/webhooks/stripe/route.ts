import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminClient } from "@/lib/supabase/admin";

/**
 * Stripe webhook handler for Room Link platform billing.
 *
 * Handles subscription events for landlords paying Room Link.
 * NOT for Stripe Connect rent collection.
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
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("[webhook] Checkout completed:", session.id);

  // Only handle subscription checkouts
  if (session.mode !== "subscription") {
    return;
  }

  // Verify this is a Room Link platform subscription
  const billingType = session.metadata?.billing_type;
  if (billingType !== "roomlink_platform_subscription") {
    console.log("[webhook] Not a Room Link subscription, skipping");
    return;
  }

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const userId = session.metadata?.owner_id || session.metadata?.user_id;

  if (!userId) {
    console.error("[webhook] No user ID in checkout metadata");
    return;
  }

  const supabase = getAdminClient();

  // Update user with customer and subscription IDs
  const { error } = await supabase
    .from("users")
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_started_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("[webhook] Error updating user after checkout:", error);
    throw error;
  }

  console.log(`[webhook] Updated user ${userId} with subscription ${subscriptionId}`);
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  console.log("[webhook] Subscription changed:", subscription.id, subscription.status);

  // Verify this is a Room Link platform subscription
  const billingType = subscription.metadata?.billing_type;
  if (billingType !== "roomlink_platform_subscription") {
    console.log("[webhook] Not a Room Link subscription, skipping");
    return;
  }

  const customerId = subscription.customer as string;
  const userId = subscription.metadata?.owner_id || subscription.metadata?.user_id;

  // Get price ID and plan name
  const priceId = subscription.items.data[0]?.price?.id || null;
  const planName = determinePlanFromPriceId(priceId);

  // Access subscription period dates from the raw object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subData = subscription as any;
  const periodStart = subData.current_period_start;
  const periodEnd = subData.current_period_end;

  const supabase = getAdminClient();

  // Find user by customer ID or user ID
  let query = supabase.from("users").update({
    stripe_subscription_id: subscription.id,
    stripe_subscription_status: subscription.status,
    stripe_price_id: priceId,
    stripe_current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    stripe_current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    stripe_cancel_at_period_end: subscription.cancel_at_period_end,
    subscription_plan: planName,
  });

  if (userId) {
    query = query.eq("id", userId);
  } else {
    query = query.eq("stripe_customer_id", customerId);
  }

  const { error } = await query;

  if (error) {
    console.error("[webhook] Error updating subscription:", error);
    throw error;
  }

  console.log(`[webhook] Updated subscription ${subscription.id} to status ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("[webhook] Subscription deleted:", subscription.id);

  const customerId = subscription.customer as string;
  const userId = subscription.metadata?.owner_id || subscription.metadata?.user_id;

  const supabase = getAdminClient();

  let query = supabase.from("users").update({
    stripe_subscription_status: "canceled",
    stripe_cancel_at_period_end: false,
    subscription_plan: "free",
    subscription_canceled_at: new Date().toISOString(),
  });

  if (userId) {
    query = query.eq("id", userId);
  } else {
    query = query.eq("stripe_customer_id", customerId);
  }

  const { error } = await query;

  if (error) {
    console.error("[webhook] Error handling subscription deletion:", error);
    throw error;
  }

  console.log(`[webhook] Marked subscription ${subscription.id} as canceled`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("[webhook] Invoice payment succeeded:", invoice.id);

  // Update billing timestamp
  const customerId = invoice.customer as string;
  if (!customerId) return;

  const supabase = getAdminClient();

  // Just log for now - subscription webhook handles the main update
  console.log(`[webhook] Payment succeeded for customer ${customerId}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("[webhook] Invoice payment failed:", invoice.id);

  const customerId = invoice.customer as string;
  if (!customerId) return;

  // The subscription.updated webhook will handle status changes to past_due/unpaid
  console.log(`[webhook] Payment failed for customer ${customerId}`);
}

/**
 * Determine the plan name from the Stripe price ID.
 * Update this mapping when you add more plans.
 */
function determinePlanFromPriceId(priceId: string | null): string {
  if (!priceId) return "free";

  // Check environment variable first
  const monthlyPriceId = process.env.STRIPE_ROOMLINK_MONTHLY_PRICE_ID;
  if (priceId === monthlyPriceId) {
    return "pro"; // Default to pro for the main subscription
  }

  // Add more price ID mappings as needed
  // const starterPriceId = process.env.STRIPE_STARTER_PRICE_ID;
  // const enterprisePriceId = process.env.STRIPE_ENTERPRISE_PRICE_ID;

  return "pro";
}
