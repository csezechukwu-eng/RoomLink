"use server";

import { getServiceClient } from "@/lib/supabase/server";
import { getCurrentOwnerId, getCurrentUser } from "@/lib/auth";
import {
  createConnectAccount,
  createOnboardingLink,
  getAccountStatus,
  createDashboardLink,
  computeOnboardingStatus,
} from "@/lib/stripe/connect";
import type { ActionState } from "@/lib/actions/types";
import { errorState, successState } from "@/lib/actions/_shared";
import type { StripeConnectOnboardingStatus } from "@/lib/types";

/**
 * Server actions for Stripe Connect landlord onboarding.
 *
 * SECURITY:
 * - All actions require authenticated landlord
 * - Landlord can only manage their own Connect account
 * - Stripe secret key stays server-side
 *
 * BUSINESS MODEL:
 * - No monthly subscription for landlords
 * - 5% host fee deducted from each rent payment
 * - Landlord keeps 95% of monthly rent
 */

// -----------------------------------------------------------------------------
// Types for action responses
// -----------------------------------------------------------------------------

export interface ConnectStatusData {
  onboardingStatus: StripeConnectOnboardingStatus;
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsDue: string[];
}

// -----------------------------------------------------------------------------
// Actions
// -----------------------------------------------------------------------------

/**
 * Get the current landlord's Stripe Connect status.
 * This is used to display the onboarding UI state.
 */
export async function getStripeConnectStatusAction(): Promise<ActionState> {
  // 1. Authenticate landlord
  const ownerId = await getCurrentOwnerId();
  if (!ownerId) {
    return errorState("Not authenticated. Please sign in.");
  }

  // 2. Fetch landlord's Stripe Connect fields
  const supabase = getServiceClient();
  const { data: user, error } = await supabase
    .from("users")
    .select(`
      stripe_account_id,
      stripe_connect_account_type,
      stripe_connect_charges_enabled,
      stripe_connect_payouts_enabled,
      stripe_connect_details_submitted,
      stripe_connect_requirements_due
    `)
    .eq("id", ownerId)
    .maybeSingle();

  if (error) {
    console.error("[getStripeConnectStatusAction] DB error:", error);
    return errorState("Unable to load payout status. Please try again.");
  }

  // 3. Compute status
  const accountId = user?.stripe_account_id ?? null;
  const chargesEnabled = user?.stripe_connect_charges_enabled ?? false;
  const payoutsEnabled = user?.stripe_connect_payouts_enabled ?? false;
  const detailsSubmitted = user?.stripe_connect_details_submitted ?? false;
  const requirementsDue = (user?.stripe_connect_requirements_due as string[]) ?? [];

  const onboardingStatus = computeOnboardingStatus(
    accountId,
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted
  );

  return successState("Status loaded.", {
    onboardingStatus,
    accountId,
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted,
    requirementsDue,
  });
}

/**
 * Create or reuse a Stripe Connect Express account for the landlord.
 * If account already exists, returns the existing account ID.
 */
export async function createStripeConnectAccountAction(): Promise<ActionState> {
  // 1. Authenticate landlord
  const user = await getCurrentUser();
  if (!user) {
    return errorState("Not authenticated. Please sign in.");
  }

  const ownerId = user.id;
  const email = user.email ?? "";

  // 2. Check if account already exists
  const supabase = getServiceClient();
  const { data: existing } = await supabase
    .from("users")
    .select("stripe_account_id")
    .eq("id", ownerId)
    .maybeSingle();

  if (existing?.stripe_account_id) {
    // Already has an account
    return successState("Account already exists.", {
      accountId: existing.stripe_account_id,
    });
  }

  // 3. Create new Stripe Connect Express account
  try {
    const result = await createConnectAccount(email, { landlordId: ownerId });

    // 4. Store account ID in database
    const { error: updateError } = await supabase
      .from("users")
      .update({
        stripe_account_id: result.accountId,
        stripe_connect_account_type: result.type,
        stripe_connect_enabled: false, // Not enabled until onboarding complete
        stripe_connect_last_synced_at: new Date().toISOString(),
      })
      .eq("id", ownerId);

    if (updateError) {
      console.error("[createStripeConnectAccountAction] DB update error:", updateError);
      return errorState("Unable to save account. Please try again.");
    }

    return successState("Account created.", {
      accountId: result.accountId,
    });
  } catch (err) {
    console.error("[createStripeConnectAccountAction] Stripe error:", err);

    if (err instanceof Error && err.message.includes("not configured")) {
      return errorState("Payment system is not configured. Please contact support.");
    }

    return errorState("Unable to create account. Please try again.");
  }
}

/**
 * Create a Stripe onboarding link for the landlord to complete setup.
 * Creates the account first if it doesn't exist.
 */
