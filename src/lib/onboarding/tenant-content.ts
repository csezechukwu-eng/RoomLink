/**
 * Tenant Onboarding Content Configuration
 *
 * This file defines the step structure and content for the tenant onboarding flow.
 */

export type TenantStepKey =
  | "welcome"
  | "basic-info"
  | "housing-preferences"
  | "verification"
  | "payment-method"
  | "messaging-rules"
  | "review";

export interface TenantOnboardingStep {
  key: TenantStepKey;
  title: string;
  subtitle: string;
}

/**
 * Ordered array of tenant onboarding steps.
 * The order here determines the navigation flow.
 */
export const TENANT_STEPS: TenantOnboardingStep[] = [
  {
    key: "welcome",
    title: "Welcome",
    subtitle: "Let's get started",
  },
  {
    key: "basic-info",
    title: "Basic Info",
    subtitle: "Tell us about you",
  },
  {
    key: "housing-preferences",
    title: "Housing Preferences",
    subtitle: "What are you looking for?",
  },
  {
    key: "verification",
    title: "ID & Verification",
    subtitle: "Verify your identity",
  },
  {
    key: "payment-method",
    title: "Payment Method",
    subtitle: "Set up your payments",
  },
  {
    key: "messaging-rules",
    title: "Messaging & House Rules",
    subtitle: "Stay connected",
  },
  {
    key: "review",
    title: "Review & Finish",
    subtitle: "Confirm and complete",
  },
];

/**
 * Get a step by its key.
 */
export function getTenantStep(key: TenantStepKey): TenantOnboardingStep | undefined {
  return TENANT_STEPS.find((step) => step.key === key);
}

/**
 * Get the index of a step by its key.
 */
export function getTenantStepIndex(key: TenantStepKey): number {
  return TENANT_STEPS.findIndex((step) => step.key === key);
}

/**
 * Get the next step after the given key.
 */
export function getNextTenantStep(key: TenantStepKey): TenantOnboardingStep | undefined {
  const index = getTenantStepIndex(key);
  if (index === -1 || index === TENANT_STEPS.length - 1) return undefined;
  return TENANT_STEPS[index + 1];
}

/**
 * Get the previous step before the given key.
 */
export function getPreviousTenantStep(key: TenantStepKey): TenantOnboardingStep | undefined {
  const index = getTenantStepIndex(key);
  if (index <= 0) return undefined;
  return TENANT_STEPS[index - 1];
}

/**
 * What tenants unlock by completing onboarding
 */
export const TENANT_BENEFITS = [
  {
    key: "browse-apply",
    title: "Browse & apply for beds",
    description: "View live availability and submit applications instantly.",
  },
  {
    key: "message",
    title: "Message your landlord",
    description: "Communicate easily with your landlord and housemates.",
  },
  {
    key: "maintenance",
    title: "Submit maintenance requests",
    description: "Report issues and track updates in one place.",
  },
  {
    key: "rent",
    title: "Track your rent",
    description: "View payment history and upcoming due dates.",
  },
  {
    key: "agreements",
    title: "Review agreements",
    description: "Access and sign your lease and important documents.",
  },
];
