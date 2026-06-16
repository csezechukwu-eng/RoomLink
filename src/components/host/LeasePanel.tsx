import { FileSignature, ExternalLink, Upload, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { InlineActionButton } from "@/components/forms/InlineActionButton";
import { sendLeaseAction } from "@/lib/actions/leases";
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

export function LeasePanel({
  application,
  lease,
  docusignConfigured,
  templateConfigured,
}: {
  application: ApplicationWithRefs;
  lease: Lease | null;
  docusignConfigured: boolean;
  templateConfigured: boolean;
}) {
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
          {!templateConfigured && (
            <p className="text-xs text-amber-600">
              Set <code>DOCUSIGN_TEMPLATE_ID</code> to your lease template first.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <InlineActionButton
              action={sendLeaseAction}
              fields={{ application_id: application.id }}
              variant="primary"
              pendingLabel="Sending..."
            >
              <FileSignature className="h-4 w-4" />
              Send lease for signing
            </InlineActionButton>
            <button
              type="button"
              disabled
              title="Uploading your own lease document is coming next."
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-400"
            >
              <Upload className="h-4 w-4" />
              Upload your own lease (soon)
            </button>
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
