import "server-only";

import { getCurrentUser, isDemoMode, DEMO_OWNER_ID } from "@/lib/auth";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/server";
import { computeOnboardingStatus } from "@/lib/stripe/connect";
import { STEPS, type StepKey } from "./content";
import type { StripeConnectOnboardingStatus, VerificationStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StepStatus = "complete" | "incomplete" | "blocked";

export interface StepState {
  key: StepKey;
  status: StepStatus;
  blockers: string[];
}

export interface OnboardingReadiness {
  /** All required-to-publish items are complete */
  publishReady: boolean;
  /** All required-to-get-paid items are complete */
  payoutReady: boolean;
  /** Count of recommended items remaining */
  recommendedRemaining: number;
}

export interface LandlordOnboardingState {
  steps: StepState[];
  readiness: OnboardingReadiness;
  /** Key of the first incomplete step */
  firstIncompleteStepKey: StepKey;
  /** Percentage of steps complete (0-100) */
  percentComplete: number;
  /** Draft property ID being created during onboarding */
  draftPropertyId: string | null;
  /** Whether onboarding is fully complete */
  isComplete: boolean;
  /** Raw data for use by step components */
  data: OnboardingData;
}

export interface OnboardingData {
  // User data
  userId: string;
  email: string;
  fullName: string | null;
  displayName: string | null;
  phone: string | null;
  landlordType: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  avatarUrl: string | null;

  // Identity
  identityVerificationStatus: VerificationStatus;
  identityVerifiedAt: string | null;
  authorityAttestedAt: string | null;

  // Payouts (Stripe Connect)
  stripeConnectStatus: StripeConnectOnboardingStatus;
  stripeAccountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;

  // Property
  propertyId: string | null;
  propertyName: string | null;
  propertyType: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  description: string | null;
  houseRules: string | null;
  occupancyType: string | null;
  defaultMinStayDays: number;

  // Property Amenities
  furnished: boolean;
  utilitiesIncluded: boolean;
  wifi: boolean;
  laundry: string | null;
  parking: string | null;
  neighborhood: string | null;

  // Room/Bed
  hasRoom: boolean;
  hasBed: boolean;
  hasBedWithRent: boolean;
  roomId: string | null;
  roomName: string | null;
  bedId: string | null;
  bedLabel: string | null;
  monthlyRent: number | null;
  depositAmount: number | null;
  availableFrom: string | null;
  minStayDays: number | null;
  maxStayDays: number | null;

  // Media
  photoCount: number;
  hasCoverPhoto: boolean;

  // Compliance
  complianceAckAt: string | null;

  // Completion
  onboardingCompletedAt: string | null;
}

// ---------------------------------------------------------------------------
// Demo Mode Mock Data
// ---------------------------------------------------------------------------

function getDemoOnboardingState(): LandlordOnboardingState {
  const demoData: OnboardingData = {
    userId: DEMO_OWNER_ID,
    email: "demo@rentabed.local",
    fullName: "Demo Landlord",
    displayName: "Demo",
    phone: "(555) 123-4567",
    landlordType: "individual",
    emergencyContactName: "Emergency Contact",
    emergencyContactPhone: "(555) 987-6543",
    avatarUrl: null,
    identityVerificationStatus: "verified",
    identityVerifiedAt: new Date().toISOString(),
    authorityAttestedAt: new Date().toISOString(),
    stripeConnectStatus: "payouts_ready",
    stripeAccountId: "acct_demo123",
    chargesEnabled: true,
    payoutsEnabled: true,
    propertyId: "demo-property-id",
    propertyName: "Demo Property",
    propertyType: "co_living",
    address: "123 Demo Street",
    city: "San Francisco",
    state: "CA",
    zip: "94102",
    description: "A lovely demo property",
    houseRules: "Be respectful",
    occupancyType: "coed",
    defaultMinStayDays: 30,
    furnished: true,
    utilitiesIncluded: true,
    wifi: true,
    laundry: "In-unit washer/dryer",
    parking: "Street parking available",
    neighborhood: "Downtown SF, near BART",
    hasRoom: true,
    hasBed: true,
    hasBedWithRent: true,
    roomId: "demo-room-id",
    roomName: "Room A",
    bedId: "demo-bed-id",
    bedLabel: "Bed 1",
    monthlyRent: 800,
    depositAmount: 800,
    availableFrom: null,
    minStayDays: 30,
    maxStayDays: null,
    photoCount: 5,
    hasCoverPhoto: true,
    complianceAckAt: new Date().toISOString(),
    onboardingCompletedAt: new Date().toISOString(),
  };

  return {
    steps: STEPS.map((step) => ({
      key: step.key,
      status: "complete" as StepStatus,
      blockers: [],
    })),
    readiness: {
      publishReady: true,
      payoutReady: true,
      recommendedRemaining: 0,
    },
    firstIncompleteStepKey: "publish",
    percentComplete: 100,
    draftPropertyId: "demo-property-id",
    isComplete: true,
    data: demoData,
  };
}

// ---------------------------------------------------------------------------
// Main State Function
// ---------------------------------------------------------------------------

/**
 * Get the complete landlord onboarding state.
 * This is the single source of truth for onboarding progress.
 *
 * Derives everything from real data (endowed-progress model).
 */
export async function getLandlordOnboardingState(): Promise<LandlordOnboardingState | null> {
  // Demo mode returns mock data
  if (isDemoMode()) {
    return getDemoOnboardingState();
  }

  // Get current user
  const user = await getCurrentUser();
  if (!user) return null;

  const userId = user.id;
  const email = user.email || "";

  // Check if service role is configured
  if (!isServiceRoleConfigured()) {
    // Return minimal state when DB not configured
    return createMinimalState(userId, email);
  }

  try {
    const supabase = getServiceClient();

    // Fetch user data with all onboarding fields
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(`
        id,
        email,
        full_name,
        phone,
        display_name,
        landlord_type,
        emergency_contact_name,
        emergency_contact_phone,
        avatar_url,
        verification_status,
        identity_verification_session_id,
        identity_verified_at,
        authority_attested_at,
        compliance_ack_at,
        onboarding_completed_at,
        onboarding_draft_property_id,
        stripe_account_id,
        stripe_connect_charges_enabled,
        stripe_connect_payouts_enabled,
        stripe_connect_details_submitted
      `)
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      console.error("[getLandlordOnboardingState] User fetch error:", userError);
      return createMinimalState(userId, email);
    }

    // If no user row exists, return minimal state
    if (!userData) {
      return createMinimalState(userId, email);
    }

    // Get draft property ID (prefer onboarding_draft_property_id, fall back to most recent)
    let propertyId = userData.onboarding_draft_property_id;
    let propertyData = null;

    if (propertyId) {
      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .maybeSingle();
      propertyData = data;
    }

    // If no draft property, get the most recent property
    if (!propertyData) {
      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      propertyData = data;
      propertyId = data?.id || null;
    }

    // Fetch rooms and beds for the property
    let hasRoom = false;
    let hasBed = false;
    let hasBedWithRent = false;
    let roomId: string | null = null;
    let roomName: string | null = null;
    let bedId: string | null = null;
    let bedLabel: string | null = null;
    let monthlyRent: number | null = null;
    let depositAmount: number | null = null;
    let availableFrom: string | null = null;
    let minStayDays: number | null = null;
    let maxStayDays: number | null = null;

    if (propertyId) {
      // Fetch first room
      const { data: rooms } = await supabase
        .from("rooms")
        .select("id, name")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: true })
        .limit(1);
      hasRoom = (rooms?.length ?? 0) > 0;
      if (rooms && rooms.length > 0) {
        roomId = rooms[0].id;
        roomName = rooms[0].name;
      }

      // Fetch first bed (for onboarding state)
      const { data: beds } = await supabase
        .from("beds")
        .select("id, label, monthly_rent, deposit_amount, available_from, min_stay_days, max_stay_days")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: true });
      hasBed = (beds?.length ?? 0) > 0;
      hasBedWithRent = beds?.some((bed) => bed.monthly_rent > 0) ?? false;
      if (beds && beds.length > 0) {
        bedId = beds[0].id;
        bedLabel = beds[0].label;
        monthlyRent = beds[0].monthly_rent;
        depositAmount = beds[0].deposit_amount;
        availableFrom = beds[0].available_from;
        minStayDays = beds[0].min_stay_days;
        maxStayDays = beds[0].max_stay_days;
      }
    }

    // Fetch property media
    let photoCount = 0;
    let hasCoverPhoto = false;

    if (propertyId) {
      const { data: media } = await supabase
        .from("property_media")
        .select("id, is_cover")
        .eq("property_id", propertyId)
        .eq("media_type", "property");

      photoCount = media?.length ?? 0;
      hasCoverPhoto = media?.some((m) => m.is_cover) ?? false;
    }

    // Compute Stripe Connect status
    const stripeConnectStatus = computeOnboardingStatus(
      userData.stripe_account_id,
      userData.stripe_connect_charges_enabled ?? false,
      userData.stripe_connect_payouts_enabled ?? false,
      userData.stripe_connect_details_submitted ?? false
    );

    // Build the data object
    const data: OnboardingData = {
      userId,
      email: userData.email || email,
      fullName: userData.full_name,
      displayName: userData.display_name,
      phone: userData.phone,
      landlordType: userData.landlord_type,
      emergencyContactName: userData.emergency_contact_name,
      emergencyContactPhone: userData.emergency_contact_phone,
      avatarUrl: userData.avatar_url,
      identityVerificationStatus: (userData.verification_status as VerificationStatus) || "not_started",
      identityVerifiedAt: userData.identity_verified_at,
      authorityAttestedAt: userData.authority_attested_at,
      stripeConnectStatus,
      stripeAccountId: userData.stripe_account_id,
      chargesEnabled: userData.stripe_connect_charges_enabled ?? false,
      payoutsEnabled: userData.stripe_connect_payouts_enabled ?? false,
      propertyId,
      propertyName: propertyData?.name || null,
      propertyType: propertyData?.property_type || null,
      address: propertyData?.address || null,
      city: propertyData?.city || null,
      state: propertyData?.state || null,
      zip: propertyData?.zip || null,
      description: propertyData?.description || null,
      houseRules: propertyData?.house_rules || null,
      occupancyType: propertyData?.occupancy_type || null,
      defaultMinStayDays: propertyData?.default_min_stay_days ?? 30,
      furnished: propertyData?.furnished ?? false,
      utilitiesIncluded: propertyData?.utilities_included ?? false,
      wifi: propertyData?.wifi ?? false,
      laundry: propertyData?.laundry || null,
      parking: propertyData?.parking || null,
      neighborhood: propertyData?.neighborhood || null,
      hasRoom,
      hasBed,
      hasBedWithRent,
      roomId,
      roomName,
      bedId,
      bedLabel,
      monthlyRent,
      depositAmount,
      availableFrom,
      minStayDays,
      maxStayDays,
      photoCount,
      hasCoverPhoto,
      complianceAckAt: userData.compliance_ack_at,
      onboardingCompletedAt: userData.onboarding_completed_at,
    };

    // Derive step statuses
    const steps = deriveStepStatuses(data);

    // Calculate readiness
    const readiness = calculateReadiness(steps, data);

    // Find first incomplete step
    const firstIncomplete = steps.find((s) => s.status !== "complete");
    const firstIncompleteStepKey = firstIncomplete?.key || "publish";

    // Calculate percent complete
    const completedSteps = steps.filter((s) => s.status === "complete").length;
    const percentComplete = Math.round((completedSteps / steps.length) * 100);

    return {
      steps,
      readiness,
      firstIncompleteStepKey,
      percentComplete,
      draftPropertyId: propertyId,
      isComplete: data.onboardingCompletedAt !== null,
      data,
    };
  } catch (error) {
    console.error("[getLandlordOnboardingState] Error:", error);
    return createMinimalState(userId, email);
  }
}

