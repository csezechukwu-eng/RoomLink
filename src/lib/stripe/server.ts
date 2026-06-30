import "server-only";
import Stripe from "stripe";

/**
 * Stripe server-side client for Room Link.
 *
 * BUSINESS MODEL (June 2025):
 * Room Link uses a transaction-fee model, NOT landlord subscriptions.
 * - Landlords do not pay a monthly subscription
 * - Landlords pay a 5% host fee on each monthly rent payment
 * - Tenants pay monthly rent through Room Link (Stripe Connect)
 *
 * This file provides the core Stripe client for future marketplace payments.
 * The landlord subscription billing code has been removed.
 */

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn("[Stripe] STRIPE_SECRET_KEY is not configured");
}

/**
 * Stripe client instance.
 * Used for Stripe Connect marketplace payments (future).
 */
export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey)
  : null;

/**
 * Check if Stripe webhook is properly configured.
 * Required for /api/webhooks/stripe route.
 */
export function isWebhookConfigured(): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  return Boolean(secret && secret.length > 0);
}

/**
 * Get Stripe config diagnostic info (safe - no secret values logged).
 * Use this to debug config issues in production.
 */
export function getStripeConfigDiagnostics(): {
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
  webhookSecretStartsWithWhsec: boolean;
  nodeEnv: string;
  vercelEnv: string | undefined;
} {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  return {
    hasSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
    hasWebhookSecret: Boolean(webhookSecret && webhookSecret.length > 0),
    webhookSecretStartsWithWhsec: Boolean(webhookSecret?.startsWith("whsec_")),
    nodeEnv: process.env.NODE_ENV || "unknown",
    vercelEnv: process.env.VERCEL_ENV,
  };
}

/**
 * Get the base URL for redirects.
 *
 * IMPORTANT: NEXT_PUBLIC_APP_URL (custom domain) takes priority over VERCEL_URL.
 * VERCEL_URL is auto-set to the deployment URL (e.g., roomlink-xxx.vercel.app),
 * which causes cookie domain mismatches when using a custom domain.
 */
export function getBaseUrl(): string {
  // Production URL (custom domain) - MUST be checked first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // Vercel deployment URL (fallback for preview deployments)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Local development
  return "http://localhost:3000";
}

// =============================================================================
// FUTURE: Stripe Connect Marketplace Payments
// =============================================================================

/**
 * Platform fee configuration for marketplace payments.
 * These will be used when Stripe Connect is implemented.
 */
export const PLATFORM_FEES = {
  /** Host fee percentage (deducted from landlord payout) */
  hostFeePercent: 5, // 5%

  /** Tenant service fee for bank payments (ACH) */
  tenantBankFeePercent: 3, // 3%

  /** Tenant service fee for card payments */
  tenantCardFeePercent: 5.5, // 5.5%
} as const;
