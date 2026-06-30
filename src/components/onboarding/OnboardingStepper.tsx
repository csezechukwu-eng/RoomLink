"use client";

import { Check } from "lucide-react";
import { STEPS, getStepIndex, type StepKey } from "@/lib/onboarding/content";
import type { StepState } from "@/lib/onboarding/state";
import { cn } from "@/lib/utils";

interface OnboardingStepperProps {
  steps: StepState[];
  activeStep: StepKey;
  onStepClick: (step: StepKey) => void;
}

/**
 * OnboardingStepper
 *
 * Vertical list of steps with complete/current/upcoming states.
 * Uses indigo circle + checkmark style matching MultiStepApplyForm.
 */
export function OnboardingStepper({ steps, activeStep, onStepClick }: OnboardingStepperProps) {
  const activeStepIndex = getStepIndex(activeStep);

  return (
    <nav aria-label="Onboarding steps">
      <ol className="space-y-2">
        {STEPS.map((step, index) => {
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
                      isCurrent || isComplete ? "text-slate-900" : "text-slate-500"
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {step.timeEstimate}
                  </p>
                </div>

                {/* Requirement Badge */}
                <RequirementBadge requirement={step.requirement} isComplete={isComplete} />
              </button>

              {/* Connector Line */}
              {index < STEPS.length - 1 && (
                <div className="ml-[22px] h-2 w-0.5 bg-slate-200" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function RequirementBadge({
  requirement,
  isComplete,
}: {
  requirement: "publish" | "payout" | "recommended";
  isComplete: boolean;
}) {
  if (isComplete) return null;

  const colors = {
    publish: "bg-red-50 text-red-700",
    payout: "bg-amber-50 text-amber-700",
    recommended: "bg-slate-50 text-slate-600",
  };

  const labels = {
    publish: "Required",
    payout: "For payouts",
    recommended: "Optional",
  };

  return (
    <span
      className={cn(
        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
        colors[requirement]
      )}
    >
      {labels[requirement]}
    </span>
  );
}
