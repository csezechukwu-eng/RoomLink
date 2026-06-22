import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  User,
  MapPin,
  Home,
  Calendar,
  FileText,
  Hash,
  Eye,
  CheckCircle2,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ErrorState } from "@/components/ErrorState";
import { SignatureTrackingSection } from "@/components/host/SignatureTrackingSection";
import {
  getPreparedLeaseById,
  getPreparedLeaseFields,
} from "@/lib/services/preparedLeases";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Helpers
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

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
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

function LeaseStatusBadge({ status }: { status: string }) {
  const styles: Record<
    string,
    { className: string; label: string; icon: React.ReactNode }
  > = {
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

  const config =
    styles[status] ?? {
      className: "bg-slate-100 text-slate-600",
      label: status,
      icon: null,
    };

  return (
    <Badge className={`text-xs ${config.className}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default async function PreparedLeaseDetailPage({
  params,
}: {
  params: Promise<{ leaseId: string }>;
}) {
  const { leaseId } = await params;

  const [leaseResult, fieldsResult] = await Promise.all([
    getPreparedLeaseById(leaseId),
    getPreparedLeaseFields(leaseId),
  ]);

  if (leaseResult.error !== null) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/leases/applications"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lease Applications
        </Link>
        <ErrorState
          title="Couldn't load lease"
          message={leaseResult.error}
        />
      </div>
    );
  }

  if (!leaseResult.data) {
    notFound();
  }

  const lease = leaseResult.data;
  const fields = fieldsResult.data ?? [];

  const applicantName =
    lease.applicant_name || lease.applicant_snapshot?.name || "Unknown Applicant";
  const propertyName = lease.property_name || lease.property_snapshot?.name;
  const roomName = lease.room_snapshot?.name;
  const bedLabel = lease.bed_snapshot?.label;
  const monthlyRent = lease.rent_snapshot?.monthly_rent;
  const depositAmount = lease.deposit_snapshot?.deposit_amount;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/leases/applications"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Lease Applications
      </Link>

      {/* Lease Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <User className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">{applicantName}</CardTitle>
                  <LeaseStatusBadge status={lease.status} />
                </div>
                <CardDescription className="mt-1">
                  {lease.template_title || "Lease Document"}
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                Sent {formatDate(lease.sent_at)}
              </div>
              {lease.viewed_at && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Eye className="h-3 w-3" />
                  Viewed {formatDateTime(lease.viewed_at)}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Lease Reference Number */}
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
              <div className="flex items-center gap-3">
                <Hash className="h-5 w-5 text-indigo-600" />
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                    Lease Reference Number
                  </div>
                  <code className="mt-1 block font-mono text-lg font-semibold text-indigo-900">
                    {lease.lease_reference_number}
                  </code>
                </div>
              </div>
            </div>

            {/* Lease Details Grid */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {propertyName && (
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />
                      Property
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-slate-900">
                      {propertyName}
                    </dd>
                  </div>
                )}

                {roomName && (
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <Home className="h-3.5 w-3.5" />
                      Room
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-slate-900">
                      {roomName}
                    </dd>
                  </div>
                )}

                {bedLabel && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Bed
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-slate-900">
                      {bedLabel}
                    </dd>
                  </div>
                )}

                {monthlyRent !== null && monthlyRent !== undefined && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Monthly Rent
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-slate-900">
                      {formatCurrency(monthlyRent)}
                    </dd>
                  </div>
                )}

                {depositAmount !== null && depositAmount !== undefined && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Deposit
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-slate-900">
                      {formatCurrency(depositAmount)}
                    </dd>
                  </div>
                )}

                {lease.rental_type && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Rental Type
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-slate-900">
                      {lease.rental_type.replace(/_/g, " ")}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Applicant Contact Info */}
            {(lease.applicant_snapshot?.email ||
              lease.applicant_snapshot?.phone) && (
              <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="mb-3 text-sm font-medium text-slate-700">
                  Tenant Contact
                </h3>
                <dl className="grid gap-3 sm:grid-cols-2">
                  {lease.applicant_snapshot?.email && (
                    <div>
                      <dt className="text-xs text-slate-500">Email</dt>
                      <dd className="text-sm text-slate-900">
                        {lease.applicant_snapshot.email}
                      </dd>
                    </div>
                  )}
                  {lease.applicant_snapshot?.phone && (
                    <div>
                      <dt className="text-xs text-slate-500">Phone</dt>
                      <dd className="text-sm text-slate-900">
                        {lease.applicant_snapshot.phone}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
              <Link href={`/dashboard/applications/${lease.application_id}`}>
                <Button variant="outline" size="sm">
                  <FileText className="mr-1.5 h-4 w-4" />
                  View Application
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature Tracking Section */}
      <SignatureTrackingSection
        leaseReferenceNumber={lease.lease_reference_number}
        fields={fields}
      />
    </div>
  );
}
