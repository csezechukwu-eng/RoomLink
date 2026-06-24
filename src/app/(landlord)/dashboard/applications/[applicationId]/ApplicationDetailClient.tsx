"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  Building,
  Calendar,
  User,
  Mail,
  Phone,
  Briefcase,
  Car,
  PawPrint,
  Cigarette,
  Shield,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ListChecks,
  Beaker,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FormAlert } from "@/components/forms/FormAlert";
import { SubmitButton } from "@/components/forms/SubmitButton";
import {
  approveApplicationAction,
  rejectApplicationAction,
  waitlistApplicationAction,
  markUnderReviewAction,
  updateInternalNotesAction,
} from "@/lib/actions/applications";
import { ApplicationFeeSection } from "@/components/host/ApplicationFeeSection";
import { initialActionState } from "@/lib/actions/types";
import {
  APPLICATION_STATUS_STYLES,
  labelForCommuterStatus,
  labelForEmploymentStatus,
  labelForGovernmentIdStatus,
  labelForSmokingStatus,
  LENGTH_OF_STAY_OPTIONS,
  REFERRAL_SOURCES,
  PAYMENT_METHODS,
} from "@/lib/constants";
import type { ApplicationWithRefs } from "@/lib/services/applications";
import { formatCurrency } from "@/lib/utils";

interface ApplicationDetailClientProps {
  application: ApplicationWithRefs;
}

