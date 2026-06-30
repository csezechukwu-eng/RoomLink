"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { OnboardingStepper } from "./OnboardingStepper";
import { ReadinessPanel } from "./ReadinessPanel";
import { WelcomeScreen } from "./WelcomeScreen";
import { AccountStep } from "./steps/AccountStep";
import { IdentityStep } from "./steps/IdentityStep";
import { PayoutsStep } from "./steps/PayoutsStep";
import { PropertyStep } from "./steps/PropertyStep";
import { ListingStep } from "./steps/ListingStep";
import { PublishStep } from "./steps/PublishStep";
import { Button } from "@/components/ui/button";
import { STEPS, getStepIndex, getNextStep, getPreviousStep, type StepKey } from "@/lib/onboarding/content";
import type { LandlordOnboardingState } from "@/lib/onboarding/state";
import type { PropertyMedia } from "@/lib/types";

interface OnboardingShellProps {
  state: LandlordOnboardingState;
  activeStep: StepKey;
  existingPhotos?: PropertyMedia[];
}

/**
 * OnboardingShell
 *
 * Main container for the onboarding flow. Manages layout:
 * - Left sidebar: Stepper + ReadinessPanel (desktop)
 * - Center: Active step content
 * - Footer: Back / Save & Continue buttons
 * - Bottom: Progress bar
 */
export function OnboardingShell({ state, activeStep, existingPhotos = [] }: OnboardingShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigateToStep = useCallback((step: StepKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", step);
    router.push(`/onboarding/landlord?${params.toString()}`);
  }, [router, searchParams]);

  const handleBack = useCallback(() => {
    const prevStep = getPreviousStep(activeStep);
    if (prevStep) {
      navigateToStep(prevStep.key);
    }
  }, [activeStep, navigateToStep]);

  const handleContinue = useCallback(() => {
    const nextStep = getNextStep(activeStep);
    if (nextStep) {
      navigateToStep(nextStep.key);
    }
  }, [activeStep, navigateToStep]);

  const handleSaveAndExit = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const currentStepIndex = getStepIndex(activeStep);
  const isFirstStep = currentStepIndex === 0;

  // Render the active step content
  const renderStepContent = () => {
    switch (activeStep) {
      case "welcome":
        return <WelcomeScreen onGetStarted={() => navigateToStep("account")} />;
      case "account":
        return <AccountStep state={state} onContinue={handleContinue} />;
      case "identity":
        return <IdentityStep state={state} onContinue={handleContinue} />;
      case "payouts":
        return <PayoutsStep state={state} onContinue={handleContinue} />;
      case "property":
        return <PropertyStep state={state} onContinue={handleContinue} />;
      case "listing":
        return <ListingStep state={state} existingPhotos={existingPhotos} onContinue={handleContinue} />;
      case "publish":
        return <PublishStep state={state} />;
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Sidebar - Desktop */}
      <aside className="hidden lg:block lg:w-72 shrink-0">
        <div className="sticky top-24 space-y-6">
          <OnboardingStepper
            steps={state.steps}
            activeStep={activeStep}
            onStepClick={navigateToStep}
          />
          <ReadinessPanel readiness={state.readiness} steps={state.steps} />
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-500">
            Step {currentStepIndex + 1} of {STEPS.length}
          </span>
          <span className="text-sm font-medium text-slate-900">
            {state.percentComplete}% complete
          </span>
        </div>
        {/* Mobile progress bar */}
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${state.percentComplete}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          {/* Step Content */}
          <div className="p-6 sm:p-8">
            {renderStepContent()}
          </div>

          {/* Footer Navigation - only show for non-welcome steps */}
          {activeStep !== "welcome" && (
            <div className="border-t border-slate-200 px-6 py-4 sm:px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {!isFirstStep && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSaveAndExit}
                    className="text-slate-600"
                  >
                    Finish later
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Progress Bar - Desktop */}
        <div className="hidden lg:block mt-6">
          <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
            <span>Progress</span>
            <span>{state.percentComplete}% complete</span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${state.percentComplete}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
