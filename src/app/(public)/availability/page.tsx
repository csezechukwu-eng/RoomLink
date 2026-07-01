import { Suspense } from "react";
import { BedDouble } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { AvailabilityCard } from "@/components/availability/AvailabilityCard";
import { AvailabilityFilters } from "@/components/availability/AvailabilityFilters";
import { SearchBar } from "@/components/availability/SearchBar";
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
  amenities?: string;
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
  const hasFilters = Object.keys(filters).length > 0 || !!params.amenities;

  return (
    <div className="space-y-6">
      {/* Airbnb-style Search Bar */}
      <div className="flex justify-center py-2">
        <Suspense fallback={<div className="h-14 w-full max-w-2xl animate-pulse bg-slate-100 rounded-full" />}>
          <SearchBar className="w-full max-w-2xl" />
        </Suspense>
      </div>

      {/* Filter Pills */}
      <div className="border-b pb-4">
        <Suspense fallback={<div className="h-12 animate-pulse bg-slate-100 rounded-lg" />}>
          <AvailabilityFilters />
        </Suspense>
      </div>

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
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-slate-900">
              {result.data.length === 1
                ? "1 monthly stay"
                : `${result.data.length} monthly stays`}
            </h1>
          </div>

          {/* Property Grid - Airbnb style 4 columns */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.data.map((p) => (
              <AvailabilityCard key={p.id} property={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