// ---------------------------------------------------------------------------
// Step Status Derivation
// ---------------------------------------------------------------------------

function deriveStepStatuses(data: OnboardingData): StepState[] {
  return STEPS.map((step) => {
    const { status, blockers } = getStepStatusAndBlockers(step.key, data);
    return { key: step.key, status, blockers };
  });
}

function getStepStatusAndBlockers(
  key: StepKey,
  data: OnboardingData
): { status: StepStatus; blockers: string[] } {
  const blockers: string[] = [];

  switch (key) {
    case "welcome":
      // Welcome is always complete once they've started
      return { status: "complete", blockers: [] };

    case "account": {
      // Required: full_name, phone, landlord_type
      if (!data.fullName) blockers.push("Legal name is required");
      if (!data.phone) blockers.push("Phone number is required");
      if (!data.landlordType) blockers.push("Landlord type is required");

      return {
        status: blockers.length === 0 ? "complete" : "incomplete",
        blockers,
      };
    }

    case "identity": {
      // Required: identity verified + authority attested
      if (data.identityVerificationStatus !== "verified") {
        blockers.push("Identity verification is required");
      }
      if (!data.authorityAttestedAt) {
        blockers.push("Authority attestation is required");
      }

      return {
        status: blockers.length === 0 ? "complete" : "incomplete",
        blockers,
      };
    }

    case "payouts": {
      // Required for payouts only (not publish)
      if (data.stripeConnectStatus !== "payouts_ready") {
        blockers.push("Stripe payout setup is incomplete");
      }

      return {
        status: blockers.length === 0 ? "complete" : "incomplete",
        blockers,
      };
    }

    case "property": {
      // Required: property name, type, address, at least one bed with rent
      if (!data.propertyName) blockers.push("Property name is required");
      if (!data.propertyType) blockers.push("Property type is required");
      if (!data.address) blockers.push("Property address is required");
      if (!data.hasBedWithRent) blockers.push("At least one bed with monthly rent is required");

      return {
        status: blockers.length === 0 ? "complete" : "incomplete",
        blockers,
      };
    }

    case "listing": {
      // Required: cover photo + at least 3 photos
      if (!data.hasCoverPhoto) blockers.push("Cover photo is required");
      if (data.photoCount < 3) blockers.push(`At least 3 photos required (${data.photoCount}/3)`);

      return {
        status: blockers.length === 0 ? "complete" : "incomplete",
        blockers,
      };
    }

    case "publish": {
      // Required: compliance ack
      if (!data.complianceAckAt) blockers.push("Compliance acknowledgement is required");

      // Also check all prerequisite steps
      const prereqSteps: StepKey[] = ["account", "identity", "property", "listing"];
      for (const prereqKey of prereqSteps) {
        const prereq = getStepStatusAndBlockers(prereqKey, data);
        if (prereq.status !== "complete") {
          blockers.push(`${prereqKey} step is incomplete`);
        }
      }

      return {
        status: blockers.length === 0 ? "complete" : "incomplete",
        blockers,
      };
    }

    default:
      return { status: "incomplete", blockers: ["Unknown step"] };
  }
}

