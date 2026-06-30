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
 * Get the canonical base URL for redirects.
 *
 * CRITICAL: This URL is used for:
 * - Stripe Identity return URLs
 * - Stripe Connect return/refresh URLs
 * - Supabase auth email redirects (emailRedirectTo)
 * - All absolute URL construction
 *
 * PRIORITY ORDER:
 * 1. NEXT_PUBLIC_APP_URL (canonical production domain - e.g., https://renta-bed.com)
 * 2. VERCEL_URL (Vercel preview deployments only)
 * 3. localhost (local development only)
 *
 * IMPORTANT:
 * - In production, NEXT_PUBLIC_APP_URL MUST be set to the custom domain
 * - VERCEL_URL is auto-set by Vercel to the deployment URL (e.g., roomlink-xxx.vercel.app)
 * - Using VERCEL_URL in production causes cookie domain mismatches with custom domains
 */
export function getBaseUrl(): string {
  // 1. Canonical production URL (custom domain) - MUST be checked first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    // Normalize: remove trailing slash
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  // 2. Production warning - NEXT_PUBLIC_APP_URL should be set
  const isProduction = process.env.NODE_ENV === "production";
  const isVercel = !!process.env.VERCEL;

  if (isProduction && isVercel) {
    console.warn(
      "[getBaseUrl] WARNING: NEXT_PUBLIC_APP_URL is not set in production. " +
      "Falling back to VERCEL_URL which may cause redirect issues. " +
      "Set NEXT_PUBLIC_APP_URL=https://renta-bed.com in Vercel environment variables."
    );
  }

  // 3. Vercel preview/development fallback
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 4. Local development
  return "http://localhost:3000";
}

/**
 * Get diagnostic info about URL configuration (safe for logging).
 */
export function getUrlConfigDiagnostics(): {
  hasCanonicalUrl: boolean;
  canonicalUrl: string | undefined;
  vercelUrl: string | undefined;
  nodeEnv: string;
  isVercel: boolean;
  resolvedBaseUrl: string;
} {
  return {
    hasCanonicalUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    canonicalUrl: process.env.NEXT_PUBLIC_APP_URL,
    vercelUrl: process.env.VERCEL_URL,
    nodeEnv: process.env.NODE_ENV || "unknown",
    isVercel: !!process.env.VERCEL,
    resolvedBaseUrl: getBaseUrl(),
  };
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
