/**
 * Landlord Onboarding Content Configuration
 *
 * This file defines the step structure and content for the landlord onboarding flow.
 * Hint strings are intentionally empty — Part 2 will fill these in with friendly copy.
 */

export type StepKey =
  | "welcome"
  | "account"
  | "identity"
  | "payouts"
  | "property"
  | "listing"
  | "publish";

export type RequirementType = "publish" | "payout" | "recommended";

export interface OnboardingStep {
  key: StepKey;
  title: string;
  subtitle: string;
  timeEstimate: string;
  requirement: RequirementType;
  /** Hint slot for Part 2 — intentionally empty for now */
  hint: string;
}

/**
 * Ordered array of onboarding steps.
 * The order here determines the navigation flow.
 */
export const STEPS: OnboardingStep[] = [
  {
    key: "welcome",
    title: "Welcome",
    subtitle: "Get started with renta bed",
    timeEstimate: "1 min",
    requirement: "publish",
    hint: "", // Part 2
  },
  {
    key: "account",
    title: "Account Setup",
    subtitle: "Tell us about yourself",
    timeEstimate: "2 min",
    requirement: "publish",
    hint: "", // Part 2
  },
  {
    key: "identity",
    title: "Identity & Authority",
    subtitle: "Verify your identity",
    timeEstimate: "3 min",
    requirement: "publish",
    hint: "", // Part 2
  },
  {
    key: "payouts",
    title: "Pricing & Payouts",
    subtitle: "Set up how you get paid",
    timeEstimate: "3 min",
    requirement: "payout",
    hint: "", // Part 2
  },
  {
    key: "property",
    title: "Property Basics",
    subtitle: "Describe your property",
    timeEstimate: "3 min",
    requirement: "publish",
    hint: "", // Part 2
  },
  {
    key: "listing",
    title: "Listing Content",
    subtitle: "Add photos and details",
    timeEstimate: "5 min",
    requirement: "publish",
    hint: "", // Part 2
  },
  {
    key: "publish",
    title: "Review & Publish",
    subtitle: "Go live on renta bed",
    timeEstimate: "2 min",
    requirement: "publish",
    hint: "", // Part 2
  },
];

/**
 * Get a step by its key.
 */
export function getStep(key: StepKey): OnboardingStep | undefined {
  return STEPS.find((step) => step.key === key);
}

/**
 * Get the index of a step by its key.
 */
export function getStepIndex(key: StepKey): number {
  return STEPS.findIndex((step) => step.key === key);
}

/**
 * Get the next step after the given key.
 */
export function getNextStep(key: StepKey): OnboardingStep | undefined {
  const index = getStepIndex(key);
  if (index === -1 || index === STEPS.length - 1) return undefined;
  return STEPS[index + 1];
}

/**
 * Get the previous step before the given key.
 */
export function getPreviousStep(key: StepKey): OnboardingStep | undefined {
  const index = getStepIndex(key);
  if (index <= 0) return undefined;
  return STEPS[index - 1];
}

// ---------------------------------------------------------------------------
// Per-Field Hint Placeholders (Part 2 will populate these)
// ---------------------------------------------------------------------------

export const FIELD_HINTS = {
  // Account step
  fullName: "",
  displayName: "",
  phone: "",
  landlordType: "",
  emergencyContact: "",
  profilePhoto: "",

  // Identity step
  identityVerification: "",
  authorityAttestation: "",

  // Payouts step
  stripeConnect: "",
  hostFee: "",

  // Property step
  propertyName: "",
  propertyType: "",
  address: "",
  occupancyType: "",
  amenities: "",
  monthlyRent: "",

  // Listing step
  photos: "",
  description: "",
  neighborhood: "",

  // Publish step
  houseRules: "",
  compliance: "",
  preview: "",
};
