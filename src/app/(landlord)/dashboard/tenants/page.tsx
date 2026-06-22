import Link from "next/link";
import { Users, Building } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SummaryCard } from "@/components/SummaryCard";
import { TenantRoster } from "@/components/host/TenantRoster";
import { MoveBoard } from "@/components/host/MoveBoard";
import { getProperties, getRoster } from "@/lib/queries";
import { splitRoster } from "@/lib/tenantOps";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const [propertiesResult, rosterResult] = await Promise.all([
    getProperties(),
    getRoster(),
  ]);
  const properties = propertiesResult.data ?? [];
  const roster = rosterResult.data ?? [];

  // No properties at all → guide to create one.
  if (properties.length === 0) {
    return (
      <div className="space-y-6">
        <Header />
        <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Building className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">
            Create a property first
          </h2>
          <p className="mt-2 max-w-md text-slate-500">
            Add a property with beds, then approve applications to place tenants.
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

  const { movingIn, movingOut } = splitRoster(roster);
  const unpaid = roster.filter(
    (e) => e.rentStatus === "due" || e.rentStatus === "overdue"
  ).length;

  // Properties exist but no tenants placed yet.
  if (roster.length === 0) {
    return (
      <div className="space-y-6">
        <Header />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Total tenants" value={0} />
          <SummaryCard label="Moving in" value={0} />
          <SummaryCard label="Moving out soon" value={0} />
          <SummaryCard label="Unpaid" value={0} />
        </div>
        <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Users className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">No tenants yet</h2>
          <p className="mt-2 max-w-md text-slate-500">
            When you approve an application, a reservation is created and the
            tenant shows up here with their bed, lease, deposit, and rent status.
          </p>
          <Link
            href="/dashboard/applications"
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Review applications
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total tenants" value={roster.length} />
        <SummaryCard
          label="Moving in"
          value={movingIn.length}
          accentClassName="bg-emerald-500"
        />
        <SummaryCard
          label="Moving out soon"
          value={movingOut.length}
          accentClassName="bg-amber-500"
        />
        <SummaryCard
          label="Unpaid"
          value={unpaid}
          accentClassName="bg-red-500"
        />
      </div>

      <MoveBoard entries={roster} showProperty />

      <TenantRoster entries={roster} showProperty enableFilters />
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
      <p className="text-slate-500">
        Everyone housed across your properties — bed, lease, deposit, and rent at a glance.
      </p>
    </div>
  );
}
