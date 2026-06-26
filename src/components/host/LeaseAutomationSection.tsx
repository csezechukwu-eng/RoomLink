"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import {
  FileText,
  Send,
  CheckCircle2,
  AlertCircle,
  Settings2,
  FileCheck,
  AlertTriangle,
  Hash,
  FileSignature,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/forms/FormAlert";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { approveAndSendLeaseAction } from "@/lib/actions/applications";
import { initialActionState } from "@/lib/actions/types";
import { getStayTypeLabel } from "@/lib/leaseTemplateOptions";
import type { LeaseAutomationContext } from "@/lib/services/preparedLeases";

interface LeaseAutomationSectionProps {
  context: LeaseAutomationContext | null;
}

export function LeaseAutomationSection({ context }: LeaseAutomationSectionProps) {
  const [state, action] = useActionState(approveAndSendLeaseAction, initialActionState);

  if (!context) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-3 text-slate-500">
          <AlertCircle className="h-5 w-5" />
          <span>Unable to load lease automation context.</span>
        </div>
      </Card>
    );
  }

  const {
    application,
    linkedTemplate,
    templateFieldCount,
    hasRequiredSignature,
    existingPreparedLease,
    missingRequirements,
    canSendLease,
  } = context;

  // Show existing lease status
  if (existingPreparedLease) {
    const statusLabels: Record<string, { label: string; className: string }> = {
      sent: { label: "Agreement Sent", className: "bg-blue-100 text-blue-700" },
      viewed: { label: "Agreement Viewed", className: "bg-indigo-100 text-indigo-700" },
      signed: { label: "Agreement Signed", className: "bg-green-100 text-green-700" },
      completed: { label: "Agreement Completed", className: "bg-emerald-100 text-emerald-700" },
      cancelled: { label: "Agreement Cancelled", className: "bg-slate-100 text-slate-600" },
    };
    const statusConfig = statusLabels[existingPreparedLease.status] ?? statusLabels.sent;

    return (
      <Card className="p-5">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <FileCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Agreement Sent</h2>
                <p className="text-sm text-slate-500">
                  Sent on{" "}
                  {existingPreparedLease.sent_at
                    ? new Date(existingPreparedLease.sent_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
            <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
          </div>

          {/* Agreement Reference Number */}
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-medium text-indigo-600">Agreement Reference:</span>
              <code className="font-mono text-sm font-semibold text-indigo-900">
                {existingPreparedLease.lease_reference_number}
              </code>
            </div>
          </div>

          {/* View Signatures Button */}
          <div className="flex items-center gap-2 border-t border-slate-200 pt-3">
            <Link href={`/dashboard/leases/applications/${existingPreparedLease.id}`}>
              <Button variant="outline" size="sm">
                <FileSignature className="mr-1.5 h-4 w-4" />
                View Signature Tracking
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  // Application already approved but no lease (legacy)
  if (application.status === "approved") {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Application Approved</h2>
            <p className="text-sm text-slate-500">
              This application was approved without lease automation.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Not approvable status
  const approvableStatuses = ["submitted", "under_review", "waitlisted"];
  if (!approvableStatuses.includes(application.status)) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-3 text-slate-500">
          <AlertCircle className="h-5 w-5" />
          <span>
            Lease automation is not available for &quot;{application.status}&quot; applications.
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
            <FileText className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Monthly Agreement</h2>
            <p className="text-sm text-slate-500">
              Send a monthly stay agreement when approving this request.
            </p>
          </div>
        </div>

        {/* Rental Type */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Rental Type
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {application.stay_type
                  ? getStayTypeLabel(application.stay_type)
                  : "Not assigned"}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Linked Lease Template
              </dt>
              <dd className="mt-1">
                {linkedTemplate ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {linkedTemplate.title}
                    </span>
                    <Badge
                      className={
                        linkedTemplate.status === "ready"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }
                    >
                      {linkedTemplate.status === "ready" ? "Ready" : "Needs Setup"}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-sm text-slate-500">No template linked</span>
                )}
              </dd>
            </div>

            {linkedTemplate && (
              <>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Signature Fields
                  </dt>
                  <dd className="mt-1 text-sm text-slate-700">
                    {templateFieldCount} field{templateFieldCount !== 1 ? "s" : ""} configured
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Required Signature
                  </dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-sm">
                    {hasRequiredSignature ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-green-700">Tenant signature configured</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <span className="text-amber-700">Missing tenant signature</span>
                      </>
                    )}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>

        {/* Missing Requirements */}
        {missingRequirements.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <h3 className="font-medium text-amber-800">Cannot Send Lease</h3>
                <ul className="mt-2 space-y-1 text-sm text-amber-700">
                  {missingRequirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Action feedback */}
        <FormAlert state={state} />

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
          {canSendLease ? (
            <form action={action}>
              <input type="hidden" name="id" value={application.id} />
              <SubmitButton pendingLabel="Sending...">
                <Send className="mr-1.5 h-4 w-4" />
                Approve & Send Agreement
              </SubmitButton>
            </form>
          ) : (
            <Button disabled>
              <Send className="mr-1.5 h-4 w-4" />
              Approve & Send Agreement
            </Button>
          )}

          {linkedTemplate && linkedTemplate.status === "needs_setup" && (
            <Link href={`/dashboard/leases/templates/${linkedTemplate.id}/designer`}>
              <Button variant="outline">
                <Settings2 className="mr-1.5 h-4 w-4" />
                Edit Field Setup
              </Button>
            </Link>
          )}

          {!linkedTemplate && application.stay_type && (
            <Link href="/dashboard/leases/applications">
              <Button variant="outline">
                <FileText className="mr-1.5 h-4 w-4" />
                Go to Agreement Templates
              </Button>
            </Link>
          )}

          {!application.stay_type && (
            <span className="text-sm text-slate-500">
              Assign a rental type to this request to enable agreement automation.
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
