"use client";

import * as React from "react";
import { useState, useEffect, useTransition } from "react";
import { Shield, Check, AlertCircle, Clock, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StepHintSlot } from "../StepHintSlot";
import { getStep } from "@/lib/onboarding/content";
import {
  createIdentityVerificationAction,
  refreshIdentityStatusAction,
  saveAuthorityAttestationAction,
} from "@/lib/actions/identity";
import type { LandlordOnboardingState } from "@/lib/onboarding/state";
import type { VerificationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface IdentityStepProps {
  state: LandlordOnboardingState;
  onContinue: () => void;
}

/**
 * IdentityStep
 *
 * Step 2 of onboarding - Required to publish.
 * - Stripe Identity verification
 * - Authority attestation checkbox
 */
export function IdentityStep({ state, onContinue }: IdentityStepProps) {
  const step = getStep("identity");
  const { data } = state;

  const [isPending, startTransition] = useTransition();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(
    data.identityVerificationStatus
  );
  const [isAttested, setIsAttested] = useState(!!data.authorityAttestedAt);
  const [error, setError] = useState<string | null>(null);

  // Refresh status on mount in case we're returning from Stripe verification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldRefresh =
      params.get("demo_verified") === "true" ||
      params.get("refresh_status") === "true" ||
      verificationStatus === "pending";

    if (shouldRefresh) {
      console.log("[IdentityStep] Refreshing verification status...");
      startTransition(async () => {
        const result = await refreshIdentityStatusAction();
        console.log("[IdentityStep] Refresh result:", result);
        if (result.status === "success" && result.data) {
          console.log("[IdentityStep] Setting status to:", result.data.status);
          setVerificationStatus(result.data.status);

          // Clean up URL params after refresh
          if (params.get("refresh_status") === "true") {
            const url = new URL(window.location.href);
            url.searchParams.delete("refresh_status");
            url.searchParams.delete("t");
            window.history.replaceState({}, "", url.toString());
          }
        }
      });
    }
  }, []); // Only run once on mount

  const handleStartVerification = () => {
    setError(null);
    startTransition(async () => {
      const result = await createIdentityVerificationAction();

      if (result.status === "error") {
        setError(result.message || "Failed to start verification");
        return;
      }

      if (result.data?.alreadyVerified) {
        setVerificationStatus("verified");
        return;
      }

      if (result.data?.url) {
        // Redirect to Stripe's hosted verification
        window.location.href = result.data.url;
      }
    });
  };

  const handleRefreshStatus = () => {
    setError(null);
    startTransition(async () => {
      const result = await refreshIdentityStatusAction();
      if (result.status === "success" && result.data) {
        setVerificationStatus(result.data.status);
      } else if (result.status === "error") {
        setError(result.message || "Failed to refresh status");
      }
    });
  };

  const handleAttestationChange = (checked: boolean) => {
    if (!checked) return; // Can't uncheck

    startTransition(async () => {
      const result = await saveAuthorityAttestationAction();
      if (result.status === "success") {
        setIsAttested(true);
      } else {
        setError(result.message || "Failed to save attestation");
      }
    });
  };

  // Check if both requirements are met
  const canContinue = verificationStatus === "verified" && isAttested;

  // Auto-continue when both requirements are met
  useEffect(() => {
    if (canContinue && !isPending) {
      const timer = setTimeout(onContinue, 500);
      return () => clearTimeout(timer);
    }
  }, [canContinue, isPending, onContinue]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{step?.title}</h2>
        <p className="text-slate-500 mt-1">{step?.subtitle}</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Identity Verification Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
              verificationStatus === "verified"
                ? "bg-emerald-100"
                : verificationStatus === "pending"
                ? "bg-amber-100"
                : "bg-slate-100"
            )}>
              <Shield className={cn(
                "h-6 w-6",
                verificationStatus === "verified"
                  ? "text-emerald-600"
                  : verificationStatus === "pending"
                  ? "text-amber-600"
                  : "text-slate-400"
              )} />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Verify your identity</h3>
              <p className="text-sm text-slate-500 mt-1">
                We use Stripe to verify your identity securely. This helps protect both you and your tenants.
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <VerificationBadge status={verificationStatus} />
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center gap-3">
          {verificationStatus === "verified" ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <Check className="h-4 w-4" />
              <span>Identity verified</span>
            </div>
          ) : verificationStatus === "pending" ? (
            <>
              <Button
                variant="outline"
                onClick={handleRefreshStatus}
                disabled={isPending}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isPending && "animate-spin")} />
                Check status
              </Button>
              <Button onClick={handleStartVerification} disabled={isPending}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Continue verification
              </Button>
            </>
          ) : (
            <Button onClick={handleStartVerification} disabled={isPending}>
              {isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Verify identity
                </>
              )}
            </Button>
          )}
        </div>
      </Card>

      {/* Authority Attestation */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="pt-0.5">
            <input
              type="checkbox"
              id="authority_attestation"
              checked={isAttested}
              onChange={(e) => handleAttestationChange(e.target.checked)}
              disabled={isPending || isAttested}
              className={cn(
                "h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600",
                isAttested && "cursor-not-allowed"
              )}
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="authority_attestation"
              className={cn(
                "block font-medium",
                isAttested ? "text-slate-500" : "text-slate-900 cursor-pointer"
              )}
            >
              I confirm that I own or am legally authorized to manage this property
            </label>
            <p className="text-sm text-slate-500 mt-1">
              By checking this box, you attest that you have the legal authority to list this property
              and will comply with all applicable laws and regulations.
            </p>
            {isAttested && (
              <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
                <Check className="h-4 w-4" />
                {data.authorityAttestedAt ? (
                  <>Attested on {new Date(data.authorityAttestedAt).toLocaleDateString()}</>
                ) : (
                  <>Attestation confirmed</>
                )}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Continue Button */}
      {canContinue && (
        <div className="flex justify-end">
          <Button onClick={onContinue} disabled={isPending}>
            Continue
          </Button>
        </div>
      )}

      {/* Hint Slot */}
      <StepHintSlot hint={step?.hint || ""} />
    </div>
  );
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  switch (status) {
    case "verified":
      return (
        <Badge className="bg-emerald-50 text-emerald-700">
          <Check className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-50 text-amber-700">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    default:
      return (
        <Badge className="bg-slate-100 text-slate-600">
          Not started
        </Badge>
      );
  }
}
