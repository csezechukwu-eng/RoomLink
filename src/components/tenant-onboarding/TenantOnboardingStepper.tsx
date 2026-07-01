"use client";

import { Check, HelpCircle, ArrowRight } from "lucide-react";
import { TENANT_STEPS, getTenantStepIndex, type TenantStepKey } from "@/lib/onboarding/tenant-content";
import type { TenantStepState } from "@/lib/onboarding/tenant-state";
import { cn } from "@/lib/utils";

interface TenantOnboardingStepperProps {
  steps: TenantStepState[];
  activeStep: TenantStepKey;
  onStepClick: (step: TenantStepKey) => void;
}

/**
 * TenantOnboardingStepper
 *
 * Vertical list of steps for tenant onboarding with complete/current/upcoming states.
 */
export function TenantOnboardingStepper({ steps, activeStep, onStepClick }: TenantOnboardingStepperProps) {
  const activeStepIndex = getTenantStepIndex(activeStep);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">Tenant Onboarding</h2>

      <nav aria-label="Onboarding steps">
        <ol className="space-y-1">
          {TENANT_STEPS.map((step, index) => {
            const stepState = steps.find((s) => s.key === step.key);
            const isComplete = stepState?.status === "complete";
            const isCurrent = step.key === activeStep;
            const isPast = index < activeStepIndex;
            const canClick = isPast || isCurrent || isComplete;

            return (
              <li key={step.key}>
                <button
                  type="button"
                  onClick={() => canClick && onStepClick(step.key)}
                  disabled={!canClick}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    isCurrent && "bg-indigo-50",
                    canClick && !isCurrent && "hover:bg-slate-50",
                    !canClick && "cursor-not-allowed opacity-50"
                  )}
                >
                  {/* Step Circle */}
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                      isComplete
                        ? "bg-indigo-600 text-white"
                        : isCurrent
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-400"
                    )}
                  >
                    {isComplete ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        isCurrent ? "text-indigo-600" : isComplete ? "text-slate-900" : "text-slate-500"
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {step.subtitle}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Questions Section */}
      <div className="rounded-lg bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100">
            <HelpCircle className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Questions?</p>
            <p className="text-sm text-slate-500">Our team is here to help.</p>
            <button className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Contact Support
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
