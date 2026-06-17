import { CheckCircle2, BedDouble, ClipboardList, FileSignature } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { StatusPill } from "@/components/StatusPill";
import { Card } from "@/components/ui/card";
import { getCurrentTenantId } from "@/lib/auth";
import { getTenantApplications } from "@/lib/services/applications";
import { getTenantReservation } from "@/lib/services/reservations";
import { getTenantLeaseDocuments } from "@/lib/services/leaseDocuments";
import {
  APPLICATION_STATUS_STYLES,
  DEPOSIT_STATUS_STYLES,
  RESERVATION_STATUS_STYLES,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { LeaseDocumentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const LEASE_STATUS_STYLES: Record<LeaseDocumentStatus, { label: string; badge: string }> = {
  draft: { label: "Draft", badge: "bg-slate-100 text-slate-600" },
  preparing: { label: "Preparing", badge: "bg-slate-100 text-slate-600" },
  out_for_signature: { label: "Awaiting Signature", badge: "bg-amber-50 text-amber-700" },
  completed: { label: "Signed", badge: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelled", badge: "bg-slate-100 text-slate-500" },
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
    getTenantLeaseDocuments(tenantId),
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
              const line = [lease.room_snapshot?.name, lease.bed_snapshot?.label]
                .filter(Boolean)
                .join(" · ");
              const style = LEASE_STATUS_STYLES[lease.status] ?? LEASE_STATUS_STYLES.draft;
              const canSign =
                lease.status === "out_for_signature" && !lease.tenant_signed_at;

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
                          {lease.monthly_rent_snapshot !== null
                            ? ` · ${formatCurrency(lease.monthly_rent_snapshot)}/mo`
                            : ""}
                        </p>
                        {lease.lease_start_date && (
                          <p className="text-sm text-slate-500">
                            Starts {formatDate(lease.lease_start_date)}
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
                      </div>
                    ) : canSign ? (
                      <Link
                        href={`/sign/${lease.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        <FileSignature className="h-4 w-4" />
                        Sign Lease
                      </Link>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Waiting for the landlord to send the lease.
                      </p>
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