export async function createStripeOnboardingLinkAction(): Promise<ActionState> {
  // 1. Authenticate landlord
  const user = await getCurrentUser();
  if (!user) {
    return errorState("Not authenticated. Please sign in.");
  }

  const ownerId = user.id;
  const email = user.email ?? "";

  // 2. Get or create account
  const supabase = getServiceClient();
  const { data: existing } = await supabase
    .from("users")
    .select("stripe_account_id")
    .eq("id", ownerId)
    .maybeSingle();

  let accountId = existing?.stripe_account_id;

  if (!accountId) {
    // Create account first
    try {
      const result = await createConnectAccount(email, { landlordId: ownerId });
      accountId = result.accountId;

      // Store account ID
      const { error: updateError } = await supabase
        .from("users")
        .update({
          stripe_account_id: accountId,
          stripe_connect_account_type: result.type,
          stripe_connect_enabled: false,
          stripe_connect_last_synced_at: new Date().toISOString(),
        })
        .eq("id", ownerId);

      if (updateError) {
        console.error("[createStripeOnboardingLinkAction] DB update error:", updateError);
        return errorState("Unable to save account. Please try again.");
      }
    } catch (err) {
      console.error("[createStripeOnboardingLinkAction] Account creation error:", err);
      return errorState("Unable to create account. Please try again.");
    }
  }

  // 3. Create onboarding link
  try {
    const result = await createOnboardingLink(accountId);

    return successState("Onboarding link created.", {
      url: result.url,
    });
  } catch (err) {
    console.error("[createStripeOnboardingLinkAction] Link creation error:", err);
    return errorState("Unable to create onboarding link. Please try again.");
  }
}

/**
 * Refresh the landlord's Stripe Connect status from Stripe.
 * Called after returning from onboarding or when status might have changed.
 */
export async function refreshStripeConnectStatusAction(): Promise<ActionState> {
  // 1. Authenticate landlord
  const ownerId = await getCurrentOwnerId();
  if (!ownerId) {
    return errorState("Not authenticated. Please sign in.");
  }

  // 2. Get account ID
  const supabase = getServiceClient();
  const { data: user } = await supabase
    .from("users")
    .select("stripe_account_id")
    .eq("id", ownerId)
    .maybeSingle();

  const accountId = user?.stripe_account_id;

  if (!accountId) {
    // No account yet
    return successState("No account connected.", {
      onboardingStatus: "not_connected" as const,
      accountId: null,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      requirementsDue: [],
    });
  }

  // 3. Fetch status from Stripe
  try {
    const status = await getAccountStatus(accountId);

    // 4. Update database with latest status
    const { error: updateError } = await supabase
      .from("users")
      .update({
        stripe_connect_charges_enabled: status.chargesEnabled,
        stripe_connect_payouts_enabled: status.payoutsEnabled,
        stripe_connect_details_submitted: status.detailsSubmitted,
        stripe_connect_onboarding_complete: status.onboardingComplete,
        stripe_connect_requirements_due: status.requirementsDue,
        stripe_connect_enabled: status.onboardingComplete,
        stripe_connect_last_synced_at: new Date().toISOString(),
      })
      .eq("id", ownerId);

    if (updateError) {
      console.error("[refreshStripeConnectStatusAction] DB update error:", updateError);
      // Don't fail - we have the status, just couldn't save it
    }

    return successState("Status refreshed.", {
      onboardingStatus: status.onboardingStatus,
      accountId: status.accountId,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      detailsSubmitted: status.detailsSubmitted,
      requirementsDue: status.requirementsDue,
    });
  } catch (err) {
    console.error("[refreshStripeConnectStatusAction] Stripe error:", err);
    return errorState("Unable to refresh status. Please try again.");
  }
}

/**
 * Create a login link for the landlord to access their Stripe Express dashboard.
 */
export async function createStripeDashboardLinkAction(): Promise<ActionState> {
  // 1. Authenticate landlord
  const ownerId = await getCurrentOwnerId();
  if (!ownerId) {
    return errorState("Not authenticated. Please sign in.");
  }

  // 2. Get account ID
  const supabase = getServiceClient();
  const { data: user } = await supabase
    .from("users")
    .select("stripe_account_id, stripe_connect_onboarding_complete")
    .eq("id", ownerId)
    .maybeSingle();

  const accountId = user?.stripe_account_id;

  if (!accountId) {
    return errorState("No Stripe account connected. Please complete onboarding first.");
  }

  // 3. Create dashboard link
  try {
    const url = await createDashboardLink(accountId);

    return successState("Dashboard link created.", {
      url,
    });
  } catch (err) {
    console.error("[createStripeDashboardLinkAction] Error:", err);
    return errorState("Unable to create dashboard link. Please try again.");
  }
}