// ---------------------------------------------------------------------------
// Readiness Calculation
// ---------------------------------------------------------------------------

function calculateReadiness(steps: StepState[], data: OnboardingData): OnboardingReadiness {
  // Publish readiness: account, identity, property, listing, publish steps complete
  const publishRequiredSteps: StepKey[] = ["account", "identity", "property", "listing", "publish"];
  const publishReady = publishRequiredSteps.every((key) => {
    const step = steps.find((s) => s.key === key);
    return step?.status === "complete";
  });

  // Payout readiness: payouts step complete
  const payoutsStep = steps.find((s) => s.key === "payouts");
  const payoutReady = payoutsStep?.status === "complete";

  // Recommended items remaining
  let recommendedRemaining = 0;
  if (!data.avatarUrl) recommendedRemaining++;
  if (!data.emergencyContactName || !data.emergencyContactPhone) recommendedRemaining++;
  if (!data.description) recommendedRemaining++;
  if (data.photoCount < 5) recommendedRemaining++; // More than minimum

  return {
    publishReady,
    payoutReady,
    recommendedRemaining,
  };
}

// ---------------------------------------------------------------------------
// Minimal State (fallback)
// ---------------------------------------------------------------------------

function createMinimalState(userId: string, email: string): LandlordOnboardingState {
  const data: OnboardingData = {
    userId,
    email,
    fullName: null,
    displayName: null,
    phone: null,
    landlordType: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    avatarUrl: null,
    identityVerificationStatus: "not_started",
    identityVerifiedAt: null,
    authorityAttestedAt: null,
    stripeConnectStatus: "not_connected",
    stripeAccountId: null,
    chargesEnabled: false,
    payoutsEnabled: false,
    propertyId: null,
    propertyName: null,
    propertyType: null,
    address: null,
    city: null,
    state: null,
    zip: null,
    description: null,
    houseRules: null,
    occupancyType: null,
    defaultMinStayDays: 30,
    furnished: false,
    utilitiesIncluded: false,
    wifi: false,
    laundry: null,
    parking: null,
    neighborhood: null,
    hasRoom: false,
    hasBed: false,
    roomId: null,
    roomName: null,
    bedId: null,
    bedLabel: null,
    monthlyRent: null,
    depositAmount: null,
    availableFrom: null,
    minStayDays: null,
    maxStayDays: null,
    hasBedWithRent: false,
    photoCount: 0,
    hasCoverPhoto: false,
    complianceAckAt: null,
    onboardingCompletedAt: null,
  };

  const steps = deriveStepStatuses(data);

  return {
    steps,
    readiness: {
      publishReady: false,
      payoutReady: false,
      recommendedRemaining: 4,
    },
    firstIncompleteStepKey: "welcome",
    percentComplete: 0,
    draftPropertyId: null,
    isComplete: false,
    data,
  };
}
