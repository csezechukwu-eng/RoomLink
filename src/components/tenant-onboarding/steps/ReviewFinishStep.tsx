"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Loader2,
  User,
  Home,
  Shield,
  CreditCard,
  MessageSquare,
  Search,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeTenantOnboarding } from "@/lib/actions/tenant-onboarding";
import type { TenantOnboardingState } from "@/lib/onboarding/tenant-state";

interface ReviewFinishStepProps {
  state: TenantOnboardingState;
}

/**
 * ReviewFinishStep
 *
 * Final step - review completion status and finish onboarding.
 */
export function ReviewFinishStep({ state }: ReviewFinishStepProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const steps = [
    {
      key: "basic-info",
      icon: User,
      title: "Basic Info",
      complete: state.steps.find((s) => s.key === "basic-info")?.status === "complete",
    },
    {
      key: "housing-preferences",
      icon: Home,
      title: "Housing Preferences",
      complete: state.steps.find((s) => s.key === "housing-preferences")?.status === "complete",
    },
    {
      key: "verification",
      icon: Shield,
      title: "ID Verification",
      complete: state.steps.find((s) => s.key === "verification")?.status === "complete",
      optional: true,
    },
    {
      key: "payment-method",
      icon: CreditCard,
      title: "Payment Method",
      complete: state.steps.find((s) => s.key === "payment-method")?.status === "complete",
      optional: true,
    },
    {
      key: "messaging-rules",
      icon: MessageSquare,
      title: "Messaging & House Rules",
      complete: state.steps.find((s) => s.key === "messaging-rules")?.status === "complete",
    },
  ];

  const requiredComplete = steps
    .filter((s) => !s.optional)
    .every((s) => s.complete);

  const handleFinish = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await completeTenantOnboarding();
      if (result.error) {
        setError(result.error);
      } else {
        // Redirect to availability page to start browsing
        router.push("/availability");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 mb-4">
          <CheckCircle className="h-8 w-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Review & finish</h1>
        <p className="text-slate-600">
          You&apos;re almost ready to start browsing beds!
        </p>
      </div>

      {/* Completion Summary */}
      <div className="rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Your profile completion</h2>

        <div className="space-y-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.key}
                className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    step.complete
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {step.complete ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{step.title}</p>
                  {step.optional && !step.complete && (
                    <p className="text-xs text-slate-500">Optional - can complete later</p>
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    step.complete ? "text-emerald-600" : "text-slate-400"
                  }`}
                >
                  {step.complete ? "Complete" : step.optional ? "Skipped" : "Incomplete"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* What's next */}
      <div className="rounded-xl bg-indigo-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">What&apos;s next?</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Search className="h-5 w-5 text-indigo-600 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900">Browse available beds</p>
              <p className="text-sm text-slate-600">
                Search for beds that match your preferences and budget.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ArrowRight className="h-5 w-5 text-indigo-600 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900">Apply instantly</p>
              <p className="text-sm text-slate-600">
                Submit applications to properties you&apos;re interested in.
              </p>
            </div>
          </div>
        </div>
      </div>

      {!requiredComplete && (
        <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-900">Some required steps are incomplete</p>
            <p className="text-amber-700 mt-1">
              Please complete all required steps before finishing your profile.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* CTA */}
      <div className="flex flex-col items-center gap-4 pt-4">
        <Button
          onClick={handleFinish}
          disabled={isSubmitting || !requiredComplete}
          size="md"
          className="px-8"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Finishing...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Start Browsing Beds
            </>
          )}
        </Button>
        <p className="text-sm text-slate-500">
          You can always update your profile later from settings.
        </p>
      </div>
    </div>
  );
}
