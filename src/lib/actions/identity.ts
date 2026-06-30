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
  // Demo mode returns a fake URL
  if (isDemoMode()) {
    return successState("Verification session created.", {
      url: "/onboarding/landlord?step=identity&demo_verified=true",
      sessionId: "vs_demo_123",
    });
  }

  // Get owner ID from auth
  const authUser = await getAuthUser();
  if (!authUser) {
    return errorState("Not authenticated. Please sign in.");
  }
  const ownerId = authUser.id;

  // Check if Stripe Identity is configured
  if (!isStripeIdentityConfigured()) {
    return errorState(
      "Identity verification is not configured. Please contact support."
    );
  }

  if (!isServiceRoleConfigured()) {
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

    // If already verified, no need for new session
    if (userData?.verification_status === "verified") {
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

        if (existingStatus.status === "pending") {
          // Create a new session URL for the existing session
          const result = await createIdentityVerificationSession(ownerId);
          return successState("Verification session created.", {
            url: result.url,
            sessionId: result.sessionId,
          });
        }
      } catch {
        // Session may have expired or been canceled, create new one
      }
    }

    // Create new verification session
    const result = await createIdentityVerificationSession(ownerId);

    // Store session ID
    const { error: updateError } = await supabase
      .from("users")
      .update({
        identity_verification_session_id: result.sessionId,
        verification_status: "pending",
      })
      .eq("id", ownerId);

    if (updateError) {
      console.error("[createIdentityVerificationAction] Update error:", updateError);
      // Continue anyway - the session was created
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
  // Demo mode returns mock data
  if (isDemoMode()) {
    return successState("Status refreshed.", {
      status: "verified" as VerificationStatus,
      verifiedAt: new Date().toISOString(),
    });
  }

  // Get owner ID from auth
  const authUser = await getAuthUser();
  if (!authUser) {
    return errorState("Not authenticated. Please sign in.");
  }
  const ownerId = authUser.id;

  if (!isStripeIdentityConfigured()) {
    return errorState("Identity verification is not configured.");
  }

  if (!isServiceRoleConfigured()) {
    return errorState("Database is not configured for this environment.");
  }

  try {
    const supabase = getServiceClient();

    // Get stored session ID
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("identity_verification_session_id")
      .eq("id", ownerId)
      .maybeSingle();

    if (fetchError) {
      console.error("[refreshIdentityStatusAction] Fetch error:", fetchError);
      return errorState("Failed to fetch session. Please try again.");
    }

    const sessionId = userData?.identity_verification_session_id;
    if (!sessionId) {
      return successState("No verification session found.", {
        status: "unverified" as VerificationStatus,
        verifiedAt: null,
      });
    }

    // Fetch status from Stripe
    const status = await getIdentityVerificationStatus(sessionId);

    // Update database
    const updateData: Record<string, unknown> = {
      verification_status: status.status,
    };

    if (status.status === "verified") {
      updateData.identity_verified_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", ownerId);

    if (updateError) {
      console.error("[refreshIdentityStatusAction] Update error:", updateError);
      // Continue anyway
    }

    // Revalidate
    revalidatePath("/onboarding/landlord");
    revalidatePath("/dashboard");

    return successState("Status refreshed.", {
      status: status.status,
      verifiedAt: status.status === "verified" ? new Date().toISOString() : null,
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
