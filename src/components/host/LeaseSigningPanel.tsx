"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileSignature,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LeaseDocumentStatus } from "@/lib/types";

interface Props {
  leaseDocumentId: string;
  status: LeaseDocumentStatus;
  landlordSigned: boolean;
  tenantSigned: boolean;
}

export function LeaseSigningPanel({
  leaseDocumentId,
  status,
  landlordSigned,
  tenantSigned,
}: Props) {
  const [copied, setCopied] = React.useState(false);

  const signingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/sign/${leaseDocumentId}`
      : `/sign/${leaseDocumentId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(signingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (status === "completed") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 p-4 text-sm font-medium text-emerald-800">
        <CheckCircle2 className="h-4 w-4" />
        Both parties have signed. Lease fully executed.
      </div>
    );
  }

  if (status === "cancelled") {
    return <p className="text-sm text-slate-500">This lease was cancelled.</p>;
  }

  return (
    <div className="space-y-4">
      {status === "preparing" && (
        <div className="space-y-3">
          <Link href={`/dashboard/lease-documents/${leaseDocumentId}/review`}>
            <Button className="w-full">
              <Eye className="h-4 w-4" />
              Review & Sign
            </Button>
          </Link>
          <p className="text-xs text-slate-500">
            Preview the document, place your signature, and send to tenant for signing.
          </p>
        </div>
      )}

      {status === "out_for_signature" && (
        <>
          <div className="flex flex-wrap gap-4 text-sm">
            <SignState signed={landlordSigned} who="Landlord" />
            <SignState signed={tenantSigned} who="Tenant" />
          </div>

          <div className="flex flex-wrap gap-2">
            {!tenantSigned && (
              <Button type="button" variant="outline" onClick={copyLink}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy tenant signing link
                  </>
                )}
              </Button>
            )}
          </div>
          {landlordSigned && !tenantSigned && (
            <p className="text-xs text-slate-500">
              Share the signing link with your tenant to complete the lease.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function SignState({ signed, who }: { signed: boolean; who: string }) {
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
          <span className="text-amber-700">Awaiting {who.toLowerCase()} signature</span>
        </>
      )}
    </span>
  );
}
