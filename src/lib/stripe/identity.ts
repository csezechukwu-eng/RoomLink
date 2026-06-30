import "server-only";
import { stripe, getBaseUrl } from "./server";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/server";
import {
  generateStateToken,
  hashStateToken,
  getStateTokenExpiry,
} from "./identityStateToken";
import type { VerificationStatus } from "@/lib/types";

/**
 * Stripe Identity helpers for landlord identity verification.
 *
 * ARCHITECTURE:
 * Uses state-token based return URLs for secure verification flow:
 * 1. Generate cryptographically secure state token
 * 2. Store hashed token in identity_verification_attempts table
 * 3. Send raw token in Stripe return_url
 * 4. Return route validates token without requiring active session
 */

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface VerificationSessionResult {
  sessionId: string;
  url: string;
  status: VerificationStatus;
  attemptId: string;
}

export interface VerificationSessionStatus {
  sessionId: string;
  status: VerificationStatus;
  lastError: string | null;
}

export interface SyncResult {
  status: VerificationStatus;
  updated: boolean;
  verifiedAt: string | null;
}

// -----------------------------------------------------------------------------
// Status Mapping
// -----------------------------------------------------------------------------

/**
 * Map Stripe verification session status to our VerificationStatus enum.
 *
 * Stripe Identity statuses:
 * - requires_input: Session created but user hasn't started OR needs to resubmit
 * - processing: Stripe is reviewing the submitted documents
 * - verified: Verification completed successfully
 * - canceled: Verification was canceled
 *
 * Our status mapping (per requirements):
 * - no session → not_started
 * - requires_input (no error) → pending (in progress)
 * - requires_input (with error) → needs_attention
 * - processing → processing
 * - verified → verified
 * - canceled → canceled
 */
export function mapStripeStatusToVerificationStatus(
  stripeStatus: string,
  hasError?: boolean
): VerificationStatus {
  switch (stripeStatus) {
    case "verified":
      return "verified";
    case "processing":
      return "processing";
    case "requires_input":
      // If there's a last_error, user needs to fix something
      return hasError ? "needs_attention" : "pending";
    case "canceled":
      return "canceled";
    default:
      return "not_started";
  }
}

// -----------------------------------------------------------------------------
// Session Creation
// -----------------------------------------------------------------------------

/**
 * Create a new Stripe Identity verification session with state token.
 *
 * This is the main entry point for starting verification:
 * 1. Generate secure state token
 * 2. Create attempt record with hashed token
 * 3. Create Stripe session with return_url including raw token
 * 4. Update user record with session ID
 *
 * @param userId - The landlord's user ID
 * @returns Session info including URL to redirect to
 */
export async function createIdentityVerificationSessionWithAttempt(
  userId: string
): Promise<VerificationSessionResult> {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in environment variables."
    );
  }

  if (!isServiceRoleConfigured()) {
    throw new Error("Database is not configured for this environment.");
  }

  const supabase = getServiceClient();
  const baseUrl = getBaseUrl();

  // 1. Generate secure state token
  const stateToken = generateStateToken();
  const stateTokenHash = hashStateToken(stateToken);
  const expiresAt = getStateTokenExpiry();

  console.log("[createIdentityVerificationSessionWithAttempt] Base URL:", baseUrl);
  console.log("[createIdentityVerificationSessionWithAttempt] State token generated");

  // 2. Create attempt record (before Stripe call, so we have attempt_id)
  const { data: attempt, error: attemptError } = await supabase
    .from("identity_verification_attempts")
    .insert({
      user_id: userId,
      state_token_hash: stateTokenHash,
      status: "created",
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    console.error("[createIdentityVerificationSessionWithAttempt] Failed to create attempt:", attemptError);
    throw new Error("Failed to create verification attempt");
  }

  const attemptId = attempt.id;
  console.log("[createIdentityVerificationSessionWithAttempt] Attempt created:", attemptId);

  // 3. Build return URL with state token
  const returnUrl = `${baseUrl}/api/identity/return?state=${stateToken}`;
  console.log("[createIdentityVerificationSessionWithAttempt] Return URL:", returnUrl.substring(0, 50) + "...");

  try {
    // 4. Create Stripe session with metadata
    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: {
        platform: "roomlink",
        user_id: userId,
        attempt_id: attemptId,
        purpose: "landlord_identity_verification",
      },
      options: {
        document: {
          allowed_types: ["driving_license", "passport", "id_card"],
          require_matching_selfie: true,
        },
      },
      return_url: returnUrl,
    });

    console.log("[createIdentityVerificationSessionWithAttempt] Stripe session created:", session.id);

    // 5. Update attempt with Stripe session ID
    const { error: updateAttemptError } = await supabase
      .from("identity_verification_attempts")
      .update({
        stripe_verification_session_id: session.id,
        status: "pending",
      })
      .eq("id", attemptId);

    if (updateAttemptError) {
      console.error("[createIdentityVerificationSessionWithAttempt] Failed to update attempt:", updateAttemptError);
      // Continue anyway - the attempt record exists
    }

    // 6. Update user record with session ID and status
    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        identity_verification_session_id: session.id,
        verification_status: "pending",
      })
      .eq("id", userId);

    if (updateUserError) {
      console.error("[createIdentityVerificationSessionWithAttempt] Failed to update user:", updateUserError);
      // Continue anyway - the Stripe session was created
    }

    return {
      sessionId: session.id,
      url: session.url || "",
      status: mapStripeStatusToVerificationStatus(session.status, false),
      attemptId,
    };
  } catch (error) {
    // Mark attempt as failed
    await supabase
      .from("identity_verification_attempts")
      .update({ status: "canceled" })
      .eq("id", attemptId);

    // Check if Identity is not enabled on the Stripe account
    if (error instanceof Error) {
      if (error.message.includes("identity") || error.message.includes("Identity")) {
        throw new Error(
          "Stripe Identity is not enabled on this account. Please enable it in the Stripe Dashboard."
        );
      }
    }
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Status Retrieval
// -----------------------------------------------------------------------------

/**
 * Get the status of an existing verification session from Stripe.
 */
export async function getIdentityVerificationStatus(
  sessionId: string
): Promise<VerificationSessionStatus> {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in environment variables."
    );
  }

  const session = await stripe.identity.verificationSessions.retrieve(sessionId);

  // Check if there's an error (indicates user needs to fix something)
  const hasError = !!session.last_error;

  return {
    sessionId: session.id,
    status: mapStripeStatusToVerificationStatus(session.status, hasError),
    lastError: session.last_error?.reason || null,
  };
}

