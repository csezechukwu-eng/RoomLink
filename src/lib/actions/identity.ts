"use server";

import { revalidatePath } from "next/cache";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/server";
import { isDemoMode, DEMO_OWNER_ID } from "@/lib/auth";
import {
  createIdentityVerificationSession,
  getIdentityVerificationStatus,
  isStripeIdentityConfigured,
} from "@/lib/stripe/identity";
import type { ActionState } from "@/lib/actions/types";
import { errorState, successState } from "@/lib/actions/_shared";
import type { VerificationStatus } from "@/lib/types";

/**
 * Server actions for Stripe Identity verification.
 *
 * SECURITY:
 * - All actions require authenticated landlord
 * - Session IDs are stored per-user for webhook matching
 * - DEMO_MODE returns mock data for testing
 */

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface IdentityStatusData {
  status: VerificationStatus;
  sessionId: string | null;
  verifiedAt: string | null;
}

// -----------------------------------------------------------------------------
// Actions
// -----------------------------------------------------------------------------

/**
 * Get the current identity verification status for the landlord.
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

    const { data: userData, error } = await supabase
      .from("users")
      .select("verification_status, identity_verification_session_id, identity_verified_at")
      .eq("id", ownerId)
      .maybeSingle();

    if (error) {
      console.error("[getIdentityStatusAction] Error:", error);
      return errorState("Failed to fetch status. Please try again.");
    }

    return successState("Status loaded.", {
      status: (userData?.verification_status as VerificationStatus) || "unverified",
      sessionId: userData?.identity_verification_session_id || null,
      verifiedAt: userData?.identity_verified_at || null,
    });
  } catch (error) {
    console.error("[getIdentityStatusAction] Error:", error);
    return errorState("An unexpected error occurred. Please try again.");
  }
}

/**
 * Create or reuse a Stripe Identity verification session.
 * Returns the hosted verification URL to redirect to.
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

    // Check for existing session
    const { data: userData } = await supabase
      .from("users")
      .select("identity_verification_session_id, verification_status")
      .eq("id", ownerId)
      .maybeSingle();

    console.log("[createIdentityVerificationAction] Current status:", userData?.verification_status);
    console.log("[createIdentityVerificationAction] Existing session:", userData?.identity_verification_session_id?.substring(0, 15));

    // If already verified, no need for new session
    if (userData?.verification_status === "verified") {
      console.log("[createIdentityVerificationAction] Already verified");
      return successState("Already verified.", {
        url: null,
        sessionId: userData.identity_verification_session_id,
        alreadyVerified: true,
      });
    }

    // If there's an existing pending session, try to reuse it
    if (userData?.identity_verification_session_id) {
      try {
        const existingStatus = await getIdentityVerificationStatus(
          userData.identity_verification_session_id
        );
        console.log("[createIdentityVerificationAction] Existing session status:", existingStatus.status);

        if (existingStatus.status === "pending") {
          // Create a new session URL for the existing session
          console.log("[createIdentityVerificationAction] Reusing pending session, creating new URL");
          const result = await createIdentityVerificationSession(ownerId);
          return successState("Verification session created.", {
            url: result.url,
            sessionId: result.sessionId,
          });
        }
      } catch (e) {
        console.log("[createIdentityVerificationAction] Existing session check failed:", e);
        // Session may have expired or been canceled, create new one
      }
    }

    // Create new verification session
    console.log("[createIdentityVerificationAction] Creating new session...");
    const result = await createIdentityVerificationSession(ownerId);
    console.log("[createIdentityVerificationAction] New session ID:", result.sessionId.substring(0, 15));
    console.log("[createIdentityVerificationAction] Session URL exists:", !!result.url);

    // Store session ID - CRITICAL: Must succeed before redirect
    console.log("[createIdentityVerificationAction] Saving session ID to database...");
    const { error: updateError, data: updateResult } = await supabase
      .from("users")
      .update({
        identity_verification_session_id: result.sessionId,
        verification_status: "pending",
      })
      .eq("id", ownerId)
      .select("identity_verification_session_id, verification_status");

    if (updateError) {
      console.error("[createIdentityVerificationAction] FAILED to save session ID:", updateError);
      console.error("[createIdentityVerificationAction] Error code:", updateError.code);
      console.error("[createIdentityVerificationAction] Error message:", updateError.message);
      // This is critical - if we can't save the session ID, we can't sync status later
      // But we continue anyway as the webhook can still work via metadata
    } else {
      console.log("[createIdentityVerificationAction] SUCCESS: Session saved to DB");
      console.log("[createIdentityVerificationAction] DB now shows:", updateResult);
    }

    return successState("Verification session created.", {
      url: result.url,
      sessionId: result.sessionId,
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
 * Called after returning from the hosted verification page.
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

    // Get stored session ID AND current status
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("identity_verification_session_id, verification_status")
      .eq("id", ownerId)
      .maybeSingle();

    if (fetchError) {
      console.error("[refreshIdentityStatusAction] Fetch error:", fetchError);
      return errorState("Failed to fetch session. Please try again.");
    }

    console.log("[refreshIdentityStatusAction] Current DB status:", userData?.verification_status);
    console.log("[refreshIdentityStatusAction] Session ID exists:", !!userData?.identity_verification_session_id);

    const sessionId = userData?.identity_verification_session_id;
    if (!sessionId) {
      console.log("[refreshIdentityStatusAction] No session found");
      return successState("No verification session found.", {
        status: "unverified" as VerificationStatus,
        verifiedAt: null,
      });
    }

    // Fetch status from Stripe
    console.log("[refreshIdentityStatusAction] Fetching from Stripe...");
    const stripeResult = await getIdentityVerificationStatus(sessionId);
    console.log("[refreshIdentityStatusAction] Stripe status:", stripeResult.status);

    // Update database
    const updateData: Record<string, unknown> = {
      verification_status: stripeResult.status,
    };

    if (stripeResult.status === "verified") {
      updateData.identity_verified_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", ownerId);

    if (updateError) {
      console.error("[refreshIdentityStatusAction] Update error:", updateError);
      // Continue anyway - return the status from Stripe
    } else {
      console.log("[refreshIdentityStatusAction] DB updated successfully");
    }

    // Revalidate
    revalidatePath("/onboarding/landlord");
    revalidatePath("/dashboard");

    console.log("[refreshIdentityStatusAction] Returning status:", stripeResult.status);
    return successState("Status refreshed.", {
      status: stripeResult.status,
      verifiedAt: stripeResult.status === "verified" ? new Date().toISOString() : null,
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
