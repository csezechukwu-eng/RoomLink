import "server-only";

import { getCurrentUser, isDemoMode } from "@/lib/auth";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/server";
import { TENANT_STEPS, type TenantStepKey } from "./tenant-content";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TenantStepStatus = "complete" | "incomplete";

export interface TenantStepState {
  key: TenantStepKey;
  status: TenantStepStatus;
}

export interface TenantOnboardingState {
  steps: TenantStepState[];
  /** Key of the first incomplete step */
  firstIncompleteStepKey: TenantStepKey;
  /** Percentage of steps complete (0-100) */
  percentComplete: number;
  /** Whether onboarding is fully complete */
  isComplete: boolean;
  /** Raw data for use by step components */
  data: TenantOnboardingData;
}

export interface TenantOnboardingData {
  // User data
  userId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;

  // Housing preferences
  moveInDate: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  preferredCity: string | null;
  roommatePreference: string | null;
  lifestyle: string | null;
  aboutMe: string | null;

  // Verification
  identityVerified: boolean;
  identityVerifiedAt: string | null;

  // Payment
  paymentMethodAdded: boolean;
  stripeCustomerId: string | null;

  // Messaging & Rules
  communicationPrefsSet: boolean;
  houseRulesAccepted: boolean;
  houseRulesAcceptedAt: string | null;

  // Completion
  onboardingCompletedAt: string | null;
}

// ---------------------------------------------------------------------------
// Demo Mode Mock Data
// ---------------------------------------------------------------------------

function getDemoTenantOnboardingState(): TenantOnboardingState {
  const demoData: TenantOnboardingData = {
    userId: "demo-tenant-id",
    email: "tenant@rentabed.local",
    fullName: "Demo Tenant",
    phone: "(555) 123-4567",
    avatarUrl: null,
    moveInDate: null,
    budgetMin: 450,
    budgetMax: 800,
    preferredCity: "Austin, TX",
    roommatePreference: "no_preference",
    lifestyle: "quiet",
    aboutMe: null,
    identityVerified: false,
    identityVerifiedAt: null,
    paymentMethodAdded: false,
    stripeCustomerId: null,
    communicationPrefsSet: false,
    houseRulesAccepted: false,
    houseRulesAcceptedAt: null,
    onboardingCompletedAt: null,
  };

  return {
    steps: TENANT_STEPS.map((step) => ({
      key: step.key,
      status: "incomplete" as TenantStepStatus,
    })),
    firstIncompleteStepKey: "welcome",
    percentComplete: 0,
    isComplete: false,
    data: demoData,
  };
}

// ---------------------------------------------------------------------------
// Main State Function
// ---------------------------------------------------------------------------

/**
 * Get the complete tenant onboarding state.
 * This is the single source of truth for tenant onboarding progress.
 */
