import { BedDouble } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { AvailabilityCard } from "@/components/availability/AvailabilityCard";
import { getAvailableProperties } from "@/lib/services/availability";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const result = await getAvailableProperties();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live availability"
        description="Browse crash pads and shared housing. Pick a property to see open beds and apply."
      />

      {result.error !== null ? (
        <ErrorState title="Couldn't load availability" message={result.error} />
      ) : result.data.length === 0 ? (
        <EmptyState
          icon={<BedDouble className="h-5 w-5" />}
          title="No listings yet"
          description="Check back soon — new crash pads are added regularly."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.data.map((p) => (
            <AvailabilityCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}
