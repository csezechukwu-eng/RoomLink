"use client";

import * as React from "react";
import { Shield, CheckCircle, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TenantOnboardingState } from "@/lib/onboarding/tenant-state";

interface TenantVerificationStepProps {
  state: TenantOnboardingState;
  onContinue: () => void;
}

/**
 * TenantVerificationStep
 *
 * Identity verification step for tenants.
 */
export function TenantVerificationStep({ state, onContinue }: TenantVerificationStepProps) {
  const [isStarting, setIsStarting] = React.useState(false);
  const isVerified = state.data.identityVerified;

  const handleStartVerification = async () => {
    setIsStarting(true);
    // In a real implementation, this would start the Stripe Identity flow
    // For now, we'll simulate it
    setTimeout(() => {
      setIsStarting(false);
      // Would redirect to Stripe Identity
    }, 1000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-6 w-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">Verify your identity</h1>
        </div>
        <p className="text-slate-600">
          A quick verification helps landlords trust you and speeds up your applications.
        </p>
      </div>

      {/* Verification Status */}
      <div className="rounded-xl border border-slate-200 p-6">
        {isVerified ? (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Identity Verified</h2>
            <p className="text-slate-600 mb-6">
              Your identity has been verified. You&apos;re all set!
            </p>
            <Button onClick={onContinue}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 mb-4">
                <Shield className="h-8 w-8 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Quick ID Check</h2>
              <p className="text-slate-600 max-w-md mx-auto">
                We use Stripe Identity for secure verification. You&apos;ll need a government-issued ID and may need to take a selfie.
              </p>
            </div>

            {/* What you'll need */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-3">What you&apos;ll need:</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Government-issued ID (driver&apos;s license, passport, etc.)
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Good lighting for photos
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  About 2 minutes of your time
                </li>
              </ul>
            </div>

            <div className="flex flex-col items-center gap-4">
              <Button
                onClick={handleStartVerification}
                disabled={isStarting}
                size="md"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Start Verification
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={onContinue}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Privacy Note */}
      <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-4">
        <AlertCircle className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-900">Your privacy is protected</p>
          <p className="text-blue-700 mt-1">
            Your ID information is securely processed by Stripe and never stored on our servers.
            We only receive a verification result.
          </p>
        </div>
      </div>
    </div>
  );
}
