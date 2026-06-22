import { SummaryCard } from "@/components/SummaryCard";
import type { DashboardMetrics } from "@/lib/types";

/**
 * Overview stat cards for the host dashboard home. Cards that depend on a
 * feature (overdue rent, open maintenance) are only rendered when that data
 * exists, so we never show a meaningless zero for an unused feature.
 */
export function HostDashboardStats({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
      <SummaryCard label="Total Properties" value={metrics.totalProperties} />
      <SummaryCard label="Total Beds" value={metrics.totalBeds} />
      <SummaryCard
        label="Vacant Beds"
        value={metrics.beds.vacant}
        accentClassName="bg-emerald-500"
      />
      <SummaryCard
        label="Reserved Beds"
        value={metrics.beds.reserved}
        accentClassName="bg-blue-500"
      />
      <SummaryCard
        label="Occupied Beds"
        value={metrics.beds.occupied}
        accentClassName="bg-slate-700"
      />
      <SummaryCard
        label="Pending Applications"
        value={metrics.pendingApplications}
        accentClassName="bg-amber-500"
      />
      {metrics.overdueRent > 0 && (
        <SummaryCard
          label="Overdue Rent"
          value={metrics.overdueRent}
          accentClassName="bg-red-500"
        />
      )}
      {metrics.openMaintenance > 0 && (
        <SummaryCard
          label="Open Maintenance"
          value={metrics.openMaintenance}
          accentClassName="bg-amber-500"
        />
      )}
    </div>
  );
}
