import Link from "next/link";
import {
  Building,
  ClipboardList,
  Activity,
  CalendarClock,
  ArrowRight,
  Beaker,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HostDashboardStats } from "@/components/host/HostDashboardStats";
import { HostPriorityPanel } from "@/components/host/HostPriorityPanel";
import { PropertyFormModal } from "@/components/forms/PropertyFormModal";
import { getDashboardMetrics } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import type { DashboardMetrics } from "@/lib/types";

export const dynamic = "force-dynamic";

const EMPTY_METRICS: DashboardMetrics = {
  totalProperties: 0,
  totalRooms: 0,
  totalBeds: 0,
  beds: { total: 0, vacant: 0, reserved: 0, occupied: 0, unavailable: 0 },
  pendingApplications: 0,
  activeReservations: 0,
  rentDue: 0,
  overdueRent: 0,
  openMaintenance: 0,
  availableNow: 0,
  freeingSoon: 0,
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  let metrics = EMPTY_METRICS;
  try {
    const result = await getDashboardMetrics();
    if (result.data) metrics = result.data;
  } catch {
    // Show empty state if the database isn't configured.
  }

  const hasProperties = metrics.totalProperties > 0;

  // Empty state for brand-new accounts.
  if (!hasProperties) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {userName}
          </h1>
          <p className="text-slate-500">
            Here&apos;s what needs your attention today.
          </p>
        </div>

        <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Building className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">
            Add your first property
          </h2>
          <p className="mt-2 max-w-md text-slate-500">
            Start by creating a property, then add rooms and beds. Once you do,
            your operations dashboard comes to life.
          </p>
          <div className="mt-6">
            <PropertyFormModal mode="create" triggerLabel="Add Property" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {userName}
          </h1>
          <p className="text-slate-500">
            Here&apos;s what needs your attention today.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PropertyFormModal mode="create" triggerLabel="Add Property" />
          <Link href="/dashboard/applications">
            <Button variant="outline">
              <ClipboardList className="h-4 w-4" />
              View Applications
            </Button>
          </Link>
          <Link href="/dashboard/demo">
            <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
              <Beaker className="h-4 w-4" />
              Demo Test Center
            </Button>
          </Link>
        </div>
      </div>

      {/* Live availability banner */}
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
            <CalendarClock className="h-5 w-5 text-emerald-600" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Live availability</p>
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-emerald-600">
                {metrics.availableNow}
              </span>{" "}
              {metrics.availableNow === 1 ? "bed" : "beds"} open now
              <span className="px-1.5 text-slate-300">·</span>
              <span className="font-semibold text-amber-600">
                {metrics.freeingSoon}
              </span>{" "}
              freeing up in 30 days
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/properties"
          className="inline-flex items-center gap-1 self-start text-sm font-medium text-indigo-600 hover:text-indigo-700 sm:self-auto"
        >
          Manage availability
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>

      {/* Overview stats */}
      <HostDashboardStats metrics={metrics} />

      {/* Priorities + activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HostPriorityPanel metrics={metrics} />
        </div>

        <Card className="flex flex-col p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            A live feed of changes across your portfolio.
          </p>
          <div className="mt-5 flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
            <Activity className="h-7 w-7 text-slate-400" />
            <p className="mt-3 text-sm font-medium text-slate-700">
              Activity tracking coming soon
            </p>
            <p className="mt-1 text-sm text-slate-500">
              We&apos;ll surface recent applications, payments, and move-ins here.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
