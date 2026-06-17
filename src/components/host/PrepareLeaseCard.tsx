import Link from "next/link";
import { FileSignature, CheckCircle2, Circle, ArrowRight, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { UploadLeaseModal } from "@/components/host/UploadLeaseModal";
import { computeLeaseReadiness } from "@/lib/leaseReadiness";
import type { ApplicationLeaseContext } from "@/lib/services/leaseDocuments";

const DOC_STATUS: Record<string, { label: string; badge: string }> = {
  draft: { label: "Draft", badge: "bg-slate-100 text-slate-600" },
  preparing: { label: "Preparing", badge: "bg-amber-50 text-amber-700" },
  cancelled: { label: "Cancelled", badge: "bg-slate-100 text-slate-500" },
};

/**
 * Landlord-side entry point for lease preparation, shown on the application
 * page. Gated on approval + a real readiness checklist. No tenant involvement.
 */
export function PrepareLeaseCard({
  context,
}: {
  context: ApplicationLeaseContext | null;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <FileSignature className="h-5 w-5 text-indigo-600" />
        <h2 className="text-base font-semibold text-slate-900">Prepare Lease</h2>
      </div>

      {!context ? (
        <p className="mt-3 text-sm text-slate-500">
          Lease preparation isn&apos;t available for this application.
        </p>
      ) : context.existing ? (
        <ExistingDoc context={context} />
      ) : (
        <NotYetPrepared context={context} />
      )}
    </Card>
  );
}

function ExistingDoc({ context }: { context: ApplicationLeaseContext }) {
  const doc = context.existing!;
  const style = DOC_STATUS[doc.status] ?? DOC_STATUS.draft;
  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-slate-900">{doc.title}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}>
          {style.label}
        </span>
      </div>
      <p className="text-sm text-slate-500">
        A lease document has already been started for this applicant.
      </p>
      <Link
        href={`/dashboard/lease-documents/${doc.id}`}
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Open lease document
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function NotYetPrepared({ context }: { context: ApplicationLeaseContext }) {
  const { ctx } = context;
  const approved = ctx.application.status === "approved";

  if (!approved) {
    return (
      <div className="mt-4 flex items-start gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-4">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
        <div>
          <p className="text-sm font-medium text-slate-900">
            Approve the application before preparing a lease
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Lease preparation unlocks once this applicant is approved.
          </p>
        </div>
      </div>
    );
  }

  const readiness = computeLeaseReadiness(ctx);
  const propertyName = ctx.property?.name ?? "Property";

  return (
    <div className="mt-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Lease Readiness</h3>
        <p className="text-sm text-slate-500">
          Complete these items before preparing the lease.
        </p>
      </div>

      <ul className="space-y-2">
        {readiness.items.map((item) => (
          <li key={item.key} className="flex items-start gap-2.5">
            {item.complete ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <Circle
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  item.required ? "text-amber-500" : "text-slate-300"
                }`}
              />
            )}
            <div className="min-w-0">
              <span className={`text-sm ${item.complete ? "text-slate-600" : "text-slate-900"}`}>
                {item.label}
                {!item.required && (
                  <span className="ml-1.5 text-xs text-slate-400">(optional)</span>
                )}
              </span>
              {!item.complete && item.hint && (
                <p className="text-xs text-slate-500">{item.hint}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {readiness.ready ? (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            Ready to prepare lease
          </p>
          <div className="mt-3">
            <UploadLeaseModal
              applicationId={ctx.application.id}
              defaults={{
                title: `${propertyName} — Lease`,
                leaseStartDate: ctx.application.desired_move_in,
              }}
            />
          </div>
        </div>
      ) : (
        <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          Complete the missing items above before uploading a lease.
        </p>
      )}
    </div>
  );
}
