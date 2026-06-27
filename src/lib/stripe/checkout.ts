import "server-only";
import { stripe, getBaseUrl } from "./server";

/**
 * Stripe Checkout helper for Room Link tenant rent payments.
 *
 * IMPORTANT:
 * - This helper accepts already-validated server-side data only.
 * - It does NOT query the database.
 * - It does NOT trust client-submitted amounts.
 * - The caller (server action) is responsible for validating ownership
 *   and fetching the correct rent charge amount from the database.
 *
 * Stripe Connect:
 * - Uses destination charges with application_fee_amount
 * - Room Link keeps 5% host fee
 * - Landlord receives 95% via their connected account
 */

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface CreateRentCheckoutInput {
  /** The rent charge ID being paid */
  rentChargeId: string;

  /** The tenant making the payment */
  tenantId: string;

  /** The landlord who will receive the payment (optional for now) */
  landlordId?: string | null;

  /** The property this rent charge belongs to */
  propertyId?: string | null;

  /** The bed this rent charge is for */
  bedId?: string | null;

  /** Amount in cents (USD). Must be a positive integer. */
  amountCents: number;

  /** Currency code (defaults to "usd") */
  currency?: string;

  /** Description shown in Stripe Checkout (defaults to "Rent Payment") */
  description?: string;

  /** Optional payment record ID if pre-created */
  paymentId?: string | null;

  // -------------------------------------------------------------------------
  // Stripe Connect fields (optional - only used when landlord is connected)
  // -------------------------------------------------------------------------

  /** Landlord's Stripe Connect account ID (acct_xxx) */
  connectedAccountId?: string | null;

  /** Room Link's 5% host fee in cents */
  hostFeeCents?: number | null;

  /** Landlord's payout amount in cents (amountCents - hostFeeCents) */
  landlordPayoutCents?: number | null;
}

export interface CreateRentCheckoutResult {
  /** Stripe Checkout Session ID */
  sessionId: string;

  /** URL to redirect the tenant to for payment */
  url: string;
}

// -----------------------------------------------------------------------------
// Helper
// -----------------------------------------------------------------------------

/**
 * Create a Stripe Checkout Session for a rent payment.
 *
 * @param input - Validated server-side rent charge data
 * @returns Checkout session ID and URL
 * @throws Error if Stripe is not configured or input is invalid
 */
export async function createRentCheckoutSession(
  input: CreateRentCheckoutInput
): Promise<CreateRentCheckoutResult> {
  // ---------------------------------------------------------------------------
  // 1. Validate Stripe is configured
  // ---------------------------------------------------------------------------
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in environment variables."
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Validate amountCents
  // ---------------------------------------------------------------------------
  if (!Number.isInteger(input.amountCents)) {
    throw new Error("amountCents must be an integer.");
  }

  if (input.amountCents <= 0) {
    throw new Error("amountCents must be greater than 0.");
  }

  // ---------------------------------------------------------------------------
  // 3. Build URLs
  // ---------------------------------------------------------------------------
  const baseUrl = getBaseUrl();
  const successUrl = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/payment/cancel?rent_charge_id=${encodeURIComponent(input.rentChargeId)}`;

  // ---------------------------------------------------------------------------
  // 4. Build metadata (convert to strings, omit null/undefined)
  // ---------------------------------------------------------------------------
  const metadata: Record<string, string> = {
    rent_charge_id: input.rentChargeId,
    tenant_id: input.tenantId,
    payment_type: "rent",
  };

  if (input.landlordId) {
    metadata.landlord_id = input.landlordId;
  }

  if (input.propertyId) {
    metadata.property_id = input.propertyId;
  }

  if (input.bedId) {
    metadata.bed_id = input.bedId;
  }

  if (input.paymentId) {
    metadata.payment_id = input.paymentId;
  }

  // Add Stripe Connect metadata if present
  if (input.connectedAccountId) {
    metadata.connected_account_id = input.connectedAccountId;
  }
  if (input.hostFeeCents != null) {
    metadata.host_fee_cents = String(input.hostFeeCents);
  }
  if (input.landlordPayoutCents != null) {
    metadata.landlord_payout_cents = String(input.landlordPayoutCents);
  }

  // ---------------------------------------------------------------------------
  // 5. Determine client_reference_id
  // ---------------------------------------------------------------------------
  const clientReferenceId = input.paymentId ?? input.rentChargeId;

  // ---------------------------------------------------------------------------
  // 6. Build Stripe Connect payment_intent_data (if connected account provided)
  // ---------------------------------------------------------------------------
  let paymentIntentData: {
    application_fee_amount?: number;
    transfer_data?: { destination: string };
  } | undefined;

  if (input.connectedAccountId && input.hostFeeCents != null && input.hostFeeCents > 0) {
    paymentIntentData = {
      application_fee_amount: input.hostFeeCents,
      transfer_data: {
        destination: input.connectedAccountId,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 7. Create Checkout Session
  // ---------------------------------------------------------------------------
  const currency = input.currency ?? "usd";
  const description = input.description ?? "Rent Payment";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: clientReferenceId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    ...(paymentIntentData && { payment_intent_data: paymentIntentData }),
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: input.amountCents,
          product_data: {
            name: description,
          },
        },
        quantity: 1,
      },
    ],
  });

  // ---------------------------------------------------------------------------
  // 7. Validate session URL exists
  // ---------------------------------------------------------------------------
  if (!session.url) {
    throw new Error("Stripe Checkout Session was created but has no URL.");
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
}
