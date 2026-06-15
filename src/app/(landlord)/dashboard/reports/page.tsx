import { TrendingUp, Building } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getProperties } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const propertiesResult = await getProperties();
  const properties = propertiesResult.data ?? [];

  // Show empty state if no properties
  if (properties.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500">View analytics and reports for your properties.</p>
        </div>

        <Card className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Building className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">
            Create a property first
          </h2>
          <p className="mt-2 max-w-md text-slate-500">
            You need to create properties before you can view reports and analytics.
            Go to Properties to get started.
          </p>
          <Link
            href="/dashboard/properties"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Go to Properties
          </Link>
        </Card>
      </div>
    );
  }

  // Show empty reports state (with basic structure for when data exists)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-500">View analytics and reports for your properties.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Revenue" value={formatCurrency(0)} />
        <StatCard label="Occupancy Rate" value="0%" />
        <StatCard label="Avg. Monthly Revenue" value={formatCurrency(0)} />
        <StatCard label="Properties" value={properties.length} />
      </div>

      <Card className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
          <TrendingUp className="h-8 w-8 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-xl font-semibold text-slate-900">
          Not enough data yet
        </h2>
        <p className="mt-2 max-w-md text-slate-500">
          Add rooms and beds to your properties, then accept tenants to start
          tracking occupancy and revenue analytics.
        </p>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </Card>
  );
}
