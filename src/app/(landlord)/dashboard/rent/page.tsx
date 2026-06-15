import { DollarSign, Building } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getProperties } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RentPage() {
  const propertiesResult = await getProperties();
  const properties = propertiesResult.data ?? [];

  // Show empty state if no properties
  if (properties.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rent & Payments</h1>
          <p className="text-slate-500">Track rent payments and manage charges across your properties.</p>
        </div>

        <Card className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Building className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">
            Create a property first
          </h2>
          <p className="mt-2 max-w-md text-slate-500">
            You need to create properties with beds and tenants before you can track rent payments.
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

  // Show empty rent state
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rent & Payments</h1>
        <p className="text-slate-500">Track rent payments and manage charges across your properties.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Expected This Month" value={formatCurrency(0)} />
        <StatCard label="Collected" value={formatCurrency(0)} color="emerald" />
        <StatCard label="Outstanding" value={formatCurrency(0)} color="amber" />
        <StatCard label="Overdue" value={formatCurrency(0)} color="red" />
      </div>

      <Card className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
          <DollarSign className="h-8 w-8 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-xl font-semibold text-slate-900">
          No rent charges yet
        </h2>
        <p className="mt-2 max-w-md text-slate-500">
          When you have active tenants, you can create rent charges and track payments here.
          Start by adding rooms and beds to your properties.
        </p>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  color = "slate"
}: {
  label: string;
  value: string;
  color?: "slate" | "emerald" | "amber" | "red";
}) {
  const colorClasses = {
    slate: "text-slate-900",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-600",
  };

  return (
    <Card className="p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
    </Card>
  );
}
