import "server-only";
import Stripe from "stripe";

/**
 * Stripe server-side client for Room Link platform billing.
 *
 * This is used for landlords paying Room Link (platform subscription).
 * NOT for Stripe Connect rent collection.
 */

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn("[Stripe] STRIPE_SECRET_KEY is not configured");
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey)
  : null;

/**
 * Check if Stripe is properly configured
 */
export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_ROOMLINK_MONTHLY_PRICE_ID
  );
}

/**
 * Get the Room Link subscription price ID
 */
export function getRoomLinkPriceId(): string | null {
  return process.env.STRIPE_ROOMLINK_MONTHLY_PRICE_ID || null;
}

/**
 * Get the base URL for redirects
 */
export function getBaseUrl(): string {
  // Vercel deployment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Production URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // Local development
  return "http://localhost:3000";
}
