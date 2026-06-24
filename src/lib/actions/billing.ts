"use server";

import { stripe, isStripeConfigured, getRoomLinkPriceId, getBaseUrl } from "@/lib/stripe/server";
import { createAuthenticatedClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/server";
import { isDemoMode, DEMO_OWNER_ID } from "@/lib/auth";

/**
 * Billing actions for Room Link platform subscription.
 *
 * These handle landlords paying Room Link (Flow B).
 * NOT for Stripe Connect rent collection (Flow A).
 */

export interface BillingActionResult {
  success: boolean;
  error?: string;
  url?: string;
}

/**
 * Create a Stripe Checkout session for Room Link subscription.
 * Redirects landlord to Stripe Checkout to start their subscription.
 */
export async function createRoomLinkSubscriptionCheckout(): Promise<BillingActionResult> {
  try {
    // Check Stripe configuration
    if (!stripe || !isStripeConfigured()) {
      return {
        success: false,
        error: "Stripe billing is not configured. Please contact support.",
      };
    }

    const priceId = getRoomLinkPriceId();
    if (!priceId) {
      return {
        success: false,
        error: "Subscription pricing is not configured.",
      };
    }

    // Get authenticated user
    let userId: string;
    let userEmail: string;

    if (isDemoMode()) {
      userId = DEMO_OWNER_ID;
      userEmail = "demo@roomlink.local";
    } else {
      const authUser = await getAuthUser();
      if (!authUser) {
        return { success: false, error: "Please sign in to continue." };
      }
      userId = authUser.id;
      userEmail = authUser.email || "";
    }

    const supabase = await createAuthenticatedClient();

    // Fetch or create Stripe customer
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("stripe_customer_id, email, full_name, billing_email")
      .eq("id", userId)
      .single();

    if (userError && userError.code !== "PGRST116") {
      console.error("[billing] Error fetching user:", userError);
      return { success: false, error: "Failed to load account data." };
    }

    let stripeCustomerId = userData?.stripe_customer_id;
    const billingEmail = userData?.billing_email || userData?.email || userEmail;

    // Create Stripe customer if needed
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: billingEmail,
        name: userData?.full_name || undefined,
        metadata: {
          owner_id: userId,
          user_id: userId,
          billing_type: "roomlink_platform_subscription",
        },
      });

      stripeCustomerId = customer.id;

      // Save stripe_customer_id to database
      const { error: updateError } = await supabase
        .from("users")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", userId);

      if (updateError) {
        console.error("[billing] Error saving stripe_customer_id:", updateError);
        // Continue anyway - checkout will still work
      }
    }

    // Create Checkout Session
    const baseUrl = getBaseUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard/settings/billing?success=true`,
      cancel_url: `${baseUrl}/dashboard/settings/billing?canceled=true`,
      metadata: {
        owner_id: userId,
        user_id: userId,
        billing_type: "roomlink_platform_subscription",
      },
      subscription_data: {
        metadata: {
          owner_id: userId,
          user_id: userId,
          billing_type: "roomlink_platform_subscription",
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    if (!session.url) {
      return { success: false, error: "Failed to create checkout session." };
    }

    return { success: true, url: session.url };
  } catch (error) {
    console.error("[billing] Checkout error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to start checkout.",
    };
  }
}

/**
 * Create a Stripe Customer Portal session for managing billing.
 * Allows landlords to update payment method, view invoices, cancel subscription.
 */
export async function createRoomLinkBillingPortalSession(): Promise<BillingActionResult> {
  try {
    if (!stripe) {
      return {
        success: false,
        error: "Stripe billing is not configured.",
      };
    }

    // Get authenticated user
    let userId: string;

    if (isDemoMode()) {
      userId = DEMO_OWNER_ID;
    } else {
      const authUser = await getAuthUser();
      if (!authUser) {
        return { success: false, error: "Please sign in to continue." };
      }
      userId = authUser.id;
    }

    const supabase = await createAuthenticatedClient();

    // Get stripe_customer_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    if (userError || !userData?.stripe_customer_id) {
      return {
        success: false,
        error: "No billing account found. Start a subscription first.",
      };
    }

    const baseUrl = getBaseUrl();
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripe_customer_id,
      return_url: `${baseUrl}/dashboard/settings/billing`,
    });

    return { success: true, url: session.url };
  } catch (error) {
    console.error("[billing] Portal error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to open billing portal.",
    };
  }
}

/**
 * Get current subscription status from database.
 */
export async function getSubscriptionStatus() {
  try {
    if (isDemoMode()) {
      // Return mock data for demo mode
      return {
        hasSubscription: true,
        subscription: {
          status: "active" as const,
          plan: "pro" as const,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancelAtPeriodEnd: false,
        },
        stripeCustomerId: null,
        error: null,
      };
    }

    const authUser = await getAuthUser();
    if (!authUser) {
      return { hasSubscription: false, subscription: null, stripeCustomerId: null, error: "Not authenticated" };
    }
    const userId = authUser.id;

    const supabase = await createAuthenticatedClient();

    const { data, error } = await supabase
      .from("users")
      .select(`
        stripe_customer_id,
        stripe_subscription_id,
        stripe_subscription_status,
        stripe_price_id,
        stripe_current_period_start,
        stripe_current_period_end,
        stripe_cancel_at_period_end,
        subscription_plan,
        subscription_started_at,
        subscription_canceled_at
      `)
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("[billing] Error fetching subscription:", error);
      return { hasSubscription: false, subscription: null, stripeCustomerId: null, error: error.message };
    }

    const hasActiveSubscription = data?.stripe_subscription_status === "active" ||
                                   data?.stripe_subscription_status === "trialing";

    return {
      hasSubscription: hasActiveSubscription,
      subscription: data ? {
        status: data.stripe_subscription_status,
        plan: data.subscription_plan,
        priceId: data.stripe_price_id,
        currentPeriodStart: data.stripe_current_period_start,
        currentPeriodEnd: data.stripe_current_period_end,
        cancelAtPeriodEnd: data.stripe_cancel_at_period_end,
        startedAt: data.subscription_started_at,
        canceledAt: data.subscription_canceled_at,
      } : null,
      stripeCustomerId: data?.stripe_customer_id || null,
      error: null,
    };
  } catch (error) {
    console.error("[billing] Error getting subscription status:", error);
    return {
      hasSubscription: false,
      subscription: null,
      stripeCustomerId: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
