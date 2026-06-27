"use server";

import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
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
// Debug helpers (safe - no secrets logged)
// -----------------------------------------------------------------------------

function logDebug(action: string, data: Record<string, unknown>) {
  console.log(`[${action}]`, JSON.stringify(data, null, 2));
}

function logError(action: string, error: unknown, context?: Record<string, unknown>) {
  const errorInfo: Record<string, unknown> = { ...context };

  if (error instanceof Error) {
    errorInfo.errorName = error.name;
    errorInfo.errorMessage = error.message;
  } else if (typeof error === "object" && error !== null) {
    // Supabase PostgrestError
    const pgError = error as { code?: string; message?: string; details?: string; hint?: string };
    errorInfo.code = pgError.code;
    errorInfo.message = pgError.message;
    errorInfo.details = pgError.details;
    errorInfo.hint = pgError.hint;
  } else {
    errorInfo.error = String(error);
  }

  console.error(`[${action}] ERROR:`, JSON.stringify(errorInfo, null, 2));
}

/**
 * Parse Supabase error and return a user-friendly message.
 */
function parseSupabaseError(error: unknown): string {
  if (!error) return "Unknown database error.";

  const pgError = error as { code?: string; message?: string };

  // Column doesn't exist - migration not applied
  if (pgError.message?.includes("column") && pgError.message?.includes("does not exist")) {
    return "Database schema is not up to date. Please contact support.";
  }

  // Table doesn't exist
  if (pgError.message?.includes("relation") && pgError.message?.includes("does not exist")) {
    return "Database table not found. Please contact support.";
  }

  // Permission denied (RLS)
  if (pgError.code === "42501" || pgError.message?.includes("permission denied")) {
    return "Permission denied. Please contact support.";
  }

  // Connection error
  if (pgError.code === "PGRST301" || pgError.message?.includes("connection")) {
    return "Database connection failed. Please try again.";
  }

  return "Database error. Please try again.";
}

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
  const ACTION = "getStripeConnectStatusAction";

  // 0. Check configuration
  if (!isServiceRoleConfigured()) {
    logError(ACTION, "Service role not configured");
    return errorState("Database is not configured for this environment.");
  }

  // 1. Authenticate landlord
  let user;
  try {
    user = await getCurrentUser();
  } catch (err) {
    logError(ACTION, err, { step: "auth" });
    return errorState("Not authenticated. Please sign in.");
  }

  if (!user) {
    logDebug(ACTION, { step: "auth", result: "no user" });
    return errorState("Not authenticated. Please sign in.");
  }

  const ownerId = user.id;
  logDebug(ACTION, {
    step: "auth",
    userId: ownerId,
    hasEmail: Boolean(user.email),
  });

  // 2. Fetch landlord's Stripe Connect fields
  const supabase = getServiceClient();

  // First, try to fetch just id to verify basic connectivity and user exists
  const { data: basicCheck, error: basicError } = await supabase
    .from("users")
    .select("id")
    .eq("id", ownerId)
    .maybeSingle();

  if (basicError) {
    logError(ACTION, basicError, { step: "basic_check", userId: ownerId });
    // Don't show schema error for basic check - this should always work
    return successState("Status loaded.", {
      onboardingStatus: "not_connected" as StripeConnectOnboardingStatus,
      accountId: null,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      requirementsDue: [],
    });
  }

  // If user row doesn't exist, return not_connected (this is normal for new users)
  if (!basicCheck) {
    logDebug(ACTION, { step: "basic_check", result: "no user row", userId: ownerId });
    return successState("Status loaded.", {
      onboardingStatus: "not_connected" as StripeConnectOnboardingStatus,
      accountId: null,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      requirementsDue: [],
    });
  }

  // Try to fetch stripe_account_id (may not exist if migration 0025 not applied)
  let stripeAccountId: string | null = null;
  try {
    const { data: accountData } = await supabase
      .from("users")
      .select("stripe_account_id")
      .eq("id", ownerId)
      .maybeSingle();
    stripeAccountId = accountData?.stripe_account_id ?? null;
  } catch {
    logDebug(ACTION, { step: "fetch_account_id", result: "column may not exist" });
  }

  // Now try to fetch the full Connect status fields (may not exist if migration 0028 not applied)
  const { data: userData, error: fetchError } = await supabase
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

  if (fetchError) {
    logError(ACTION, fetchError, { step: "fetch_connect_status", userId: ownerId });

    // If columns don't exist, return default status (migration not applied)
    // This is NOT an error - just means onboarding hasn't been set up yet
    const errorMsg = (fetchError as { message?: string }).message || "";
    if (errorMsg.includes("column") && errorMsg.includes("does not exist")) {
      logDebug(ACTION, { step: "migration_check", result: "columns missing - returning default status" });
      return successState("Status loaded.", {
        onboardingStatus: stripeAccountId ? "onboarding_incomplete" : "not_connected",
        accountId: stripeAccountId,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        requirementsDue: [],
      });
    }

    // For other errors, also return default status instead of showing error
    return successState("Status loaded.", {
      onboardingStatus: "not_connected" as StripeConnectOnboardingStatus,
      accountId: null,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      requirementsDue: [],
    });
  }

  // 3. Compute status
  const accountId = userData?.stripe_account_id ?? null;
  const chargesEnabled = userData?.stripe_connect_charges_enabled ?? false;
  const payoutsEnabled = userData?.stripe_connect_payouts_enabled ?? false;
  const detailsSubmitted = userData?.stripe_connect_details_submitted ?? false;
  const requirementsDue = (userData?.stripe_connect_requirements_due as string[]) ?? [];

  const onboardingStatus = computeOnboardingStatus(
    accountId,
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted
  );

  logDebug(ACTION, {
    step: "complete",
    userId: ownerId,
    hasAccountId: Boolean(accountId),
    onboardingStatus,
    chargesEnabled,
    payoutsEnabled,
  });

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
  const ACTION = "createStripeConnectAccountAction";

  // 0. Check configuration
  const hasStripeKey = Boolean(process.env.STRIPE_SECRET_KEY);
  if (!hasStripeKey) {
    logError(ACTION, "STRIPE_SECRET_KEY not configured");
    return errorState("Stripe is not configured for this environment.");
  }

  // 1. Authenticate landlord
  let user;
  try {
    user = await getCurrentUser();
  } catch (err) {
    logError(ACTION, err, { step: "auth" });
    return errorState("Not authenticated. Please sign in.");
  }

  if (!user) {
    logDebug(ACTION, { step: "auth", result: "no user" });
    return errorState("Not authenticated. Please sign in.");
  }

  const ownerId = user.id;
  const email = user.email ?? "";
  logDebug(ACTION, { step: "start", userId: ownerId, hasEmail: Boolean(email) });

  // 2. Check if account already exists
  const supabase = getServiceClient();
  const { data: existing, error: fetchError } = await supabase
    .from("users")
    .select("stripe_account_id")
    .eq("id", ownerId)
    .maybeSingle();

  if (fetchError) {
    logError(ACTION, fetchError, { step: "fetch_existing" });
    return errorState(parseSupabaseError(fetchError));
  }

  if (existing?.stripe_account_id) {
    logDebug(ACTION, { step: "existing_account", accountIdPrefix: existing.stripe_account_id.slice(0, 10) });
    return successState("Account already exists.", {
      accountId: existing.stripe_account_id,
    });
  }

  // 3. Create new Stripe Connect Express account
  try {
    logDebug(ACTION, { step: "create_account" });
    const result = await createConnectAccount(email, { landlordId: ownerId });

    // 4. Store account ID in database
    const { error: updateError } = await supabase
      .from("users")
      .update({
        stripe_account_id: result.accountId,
      })
      .eq("id", ownerId);

    if (updateError) {
      logError(ACTION, updateError, { step: "save_account_id" });
      return errorState(parseSupabaseError(updateError));
    }

    // Try to update additional fields (may fail if columns don't exist)
    try {
      await supabase
        .from("users")
        .update({
          stripe_connect_account_type: result.type,
          stripe_connect_enabled: false,
          stripe_connect_last_synced_at: new Date().toISOString(),
        })
        .eq("id", ownerId);
    } catch {
      logDebug(ACTION, { step: "save_connect_fields", result: "columns may not exist" });
    }

    logDebug(ACTION, { step: "account_created", accountIdPrefix: result.accountId.slice(0, 10) });
    return successState("Account created.", {
      accountId: result.accountId,
    });
  } catch (err) {
    logError(ACTION, err, { step: "stripe_create" });

    if (err instanceof Error && err.message.includes("not configured")) {
      return errorState("Stripe is not configured for this environment.");
    }

    return errorState("Unable to create account. Please try again.");
  }
}

