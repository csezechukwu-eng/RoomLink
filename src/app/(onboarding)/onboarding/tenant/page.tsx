import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { getTenantOnboardingState } from "@/lib/onboarding/tenant-state";
import { TenantOnboardingShell } from "@/components/tenant-onboarding";
import type { TenantStepKey } from "@/lib/onboarding/tenant-content";

interface PageProps {
  searchParams: Promise<{ step?: string }>;
}

const VALID_STEPS: TenantStepKey[] = [
  "welcome",
  "basic-info",
  "verification",
  "payment-method",
  "messaging-rules",
  "review",
];

function isValidStep(step: string): step is TenantStepKey {
  return VALID_STEPS.includes(step as TenantStepKey);
}

/**
 * Tenant Onboarding Page
 *
 * Server component that fetches the onboarding state and renders the shell.
 * Active step is determined from ?step= param, defaulting to firstIncompleteStepKey.
 */
export default async function TenantOnboardingPage({ searchParams }: PageProps) {
  // Require authentication
  await requireCurrentUser();

  // Get onboarding state
  const state = await getTenantOnboardingState();

  if (!state) {
    redirect("/signin");
  }

  // If onboarding is complete, redirect to availability
  if (state.isComplete) {
    redirect("/availability");
  }

  // Determine active step from search params or default to first incomplete
  const params = await searchParams;
  const stepParam = params.step;
  const activeStep =
    stepParam && isValidStep(stepParam) ? stepParam : state.firstIncompleteStepKey;

  return <TenantOnboardingShell state={state} activeStep={activeStep} />;
}
