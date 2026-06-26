"use client";

import * as React from "react";
import { useActionState } from "react";
import { DollarSign, Check, X, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FormAlert } from "@/components/forms/FormAlert";
import { SubmitButton } from "@/components/forms/SubmitButton";
import {
  markFeePaidAction,
  waiveFeeAction,
  resetFeeStatusAction,
  updateFeeNotesAction,
} from "@/lib/actions/applications";
import { initialActionState } from "@/lib/actions/types";
import { formatCurrency } from "@/lib/utils";
import type { ApplicationFeeStatus } from "@/lib/types";

interface ApplicationFeeSectionProps {
  applicationId: string;
  feeRequired: boolean;
  feeAmount: number | null;
  feeStatus: ApplicationFeeStatus;
  feePaidAt: string | null;
  feeWaivedAt: string | null;
  feeNotes: string | null;
}

const FEE_STATUS_STYLES: Record<
  ApplicationFeeStatus,
  { label: string; badge: string }
> = {
  not_required: {
    label: "Not Required",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
  unpaid: {
    label: "Unpaid",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
  },
  paid_manually: {
    label: "Paid",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  waived: {
    label: "Waived",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
};

export function ApplicationFeeSection({
  applicationId,
  feeRequired,
  feeAmount,
  feeStatus,
  feePaidAt,
  feeWaivedAt,
  feeNotes,
}: ApplicationFeeSectionProps) {
  const [paidState, paidAction] = useActionState(markFeePaidAction, initialActionState);
  const [waiveState, waiveAction] = useActionState(waiveFeeAction, initialActionState);
  const [resetState, resetAction] = useActionState(resetFeeStatusAction, initialActionState);
  const [notesState, notesAction] = useActionState(updateFeeNotesAction, initialActionState);

  const [notes, setNotes] = React.useState(feeNotes || "");

  // If fee is not required and status is not_required, show minimal UI
  if (!feeRequired && feeStatus === "not_required") {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <DollarSign className="h-5 w-5 text-slate-400" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Application Fee</h2>
            <p className="text-sm text-slate-500">No application fee required</p>
          </div>
        </div>
      </Card>
    );
  }

  const statusStyle = FEE_STATUS_STYLES[feeStatus];
  const canMarkPaid = feeStatus === "unpaid";
  const canWaive = feeStatus === "unpaid";
  const canReset = feeStatus === "paid_manually" || feeStatus === "waived";

  // Combine action states for feedback
  const actionState =
    paidState.status !== "idle"
      ? paidState
      : waiveState.status !== "idle"
      ? waiveState
      : resetState.status !== "idle"
      ? resetState
      : null;

  return (
    <Card className="p-5">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">Application Fee</h2>
          </div>
          <Badge className={`border ${statusStyle.badge}`}>{statusStyle.label}</Badge>
        </div>

        {/* Fee Details */}
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">Fee Required</dt>
            <dd className="font-medium text-slate-900">{feeRequired ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Amount</dt>
            <dd className="font-medium text-slate-900">
              {feeAmount ? formatCurrency(feeAmount) : "—"}
            </dd>
          </div>
          {feePaidAt && (
            <div>
              <dt className="text-slate-500">Paid On</dt>
              <dd className="font-medium text-slate-900">
                {new Date(feePaidAt).toLocaleDateString()}
              </dd>
            </div>
          )}
          {feeWaivedAt && (
            <div>
              <dt className="text-slate-500">Waived On</dt>
              <dd className="font-medium text-slate-900">
                {new Date(feeWaivedAt).toLocaleDateString()}
              </dd>
            </div>
          )}
        </dl>

        {/* Action feedback */}
        {actionState && <FormAlert state={actionState} />}

        {/* Actions */}
        {(canMarkPaid || canWaive || canReset) && (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {canMarkPaid && (
              <form action={paidAction}>
                <input type="hidden" name="id" value={applicationId} />
                <SubmitButton size="sm" pendingLabel="...">
                  <Check className="mr-1 h-4 w-4" />
                  Mark Paid
                </SubmitButton>
              </form>
            )}
            {canWaive && (
              <form action={waiveAction}>
                <input type="hidden" name="id" value={applicationId} />
                <SubmitButton size="sm" variant="secondary" pendingLabel="...">
                  <X className="mr-1 h-4 w-4" />
                  Waive Fee
                </SubmitButton>
              </form>
            )}
            {canReset && (
              <form action={resetAction}>
                <input type="hidden" name="id" value={applicationId} />
                <SubmitButton size="sm" variant="outline" pendingLabel="...">
                  <RotateCcw className="mr-1 h-4 w-4" />
                  Reset to Unpaid
                </SubmitButton>
              </form>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="border-t border-slate-100 pt-4">
          <form action={notesAction} className="space-y-3">
            <input type="hidden" name="id" value={applicationId} />
            <div>
              <label
                htmlFor="fee_notes"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Fee Notes
              </label>
              <Textarea
                id="fee_notes"
                name="fee_notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Add notes about fee payment..."
                className="text-sm"
              />
            </div>
            <FormAlert state={notesState} />
            <SubmitButton size="sm" variant="outline" className="w-full" pendingLabel="Saving...">
              Save Notes
            </SubmitButton>
          </form>
        </div>
      </div>
    </Card>
  );
}
