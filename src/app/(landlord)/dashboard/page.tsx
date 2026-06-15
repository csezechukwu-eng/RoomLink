import Link from "next/link";
import {
  AlertCircle,
  Clock,
  Wrench,
  CalendarClock,
  ChevronDown,
  Building,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboardMetrics, getProperties } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Get current user for personalized greeting
  const user = await getCurrentUser();
  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  // Try to fetch real data
  let metrics = {
    totalBeds: 0,
    totalRooms: 0,
    totalProperties: 0,
    beds: { total: 0, vacant: 0, reserved: 0, occupied: 0, unavailable: 0 },
    pendingApplications: 0,
    activeReservations: 0,
    rentDue: 0,
    openMaintenance: 0,
  };
  let selectedPropertyName = "";
  let hasProperties = false;

  try {
    const [metricsResult, propertiesResult] = await Promise.all([
      getDashboardMetrics(),
      getProperties(),
    ]);

    if (metricsResult.data) {
      metrics = metricsResult.data;
    }
    if (propertiesResult.data && propertiesResult.data.length > 0) {
      selectedPropertyName = propertiesResult.data[0].name;
      hasProperties = true;
    }
  } catch {
    // Show empty state if database is not configured or error occurs
  }

  // Show empty state for new accounts with no properties
  if (!hasProperties) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Welcome, {userName}!</p>
        </div>

        {/* Empty State */}
        <Card className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Building className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">
            You have no properties yet
          </h2>
          <p className="mt-2 max-w-md text-slate-500">
            Create your first crash pad to get started. Once you add properties,
            rooms, and beds, you&apos;ll see your dashboard come to life.
          </p>
          <Link href="/dashboard/properties/new" className="mt-6">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Property
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Welcome back, {userName}!</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
          {selectedPropertyName}
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Beds" value={metrics.totalBeds} />
        <StatCard label="Occupied" value={metrics.beds.occupied} />
        <StatCard label="Reserved" value={metrics.beds.reserved} color="indigo" />
        <StatCard label="Available" value={metrics.beds.vacant} color="emerald" />
        <StatCard label="Late Payments" value={metrics.rentDue} color="red" />
      </div>

      {/* Main Content - Occupancy & Rent Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Occupancy Overview */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Occupancy Overview</h2>

          {/* Room Grid */}
          <div className="grid grid-cols-2 gap-4">
            <RoomOccupancyCard
              name="Room A"
              beds={4}
              bedLabels={["A1", "A2", "A3", "A4"]}
              bedStatuses={["occupied", "occupied", "occupied", "available"]}
            />
            <RoomOccupancyCard
              name="Room B"
              beds={4}
              bedLabels={["B1", "B2", "B3", "B4"]}
              bedStatuses={["occupied", "occupied", "occupied", "occupied"]}
            />
            <RoomOccupancyCard
              name="Room C"
              beds={4}
              bedLabels={["C1", "C2", "C3", "C4"]}
              bedStatuses={["occupied", "occupied", "occupied", "available"]}
            />
            <RoomOccupancyCard
              name="Room D"
              beds={4}
              bedLabels={["D1", "D2", "D3", "D4"]}
              bedStatuses={["occupied", "occupied", "occupied", "unavailable"]}
            />
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-6 text-xs text-slate-600">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-indigo-600" />
              Occupied
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-500" />
              Reserved
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              Available
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-slate-300" />
              Unavailable
            </span>
          </div>
        </Card>

        {/* Rent Overview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Rent Overview</h2>
            <ChevronDown className="h-5 w-5 text-slate-400" />
          </div>

          <div className="flex items-center gap-6">
            {/* Donut Chart */}
            <div className="relative h-40 w-40 shrink-0">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                {/* Background circle */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="4"
                />
                {/* Collected (green) */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeDasharray="75 100"
                  strokeLinecap="round"
                  className="pie-segment"
                />
                {/* Pending (blue) */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="4"
                  strokeDasharray="15 100"
                  strokeDashoffset="-75"
                  strokeLinecap="round"
                  className="pie-segment"
                />
                {/* Late (red) */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="4"
                  strokeDasharray="10 100"
                  strokeDashoffset="-90"
                  strokeLinecap="round"
                  className="pie-segment"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">$9,450</span>
                <span className="text-xs text-slate-500">Expected</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-slate-600">Collected</span>
                <span className="ml-auto text-sm font-semibold text-slate-900">$8,150</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm text-slate-600">Pending</span>
                <span className="ml-auto text-sm font-semibold text-slate-900">$1,300</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm text-slate-600">Late</span>
                <span className="ml-auto text-sm font-semibold text-slate-900">$650</span>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/rent"
            className="mt-6 block w-full rounded-lg border border-slate-200 py-2 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            View All
          </Link>
        </Card>
      </div>

      {/* Bottom Section - Recent Applications & Tasks */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Applications */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Applications</h2>

          <div className="space-y-4">
            <ApplicationRow
              name="James Carter"
              room="Room B / Bed 3"
              moveIn="Jul 15, 2024"
              status="submitted"
            />
            <ApplicationRow
              name="Trey Mitchell"
              room="Room C / Bed 2"
              moveIn="Aug 1, 2024"
              status="under_review"
            />
            <ApplicationRow
              name="Chris Johnson"
              room="Room D / Bed 1"
              moveIn="Jul 20, 2024"
              status="submitted"
            />
            <ApplicationRow
              name="Andre Lewis"
              room="Room A / Bed 4"
              moveIn="Jul 10, 2024"
              status="submitted"
            />
          </div>

          <Link
            href="/dashboard/applications"
            className="mt-6 block text-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View All
          </Link>
        </Card>

        {/* Tasks */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Tasks</h2>

          <div className="space-y-4">
            <TaskRow
              icon={<AlertCircle className="h-4 w-4" />}
              text="2 late payments"
              color="red"
            />
            <TaskRow
              icon={<Clock className="h-4 w-4" />}
              text="4 applications waiting"
              color="amber"
            />
            <TaskRow
              icon={<Wrench className="h-4 w-4" />}
              text="1 maintenance requests"
              color="blue"
            />
            <TaskRow
              icon={<CalendarClock className="h-4 w-4" />}
              text="1 move-out notice"
              color="slate"
            />
          </div>

          <Link
            href="/dashboard/applications"
            className="mt-6 block text-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View All Tasks
          </Link>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: "indigo" | "emerald" | "red";
}) {
  const valueColors = {
    indigo: "text-indigo-600",
    emerald: "text-emerald-600",
    red: "text-red-600",
  };

  return (
    <Card className="p-4">
      <p className={`text-3xl font-bold ${color ? valueColors[color] : "text-slate-900"}`}>
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </Card>
  );
}

function RoomOccupancyCard({
  name,
  beds,
  bedLabels,
  bedStatuses,
}: {
  name: string;
  beds: number;
  bedLabels: string[];
  bedStatuses: ("occupied" | "reserved" | "available" | "unavailable")[];
}) {
  const statusColors = {
    occupied: "bg-indigo-600 text-white",
    reserved: "bg-blue-500 text-white",
    available: "bg-emerald-500 text-white",
    unavailable: "bg-slate-200 text-slate-500",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3">
        <h3 className="font-semibold text-slate-900">{name}</h3>
        <p className="text-xs text-slate-500">{beds} Beds</p>
      </div>
      <div className="flex gap-2">
        {bedLabels.map((label, i) => (
          <div
            key={label}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${statusColors[bedStatuses[i]]}`}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplicationRow({
  name,
  room,
  moveIn,
  status,
}: {
  name: string;
  room: string;
  moveIn: string;
  status: "submitted" | "under_review";
}) {
  const statusStyles = {
    submitted: "bg-emerald-50 text-emerald-700",
    under_review: "bg-amber-50 text-amber-700",
  };

  const statusLabels = {
    submitted: "Submitted",
    under_review: "Under Review",
  };

  // Generate initials from name
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div className="flex items-center gap-3">
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
        {initials}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">{room}</p>
      </div>

      {/* Move-in Date */}
      <div className="hidden text-right sm:block">
        <p className="text-xs text-slate-500">Move-in: {moveIn}</p>
      </div>

      {/* Status Badge */}
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}
      >
        {statusLabels[status]}
      </span>
    </div>
  );
}

function TaskRow({
  icon,
  text,
  color,
}: {
  icon: React.ReactNode;
  text: string;
  color: "red" | "amber" | "blue" | "slate";
}) {
  const colors = {
    red: "text-red-600",
    amber: "text-amber-600",
    blue: "text-blue-600",
    slate: "text-slate-600",
  };

  const bgColors = {
    red: "bg-red-50",
    amber: "bg-amber-50",
    blue: "bg-blue-50",
    slate: "bg-slate-50",
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${bgColors[color]}`}>
        <span className={colors[color]}>{icon}</span>
      </div>
      <span className={`text-sm font-medium ${colors[color]}`}>{text}</span>
    </div>
  );
}
