"use server";

import { revalidatePath } from "next/cache";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/server";
import { isDemoMode, DEMO_OWNER_ID } from "@/lib/auth";
import {
  createIdentityVerificationSessionWithAttempt,
  getIdentityVerificationStatus,
  isStripeIdentityConfigured,
  syncIdentityStatusFromStripe,
} from "@/lib/stripe/identity";
import type { ActionState } from "@/lib/actions/types";
import { errorState, successState } from "@/lib/actions/_shared";
import type { VerificationStatus } from "@/lib/types";

/**
 * Server actions for Stripe Identity verification.
 *
 * ARCHITECTURE:
 * Uses a state-token system for secure return URL handling:
 * 1. Generate secure random state token
 * 2. Store hashed version in identity_verification_attempts table
 * 3. Send raw token in Stripe return_url
 * 4. Return route validates token without requiring active session
 *
 * SECURITY:
 * - All actions require authenticated landlord
 * - State tokens are hashed before storage
 * - Attempts expire after 1 hour
 * - DEMO_MODE returns mock data for testing
 */

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface IdentityStatusData {
  status: VerificationStatus;
  sessionId: string | null;
  verifiedAt: string | null;
  attemptId?: string | null;
}

// -----------------------------------------------------------------------------
// Actions
// -----------------------------------------------------------------------------

/**
 * Get the current identity verification status for the landlord.
 * Also syncs with Stripe if there's an active verification session.
 */
export async function getIdentityStatusAction(): Promise<ActionState> {
  // Demo mode returns mock verified status
  if (isDemoMode()) {
    return successState("Status loaded.", {
      status: "verified" as VerificationStatus,
      sessionId: "vs_demo_123",
      verifiedAt: new Date().toISOString(),
    });
  }

  // Get owner ID from auth
  const authUser = await getAuthUser();
  if (!authUser) {
    return errorState("Not authenticated. Please sign in.");
  }
  const ownerId = authUser.id;

  if (!isServiceRoleConfigured()) {
    return errorState("Database is not configured for this environment.");
  }

  try {
    const supabase = getServiceClient();

    // Get user data
    const { data: userData, error } = await supabase
      .from("users")
      .select("verification_status, identity_verification_session_id, identity_verified_at")
      .eq("id", ownerId)
      .maybeSingle();

    if (error) {
      console.error("[getIdentityStatusAction] Error:", error);
      return errorState("Failed to fetch status. Please try again.");
    }

    const currentStatus = (userData?.verification_status as VerificationStatus) || "not_started";
    const sessionId = userData?.identity_verification_session_id || null;

    // If there's a session and status is not final, sync with Stripe
    if (sessionId && !["verified", "canceled"].includes(currentStatus)) {
      console.log("[getIdentityStatusAction] Syncing with Stripe...");
      const syncResult = await syncIdentityStatusFromStripe(ownerId, sessionId);
      if (syncResult.updated) {
        console.log("[getIdentityStatusAction] Status updated to:", syncResult.status);
        return successState("Status loaded.", {
          status: syncResult.status,
          sessionId,
          verifiedAt: syncResult.verifiedAt || null,
        });
      }
    }

    return successState("Status loaded.", {
      status: currentStatus,
      sessionId,
      verifiedAt: userData?.identity_verified_at || null,
    });
  } catch (error) {
    console.error("[getIdentityStatusAction] Error:", error);
    return errorState("An unexpected error occurred. Please try again.");
  }
}

/**
 * Create a new Stripe Identity verification session with state token.
 * Returns the hosted verification URL to redirect to.
 *
 * Flow:
 * 1. Generate secure state token
 * 2. Create attempt record with hashed token
 * 3. Create Stripe session with return_url including raw token
 * 4. Return URL for client redirect
 */
export async function createIdentityVerificationAction(): Promise<ActionState> {
  console.log("[createIdentityVerificationAction] Starting...");

  // Demo mode returns a fake URL
  if (isDemoMode()) {
    console.log("[createIdentityVerificationAction] Demo mode");
    return successState("Verification session created.", {
      url: "/onboarding/landlord?step=identity&demo_verified=true",
      sessionId: "vs_demo_123",
    });
  }

  // Get owner ID from auth
  const authUser = await getAuthUser();
  if (!authUser) {
    console.error("[createIdentityVerificationAction] Not authenticated");
    return errorState("Not authenticated. Please sign in.");
  }
  const ownerId = authUser.id;
  console.log("[createIdentityVerificationAction] User ID:", ownerId);

  // Check if Stripe Identity is configured
  if (!isStripeIdentityConfigured()) {
    console.error("[createIdentityVerificationAction] Stripe not configured");
    return errorState(
      "Identity verification is not configured. Please contact support."
    );
  }

  if (!isServiceRoleConfigured()) {
    console.error("[createIdentityVerificationAction] DB not configured");
    return errorState("Database is not configured for this environment.");
  }

  try {
    const supabase = getServiceClient();

    // Check if already verified
    const { data: userData } = await supabase
      .from("users")
      .select("verification_status, identity_verification_session_id")
      .eq("id", ownerId)
      .maybeSingle();

    if (userData?.verification_status === "verified") {
      console.log("[createIdentityVerificationAction] Already verified");
      return successState("Already verified.", {
        url: null,
        sessionId: userData.identity_verification_session_id,
        alreadyVerified: true,
      });
    }

    // Create new verification session with state token
    console.log("[createIdentityVerificationAction] Creating session with state token...");
    const result = await createIdentityVerificationSessionWithAttempt(ownerId);

    console.log("[createIdentityVerificationAction] Session created:");
    console.log("[createIdentityVerificationAction]   - Session ID:", result.sessionId.substring(0, 15) + "...");
    console.log("[createIdentityVerificationAction]   - Attempt ID:", result.attemptId);
    console.log("[createIdentityVerificationAction]   - URL exists:", !!result.url);

    return successState("Verification session created.", {
      url: result.url,
      sessionId: result.sessionId,
      attemptId: result.attemptId,
    });
  } catch (error) {
    console.error("[createIdentityVerificationAction] Error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Identity is not enabled")) {
        return errorState(
          "Identity verification is not available. Please contact support."
        );
      }
    }

    return errorState("Failed to start verification. Please try again.");
  }
}

