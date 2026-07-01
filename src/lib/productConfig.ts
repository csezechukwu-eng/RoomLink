/**
 * renta bed Product Configuration
 * ================================
 *
 * PRODUCT DIRECTION (June 2025):
 * renta bed is a MARKETPLACE for monthly crash-pad / shared-housing / room-and-bed rentals.
 *
 * renta bed is NOT:
 * - Airbnb (nightly short-term rentals)
 * - Traditional property-management SaaS (landlord monthly subscription)
 * - A background check provider
 *
 * renta bed IS:
 * - A marketplace for minimum one-month stays
 * - Transaction-fee based (fees on monthly booking payments)
 *
 * BUSINESS MODEL:
 * - Tenant books minimum one-month stay
 * - Tenant pays monthly rent through renta bed
 * - Tenant pays renta bed service fee on top of rent
 * - Host/Landlord pays renta bed host fee (deducted from payout)
 * - Host/Landlord receives rent payout through Stripe Connect
 * - Deposit collected at move-in when required
 * - Monthly stay agreement stored
 * - Tenant can renew month-to-month
 *
 * TERMINOLOGY:
 * - "Monthly stay" (not "28-day stay" or "short-term rental")
 * - "Minimum one-month stay" (not "nightly booking")
 * - "Monthly rent" (not "nightly rate")
 * - "Monthly booking" (not "reservation")
 * - "Monthly renewal"
 * - "Monthly stay agreement" (not "lease" in some contexts)
 * - "Tenant"
 * - "Host" or "Landlord"
 * - "Listing"
 * - "Available beds"
 * - "House capacity"
 * - "Co-ed" / "Women-only house" / "Women-only rooms available"
 * - "renta bed service fee" (tenant-side)
 * - "renta bed host fee" (landlord-side)
 * - "Estimated host payout"
 * - "Stripe Connect payout"
 *
 * AVOID saying:
 * - "prevents squatters"
 * - "avoids tenant rights"
 * - "guarantees no eviction issues"
 * - "legally women-only"
 * - "fair housing approved"
 * - "background checked" (unless feature is built)
 *
 * SAFER wording:
 * - "minimum one-month stay"
 * - "monthly stay agreement"
 * - "month-to-month renewal workflow"
 * - "clear records for hosts and tenants"
 * - "hosts are responsible for using attorney-reviewed lease terms"
 * - "hosts are responsible for complying with fair housing, roommate, occupancy, and local laws"
 *
 * WOMEN-ONLY / CO-ED settings:
 * These can exist as listing occupancy settings, but UI must include compliance note:
 * "Hosts are responsible for complying with fair housing, roommate, occupancy, and local laws
 *  when setting occupancy preferences."
 *
 * FEE STRUCTURE (suggested defaults for payment work):
 * - tenant_bank_service_fee_percent = 0.03 (3%)
 * - tenant_card_service_fee_percent = 0.055 (5.5%)
 * - host_fee_percent = 0.02 (2%)
 * - apply_fees_to_deposit = false
 *
 * DEPOSIT RULES:
 * - Deposit is charged at move-in only (not recurring)
 * - Platform fees apply to monthly rent subtotal by default, NOT deposit
 *
 * LEGACY CODE NOTE:
 * The codebase contains landlord SaaS subscription billing code that was built
 * before this product pivot. This code is preserved but hidden from active UI.
 * The subscription billing should NOT be the primary business model.
 *
 * TODO: Future phases will implement:
 * - Stripe Connect marketplace payments (tenant pays, host receives payout)
 * - Platform fee collection on each monthly payment
 * - Monthly renewal workflow
 * - Reviews system
 * - Checkout photos
 */

// =============================================================================
// FEATURE FLAGS
// =============================================================================

/**
 * Feature flags for controlling product features.
 * These can be toggled as features are implemented or deprecated.
 */
export const PRODUCT_FEATURES = {
  /**
   * DEPRECATED: Landlord SaaS subscription billing.
   * This was the original billing model where landlords pay renta bed monthly.
   * Now hidden from UI. The new model is transaction-fee based.
   */
  LANDLORD_SUBSCRIPTION_BILLING: false,

  /**
   * TODO: Stripe Connect marketplace payments.
   * When enabled, tenants pay through renta bed and hosts receive payouts.
   * Platform fees are collected on each transaction.
   */
  STRIPE_CONNECT_PAYMENTS: false,

  /**
   * TODO: Background checks.
   * Do NOT claim this feature exists until it is implemented.
   */
  BACKGROUND_CHECKS: false,

  /**
   * TODO: Instant booking.
   * Requires payment + lease flow to be ready before enabling.
   */
  INSTANT_BOOKING: false,

  /**
   * TODO: Reviews system.
   * Host and tenant reviews after checkout.
   */
  REVIEWS: false,

  /**
   * TODO: Checkout photos.
   * Document condition at move-out.
   */
  CHECKOUT_PHOTOS: false,
} as const;

// =============================================================================
// FEE CONFIGURATION (for future Stripe Connect implementation)
// =============================================================================

/**
 * Default platform fee configuration.
 * These will be used when Stripe Connect payments are implemented.
 *
 * IMPORTANT: Percentages are decimal values.
 * 3% = 0.03 (NOT 0.03%)
 */
export const DEFAULT_FEES = {
  /** Service fee charged to tenant paying via bank transfer (ACH) */
  tenant_bank_service_fee_percent: 0.03, // 3%

  /** Service fee charged to tenant paying via credit/debit card */
  tenant_card_service_fee_percent: 0.055, // 5.5%

  /** Host fee deducted from landlord payout */
  host_fee_percent: 0.02, // 2%

  /** Whether to apply platform fees to security deposit (default: false) */
  apply_fees_to_deposit: false,
} as const;

// =============================================================================
// MINIMUM STAY CONFIGURATION
// =============================================================================

/**
 * Minimum stay requirements.
 * renta bed is for monthly stays only.
 */
export const MINIMUM_STAY = {
  /** Minimum stay in days */
  days: 30,

  /** Minimum stay in months */
  months: 1,

  /** Display label */
  label: "Minimum one-month stay",
} as const;

// =============================================================================
// COMPLIANCE TEXT
// =============================================================================

/**
 * Standard compliance text to display in various parts of the UI.
 */
export const COMPLIANCE_TEXT = {
  /** Disclaimer for occupancy preference settings (women-only, co-ed, etc.) */
  occupancyPreferences:
    "Hosts are responsible for complying with fair housing, roommate, occupancy, and local laws when setting occupancy preferences.",

  /** Disclaimer for lease/agreement terms */
  leaseTerms:
    "Hosts are responsible for using attorney-reviewed lease terms that comply with local laws.",

  /** General host responsibility disclaimer */
  hostResponsibility:
    "Hosts are responsible for complying with all applicable laws and regulations.",
} as const;

// =============================================================================
// HOST FEE CONFIGURATION (Transaction-based model)
// =============================================================================

/**
 * Host fee configuration for the marketplace model.
 * Landlords pay a percentage fee only when tenants pay through the platform.
 */
export const HOST_FEE = {
  /** Host fee percentage (5% = landlord keeps 95%) */
  percent: 5,

  /** Display label */
  label: "5% host fee",

  /** What landlord keeps */
  keepPercent: 95,
} as const;
