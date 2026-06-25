import { BedDouble, SearchX } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { AvailabilityCard } from "@/components/availability/AvailabilityCard";
import { SearchFilters } from "@/components/availability/SearchFilters";
import {
  getAvailableProperties,
  type AvailabilitySearch,
} from "@/lib/services/availability";
import type { OccupancyType } from "@/lib/types";

export const dynamic = "force-dynamic";

type RawParams = Record<string, string | string[] | undefined>;

function str(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  const trimmed = s?.trim();
  return trimmed ? trimmed : undefined;
}

function num(v: string | string[] | undefined): number | undefined {
  const s = str(v);
  if (s === undefined) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

const OCCUPANCY_VALUES: OccupancyType[] = [
  "co_ed",
  "women_only_house",
  "women_only_rooms",
];

function parseSearch(params: RawParams): AvailabilitySearch {
  const occRaw = str(params.occupancy);
  const occupancy =
    occRaw && OCCUPANCY_VALUES.includes(occRaw as OccupancyType)
      ? (occRaw as OccupancyType)
      : undefined;
  return {
    city: str(params.city),
    state: str(params.state),
    occupancy,
    minBeds: num(params.minBeds),
    rentMin: num(params.rentMin),
    rentMax: num(params.rentMax),
    moveIn: str(params.moveIn),
  };
}

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const search = parseSearch(params);
  const hasFilters = Object.values(search).some((v) => v !== undefined);

  const result = await getAvailableProperties(search);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Find a monthly stay"
        description="Browse crash pads, shared housing, and rooms. Every stay is a 30-day minimum — search by location, move-in, and occupancy."
      />

      <SearchFilters values={search} />

      {result.error !== null ? (
        <ErrorState title="Couldn't load listings" message={result.error} />
      ) : result.data.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={<SearchX className="h-5 w-5" />}
            title="No listings match your search"
            description="Try widening your filters — a different city, occupancy type, or rent range."
          />
        ) : (
          <EmptyState
            icon={<BedDouble className="h-5 w-5" />}
            title="No listings yet"
            description="Check back soon — new crash pads are added regularly."
          />
        )
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {result.data.length} listing{result.data.length === 1 ? "" : "s"}
            {hasFilters ? " match your search" : " available"}
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
