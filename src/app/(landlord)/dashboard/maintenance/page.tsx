import { Wrench, Building } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getProperties } from "@/lib/queries";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const propertiesResult = await getProperties();
  const properties = propertiesResult.data ?? [];

  // Show empty state if no properties
  if (properties.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance</h1>
          <p className="text-slate-500">Track and manage maintenance requests across your properties.</p>
        </div>

        <Card className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Building className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">
            Create a property first
          </h2>
          <p className="mt-2 max-w-md text-slate-500">
            You need to create properties before you can track maintenance requests.
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

  // Show empty maintenance state
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Maintenance</h1>
        <p className="text-slate-500">Track and manage maintenance requests across your properties.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Open Requests" value={0} />
        <StatCard label="In Progress" value={0} />
        <StatCard label="Completed" value={0} />
        <StatCard label="Urgent" value={0} />
      </div>

      <Card className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
          <Wrench className="h-8 w-8 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-xl font-semibold text-slate-900">
          No maintenance requests yet
        </h2>
        <p className="mt-2 max-w-md text-slate-500">
          When tenants submit maintenance requests, they will appear here.
          You can also create requests to track repairs and improvements.
        </p>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </Card>
  );
}