/**
 * Create a Stripe onboarding link for the landlord to complete setup.
 * Creates the account first if it doesn't exist.
 */
export async function createStripeOnboardingLinkAction(): Promise<ActionState> {
  const ACTION = "createStripeOnboardingLinkAction";

  // 0. Check Stripe configuration
  const hasStripeKey = Boolean(process.env.STRIPE_SECRET_KEY);
  if (!hasStripeKey) {
    logError(ACTION, "STRIPE_SECRET_KEY not configured");
    return errorState("Stripe is not configured for this environment.");
  }

  // 0b. Check database configuration
  if (!isServiceRoleConfigured()) {
    logError(ACTION, "Service role not configured");
    return errorState("Database is not configured for this environment.");
  }

  // 1. Authenticate landlord
  let user;
  try {
    user = await getCurrentUser();
  } catch (err) {
    logError(ACTION, err, { step: "auth" });
    return errorState("Not authenticated. Please sign in.");
  }

  if (!user) {
    logDebug(ACTION, { step: "auth", result: "no user" });
    return errorState("Not authenticated. Please sign in.");
  }

  const ownerId = user.id;
  const email = user.email ?? "";

  logDebug(ACTION, {
    step: "start",
    userId: ownerId,
    hasEmail: Boolean(email),
    hasStripeKey,
  });

  // 2. Get or create account
  const supabase = getServiceClient();

  // Check if user row exists first
  const { data: userCheck, error: userCheckError } = await supabase
    .from("users")
    .select("id")
    .eq("id", ownerId)
    .maybeSingle();

  if (userCheckError) {
    logError(ACTION, userCheckError, { step: "user_check", userId: ownerId });
    return errorState(parseSupabaseError(userCheckError));
  }

  // If user row doesn't exist, create it first
  if (!userCheck) {
    logDebug(ACTION, { step: "user_check", result: "no user row, creating" });
    const { error: insertError } = await supabase
      .from("users")
      .insert({
        id: ownerId,
        email: email,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      logError(ACTION, insertError, { step: "user_insert", userId: ownerId });
      // Continue anyway - the user might exist due to race condition
    }
  }

  // Now try to fetch stripe_account_id (may not exist if migration not applied)
  let accountId: string | null = null;
  try {
    const { data: existing, error: fetchError } = await supabase
      .from("users")
      .select("stripe_account_id")
      .eq("id", ownerId)
      .maybeSingle();

    if (fetchError) {
      const errorMsg = (fetchError as { message?: string }).message || "";
      if (errorMsg.includes("column") && errorMsg.includes("does not exist")) {
        // Column doesn't exist - migration not applied, but we can still create account
        logDebug(ACTION, { step: "fetch_account_id", result: "column does not exist" });
      } else {
        logError(ACTION, fetchError, { step: "fetch_account_id", userId: ownerId });
      }
    } else {
      accountId = existing?.stripe_account_id ?? null;
    }
  } catch {
    logDebug(ACTION, { step: "fetch_account_id", result: "query failed" });
  }
  logDebug(ACTION, {
    step: "existing_check",
    hasExistingAccount: Boolean(accountId),
    accountIdPrefix: accountId ? accountId.slice(0, 10) : null,
  });

  if (!accountId) {
    // Create account first
    try {
      logDebug(ACTION, { step: "create_account", email: email ? `${email.slice(0, 3)}***` : "(none)" });
      const result = await createConnectAccount(email, { landlordId: ownerId });
      accountId = result.accountId;
      logDebug(ACTION, { step: "account_created", accountIdPrefix: accountId.slice(0, 10) });

      // Store account ID - only update fields that exist (handle migration not applied)
      const { error: updateError } = await supabase
        .from("users")
        .update({
          stripe_account_id: accountId,
        })
        .eq("id", ownerId);

      if (updateError) {
        logError(ACTION, updateError, { step: "save_account_id" });
        // Don't fail completely - we have the account, just couldn't save all fields
        // Try a simpler update with just the account ID
      }

      // Try to update additional fields (may fail if columns don't exist)
      try {
        await supabase
          .from("users")
          .update({
            stripe_connect_account_type: result.type,
            stripe_connect_enabled: false,
            stripe_connect_last_synced_at: new Date().toISOString(),
          })
          .eq("id", ownerId);
      } catch {
        logDebug(ACTION, { step: "save_connect_fields", result: "columns may not exist" });
        // Ignore - columns might not exist if migration wasn't applied
      }

      logDebug(ACTION, { step: "account_saved" });
    } catch (err) {
      logError(ACTION, err, { step: "stripe_create_account" });

      if (err instanceof Error) {
        if (err.message.includes("not configured")) {
          return errorState("Stripe is not configured for this environment.");
        }

        // Check for Stripe API errors
        if ("type" in err && "code" in err) {
          const stripeError = err as { type: string; code: string; message: string };
          logError(ACTION, stripeError, { step: "stripe_api_error" });
          return errorState(`Stripe error: ${stripeError.message}`);
        }
      }

      return errorState("Unable to create Stripe account. Please try again.");
    }
  }

  // 3. Create onboarding link
  try {
    logDebug(ACTION, { step: "create_link", accountIdPrefix: accountId.slice(0, 10) });
    const result = await createOnboardingLink(accountId);
    logDebug(ACTION, { step: "link_created", expiresAt: result.expiresAt.toISOString() });

    return successState("Onboarding link created.", {
      url: result.url,
    });
  } catch (err) {
    logError(ACTION, err, { step: "create_onboarding_link" });

    if (err instanceof Error) {
      if (err.message.includes("not configured")) {
        return errorState("Stripe is not configured for this environment.");
      }
    }

    return errorState("Unable to create onboarding link. Please try again.");
  }
}

/**
 * Refresh the landlord's Stripe Connect status from Stripe.
 * Called after returning from onboarding or when status might have changed.
 */
export async function refreshStripeConnectStatusAction(): Promise<ActionState> {
  const ACTION = "refreshStripeConnectStatusAction";

  // 1. Authenticate landlord
  let user;
  try {
    user = await getCurrentUser();
  } catch (err) {
    logError(ACTION, err, { step: "auth" });
    return errorState("Not authenticated. Please sign in.");
  }

  if (!user) {
    logDebug(ACTION, { step: "auth", result: "no user" });
    return errorState("Not authenticated. Please sign in.");
  }

  const ownerId = user.id;
  logDebug(ACTION, { step: "start", userId: ownerId });

  // 2. Get account ID
  const supabase = getServiceClient();
  const { data: userData, error: fetchError } = await supabase
    .from("users")
    .select("stripe_account_id")
    .eq("id", ownerId)
    .maybeSingle();

  if (fetchError) {
    logError(ACTION, fetchError, { step: "fetch_account_id" });
    return errorState(parseSupabaseError(fetchError));
  }

  const accountId = userData?.stripe_account_id;

  if (!accountId) {
    // No account yet
    logDebug(ACTION, { step: "no_account" });
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
    logDebug(ACTION, { step: "fetch_stripe_status", accountIdPrefix: accountId.slice(0, 10) });
    const status = await getAccountStatus(accountId);

    // 4. Update database with latest status (ignore errors - columns may not exist)
    try {
      await supabase
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
    } catch (updateErr) {
      logError(ACTION, updateErr, { step: "save_status" });
      // Don't fail - we have the status, just couldn't save it
    }

    logDebug(ACTION, {
      step: "complete",
      onboardingStatus: status.onboardingStatus,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
    });

    return successState("Status refreshed.", {
      onboardingStatus: status.onboardingStatus,
      accountId: status.accountId,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      detailsSubmitted: status.detailsSubmitted,
      requirementsDue: status.requirementsDue,
    });
  } catch (err) {
    logError(ACTION, err, { step: "stripe_fetch" });
    return errorState("Unable to refresh status. Please try again.");
  }
}

/**
 * Create a login link for the landlord to access their Stripe Express dashboard.
 */
export async function createStripeDashboardLinkAction(): Promise<ActionState> {
  const ACTION = "createStripeDashboardLinkAction";

  // 1. Authenticate landlord
  let user;
  try {
    user = await getCurrentUser();
  } catch (err) {
    logError(ACTION, err, { step: "auth" });
    return errorState("Not authenticated. Please sign in.");
  }

  if (!user) {
    logDebug(ACTION, { step: "auth", result: "no user" });
    return errorState("Not authenticated. Please sign in.");
  }

  const ownerId = user.id;
  logDebug(ACTION, { step: "start", userId: ownerId });

  // 2. Get account ID
  const supabase = getServiceClient();
  const { data: userData, error: fetchError } = await supabase
    .from("users")
    .select("stripe_account_id")
    .eq("id", ownerId)
    .maybeSingle();

  if (fetchError) {
    logError(ACTION, fetchError, { step: "fetch_account_id" });
    return errorState(parseSupabaseError(fetchError));
  }

  const accountId = userData?.stripe_account_id;

  if (!accountId) {
    logDebug(ACTION, { step: "no_account" });
    return errorState("No Stripe account connected. Please complete onboarding first.");
  }

  // 3. Create dashboard link
  try {
    logDebug(ACTION, { step: "create_link", accountIdPrefix: accountId.slice(0, 10) });
    const url = await createDashboardLink(accountId);

    return successState("Dashboard link created.", {
      url,
    });
  } catch (err) {
    logError(ACTION, err, { step: "stripe_create_link" });
    return errorState("Unable to create dashboard link. Please try again.");
  }
}