export function ApplicationDetailClient({ application }: ApplicationDetailClientProps) {
  const [approveState, approveAction] = useActionState(approveApplicationAction, initialActionState);
  const [rejectState, rejectAction] = useActionState(rejectApplicationAction, initialActionState);
  const [waitlistState, waitlistAction] = useActionState(waitlistApplicationAction, initialActionState);
  const [reviewState, reviewAction] = useActionState(markUnderReviewAction, initialActionState);
  const [notesState, notesAction] = useActionState(updateInternalNotesAction, initialActionState);

  const [notes, setNotes] = React.useState(application.internal_notes || "");

  const statusStyle = APPLICATION_STATUS_STYLES[application.status] || APPLICATION_STATUS_STYLES.submitted;
  const fullName = `${application.first_name} ${application.last_name || ""}`.trim();
  const submittedDate = new Date(application.created_at).toLocaleDateString();

  // Determine which actions are available based on current status
  const canApprove = ["submitted", "under_review", "waitlisted"].includes(application.status);
  const canReject = ["submitted", "under_review", "waitlisted"].includes(application.status);
  const canWaitlist = ["submitted", "under_review"].includes(application.status);
  const canMarkUnderReview = application.status === "submitted";

  // Fee warning: show if fee is required but not paid/waived
  const showFeeWarning =
    canApprove &&
    application.application_fee_required &&
    application.application_fee_status === "unpaid";

  // Combine all action states for feedback
  const actionState = approveState.status !== "idle" ? approveState
    : rejectState.status !== "idle" ? rejectState
    : waitlistState.status !== "idle" ? waitlistState
    : reviewState.status !== "idle" ? reviewState
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{fullName}</h1>
            <Badge className={statusStyle.badge}>{application.status.replace("_", " ")}</Badge>
            {application.is_demo && (
              <Badge className="bg-amber-100 text-amber-700 border border-amber-300">
                <Beaker className="mr-1 h-3 w-3" />
                Demo Application
              </Badge>
            )}
          </div>
          <p className="mt-1 text-slate-500">Applied on {submittedDate}</p>
        </div>
      </div>

      {/* Action feedback */}
      {actionState && <FormAlert state={actionState} />}

      {/* Quick Actions */}
      {(canApprove || canReject || canWaitlist || canMarkUnderReview) && (
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Actions</h2>

          {/* Fee Warning */}
          {showFeeWarning && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                Application fee is not marked as paid or waived yet. You can still
                approve, but consider collecting the fee first.
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {canMarkUnderReview && (
              <form action={reviewAction}>
                <input type="hidden" name="id" value={application.id} />
                <SubmitButton size="sm" variant="outline" pendingLabel="...">
                  <Clock className="mr-1 h-4 w-4" />
                  Mark Under Review
                </SubmitButton>
              </form>
            )}
            {canApprove && (
              <form action={approveAction}>
                <input type="hidden" name="id" value={application.id} />
                <SubmitButton size="sm" pendingLabel="...">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Approve
                </SubmitButton>
              </form>
            )}
            {canWaitlist && (
              <form action={waitlistAction}>
                <input type="hidden" name="id" value={application.id} />
                <SubmitButton size="sm" variant="secondary" pendingLabel="...">
                  <ListChecks className="mr-1 h-4 w-4" />
                  Waitlist
                </SubmitButton>
              </form>
            )}
            {canReject && (
              <form action={rejectAction}>
                <input type="hidden" name="id" value={application.id} />
                <SubmitButton size="sm" variant="danger" pendingLabel="...">
                  <XCircle className="mr-1 h-4 w-4" />
                  Reject
                </SubmitButton>
              </form>
            )}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal Information */}
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <User className="h-5 w-5 text-slate-400" />
              Personal Information
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem icon={User} label="Full Name" value={fullName} />
              <DetailItem icon={Mail} label="Email" value={application.email || "—"} />
              <DetailItem icon={Phone} label="Phone" value={application.phone || "—"} />
              <DetailItem icon={MapPin} label="Current Address" value={application.current_address || "—"} />
            </dl>
          </Card>

          {/* Stay Details */}
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Calendar className="h-5 w-5 text-slate-400" />
              Stay Details
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                icon={Calendar}
                label="Desired Move-In"
                value={application.desired_move_in ? new Date(application.desired_move_in).toLocaleDateString() : "—"}
              />
              <DetailItem
                icon={Clock}
                label="Length of Stay"
                value={
                  LENGTH_OF_STAY_OPTIONS.find((o) => o.value === application.length_of_stay)?.label ||
                  application.length_of_stay ||
                  "—"
                }
              />
              <div className="sm:col-span-2">
                <DetailItem icon={FileText} label="Reason for Stay" value={application.reason_for_stay || "—"} />
              </div>
              <DetailItem
                icon={Briefcase}
                label="Commuter Status"
                value={application.commuter_status ? labelForCommuterStatus(application.commuter_status) : "—"}
              />
              {application.commuter_status_other && (
                <DetailItem icon={FileText} label="Commuter Details" value={application.commuter_status_other} />
              )}
            </dl>
          </Card>

          {/* Employment & Emergency Contact */}
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Briefcase className="h-5 w-5 text-slate-400" />
              Employment & Emergency Contact
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                icon={Briefcase}
                label="Employment Status"
                value={application.employment_status ? labelForEmploymentStatus(application.employment_status) : "—"}
              />
              <DetailItem icon={Building} label="Employer" value={application.employer_name || "—"} />
              <DetailItem
                icon={Briefcase}
                label="Monthly Income"
                value={application.monthly_income ? formatCurrency(application.monthly_income) : "—"}
              />
            </dl>

            <hr className="my-4 border-slate-200" />

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem icon={User} label="Emergency Contact" value={application.emergency_contact_name || "—"} />
              <DetailItem icon={Phone} label="Emergency Phone" value={application.emergency_contact_phone || "—"} />
            </dl>
          </Card>

          {/* Additional Details */}
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <FileText className="h-5 w-5 text-slate-400" />
              Additional Details
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                icon={Shield}
                label="Government ID Status"
                value={application.government_id_status ? labelForGovernmentIdStatus(application.government_id_status) : "—"}
              />
              <DetailItem
                icon={Shield}
                label="Background Check"
                value={application.background_check_consent ? "Consented" : "Not consented"}
              />
              <DetailItem icon={Car} label="Vehicle Info" value={application.vehicle_info || "—"} />
              <DetailItem icon={PawPrint} label="Pet Info" value={application.pet_info || "—"} />
              <DetailItem
                icon={Cigarette}
                label="Smoking Status"
                value={application.smoking_status ? labelForSmokingStatus(application.smoking_status) : "—"}
              />
              <DetailItem
                icon={FileText}
                label="How They Heard"
                value={
                  REFERRAL_SOURCES.find((o) => o.value === application.referral_source)?.label ||
                  application.referral_source ||
                  "—"
                }
              />
              <DetailItem
                icon={FileText}
                label="Payment Preference"
                value={
                  PAYMENT_METHODS.find((o) => o.value === application.preferred_payment_method)?.label ||
                  application.preferred_payment_method ||
                  "—"
                }
              />
            </dl>

            {application.tenant_notes && (
              <>
                <hr className="my-4 border-slate-200" />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Tenant Notes</dt>
                  <dd className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{application.tenant_notes}</dd>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Application Fee */}
          <ApplicationFeeSection
            applicationId={application.id}
            feeRequired={application.application_fee_required}
            feeAmount={application.application_fee_amount}
            feeStatus={application.application_fee_status}
            feePaidAt={application.application_fee_paid_at}
            feeWaivedAt={application.application_fee_waived_at}
            feeNotes={application.application_fee_notes}
          />

          {/* Property/Bed Info */}
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Building className="h-5 w-5 text-slate-400" />
              Property & Bed
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Property</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{application.property_name || "—"}</dd>
              </div>
              {application.room_name && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Room</dt>
                  <dd className="mt-1 text-sm text-slate-700">{application.room_name}</dd>
                </div>
              )}
              {application.bed_label && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Bed</dt>
                  <dd className="mt-1 text-sm text-slate-700">
                    {application.bed_label}
                    {application.monthly_rent && (
                      <span className="ml-2 text-slate-500">
                        {formatCurrency(application.monthly_rent)}/mo
                      </span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Internal Notes */}
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <FileText className="h-5 w-5 text-slate-400" />
              Internal Notes
            </h2>
            <form action={notesAction} className="space-y-3">
              <input type="hidden" name="id" value={application.id} />
              <Textarea
                name="internal_notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="Add private notes about this application..."
                className="text-sm"
              />
              <FormAlert state={notesState} />
              <SubmitButton size="sm" variant="outline" className="w-full" pendingLabel="Saving...">
                Save Notes
              </SubmitButton>
            </form>
          </Card>

          {/* Application Timeline */}
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Clock className="h-5 w-5 text-slate-400" />
              Timeline
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Created</dt>
                <dd className="text-slate-700">{new Date(application.created_at).toLocaleDateString()}</dd>
              </div>
              {application.updated_at && application.updated_at !== application.created_at && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Last Updated</dt>
                  <dd className="text-slate-700">{new Date(application.updated_at).toLocaleDateString()}</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
        <dd className="mt-0.5 text-sm text-slate-700">{value}</dd>
      </div>
    </div>
  );
}
