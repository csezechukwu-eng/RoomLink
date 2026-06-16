import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ErrorState } from "@/components/ErrorState";
import { PropertyPhotosSection } from "@/components/PropertyPhotosSection";
import { PropertyOperationsHeader } from "@/components/host/PropertyOperationsHeader";
import { PropertyOperationsStats } from "@/components/host/PropertyOperationsStats";
import { NeedsAttentionPanel } from "@/components/host/NeedsAttentionPanel";
import { RoomsBedsManager } from "@/components/host/RoomsBedsManager";
import { PropertyApplicationsPanel } from "@/components/host/PropertyApplicationsPanel";
import { PropertyPaymentsSnapshot } from "@/components/host/PropertyPaymentsSnapshot";
import { PropertyMaintenanceSnapshot } from "@/components/host/PropertyMaintenanceSnapshot";
import { PropertyRulesPanel } from "@/components/host/PropertyRulesPanel";
import { getPropertyWorkspace } from "@/lib/queries";
import { computeNeedsAttention } from "@/lib/needsAttention";

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

  const { property, rooms, bedCounts, media, applications, rentCharges, maintenance } =
    result.data;
  const roomOptions = rooms.map((r) => ({ id: r.id, name: r.name }));

  const pendingApplications = applications.filter(
    (a) => a.status === "submitted" || a.status === "under_review"
  ).length;
  const openMaintenance = maintenance.filter(
    (m) => m.status === "open" || m.status === "in_progress"
  ).length;

  const issues = computeNeedsAttention(result.data);

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

          {/* C. Rooms & Beds */}
          <RoomsBedsManager
            rooms={rooms}
            roomOptions={roomOptions}
            propertyId={property.id}
            media={media}
          />

          {/* D. Applications */}
          <PropertyApplicationsPanel applications={applications} />

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
