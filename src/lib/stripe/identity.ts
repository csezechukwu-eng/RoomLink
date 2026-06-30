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
 */
export function mapStripeStatusToVerificationStatus(
  stripeStatus: string
): VerificationStatus {
  switch (stripeStatus) {
    case "verified":
      return "verified";
    case "processing":
    case "requires_input":
      return "pending";
    case "canceled":
    case "requires_action":
    default:
      return "unverified";
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
      status: mapStripeStatusToVerificationStatus(session.status),
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

  return {
    sessionId: session.id,
    status: mapStripeStatusToVerificationStatus(session.status),
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