/**
 * Refresh the identity verification status from Stripe.
 * Called when the onboarding page loads to get fresh status.
 */
export async function refreshIdentityStatusAction(): Promise<ActionState> {
  console.log("[refreshIdentityStatusAction] Starting...");

  // Demo mode returns mock data
  if (isDemoMode()) {
    console.log("[refreshIdentityStatusAction] Demo mode - returning verified");
    return successState("Status refreshed.", {
      status: "verified" as VerificationStatus,
      verifiedAt: new Date().toISOString(),
    });
  }

  // Get owner ID from auth
  const authUser = await getAuthUser();
  if (!authUser) {
    console.error("[refreshIdentityStatusAction] Not authenticated");
    return errorState("Not authenticated. Please sign in.");
  }
  const ownerId = authUser.id;
  console.log("[refreshIdentityStatusAction] User ID:", ownerId);

  if (!isStripeIdentityConfigured()) {
    console.error("[refreshIdentityStatusAction] Stripe not configured");
    return errorState("Identity verification is not configured.");
  }

  if (!isServiceRoleConfigured()) {
    console.error("[refreshIdentityStatusAction] DB not configured");
    return errorState("Database is not configured for this environment.");
  }

  try {
    const supabase = getServiceClient();

    // Get user's verification session ID
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("identity_verification_session_id, verification_status, identity_verified_at")
      .eq("id", ownerId)
      .maybeSingle();

    if (fetchError) {
      console.error("[refreshIdentityStatusAction] Fetch error:", fetchError);
      return errorState("Failed to fetch session. Please try again.");
    }

    const sessionId = userData?.identity_verification_session_id;
    const currentStatus = (userData?.verification_status as VerificationStatus) || "not_started";

    console.log("[refreshIdentityStatusAction] Current status:", currentStatus);
    console.log("[refreshIdentityStatusAction] Session ID exists:", !!sessionId);

    // If no session, return not started
    if (!sessionId) {
      return successState("No verification session found.", {
        status: "not_started" as VerificationStatus,
        verifiedAt: null,
      });
    }

    // If already in final state, return current
    if (currentStatus === "verified") {
      return successState("Status loaded.", {
        status: currentStatus,
        verifiedAt: userData?.identity_verified_at || null,
      });
    }

    // Sync with Stripe
    console.log("[refreshIdentityStatusAction] Syncing with Stripe...");
    const syncResult = await syncIdentityStatusFromStripe(ownerId, sessionId);

    console.log("[refreshIdentityStatusAction] Sync result:", syncResult);

    // Revalidate pages
    revalidatePath("/onboarding/landlord");
    revalidatePath("/dashboard");

    return successState("Status refreshed.", {
      status: syncResult.status,
      verifiedAt: syncResult.verifiedAt || null,
    });
  } catch (error) {
    console.error("[refreshIdentityStatusAction] Error:", error);
    return errorState("Failed to refresh status. Please try again.");
  }
}

/**
 * Save the authority attestation (checkbox acknowledgment).
 */
export async function saveAuthorityAttestationAction(): Promise<ActionState> {
  // Get owner ID from auth (demo mode uses demo owner)
  const ownerId = isDemoMode() ? DEMO_OWNER_ID : (await getAuthUser())?.id;

  if (!ownerId) {
    return errorState("Not authenticated. Please sign in.");
  }

  if (!isServiceRoleConfigured()) {
    return errorState("Database is not configured for this environment.");
  }

  try {
    const supabase = getServiceClient();

    const { error } = await supabase
      .from("users")
      .update({
        authority_attested_at: new Date().toISOString(),
      })
      .eq("id", ownerId);

    if (error) {
      console.error("[saveAuthorityAttestationAction] Error:", error);
      return errorState("Failed to save attestation. Please try again.");
    }

    // Revalidate
    revalidatePath("/onboarding/landlord");

    return successState("Attestation saved.");
  } catch (error) {
    console.error("[saveAuthorityAttestationAction] Error:", error);
    return errorState("An unexpected error occurred. Please try again.");
  }
}
