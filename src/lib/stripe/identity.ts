import "server-only";
import { stripe, getBaseUrl } from "./server";
import type { VerificationStatus } from "@/lib/types";

/**
 * Stripe Identity helpers for landlord identity verification.
 *
 * Uses Stripe Identity for document verification to ensure
 * landlords are who they claim to be.
 */

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface VerificationSessionResult {
  sessionId: string;
  url: string;
  status: VerificationStatus;
}

export interface VerificationSessionStatus {
  sessionId: string;
  status: VerificationStatus;
  lastError: string | null;
}

// -----------------------------------------------------------------------------
// Helpers
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
 * Our status mapping:
 * - not_started: No session exists or user hasn't started
 * - pending: User started verification but not complete
 * - processing: Stripe is reviewing documents
 * - verified: Successfully verified
 * - needs_attention: User needs to resubmit or fix something
 * - canceled: Verification was canceled
 */
export function mapStripeStatusToVerificationStatus(
  stripeStatus: string,
  hasSubmittedBefore?: boolean
): VerificationStatus {
  switch (stripeStatus) {
    case "verified":
      return "verified";
    case "processing":
      return "processing";
    case "requires_input":
      // If user has submitted before and needs to resubmit, it's needs_attention
      // Otherwise, they just haven't started the verification yet
      return hasSubmittedBefore ? "needs_attention" : "pending";
    case "canceled":
      return "canceled";
    default:
      return "not_started";
  }
}

/**
 * Create a new Stripe Identity verification session.
 *
 * @param userId - The landlord's user ID (for metadata)
 * @param returnUrl - URL to redirect to after verification
 * @returns Session ID and hosted verification URL
 * @throws Error if Stripe is not configured or Identity is not enabled
 */
export async function createIdentityVerificationSession(
  userId: string,
  returnUrl?: string
): Promise<VerificationSessionResult> {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in environment variables."
    );
  }

  const baseUrl = getBaseUrl();
  const finalReturnUrl = returnUrl || `${baseUrl}/api/identity/return`;

  console.log("[createIdentityVerificationSession] Base URL:", baseUrl);
  console.log("[createIdentityVerificationSession] Return URL:", finalReturnUrl);

  try {
    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: {
        platform: "roomlink",
        user_id: userId,
      },
      options: {
        document: {
          // Allow passport, driver's license, or ID card
          allowed_types: ["driving_license", "passport", "id_card"],
          // Require front and back for licenses/IDs
          require_matching_selfie: true,
        },
      },
      return_url: finalReturnUrl,
    });

    return {
      sessionId: session.id,
      url: session.url || "",
      status: mapStripeStatusToVerificationStatus(session.status, false),
    };
  } catch (error) {
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

/**
 * Get the status of an existing verification session.
 *
 * @param sessionId - The verification session ID
 * @returns Session status
 * @throws Error if Stripe is not configured or session not found
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

  // Check if user has submitted before (has a verification report)
  // This helps distinguish between "hasn't started" vs "needs to resubmit"
  const hasSubmittedBefore = !!session.last_verification_report;

  return {
    sessionId: session.id,
    status: mapStripeStatusToVerificationStatus(session.status, hasSubmittedBefore),
    lastError: session.last_error?.reason || null,
  };
}

/**
 * Cancel an in-progress verification session.
 *
 * @param sessionId - The verification session ID
 * @throws Error if Stripe is not configured
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
