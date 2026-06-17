import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  CheckCircle2,
  Layers,
  Lock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { ConfirmDeleteButton } from "@/components/forms/ConfirmDeleteButton";
import { ReplaceLeasePdfModal } from "@/components/host/ReplaceLeasePdfModal";
import {
  getLeaseDocument,
  getLeaseDocumentSignedUrl,
} from "@/lib/services/leaseDocuments";
import { cancelLeaseDocument } from "@/lib/actions/leaseDocuments";
import { LEASE_TERM_OPTIONS } from "@/lib/leaseReadiness";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; badge: string }> = {
  draft: { label: "Draft", badge: "bg-slate-100 text-slate-600" },
  preparing: { label: "Preparing", badge: "bg-amber-50 text-amber-700" },
  cancelled: { label: "Cancelled", badge: "bg-slate-100 text-slate-500" },
};

function termLabel(value: string | null): string | null {
  if (!value) return null;
  return LEASE_TERM_OPTIONS.find((t) => t.value === value)?.label ?? value;
}

export default async function LeaseDocumentPage({
  params,
}: {
  params: Promise<{ leaseDocumentId: string }>;
}) {
  const { leaseDocumentId } = await params;
  const result = await getLeaseDocument(leaseDocumentId);

  // Owner-scoped: null means missing OR not this landlord's document.
  if (result.error !== null || !result.data) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <Lock className="h-7 w-7 text-slate-400" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-slate-900">
            You don&apos;t have access to this lease document
          </h2>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            It may have been removed, or it belongs to another account.
          </p>
        </Card>
      </div>
    );
  }

  const doc = result.data;
  const status = STATUS[doc.status] ?? STATUS.draft;
  const editable = doc.status === "draft" || doc.status === "preparing";

  const urlResult = await getLeaseDocumentSignedUrl(leaseDocumentId);
  const pdfUrl = urlResult.error === null ? urlResult.data : null;

  const placement = [
    doc.property_snapshot?.name,
    doc.room_snapshot?.name,
    doc.bed_snapshot?.label,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      <BackLink />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {doc.title}
            </h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.badge}`}>
              {status.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {doc.tenant_snapshot?.name ?? "Tenant"}
            {placement ? ` · ${placement}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {editable && <ReplaceLeasePdfModal leaseDocumentId={doc.id} />}
          {editable && (
            <ConfirmDeleteButton
              action={cancelLeaseDocument}
              fields={{ id: doc.id }}
              title="Cancel lease document"
              description={`Cancel "${doc.title}"? The uploaded PDF stays stored but the lease will be marked cancelled.`}
              triggerLabel="Cancel lease"
              confirmLabel="Cancel lease"
              triggerVariant="outline"
            />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* B. Uploaded PDF */}
          <Section title="Lease document">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                  <FileText className="h-5 w-5 text-red-500" />
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900">PDF lease</p>
                  <p className="text-xs text-slate-500">
                    {doc.original_file_path ? "Uploaded" : "No file"}
                  </p>
                </div>
              </div>
              {pdfUrl ? (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  View PDF <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <span className="text-xs text-slate-400">Preview unavailable</span>
              )}
            </div>
          </Section>

          {/* C. Lease metadata */}
          <Section title="Lease details">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Field label="Term type" value={termLabel(doc.lease_term_type)} />
              <Field label="Start date" value={doc.lease_start_date} />
              <Field label="End date" value={doc.lease_end_date} />
              <Field
                label="Created"
                value={new Date(doc.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              />
            </dl>
          </Section>

          {/* D. Snapshot */}
          <Section title="Snapshot at preparation">
            <p className="mb-3 text-xs text-slate-500">
              Captured when this lease was created, so later changes to the bed or
              property don&apos;t alter this document.
            </p>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Field label="Property" value={doc.property_snapshot?.name} />
              <Field label="Address" value={doc.property_snapshot?.address} />
              <Field label="Room" value={doc.room_snapshot?.name} />
              <Field label="Bed" value={doc.bed_snapshot?.label} />
              <Field
                label="Monthly rent"
                value={
                  doc.monthly_rent_snapshot != null
                    ? formatCurrency(doc.monthly_rent_snapshot)
                    : null
                }
              />
              <Field
                label="Deposit"
                value={
                  doc.deposit_amount_snapshot != null
                    ? formatCurrency(doc.deposit_amount_snapshot)
                    : null
                }
              />
              <Field label="Tenant" value={doc.tenant_snapshot?.name} />
              <Field label="Tenant contact" value={doc.tenant_snapshot?.email} />
            </dl>
          </Section>
        </div>

        {/* A. Readiness summary + E. Next step */}
        <div className="space-y-6">
          <Section title="Lease readiness">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Readiness confirmed
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Required items were complete when this lease was prepared.
            </p>
          </Section>

          <Section title="Next step">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                <Layers className="h-4 w-4 text-indigo-600" />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-900">Add fillable fields</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  Field placement will be built in the next phase.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled
              className="mt-4 w-full cursor-not-allowed rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-400"
              title="Coming in the next phase"
            >
              Continue to Prepare Fields (coming next)
            </button>
            {/* TODO (Phase 2): field placement. TODO (later): tenant signing. */}
          </Section>
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/applications"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Applications
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      {children}
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-700">{value || "—"}</dd>
    </div>
  );
}