export async function getTenantOnboardingState(): Promise<TenantOnboardingState | null> {
  // Demo mode returns mock data
  if (isDemoMode()) {
    return getDemoTenantOnboardingState();
  }

  // Get current user
  const user = await getCurrentUser();
  if (!user) return null;

  const userId = user.id;
  const email = user.email || "";

  // Check if service role is configured
  if (!isServiceRoleConfigured()) {
    return createMinimalTenantState(userId, email);
  }

  try {
    const supabase = getServiceClient();

    // Fetch user data with tenant onboarding fields
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(`
        id,
        email,
        full_name,
        phone,
        avatar_url,
        move_in_date,
        budget_min,
        budget_max,
        preferred_city,
        roommate_preference,
        lifestyle,
        about_me,
        verification_status,
        identity_verified_at,
        stripe_customer_id,
        payment_method_added,
        communication_prefs_set,
        house_rules_accepted,
        house_rules_accepted_at,
        tenant_onboarding_completed_at
      `)
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      console.error("[getTenantOnboardingState] User fetch error:", userError);
      return createMinimalTenantState(userId, email);
    }

    if (!userData) {
      return createMinimalTenantState(userId, email);
    }

    // Build the data object
    const data: TenantOnboardingData = {
      userId,
      email: userData.email || email,
      fullName: userData.full_name,
      phone: userData.phone,
      avatarUrl: userData.avatar_url,
      moveInDate: userData.move_in_date,
      budgetMin: userData.budget_min,
      budgetMax: userData.budget_max,
      preferredCity: userData.preferred_city,
      roommatePreference: userData.roommate_preference,
      lifestyle: userData.lifestyle,
      aboutMe: userData.about_me,
      identityVerified: userData.verification_status === "verified",
      identityVerifiedAt: userData.identity_verified_at,
      paymentMethodAdded: userData.payment_method_added ?? false,
      stripeCustomerId: userData.stripe_customer_id,
      communicationPrefsSet: userData.communication_prefs_set ?? false,
      houseRulesAccepted: userData.house_rules_accepted ?? false,
      houseRulesAcceptedAt: userData.house_rules_accepted_at,
      onboardingCompletedAt: userData.tenant_onboarding_completed_at,
    };

    // Derive step statuses
    const steps = deriveTenantStepStatuses(data);

    // Find first incomplete step
    const firstIncomplete = steps.find((s) => s.status !== "complete");
    const firstIncompleteStepKey = firstIncomplete?.key || "review";

    // Calculate percent complete
    const completedSteps = steps.filter((s) => s.status === "complete").length;
    const percentComplete = Math.round((completedSteps / steps.length) * 100);

    return {
      steps,
      firstIncompleteStepKey,
      percentComplete,
      isComplete: data.onboardingCompletedAt !== null,
      data,
    };
  } catch (error) {
    console.error("[getTenantOnboardingState] Error:", error);
    return createMinimalTenantState(userId, email);
  }
}

// ---------------------------------------------------------------------------
// Step Status Derivation
// ---------------------------------------------------------------------------

function deriveTenantStepStatuses(data: TenantOnboardingData): TenantStepState[] {
  return TENANT_STEPS.map((step) => {
    const status = getTenantStepStatus(step.key, data);
    return { key: step.key, status };
  });
}

function getTenantStepStatus(key: TenantStepKey, data: TenantOnboardingData): TenantStepStatus {
  switch (key) {
    case "welcome":
      // Welcome is always complete once they've started
      return "complete";

    case "basic-info":
      // Required: full_name, phone
      if (data.fullName && data.phone) {
        return "complete";
      }
      return "incomplete";

    case "housing-preferences":
      // Required: budget range, preferred city
      if (data.budgetMin !== null && data.budgetMax !== null && data.preferredCity) {
        return "complete";
      }
      return "incomplete";

    case "verification":
      // Required: identity verified
      if (data.identityVerified) {
        return "complete";
      }
      return "incomplete";

    case "payment-method":
      // Required: payment method added
      if (data.paymentMethodAdded) {
        return "complete";
      }
      return "incomplete";

    case "messaging-rules":
      // Required: house rules accepted
      if (data.houseRulesAccepted) {
        return "complete";
      }
      return "incomplete";

    case "review":
      // Complete when all previous steps are done and onboarding marked complete
      if (data.onboardingCompletedAt) {
        return "complete";
      }
      return "incomplete";

    default:
      return "incomplete";
  }
}

// ---------------------------------------------------------------------------
// Minimal State (fallback)
// ---------------------------------------------------------------------------

function createMinimalTenantState(userId: string, email: string): TenantOnboardingState {
  const data: TenantOnboardingData = {
    userId,
    email,
    fullName: null,
    phone: null,
    avatarUrl: null,
    moveInDate: null,
    budgetMin: null,
    budgetMax: null,
    preferredCity: null,
    roommatePreference: null,
    lifestyle: null,
    aboutMe: null,
    identityVerified: false,
    identityVerifiedAt: null,
    paymentMethodAdded: false,
    stripeCustomerId: null,
    communicationPrefsSet: false,
    houseRulesAccepted: false,
    houseRulesAcceptedAt: null,
    onboardingCompletedAt: null,
  };

  const steps = deriveTenantStepStatuses(data);

  return {
    steps,
    firstIncompleteStepKey: "welcome",
    percentComplete: 0,
    isComplete: false,
    data,
  };
}
