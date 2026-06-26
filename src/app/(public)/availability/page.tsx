import { Suspense } from "react";
import { BedDouble } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { AvailabilityCard } from "@/components/availability/AvailabilityCard";
import { AvailabilityFilters } from "@/components/availability/AvailabilityFilters";
import { getAvailableProperties, type AvailabilityFilters as FilterParams } from "@/lib/services/availability";
import type { PropertyOccupancyType } from "@/lib/types";

export const dynamic = "force-dynamic";

interface SearchParams {
  city?: string;
  state?: string;
  occupancy?: string;
  minBeds?: string;
  minRent?: string;
  maxRent?: string;
}

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // Parse search params into filters
  const filters: FilterParams = {};
  if (params.city) filters.city = params.city;
  if (params.state) filters.state = params.state;
  if (params.occupancy) filters.occupancyType = params.occupancy as PropertyOccupancyType;
  if (params.minBeds) filters.minBeds = parseInt(params.minBeds, 10);
  if (params.minRent) filters.minRent = parseInt(params.minRent, 10);
  if (params.maxRent) filters.maxRent = parseInt(params.maxRent, 10);

  const result = await getAvailableProperties(filters);
  const hasFilters = Object.keys(filters).length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Find your monthly stay"
        description="Browse monthly rentals with flexible 30+ day stays. Filter by location, budget, and availability."
      />

      {/* Search filters */}
      <Suspense fallback={<div className="h-24 animate-pulse bg-slate-100 rounded-lg" />}>
        <AvailabilityFilters />
      </Suspense>

      {result.error !== null ? (
        <ErrorState title="Couldn't load listings" message={result.error} />
      ) : result.data.length === 0 ? (
        <EmptyState
          icon={<BedDouble className="h-5 w-5" />}
          title={hasFilters ? "No matches found" : "No listings yet"}
          description={
            hasFilters
              ? "Try adjusting your filters to see more results."
              : "Check back soon — new monthly rentals are added regularly."
          }
        />
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {result.data.length} {result.data.length === 1 ? "listing" : "listings"} found
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.data.map((p) => (
              <AvailabilityCard key={p.id} property={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
