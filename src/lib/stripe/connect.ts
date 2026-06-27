import "server-only";
import { stripe, getBaseUrl } from "./server";
import type { StripeConnectOnboardingStatus } from "@/lib/types";

/**
 * Stripe Connect helpers for Room Link marketplace payments.
 *
 * BUSINESS MODEL:
 * - Landlords connect their Stripe accounts via Express onboarding
 * - Room Link keeps 5% host fee via application_fee_amount
 * - Landlords receive 95% via destination charges
 * - No monthly subscription fees
 */

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ConnectAccountStatus {
  /** Stripe account ID */
  accountId: string;
  /** Account type */
  type: "express" | "standard" | "custom";
  /** Whether charges are enabled */
  chargesEnabled: boolean;
  /** Whether payouts are enabled */
  payoutsEnabled: boolean;
  /** Whether details have been submitted */
  detailsSubmitted: boolean;
  /** Combined pending requirements */
  requirementsDue: string[];
  /** Whether onboarding is complete */
  onboardingComplete: boolean;
  /** Computed onboarding status for UI */
  onboardingStatus: StripeConnectOnboardingStatus;
}

export interface CreateAccountResult {
  accountId: string;
  type: "express";
}

export interface OnboardingLinkResult {
  url: string;
  expiresAt: Date;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Compute the onboarding status from account flags.
 */
export function computeOnboardingStatus(
  accountId: string | null,
  chargesEnabled: boolean,
  payoutsEnabled: boolean,
  detailsSubmitted: boolean
): StripeConnectOnboardingStatus {
  // Not connected yet
  if (!accountId) {
    return "not_connected";
  }

  // Fully ready
  if (chargesEnabled && payoutsEnabled) {
    return "payouts_ready";
  }

  // Submitted but waiting for verification
  if (detailsSubmitted) {
    return "pending_verification";
  }

  // Started but incomplete
  return "onboarding_incomplete";
}

/**
 * Create a new Stripe Connect Express account for a landlord.
 *
 * @param email - Landlord's email address
 * @param metadata - Additional metadata to store
 * @returns Account ID
 * @throws Error if Stripe is not configured
 */
export async function createConnectAccount(
  email: string,
  metadata?: { landlordId?: string }
): Promise<CreateAccountResult> {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in environment variables."
    );
  }

  const account = await stripe.accounts.create({
    type: "express",
    email,
    metadata: {
      platform: "roomlink",
      landlord_id: metadata?.landlordId ?? "",
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  return {
    accountId: account.id,
    type: "express",
  };
}

/**
 * Create an onboarding link for a Stripe Connect account.
 *
 * @param accountId - Stripe account ID
 * @returns Onboarding URL and expiration
 * @throws Error if Stripe is not configured
 */
export async function createOnboardingLink(
  accountId: string
): Promise<OnboardingLinkResult> {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in environment variables."
    );
  }

  const baseUrl = getBaseUrl();

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/api/stripe-connect/refresh`,
    return_url: `${baseUrl}/api/stripe-connect/return`,
    type: "account_onboarding",
  });

  return {
    url: accountLink.url,
    expiresAt: new Date(accountLink.expires_at * 1000),
  };
}

/**
 * Fetch the current status of a Stripe Connect account.
 *
 * @param accountId - Stripe account ID
 * @returns Account status
 * @throws Error if Stripe is not configured or account not found
 */
export async function getAccountStatus(
  accountId: string
): Promise<ConnectAccountStatus> {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in environment variables."
    );
  }

  const account = await stripe.accounts.retrieve(accountId);

  // Combine all pending requirements
  const requirementsDue = [
    ...(account.requirements?.currently_due ?? []),
    ...(account.requirements?.eventually_due ?? []),
  ];

  // Dedupe requirements
  const uniqueRequirements = [...new Set(requirementsDue)];

  // Calculate onboarding complete
  const chargesEnabled = account.charges_enabled ?? false;
  const payoutsEnabled = account.payouts_enabled ?? false;
  const detailsSubmitted = account.details_submitted ?? false;
  const onboardingComplete = chargesEnabled && payoutsEnabled;

  const onboardingStatus = computeOnboardingStatus(
    accountId,
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted
  );

  return {
    accountId: account.id,
    type: (account.type as "express" | "standard" | "custom") ?? "express",
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted,
    requirementsDue: uniqueRequirements,
    onboardingComplete,
    onboardingStatus,
  };
}

/**
 * Create a Stripe Dashboard login link for an Express account.
 *
 * @param accountId - Stripe account ID
 * @returns Dashboard URL
 * @throws Error if Stripe is not configured
 */
export async function createDashboardLink(accountId: string): Promise<string> {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in environment variables."
    );
  }

  const loginLink = await stripe.accounts.createLoginLink(accountId);
  return loginLink.url;
}

// -----------------------------------------------------------------------------
// Fee Calculation
// -----------------------------------------------------------------------------

/**
 * Calculate the 5% host fee and landlord payout.
 *
 * @param amountCents - Total amount in cents (rent only, not deposit)
 * @returns Fee breakdown
 */
export function calculateHostFee(amountCents: number): {
  hostFeeCents: number;
  landlordPayoutCents: number;
} {
  // 5% host fee, rounded
  const hostFeeCents = Math.round(amountCents * 0.05);
  const landlordPayoutCents = amountCents - hostFeeCents;

  return {
    hostFeeCents,
    landlordPayoutCents,
  };
}
