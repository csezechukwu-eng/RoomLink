import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { getLandlordOnboardingState } from "@/lib/onboarding/state";
import { getMediaForEntity } from "@/lib/actions/media";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import type { StepKey } from "@/lib/onboarding/content";

interface PageProps {
  searchParams: Promise<{ step?: string }>;
}

/**
 * Landlord Onboarding Page
 *
 * Server component that fetches the onboarding state and renders the shell.
 * Active step is determined from ?step= param, defaulting to firstIncompleteStepKey.
 */
export default async function LandlordOnboardingPage({ searchParams }: PageProps) {
  // Require authentication
  await requireCurrentUser();

  // Get onboarding state
  const state = await getLandlordOnboardingState();

  if (!state) {
    redirect("/login");
  }

  // If onboarding is complete, redirect to dashboard
  if (state.isComplete) {
    redirect("/dashboard");
  }

  // Determine active step from search params or default to first incomplete
  const params = await searchParams;
  const stepParam = params.step as StepKey | undefined;
  const activeStep = stepParam && isValidStep(stepParam) ? stepParam : state.firstIncompleteStepKey;

  // Fetch photos for listing step if needed
  let existingPhotos: Awaited<ReturnType<typeof getMediaForEntity>> = [];
  if (activeStep === "listing" && state.data.propertyId) {
    existingPhotos = await getMediaForEntity({
      propertyId: state.data.propertyId,
      mediaType: "property",
    });
  }

  return (
    <OnboardingShell
      state={state}
      activeStep={activeStep}
      existingPhotos={existingPhotos}
    />
  );
}

function isValidStep(step: string): step is StepKey {
  const validSteps: StepKey[] = ["welcome", "account", "identity", "payouts", "property", "listing", "publish"];
  return validSteps.includes(step as StepKey);
}
