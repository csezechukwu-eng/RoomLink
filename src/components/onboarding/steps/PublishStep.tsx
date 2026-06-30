"use client";

import * as React from "react";
import { useState, useActionState, useTransition } from "react";
import Link from "next/link";
import {
  Check,
  AlertCircle,
  FileText,
  Shield,
  Rocket,
  PartyPopper,
  ExternalLink,
  Share2,
  Copy,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StepHintSlot } from "../StepHintSlot";
import { getStep, type StepKey } from "@/lib/onboarding/content";
import {
  saveHouseRulesAction,
  saveComplianceAckAction,
  publishListingAction,
} from "@/lib/actions/onboarding";
import { initialActionState } from "@/lib/actions/types";
import { FormAlert } from "@/components/forms/FormAlert";
import { SubmitButton } from "@/components/forms/SubmitButton";
import type { LandlordOnboardingState } from "@/lib/onboarding/state";
import { cn } from "@/lib/utils";

interface PublishStepProps {
  state: LandlordOnboardingState;
}

/**
 * PublishStep
 *
 * Final step of onboarding.
 * - Publish requirements checklist
 * - House rules textarea
 * - Compliance acknowledgment
 * - Publish button
 * - Success celebration + share panel
 */
export function PublishStep({ state }: PublishStepProps) {
  const step = getStep("publish");
  const { data, readiness, steps } = state;

  // House rules form state
  const [rulesState, rulesAction] = useActionState(
    saveHouseRulesAction,
    initialActionState
  );

  // Publishing state
  const [isPending, startTransition] = useTransition();
  const [isPublished, setIsPublished] = useState(state.isComplete);
  const [publishedPropertyId, setPublishedPropertyId] = useState<string | null>(
    state.isComplete ? data.propertyId : null
  );
  const [publishError, setPublishError] = useState<string | null>(null);

  // Local state
  const [houseRules, setHouseRules] = useState(data.houseRules || "");
  const [hasAcknowledged, setHasAcknowledged] = useState(!!data.complianceAckAt);
  const [copied, setCopied] = useState(false);

  // Handle compliance acknowledgment
  const handleAcknowledge = () => {
    if (hasAcknowledged) return;

    startTransition(async () => {
      const result = await saveComplianceAckAction();
      if (result.status === "success") {
        setHasAcknowledged(true);
      }
    });
  };

  // Handle publish
  const handlePublish = () => {
    setPublishError(null);

    startTransition(async () => {
      const result = await publishListingAction();

      if (result.status === "error") {
        setPublishError(result.message || "Failed to publish. Please try again.");
        return;
      }

      if (result.data?.propertyId) {
        setPublishedPropertyId(result.data.propertyId);
      }
      setIsPublished(true);
    });
  };

  // Copy listing URL
  const handleCopyUrl = () => {
    const url = `${window.location.origin}/listings/${publishedPropertyId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check publish requirements
  const requirements: { key: StepKey; label: string; met: boolean }[] = [
    {
      key: "account",
      label: "Account setup complete",
      met: steps.find((s) => s.key === "account")?.status === "complete",
    },
    {
      key: "identity",
      label: "Identity verified",
      met: steps.find((s) => s.key === "identity")?.status === "complete",
    },
    {
      key: "property",
      label: "Property details added",
      met: steps.find((s) => s.key === "property")?.status === "complete",
    },
    {
      key: "listing",
      label: "Photos uploaded (3+ with cover)",
      met: steps.find((s) => s.key === "listing")?.status === "complete",
    },
  ];

  const allRequirementsMet = requirements.every((r) => r.met);
  const canPublish = allRequirementsMet && hasAcknowledged;

  // If already published, show success state
  if (isPublished) {
    return (
      <div className="space-y-6">
        {/* Success Header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
            <PartyPopper className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Your listing is live!
          </h2>
          <p className="text-slate-500 mt-2">
            Congratulations! Your property is now visible to potential tenants.
          </p>
        </div>

        {/* Success Card */}
        <Card className="p-6 border-emerald-200 bg-emerald-50">
          <div className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
            <div>
              <h3 className="font-medium text-emerald-900">
                {data.propertyName || "Your Property"}
              </h3>
              <p className="text-sm text-emerald-700 mt-1">
                {data.address}
                {data.city && `, ${data.city}`}
                {data.state && `, ${data.state}`}
              </p>
            </div>
          </div>
        </Card>

        {/* Share Panel */}
        <Card className="p-6">
          <h3 className="font-medium text-slate-900 flex items-center gap-2 mb-4">
            <Share2 className="h-5 w-5 text-indigo-600" />
            Share Your Listing
          </h3>

          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 truncate">
              {typeof window !== "undefined"
                ? `${window.location.origin}/listings/${publishedPropertyId}`
                : `/listings/${publishedPropertyId}`}
            </div>
            <Button
              variant="outline"
              onClick={handleCopyUrl}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Next Steps */}
        <Card className="p-6">
          <h3 className="font-medium text-slate-900 mb-4">Next Steps</h3>
          <div className="space-y-3">
            <Link
              href={`/dashboard/properties/${publishedPropertyId}`}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm font-medium text-slate-700">
                View your property dashboard
              </span>
              <ExternalLink className="h-4 w-4 text-slate-400" />
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm font-medium text-slate-700">
                Go to dashboard
              </span>
              <ExternalLink className="h-4 w-4 text-slate-400" />
            </Link>
            {!readiness.payoutReady && (
              <Link
                href="/dashboard/settings"
                className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                <span className="text-sm font-medium text-amber-800">
                  Set up Stripe Connect to receive payments
                </span>
                <ExternalLink className="h-4 w-4 text-amber-600" />
              </Link>
            )}
          </div>
        </Card>

        <StepHintSlot hint={step?.hint || ""} />
      </div>
    );
  }

  // Pre-publish state
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{step?.title}</h2>
        <p className="text-slate-500 mt-1">{step?.subtitle}</p>
      </div>

      {/* Requirements Checklist */}
      <Card className="p-6">
        <h3 className="font-medium text-slate-900 flex items-center gap-2 mb-4">
          <Check className="h-5 w-5 text-indigo-600" />
          Publish Requirements
        </h3>

        <div className="space-y-3">
          {requirements.map((req) => (
            <div
              key={req.key}
              className={cn(
                "flex items-center gap-3 rounded-lg p-3",
                req.met
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-50 text-slate-600"
              )}
            >
              {req.met ? (
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-slate-400 shrink-0" />
              )}
              <span className="text-sm">{req.label}</span>
              {!req.met && (
                <Link
                  href={`/onboarding/landlord?step=${req.key}`}
                  className="ml-auto text-xs text-indigo-600 hover:underline"
                >
                  Complete
                </Link>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* House Rules */}
      {data.propertyId && (
        <form action={rulesAction}>
          <input type="hidden" name="property_id" value={data.propertyId} />

          <div className="mb-4">
            <FormAlert state={rulesState} />
          </div>

          <Card className="p-6">
            <h3 className="font-medium text-slate-900 flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-indigo-600" />
              House Rules
              <Badge className="bg-slate-100 text-slate-600 text-xs ml-1">
                Optional
              </Badge>
            </h3>

            <Label htmlFor="house_rules">
              Set expectations for your tenants
            </Label>
            <Textarea
              id="house_rules"
              name="house_rules"
              value={houseRules}
              onChange={(e) => setHouseRules(e.target.value)}
              placeholder="e.g., Quiet hours after 10pm, no smoking indoors, shared spaces cleaned weekly..."
              rows={4}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-slate-500">
              Clear rules help set expectations and reduce misunderstandings.
            </p>

            <div className="flex justify-end mt-4">
              <SubmitButton>Save Rules</SubmitButton>
            </div>
          </Card>
        </form>
      )}

      {/* Compliance Acknowledgment */}
      <Card className="p-6">
        <h3 className="font-medium text-slate-900 flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-indigo-600" />
          Compliance Acknowledgment
          <Badge className="bg-red-50 text-red-700 text-xs ml-1">Required</Badge>
        </h3>

        <div className="flex items-start gap-4">
          <div className="pt-0.5">
            <input
              type="checkbox"
              id="compliance_ack"
              checked={hasAcknowledged}
              onChange={() => handleAcknowledge()}
              disabled={isPending || hasAcknowledged}
              className={cn(
                "h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600",
                hasAcknowledged && "cursor-not-allowed"
              )}
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="compliance_ack"
              className={cn(
                "block font-medium",
                hasAcknowledged ? "text-slate-500" : "text-slate-900 cursor-pointer"
              )}
            >
              I acknowledge and agree to comply with all applicable laws
            </label>
            <p className="text-sm text-slate-500 mt-1">
              By checking this box, you confirm that your listing complies with local housing
              regulations, fair housing laws, and Room Link&apos;s terms of service. You are
              responsible for obtaining any required permits or licenses.
            </p>
            {hasAcknowledged && (
              <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
                <Check className="h-4 w-4" />
                Acknowledged
                {data.complianceAckAt &&
                  ` on ${new Date(data.complianceAckAt).toLocaleDateString()}`}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Publish Button */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-slate-900 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-indigo-600" />
              Publish Your Listing
            </h3>
            {canPublish ? (
              <p className="text-sm text-emerald-600 mt-1">
                All requirements met! Ready to publish.
              </p>
            ) : (
              <p className="text-sm text-slate-500 mt-1">
                Complete all requirements above to publish.
              </p>
            )}
          </div>

          <Button
            onClick={handlePublish}
            disabled={!canPublish || isPending}
            className={cn(
              "px-6",
              canPublish
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "opacity-50"
            )}
          >
            {isPending ? (
              <>Publishing...</>
            ) : (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                Publish Listing
              </>
            )}
          </Button>
        </div>

        {publishError && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{publishError}</span>
          </div>
        )}
      </Card>

      {/* Payout Reminder */}
      {!readiness.payoutReady && (
        <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium">Stripe Connect not set up</p>
            <p className="mt-1 text-amber-700">
              You can publish your listing now, but you&apos;ll need to connect Stripe
              before you can receive rent payments. You can set this up in Settings
              after publishing.
            </p>
          </div>
        </div>
      )}

      {/* Hint Slot */}
      <StepHintSlot hint={step?.hint || ""} />
    </div>
  );
}
