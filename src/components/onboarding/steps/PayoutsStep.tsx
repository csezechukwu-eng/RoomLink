"use client";

import * as React from "react";
import { useState, useEffect, useTransition } from "react";
import {
  CreditCard,
  DollarSign,
  Check,
  AlertCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StepHintSlot } from "../StepHintSlot";
import { getStep } from "@/lib/onboarding/content";
import {
  getStripeConnectStatusAction,
  createStripeOnboardingLinkAction,
  refreshStripeConnectStatusAction,
  createStripeDashboardLinkAction,
  type ConnectStatusData,
} from "@/lib/actions/stripeConnect";
import type { LandlordOnboardingState } from "@/lib/onboarding/state";
import type { StripeConnectOnboardingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PayoutsStepProps {
  state: LandlordOnboardingState;
  onContinue: () => void;
}

/**
 * PayoutsStep
 *
 * Step 3 of onboarding - Required to get paid.
 * - Stripe Connect status and onboarding
 * - 5% host fee explainer
 */
export function PayoutsStep({ state, onContinue }: PayoutsStepProps) {
  const step = getStep("payouts");
  const { data } = state;

  const [isPending, startTransition] = useTransition();
  const [connectStatus, setConnectStatus] = useState<ConnectStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial status
  useEffect(() => {
    async function loadStatus() {
      try {
        const result = await getStripeConnectStatusAction();
        if (result.status === "success" && result.data) {
          setConnectStatus(result.data);
        } else {
          // Default to not_connected so button still shows
          setConnectStatus({
            onboardingStatus: data.stripeConnectStatus || "not_connected",
            accountId: data.stripeAccountId,
            chargesEnabled: data.chargesEnabled,
            payoutsEnabled: data.payoutsEnabled,
            detailsSubmitted: false,
            requirementsDue: [],
          });
        }
      } catch {
        setConnectStatus({
          onboardingStatus: "not_connected",
          accountId: null,
          chargesEnabled: false,
          payoutsEnabled: false,
          detailsSubmitted: false,
          requirementsDue: [],
        });
      }
      setIsLoading(false);
    }
    loadStatus();
  }, [data]);

  const handleConnectStripe = () => {
    setError(null);
    startTransition(async () => {
      const result = await createStripeOnboardingLinkAction();

      if (result.status === "error") {
        setError(result.message || "Unable to start onboarding. Please try again.");
        return;
      }

      if (result.data?.url) {
        window.location.href = result.data.url;
      } else {
        setError("Unable to get onboarding link. Please try again.");
      }
    });
  };

  const handleRefreshStatus = () => {
    setError(null);
    startTransition(async () => {
      const result = await refreshStripeConnectStatusAction();

      if (result.status === "success" && result.data) {
        setConnectStatus(result.data);
      } else {
        setError(result.message || "Unable to refresh status. Please try again.");
      }
    });
  };

  const handleViewDashboard = () => {
    startTransition(async () => {
      const result = await createStripeDashboardLinkAction();

      if (result.status === "success" && result.data?.url) {
        window.open(result.data.url, "_blank");
      } else {
        setError(result.message || "Unable to open dashboard. Please try again.");
      }
    });
  };

  // Check if payouts are ready
  const isPayoutsReady = connectStatus?.onboardingStatus === "payouts_ready";

  // Auto-continue when payouts are ready
  useEffect(() => {
    if (isPayoutsReady && !isPending) {
      const timer = setTimeout(onContinue, 500);
      return () => clearTimeout(timer);
    }
  }, [isPayoutsReady, isPending, onContinue]);

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

      {/* Host Fee Explainer */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6">
        <h3 className="font-semibold text-slate-900">How renta bed Pricing Works</h3>
        <p className="mt-1 text-sm text-slate-500">
          renta bed is free to use. You only pay when tenants pay through the platform.
        </p>

        <div className="mt-4 space-y-3">
          {/* Host Fee */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900">5% Host Fee</p>
                <p className="text-sm text-emerald-700">Deducted from each monthly rent payment</p>
              </div>
            </div>
          </div>

          {/* What You Keep */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                <CreditCard className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">You Keep 95%</p>
                <p className="text-sm text-slate-500">Receive 95% of rent directly to your bank</p>
              </div>
            </div>
          </div>

          {/* Example */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-600 mb-2">Example</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Monthly Rent</span>
                <span className="font-medium">$1,000</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Host Fee (5%)</span>
                <span>-$50</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-emerald-600">
                <span>Your Payout</span>
                <span>$950</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stripe Connect Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900">Set Up Payouts</h3>
            <p className="text-sm text-slate-500">Connect your bank account to receive rent payments.</p>
          </div>
          {connectStatus && connectStatus.onboardingStatus !== "not_connected" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshStatus}
              disabled={isPending}
            >
              <RefreshCw className={cn("h-4 w-4 mr-1.5", isPending && "animate-spin")} />
              Refresh
            </Button>
          )}
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div>
            {/* Status Badge */}
            {connectStatus && (
              <div className="mb-4">
                <StatusBadge status={connectStatus.onboardingStatus} />
              </div>
            )}

            {/* Not connected */}
            {connectStatus?.onboardingStatus === "not_connected" && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
                <CreditCard className="mx-auto h-10 w-10 text-slate-400" />
                <p className="mt-3 font-medium text-slate-900">Connect Stripe to Receive Payouts</p>
                <p className="mt-1 text-sm text-slate-500">
                  Set up your bank account to receive automatic payouts when tenants pay rent.
                </p>
                <Button onClick={handleConnectStripe} disabled={isPending} className="mt-4">
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Connect Stripe
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Onboarding incomplete */}
            {connectStatus?.onboardingStatus === "onboarding_incomplete" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
                <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
                <p className="mt-3 font-medium text-slate-900">Complete Your Stripe Setup</p>
                <p className="mt-1 text-sm text-slate-500">
                  You started connecting Stripe but haven&apos;t finished. Complete your setup to receive payouts.
                </p>
                <Button onClick={handleConnectStripe} disabled={isPending} className="mt-4 bg-amber-600 hover:bg-amber-700">
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Continue Setup
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Pending verification */}
            {connectStatus?.onboardingStatus === "pending_verification" && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
                <Clock className="mx-auto h-10 w-10 text-blue-500" />
                <p className="mt-3 font-medium text-slate-900">Verification in Progress</p>
                <p className="mt-1 text-sm text-slate-500">
                  Stripe is verifying your account. This usually takes 1-2 business days.
                </p>
                {connectStatus.requirementsDue.length > 0 && (
                  <div className="mt-4 text-left">
                    <p className="text-sm font-medium text-slate-700">Pending items:</p>
                    <ul className="mt-1 list-inside list-disc text-sm text-slate-600">
                      {connectStatus.requirementsDue.slice(0, 3).map((req) => (
                        <li key={req}>{req.replace(/_/g, " ")}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <Button variant="outline" onClick={handleConnectStripe} disabled={isPending} className="mt-4">
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Update Information
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Payouts ready */}
            {connectStatus?.onboardingStatus === "payouts_ready" && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
                <CheckCircle className="mx-auto h-10 w-10 text-emerald-500" />
                <p className="mt-3 font-medium text-slate-900">Payouts Ready</p>
                <p className="mt-1 text-sm text-slate-500">
                  Your Stripe account is set up. When tenants pay rent, you&apos;ll receive 95% automatically.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Button variant="outline" onClick={handleViewDashboard} disabled={isPending}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Stripe Dashboard
                  </Button>
                  <Button onClick={onContinue}>
                    Continue
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Skip for now section */}
      {!isPayoutsReady && (
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="flex items-start gap-3 text-sm text-slate-600">
            <AlertCircle className="h-5 w-5 shrink-0 text-slate-400 mt-0.5" />
            <div>
              <p className="font-medium text-slate-700">You can skip this step for now</p>
              <p>Stripe Connect is required to receive rent payments, but you can publish your listing first and set up payouts later.</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={onContinue}>
              Skip for now
            </Button>
          </div>
        </div>
      )}

      {/* Hint Slot */}
      <StepHintSlot hint={step?.hint || ""} />
    </div>
  );
}

function StatusBadge({ status }: { status: StripeConnectOnboardingStatus }) {
  switch (status) {
    case "not_connected":
      return (
        <Badge className="bg-slate-100 text-slate-600">
          Not Connected
        </Badge>
      );
    case "onboarding_incomplete":
      return (
        <Badge className="bg-amber-50 text-amber-700">
          <AlertCircle className="h-3 w-3 mr-1" />
          Incomplete
        </Badge>
      );
    case "pending_verification":
      return (
        <Badge className="bg-blue-50 text-blue-700">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "payouts_ready":
      return (
        <Badge className="bg-emerald-50 text-emerald-700">
          <Check className="h-3 w-3 mr-1" />
          Ready
        </Badge>
      );
  }
}
