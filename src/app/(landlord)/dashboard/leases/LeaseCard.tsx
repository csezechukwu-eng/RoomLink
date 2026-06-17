"use client";

import { useState, useActionState } from "react";
import { FileSignature, CheckCircle2, ExternalLink, Copy, Check, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { signLeaseAsLandlordAction } from "@/lib/actions/leases";
import type { Lease, LeaseStatus } from "@/lib/types";

const STATUS_STYLES: Record<LeaseStatus, { label: string; badge: string }> = {
  draft: { label: "Draft", badge: "bg-slate-100 text-slate-600" },
  sent: { label: "Awaiting Signatures", badge: "bg-amber-50 text-amber-700" },
  delivered: { label: "Opened", badge: "bg-blue-50 text-blue-700" },
  completed: { label: "Signed", badge: "bg-emerald-50 text-emerald-700" },
  declined: { label: "Declined", badge: "bg-red-50 text-red-700" },
  voided: { label: "Voided", badge: "bg-slate-100 text-slate-500" },
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface Props {
  lease: Lease & { property_name: string | null };
}

export function LeaseCard({ lease }: Props) {
  const style = STATUS_STYLES[lease.status];
  const canSign = lease.status === "sent" || lease.status === "delivered";
  const needsLandlordSignature = !lease.landlord_signed_at;
  const needsTenantSignature = !lease.tenant_signed_at;

  const [copied, setCopied] = useState(false);
  const [state, formAction, isPending] = useActionState(signLeaseAsLandlordAction, { status: "idle" });

  const tenantSigningUrl = typeof window !== "undefined"
    ? `${window.location.origin}/sign/${lease.id}`
    : `/sign/${lease.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(tenantSigningUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = tenantSigningUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLandlordSign = () => {
    const formData = new FormData();
    formData.set("lease_id", lease.id);
    formAction(formData);
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <FileSignature className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">
              {lease.tenant_name ?? "Unnamed Tenant"}
            </p>
            <p className="text-sm text-slate-500">
              {lease.property_name ?? "Property"}
              {lease.monthly_rent && ` · ${formatCurrency(lease.monthly_rent)}/mo`}
            </p>
            <p className="text-sm text-slate-500">
              {lease.lease_start && `Starts ${formatDate(lease.lease_start)}`}
              {lease.sent_at && ` · Sent ${formatDate(lease.sent_at)}`}
            </p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}>
          {style.label}
        </span>
      </div>

      {/* Signature Status */}
      {canSign && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          {/* Signature indicators */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              {lease.landlord_signed_at ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-700">Landlord signed</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span className="text-amber-700">Awaiting landlord signature</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {lease.tenant_signed_at ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-700">Tenant signed</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span className="text-amber-700">Awaiting tenant signature</span>
                </>
              )}
            </div>
          </div>

          {/* Action messages */}
          {state.status === "success" && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {state.message}
            </div>
          )}

          {state.status === "error" && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.message}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {needsLandlordSignature && (
              <button
                onClick={handleLandlordSign}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <FileSignature className="h-4 w-4" />
                {isPending ? "Signing..." : "Sign as Landlord"}
              </button>
            )}

            {needsTenantSignature && (
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Tenant Signing Link
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {lease.status === "completed" && (
        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          <span>Both parties signed</span>
          {lease.signed_pdf_url && (
            <a
              href={lease.signed_pdf_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700"
            >
              View PDF <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
    </Card>
  );
}
