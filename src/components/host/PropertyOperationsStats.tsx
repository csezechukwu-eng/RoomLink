import { SummaryCard } from "@/components/SummaryCard";
import type { BedStatusCounts } from "@/lib/types";

/**
 * Bed-status summary for a single property, plus optional operational counts
 * (pending applications, open maintenance) shown only when that data exists.
 */
export function PropertyOperationsStats({
  bedCounts,
  pendingApplications,
  openMaintenance,
}: {
  bedCounts: BedStatusCounts;
  pendingApplications: number;
  openMaintenance: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <SummaryCard label="Total beds" value={bedCounts.total} />
      <SummaryCard
        label="Vacant"
        value={bedCounts.vacant}
        accentClassName="bg-emerald-500"
      />
      <SummaryCard
        label="Reserved"
        value={bedCounts.reserved}
        accentClassName="bg-blue-500"
      />
      <SummaryCard
        label="Occupied"
        value={bedCounts.occupied}
        accentClassName="bg-slate-700"
      />
      <SummaryCard
        label="Unavailable"
        value={bedCounts.unavailable}
        accentClassName="bg-slate-300"
      />
      {pendingApplications > 0 && (
        <SummaryCard
          label="Pending applications"
          value={pendingApplications}
          accentClassName="bg-amber-500"
        />
      )}
      {openMaintenance > 0 && (
        <SummaryCard
          label="Open maintenance"
          value={openMaintenance}
          accentClassName="bg-amber-500"
        />
      )}
    </div>
  );
}
