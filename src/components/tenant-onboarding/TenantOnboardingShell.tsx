"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { TenantOnboardingStepper } from "./TenantOnboardingStepper";
import { WhatYouUnlockPanel } from "./WhatYouUnlockPanel";
import { TenantWelcomeStep } from "./steps/TenantWelcomeStep";
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { TenantVerificationStep } from "./steps/TenantVerificationStep";
import { PaymentMethodStep } from "./steps/PaymentMethodStep";
import { MessagingRulesStep } from "./steps/MessagingRulesStep";
import { ReviewFinishStep } from "./steps/ReviewFinishStep";
import { Button } from "@/components/ui/button";
import {
  TENANT_STEPS,
  getTenantStepIndex,
  getNextTenantStep,
  getPreviousTenantStep,
  type TenantStepKey,
} from "@/lib/onboarding/tenant-content";
import type { TenantOnboardingState } from "@/lib/onboarding/tenant-state";

interface TenantOnboardingShellProps {
  state: TenantOnboardingState;
  activeStep: TenantStepKey;
}

/**
 * TenantOnboardingShell
 *
 * Main container for the tenant onboarding flow.
 */
export function TenantOnboardingShell({ state, activeStep }: TenantOnboardingShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigateToStep = useCallback(
    (step: TenantStepKey) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", step);
      router.push(`/onboarding/tenant?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleBack = useCallback(() => {
    const prevStep = getPreviousTenantStep(activeStep);
    if (prevStep) {
      navigateToStep(prevStep.key);
    }
  }, [activeStep, navigateToStep]);

  const handleContinue = useCallback(() => {
    const nextStep = getNextTenantStep(activeStep);
    if (nextStep) {
      navigateToStep(nextStep.key);
    }
  }, [activeStep, navigateToStep]);

  const handleSaveAndExit = useCallback(() => {
    router.push("/availability");
  }, [router]);

  const currentStepIndex = getTenantStepIndex(activeStep);
  const isFirstStep = currentStepIndex === 0;
  const isWelcomeStep = activeStep === "welcome";

  // Render the active step content
  const renderStepContent = () => {
    switch (activeStep) {
      case "welcome":
        return <TenantWelcomeStep onGetStarted={() => navigateToStep("basic-info")} />;
      case "basic-info":
        return <BasicInfoStep state={state} onContinue={handleContinue} />;
      case "verification":
        return <TenantVerificationStep state={state} onContinue={handleContinue} />;
      case "payment-method":
        return <PaymentMethodStep state={state} onContinue={handleContinue} />;
      case "messaging-rules":
        return <MessagingRulesStep state={state} onContinue={handleContinue} />;
      case "review":
        return <ReviewFinishStep state={state} />;
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Sidebar - Desktop */}
      <aside className="hidden lg:block lg:w-64 shrink-0">
        <div className="sticky top-24">
          <TenantOnboardingStepper
            steps={state.steps}
            activeStep={activeStep}
            onStepClick={navigateToStep}
          />
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-500">
            Step {currentStepIndex + 1} of {TENANT_STEPS.length}
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
          <div className="p-6 sm:p-8">{renderStepContent()}</div>

          {/* Footer Navigation - only show for non-welcome and non-review steps */}
          {!isWelcomeStep && activeStep !== "review" && (
            <div className="border-t border-slate-200 px-6 py-4 sm:px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {!isFirstStep && (
                    <Button type="button" variant="outline" onClick={handleBack}>
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

      {/* Right Sidebar - What you'll unlock */}
      <aside className="hidden xl:block xl:w-72 shrink-0">
        <div className="sticky top-24">
          <WhatYouUnlockPanel />
        </div>
      </aside>
    </div>
  );
}
