import { CheckCircle2, BedDouble, ClipboardList, FileSignature, ExternalLink } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { StatusPill } from "@/components/StatusPill";
import { Card } from "@/components/ui/card";
import { getCurrentTenantId } from "@/lib/auth";
import { getTenantApplications } from "@/lib/services/applications";
import { getTenantReservation } from "@/lib/services/reservations";
import { getTenantLeases, type LeaseWithRefs } from "@/lib/services/leases";
import {
  APPLICATION_STATUS_STYLES,
  DEPOSIT_STATUS_STYLES,
  RESERVATION_STATUS_STYLES,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { LeaseStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const LEASE_STATUS_STYLES: Record<LeaseStatus, { label: string; badge: string }> = {
  draft: { label: "Draft", badge: "bg-slate-100 text-slate-600" },
  sent: { label: "Awaiting Signature", badge: "bg-amber-50 text-amber-700" },
  delivered: { label: "Opened", badge: "bg-blue-50 text-blue-700" },
  completed: { label: "Signed", badge: "bg-emerald-50 text-emerald-700" },
  declined: { label: "Declined", badge: "bg-red-50 text-red-700" },
  voided: { label: "Voided", badge: "bg-slate-100 text-slate-500" },
};

export default async function TenantStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ applied?: string }>;
}) {
  const { applied } = await searchParams;
  const tenantId = await getCurrentTenantId();
  const [appsResult, reservationResult, leasesResult] = await Promise.all([
    getTenantApplications(tenantId),
    getTenantReservation(tenantId),
    getTenantLeases(tenantId),
  ]);

  if (appsResult.error !== null || reservationResult.error !== null || leasesResult.error !== null) {
    return (
      <div className="space-y-6">
        <PageHeader title="My status" />
        <ErrorState
          title="Couldn't load your status"
          message={appsResult.error ?? reservationResult.error ?? leasesResult.error ?? undefined}
        />
      </div>
    );
  }

  const applications = appsResult.data;
  const reservation = reservationResult.data;
  const leases = leasesResult.data;
  const bedLine = reservation
    ? [reservation.room_name, reservation.bed_label].filter(Boolean).join(" · ")
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My status"
        description="Your application, reservation, deposit, and assigned bed."
      />

      {applied ? (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Application submitted! The host will review it and you&apos;ll see the
            decision here.
          </span>
        </div>
      ) : null}

      {/* Reservation / assignment */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Reservation
        </h2>
        {reservation ? (
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <BedDouble className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {reservation.property_name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {bedLine || "Bed assignment pending"}
                    {reservation.start_date
                      ? ` · from ${formatDate(reservation.start_date)}`
                      : ""}
                  </p>
                </div>
              </div>
              <StatusPill tone={RESERVATION_STATUS_STYLES[reservation.status]} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Deposit</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(reservation.deposit_amount)}
                </span>
                <StatusPill
                  tone={DEPOSIT_STATUS_STYLES[reservation.deposit_status]}
                />
              </div>
            </div>
          </Card>
        ) : (
          <p className="text-sm text-slate-500">
            No active reservation yet. Once a host approves an application, your
            reserved bed shows up here.
          </p>
        )}
      </section>

      {/* Applications */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Applications
        </h2>
        {applications.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-5 w-5" />}
            title="No applications yet"
            description="Browse availability and apply for a bed to get started."
          />
        ) : (
          <div className="space-y-3">
            {applications.map((a) => {
              const line = [a.room_name, a.bed_label].filter(Boolean).join(" · ");
              return (
                <Card key={a.id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">
                        {a.property_name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {line || "Bed"}
                        {a.monthly_rent !== null
                          ? ` · ${formatCurrency(a.monthly_rent)}/mo`
                          : ""}
                        {` · applied ${formatDate(a.created_at)}`}
                      </p>
                    </div>
                    <StatusPill tone={APPLICATION_STATUS_STYLES[a.status]} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Leases */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Lease Agreements
        </h2>
        {leases.length === 0 ? (
          <p className="text-sm text-slate-500">
            No lease agreements yet. Once the landlord sends a lease for signing, it will appear here.
          </p>
        ) : (
          <div className="space-y-3">
            {leases.map((lease) => {
              const line = [lease.room_name, lease.bed_label].filter(Boolean).join(" · ");
              const style = LEASE_STATUS_STYLES[lease.status];
              const canSign = lease.status === "sent" || lease.status === "delivered";

              return (
                <Card key={lease.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <FileSignature className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {lease.property_name ?? "Lease Agreement"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {line || "Bed rental agreement"}
                          {lease.monthly_rent !== null
                            ? ` · ${formatCurrency(lease.monthly_rent)}/mo`
                            : ""}
                        </p>
                        {lease.lease_start && (
                          <p className="text-sm text-slate-500">
                            Starts {formatDate(lease.lease_start)}
                          </p>
                        )}
                      </div>
                    </div>
                    <StatusPill tone={style} />
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    {lease.status === "completed" ? (
                      <div className="flex items-center gap-2 text-sm text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Lease signed successfully</span>
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
                    ) : canSign ? (
                      <Link
                        href={`/api/leases/${lease.id}/sign?role=tenant`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        <FileSignature className="h-4 w-4" />
                        Sign Lease
                      </Link>
                    ) : lease.status === "declined" ? (
                      <p className="text-sm text-red-600">This lease was declined.</p>
                    ) : lease.status === "voided" ? (
                      <p className="text-sm text-slate-500">This lease was voided by the landlord.</p>
                    ) : (
                      <p className="text-sm text-slate-500">Waiting for landlord to send the lease.</p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
