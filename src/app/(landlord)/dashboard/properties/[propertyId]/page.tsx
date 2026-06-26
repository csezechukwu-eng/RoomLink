import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { ErrorState } from "@/components/ErrorState";
import { PropertyPhotosSection } from "@/components/PropertyPhotosSection";
import { PropertyOperationsHeader } from "@/components/host/PropertyOperationsHeader";
import { PropertyOperationsStats } from "@/components/host/PropertyOperationsStats";
import { NeedsAttentionPanel } from "@/components/host/NeedsAttentionPanel";
import { RoomsBedsManager } from "@/components/host/RoomsBedsManager";
import { TenantRoster } from "@/components/host/TenantRoster";
import { MoveBoard } from "@/components/host/MoveBoard";
import { PropertyApplicationsPanel } from "@/components/host/PropertyApplicationsPanel";
import { PropertyPaymentsSnapshot } from "@/components/host/PropertyPaymentsSnapshot";
import { PropertyMaintenanceSnapshot } from "@/components/host/PropertyMaintenanceSnapshot";
import { PropertyRulesPanel } from "@/components/host/PropertyRulesPanel";
import { PropertyApplicationFeePanel } from "@/components/host/PropertyApplicationFeePanel";
import { ListingSettingsPanel } from "@/components/host/ListingSettingsPanel";
import { getPropertyWorkspace } from "@/lib/queries";
import { computeNeedsAttention } from "@/lib/needsAttention";
import { computeBedAvailability, type BedAvailability } from "@/lib/bedAvailability";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const result = await getPropertyWorkspace(propertyId);

  if (result.error !== null) {
    return (
      <div className="space-y-6">
        <BackLink />
        <ErrorState title="Couldn't load this property" message={result.error} />
      </div>
    );
  }

  if (!result.data) notFound();

  const {
    property,
    rooms,
    bedCounts,
    media,
    applications,
    rentCharges,
    maintenance,
    reservationEndByBed,
    roster,
  } = result.data;
  const roomOptions = rooms.map((r) => ({ id: r.id, name: r.name }));

  const pendingApplications = applications.filter(
    (a) => a.status === "submitted" || a.status === "under_review"
  ).length;
  const openMaintenance = maintenance.filter(
    (m) => m.status === "open" || m.status === "in_progress"
  ).length;

  // Derive per-bed availability once and reuse for badges + filtering + counts.
  const availabilityByBed: Record<string, BedAvailability> = {};
  for (const room of rooms) {
    for (const bed of room.beds) {
      availabilityByBed[bed.id] = computeBedAvailability(bed, {
        reservationEndDate: reservationEndByBed[bed.id] ?? null,
      });
    }
  }
  const availabilityValues = Object.values(availabilityByBed);
  const openNow = availabilityValues.filter((a) => a.state === "open_now").length;
  const freeingSoon = availabilityValues.filter(
    (a) => a.state === "frees_soon" || a.state === "opens_soon"
  ).length;

  const issues = computeNeedsAttention(result.data);

  // Compute rent/deposit ranges for listing settings panel
  const allBeds = rooms.flatMap((r) => r.beds);
  const rents = allBeds.map((b) => b.monthly_rent).filter((r) => r > 0);
  const deposits = allBeds.map((b) => b.deposit_amount);
  const minRent = rents.length > 0 ? Math.min(...rents) : null;
  const maxRent = rents.length > 0 ? Math.max(...rents) : null;
  const minDeposit = deposits.length > 0 ? Math.min(...deposits) : null;
  const maxDeposit = deposits.length > 0 ? Math.max(...deposits) : null;

  return (
    <div className="space-y-6">
      <PropertyOperationsHeader property={property} roomCount={rooms.length} />

      <PropertyOperationsStats
        bedCounts={bedCounts}
        pendingApplications={pendingApplications}
        openMaintenance={openMaintenance}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Needs Attention — right column on desktop, top on mobile */}
        <aside className="space-y-6 lg:order-2 lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <NeedsAttentionPanel issues={issues} />
          </div>
        </aside>

        {/* Main operations workspace */}
        <div className="space-y-8 lg:order-1 lg:col-span-2">
          {/* B. Property Photos */}
          <div id="photos" className="scroll-mt-24">
            <PropertyPhotosSection propertyId={property.id} photos={media} />
          </div>

          {/* Listing Settings - Monthly Stay Marketplace */}
          <div id="listing-settings" className="scroll-mt-24">
            <ListingSettingsPanel
              property={property}
              bedCounts={bedCounts}
              minRent={minRent}
              maxRent={maxRent}
              minDeposit={minDeposit}
              maxDeposit={maxDeposit}
            />
          </div>

          {/* C. Rooms & Beds */}
          <div className="space-y-3">
            {bedCounts.total > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm">
                <CalendarClock className="h-4 w-4 text-emerald-600" />
                <span className="text-slate-600">
                  <span className="font-semibold text-emerald-600">{openNow}</span>{" "}
                  open now
                  <span className="px-1.5 text-slate-300">·</span>
                  <span className="font-semibold text-amber-600">{freeingSoon}</span>{" "}
                  available soon
                </span>
              </div>
            )}
            <RoomsBedsManager
              rooms={rooms}
              roomOptions={roomOptions}
              propertyId={property.id}
              media={media}
              availabilityByBed={availabilityByBed}
            />
          </div>

          {/* C2. Tenants (roster + turnover) */}
          <section id="tenants" className="scroll-mt-24 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Tenants
              </h2>
              {roster.length > 0 && (
                <Link
                  href="/dashboard/tenants"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  All tenants
                </Link>
              )}
            </div>
            {roster.length > 0 && <MoveBoard entries={roster} />}
            <TenantRoster
              entries={roster}
              limit={6}
              viewAllHref="/dashboard/tenants"
            />
          </section>

          {/* D. Applications */}
          <PropertyApplicationsPanel applications={applications} />

          {/* D2. Application Fee Settings */}
          <PropertyApplicationFeePanel property={property} />

          {/* E. Rent & Payment snapshot */}
          <PropertyPaymentsSnapshot charges={rentCharges} />

          {/* F. Maintenance */}
          <PropertyMaintenanceSnapshot requests={maintenance} />

          {/* G + H. Messages/Notes + House Rules / Check-in */}
          <PropertyRulesPanel property={property} />
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/properties"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Properties
    </Link>
  );
}
