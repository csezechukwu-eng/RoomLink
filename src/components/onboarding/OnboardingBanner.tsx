"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { X, ArrowRight, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LandlordOnboardingState } from "@/lib/onboarding/state";

interface OnboardingBannerProps {
  state: LandlordOnboardingState;
}

/**
 * OnboardingBanner
 *
 * Dismissible banner shown on the dashboard for users with incomplete onboarding.
 * Shows progress and a call-to-action to continue.
 */
export function OnboardingBanner({ state }: OnboardingBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if onboarding is complete or dismissed
  if (state.isComplete || isDismissed) {
    return null;
  }

  const { percentComplete, firstIncompleteStepKey } = state;

  return (
    <div className="relative rounded-lg border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white p-4 sm:p-6">
      {/* Dismiss Button */}
      <button
        type="button"
        onClick={() => setIsDismissed(true)}
        className="absolute right-3 top-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100">
            <Rocket className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              Complete your landlord setup
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Finish setting up your account to start receiving applications and payments.
            </p>
            {/* Progress bar */}
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 w-32 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
              <span className="text-xs font-medium text-indigo-600">
                {percentComplete}% complete
              </span>
            </div>
          </div>
        </div>

        <Link href={`/onboarding/landlord?step=${firstIncompleteStepKey}`}>
          <Button className="shrink-0">
            Continue Setup
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