/**
 * Sync identity status from Stripe to database.
 * Called on page load and from return route.
 */
export async function syncIdentityStatusFromStripe(
  userId: string,
  sessionId: string
): Promise<SyncResult> {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  if (!isServiceRoleConfigured()) {
    throw new Error("Database is not configured.");
  }

  const supabase = getServiceClient();

  try {
    // Fetch current status from Stripe
    const session = await stripe.identity.verificationSessions.retrieve(sessionId);
    const hasError = !!session.last_error;
    const newStatus = mapStripeStatusToVerificationStatus(session.status, hasError);

    console.log("[syncIdentityStatusFromStripe] Stripe status:", session.status);
    console.log("[syncIdentityStatusFromStripe] Mapped status:", newStatus);
    console.log("[syncIdentityStatusFromStripe] Has error:", hasError);

    // Update user record
    const updateData: Record<string, unknown> = {
      verification_status: newStatus,
    };

    let verifiedAt: string | null = null;
    if (newStatus === "verified") {
      verifiedAt = new Date().toISOString();
      updateData.identity_verified_at = verifiedAt;
    }

    const { error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId);

    if (updateError) {
      console.error("[syncIdentityStatusFromStripe] Failed to update user:", updateError);
      return { status: newStatus, updated: false, verifiedAt: null };
    }

    // Also update any matching attempt record
    await supabase
      .from("identity_verification_attempts")
      .update({
        status: newStatus,
        stripe_status: session.status,
        stripe_last_error: session.last_error?.reason || null,
        last_synced_at: new Date().toISOString(),
      })
      .eq("stripe_verification_session_id", sessionId);

    console.log("[syncIdentityStatusFromStripe] Database updated");
    return { status: newStatus, updated: true, verifiedAt };
  } catch (error) {
    console.error("[syncIdentityStatusFromStripe] Error:", error);
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Attempt Validation (for return route)
// -----------------------------------------------------------------------------

/**
 * Validate a state token and find the matching attempt.
 * Used by the return route to identify the verification without requiring session.
 */
export async function validateStateTokenAndGetAttempt(
  stateToken: string
): Promise<{
  valid: boolean;
  attemptId?: string;
  userId?: string;
  sessionId?: string;
  expired?: boolean;
}> {
  if (!isServiceRoleConfigured()) {
    return { valid: false };
  }

  const supabase = getServiceClient();
  const tokenHash = hashStateToken(stateToken);

  // Find attempt by hash
  const { data: attempt, error } = await supabase
    .from("identity_verification_attempts")
    .select("id, user_id, stripe_verification_session_id, expires_at, return_consumed_at")
    .eq("state_token_hash", tokenHash)
    .maybeSingle();

  if (error || !attempt) {
    console.log("[validateStateTokenAndGetAttempt] No attempt found for hash");
    return { valid: false };
  }

  // Check if expired
  const expiresAt = new Date(attempt.expires_at);
  if (expiresAt.getTime() < Date.now()) {
    console.log("[validateStateTokenAndGetAttempt] Token expired");
    return { valid: false, expired: true };
  }

  // Check if already consumed (optional - allows reuse within expiry window)
  // We'll allow re-consumption for retries

  return {
    valid: true,
    attemptId: attempt.id,
    userId: attempt.user_id,
    sessionId: attempt.stripe_verification_session_id,
  };
}

/**
 * Mark an attempt's return as consumed.
 */
export async function markAttemptReturnConsumed(attemptId: string): Promise<void> {
  if (!isServiceRoleConfigured()) return;

  const supabase = getServiceClient();
  await supabase
    .from("identity_verification_attempts")
    .update({ return_consumed_at: new Date().toISOString() })
    .eq("id", attemptId);
}

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

/**
 * Cancel an in-progress verification session.
 */
export async function cancelIdentityVerificationSession(
  sessionId: string
): Promise<void> {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in environment variables."
    );
  }

  await stripe.identity.verificationSessions.cancel(sessionId);
}

/**
 * Check if Stripe Identity is available (Stripe is configured).
 */
export function isStripeIdentityConfigured(): boolean {
  return stripe !== null;
}
