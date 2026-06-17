"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  FileSignature,
  ExternalLink,
  CheckCircle2,
  Edit3,
  Send,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/forms/FormAlert";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { sendLeaseWithFieldsAction } from "@/lib/actions/leases";
import { initialActionState } from "@/lib/actions/types";
import type { ApplicationWithRefs } from "@/lib/services/applications";
import type { Lease, LeaseStatus } from "@/lib/types";

const STATUS_STYLES: Record<LeaseStatus, { label: string; badge: string }> = {
  draft: { label: "Draft", badge: "bg-slate-100 text-slate-600" },
  sent: { label: "Sent · awaiting signatures", badge: "bg-amber-50 text-amber-700" },
  delivered: { label: "Opened by signer", badge: "bg-blue-50 text-blue-700" },
  completed: { label: "Signed", badge: "bg-emerald-50 text-emerald-700" },
  declined: { label: "Declined", badge: "bg-red-50 text-red-700" },
  voided: { label: "Voided", badge: "bg-slate-100 text-slate-500" },
};

interface LeasePanelClientProps {
  application: ApplicationWithRefs;
  lease: Lease | null;
  docusignConfigured: boolean;
  templateConfigured: boolean;
}

export function LeasePanelClient({
  application,
  lease,
  docusignConfigured,
  templateConfigured,
}: LeasePanelClientProps) {
  const [showForm, setShowForm] = React.useState(false);
  const [state, action] = useActionState(sendLeaseWithFieldsAction, initialActionState);

  // Pre-fill form with application data
  const fullName = `${application.first_name ?? ""} ${application.last_name ?? ""}`.trim();
  const address = application.property_name ?? "";

  // Close form on success
  React.useEffect(() => {
    if (state.status === "success") {
      setShowForm(false);
    }
  }, [state.status]);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <FileSignature className="h-5 w-5 text-indigo-600" />
        <h2 className="text-base font-semibold text-slate-900">Lease</h2>
      </div>

      {/* Not connected yet */}
      {!docusignConfigured ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-4">
          <p className="text-sm font-medium text-slate-900">Connect DocuSign to send leases</p>
          <p className="mt-1 text-sm text-slate-500">
            Add your DocuSign env vars (integration key, account/user id, RSA key,
            template id) to enable one-click lease signing for the landlord and tenant.
          </p>
        </div>
      ) : lease ? (
        <LeaseStatusView lease={lease} />
      ) : showForm ? (
        <div className="mt-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-700">Edit Lease Details</h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form action={action} className="space-y-4">
            <input type="hidden" name="application_id" value={application.id} />

            <FormAlert state={state} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Property Name
                </label>
                <Input
                  name="property_name"
                  defaultValue={application.property_name ?? ""}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Property Address
                </label>
                <Input
                  name="property_address"
                  defaultValue=""
                  placeholder="Full address"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Room
                </label>
                <Input
                  name="room_name"
                  defaultValue={application.room_name ?? ""}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Bed
                </label>
                <Input
                  name="bed_label"
                  defaultValue={application.bed_label ?? ""}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Monthly Rent ($)
                </label>
                <Input
                  name="monthly_rent"
                  type="number"
                  step="0.01"
                  defaultValue={application.monthly_rent ?? ""}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Security Deposit ($)
                </label>
                <Input
                  name="deposit_amount"
                  type="number"
                  step="0.01"
                  defaultValue=""
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Lease Start Date
                </label>
                <Input
                  name="lease_start"
                  type="date"
                  defaultValue={application.desired_move_in ?? ""}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Lease End Date (optional)
                </label>
                <Input
                  name="lease_end"
                  type="date"
                  defaultValue=""
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Tenant Name
              </label>
              <Input
                name="tenant_name"
                defaultValue={fullName}
                className="mt-1"
              />
            </div>

            {!templateConfigured && (
              <p className="text-xs text-amber-600">
                Set <code>DOCUSIGN_TEMPLATE_ID</code> to your lease template first.
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <SubmitButton pendingLabel="Sending...">
                <Send className="mr-1.5 h-4 w-4" />
                Send Lease to DocuSign
              </SubmitButton>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-600">
            Send a lease prefilled with{" "}
            <span className="font-medium text-slate-800">
              {application.property_name ?? "this property"}
              {application.room_name ? ` · ${application.room_name}` : ""}
              {application.bed_label ? ` · ${application.bed_label}` : ""}
            </span>{" "}
            for the tenant and landlord to e-sign.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowForm(true)}>
              <Edit3 className="mr-1.5 h-4 w-4" />
              Edit & Send Lease
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function LeaseStatusView({ lease }: { lease: Lease }) {
  const style = STATUS_STYLES[lease.status];
  const signable = lease.status === "sent" || lease.status === "delivered";

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}>
          {style.label}
        </span>
        {lease.tenant_name && (
          <span className="text-sm text-slate-500">for {lease.tenant_name}</span>
        )}
      </div>

      {lease.status === "completed" ? (
        <div className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Both parties signed.
          {lease.signed_pdf_url && (
            <a
              href={lease.signed_pdf_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700"
            >
              View signed PDF <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      ) : signable ? (
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/leases/${lease.id}/sign?role=landlord`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <FileSignature className="h-4 w-4" />
            Sign as landlord
          </a>
          <a
            href={`/api/leases/${lease.id}/sign?role=tenant`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Open tenant signing
          </a>
        </div>
      ) : null}
    </div>
  );
}
