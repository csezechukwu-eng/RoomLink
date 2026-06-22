"use client";

import Link from "next/link";
import {
  User,
  MapPin,
  Home,
  Calendar,
  FileText,
  Eye,
  CheckCircle2,
  Send,
  Hash,
  FileSignature,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PreparedLeaseWithDetails } from "@/lib/types";

// ---------------------------------------------------------------------------
// Status badge styling
// ---------------------------------------------------------------------------

function LeaseStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { className: string; label: string; icon: React.ReactNode }> = {
    sent: {
      className: "bg-blue-100 text-blue-700",
      label: "Sent",
      icon: <Send className="mr-1 h-3 w-3" />,
    },
    viewed: {
      className: "bg-indigo-100 text-indigo-700",
      label: "Viewed",
      icon: <Eye className="mr-1 h-3 w-3" />,
    },
    signed: {
      className: "bg-green-100 text-green-700",
      label: "Signed",
      icon: <CheckCircle2 className="mr-1 h-3 w-3" />,
    },
    completed: {
      className: "bg-emerald-100 text-emerald-700",
      label: "Completed",
      icon: <CheckCircle2 className="mr-1 h-3 w-3" />,
    },
    cancelled: {
      className: "bg-slate-100 text-slate-600",
      label: "Cancelled",
      icon: null,
    },
  };

  const config = styles[status] ?? { className: "bg-slate-100 text-slate-600", label: status, icon: null };

  return (
    <Badge className={`text-xs ${config.className}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Main card component
// ---------------------------------------------------------------------------

interface SentLeaseCardProps {
  lease: PreparedLeaseWithDetails;
  fieldCount?: number;
}

export function SentLeaseCard({ lease, fieldCount }: SentLeaseCardProps) {
  const applicantName = lease.applicant_name || lease.applicant_snapshot?.name || "Unknown Applicant";
  const propertyName = lease.property_name || lease.property_snapshot?.name;
  const roomName = lease.room_snapshot?.name;
  const bedLabel = lease.bed_snapshot?.label;
  const monthlyRent = lease.rent_snapshot?.monthly_rent;

  return (
    <Card className="overflow-hidden p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Left side: applicant info */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <User className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">{applicantName}</h3>
              <LeaseStatusBadge status={lease.status} />
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {lease.template_title || "Lease Document"}
            </p>

            {/* Lease Reference Number */}
            <div className="mt-1.5 flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-indigo-500" />
              <code className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-xs text-indigo-700">
                {lease.lease_reference_number}
              </code>
            </div>

            {/* Property/Room/Bed info */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              {propertyName && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {propertyName}
                </span>
              )}
              {roomName && (
                <span className="flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5 text-slate-400" />
                  {roomName}
                </span>
              )}
              {bedLabel && (
                <span className="text-slate-500">
                  Bed: {bedLabel}
                </span>
              )}
              {monthlyRent && (
                <span className="text-slate-500">
                  {formatCurrency(monthlyRent)}/mo
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side: meta info and actions */}
        <div className="flex flex-col items-end gap-2">
          {/* Sent date */}
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            Sent {formatDate(lease.sent_at)}
          </div>

          {/* Field count */}
          {fieldCount !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <FileText className="h-3.5 w-3.5" />
              {fieldCount} signature field{fieldCount !== 1 ? "s" : ""}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/leases/applications/${lease.id}`}>
              <Button variant="outline" size="sm">
                <FileSignature className="mr-1.5 h-4 w-4" />
                View Signatures
              </Button>
            </Link>
            <Link href={`/dashboard/applications/${lease.application_id}`}>
              <Button variant="outline" size="sm">
                View Application
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
