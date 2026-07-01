import "server-only";
import Stripe from "stripe";
import { stripe, getBaseUrl } from "./server";

/**
 * Tenant Payment Setup Module
 *
 * Handles creating Stripe Customers and Setup Sessions for tenants
 * to save payment methods for future rent payments.
 *
 * TENANT FEE MODEL:
 * - 10% tenant service fee on each rent payment
 * - Fee is charged at payment time, not during setup
 */

export const TENANT_SERVICE_FEE_PERCENT = 10;

export interface CreateSetupSessionResult {
  sessionUrl: string;
  customerId: string;
}

/**
 * Create or retrieve a Stripe Customer for the tenant.
 * Returns the customer ID.
 */
export async function getOrCreateStripeCustomer(input: {
  userId: string;
  email: string;
  name?: string | null;
  existingCustomerId?: string | null;
}): Promise<string | null> {
  if (!stripe) {
    console.error("[tenant-setup] Stripe not configured");
    return null;
  }

  const { userId, email, name, existingCustomerId } = input;

  // If we already have a customer ID, verify it exists
  if (existingCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(existingCustomerId);
      if (!customer.deleted) {
        return existingCustomerId;
      }
    } catch {
      // Customer doesn't exist, create a new one
      console.log("[tenant-setup] Existing customer not found, creating new");
    }
  }

  // Create a new customer
  try {
    const customer = await stripe.customers.create({
      email,
      name: name || undefined,
      metadata: {
        user_id: userId,
        user_type: "tenant",
      },
    });

    console.log("[tenant-setup] Created Stripe customer:", customer.id);
    return customer.id;
  } catch (error) {
    console.error("[tenant-setup] Error creating customer:", error);
    return null;
  }
}

/**
 * Create a Stripe Checkout Session in setup mode to collect payment method.
 * This does NOT charge the customer - it only saves their payment method.
 */
export async function createPaymentSetupSession(input: {
  customerId: string;
  userId: string;
  email: string;
}): Promise<CreateSetupSessionResult | null> {
  if (!stripe) {
    console.error("[tenant-setup] Stripe not configured");
    return null;
  }

  const { customerId, userId } = input;
  const baseUrl = getBaseUrl();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: customerId,
      payment_method_types: ["card", "us_bank_account"],
      success_url: `${baseUrl}/onboarding/tenant?step=payment-method&setup=success`,
      cancel_url: `${baseUrl}/onboarding/tenant?step=payment-method&setup=canceled`,
      metadata: {
        user_id: userId,
        setup_type: "tenant_payment_method",
      },
      // Configure for future payments
      payment_method_options: {
        card: {
          request_three_d_secure: "automatic",
        },
        us_bank_account: {
          financial_connections: {
            permissions: ["payment_method", "balances"],
          },
          verification_method: "automatic",
        },
      },
    });

    if (!session.url) {
      console.error("[tenant-setup] No URL in checkout session");
      return null;
    }

    console.log("[tenant-setup] Created setup session:", session.id);
    return {
      sessionUrl: session.url,
      customerId,
    };
  } catch (error) {
    console.error("[tenant-setup] Error creating setup session:", error);
    return null;
  }
}

/**
 * Check if a customer has any saved payment methods.
 */
export async function hasPaymentMethod(customerId: string): Promise<boolean> {
  if (!stripe) {
    return false;
  }

  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      limit: 1,
    });

    return paymentMethods.data.length > 0;
  } catch (error) {
    console.error("[tenant-setup] Error checking payment methods:", error);
    return false;
  }
}

/**
 * Get the default payment method for a customer.
 */
export async function getDefaultPaymentMethod(
  customerId: string
): Promise<Stripe.PaymentMethod | null> {
  if (!stripe) {
    return null;
  }

  try {
    // First check the customer's invoice settings for default
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      return null;
    }

    const defaultMethodId = customer.invoice_settings?.default_payment_method;
    if (typeof defaultMethodId === "string") {
      return await stripe.paymentMethods.retrieve(defaultMethodId);
    }

    // If no default, get the first payment method
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      limit: 1,
    });

    return paymentMethods.data[0] || null;
  } catch (error) {
    console.error("[tenant-setup] Error getting default payment method:", error);
    return null;
  }
}
