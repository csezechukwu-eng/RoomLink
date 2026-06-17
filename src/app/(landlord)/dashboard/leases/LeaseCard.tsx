import Link from "next/link";
import { FileSignature, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { LeaseDocumentStatus } from "@/lib/types";
import type { LeaseDocumentWithProperty } from "@/lib/services/leaseDocuments";

const STATUS_STYLES: Record<LeaseDocumentStatus, { label: string; badge: string }> = {
  draft: { label: "Draft", badge: "bg-slate-100 text-slate-600" },
  preparing: { label: "Preparing", badge: "bg-amber-50 text-amber-700" },
  out_for_signature: { label: "Out for signature", badge: "bg-blue-50 text-blue-700" },
  completed: { label: "Signed", badge: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelled", badge: "bg-slate-100 text-slate-500" },
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function LeaseCard({ lease }: { lease: LeaseDocumentWithProperty }) {
  const style = STATUS_STYLES[lease.status] ?? STATUS_STYLES.draft;
  const showSignatures =
    lease.status === "out_for_signature" || lease.status === "completed";

  return (
    <Link href={`/dashboard/lease-documents/${lease.id}`} className="block">
      <Card className="p-5 transition-colors hover:border-slate-300">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <FileSignature className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                {lease.tenant_snapshot?.name ?? lease.title}
              </p>
              <p className="text-sm text-slate-500">
                {lease.property_name ?? lease.property_snapshot?.name ?? "Property"}
                {lease.monthly_rent_snapshot != null &&
                  ` · ${formatCurrency(lease.monthly_rent_snapshot)}/mo`}
              </p>
              <p className="text-sm text-slate-500">
                {lease.lease_start_date && `Starts ${formatDate(lease.lease_start_date)}`}
                {lease.sent_at && ` · Sent ${formatDate(lease.sent_at)}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}>
              {style.label}
            </span>
            <ArrowRight className="h-4 w-4 text-slate-300" />
          </div>
        </div>

        {showSignatures && (
          <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm">
            <Pip signed={Boolean(lease.landlord_signed_at)} who="Landlord" />
            <Pip signed={Boolean(lease.tenant_signed_at)} who="Tenant" />
          </div>
        )}
      </Card>
    </Link>
  );
}

function Pip({ signed, who }: { signed: boolean; who: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {signed ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-emerald-700">{who} signed</span>
        </>
      ) : (
        <>
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span className="text-amber-700">Awaiting {who.toLowerCase()}</span>
        </>
      )}
    </span>
  );
}
