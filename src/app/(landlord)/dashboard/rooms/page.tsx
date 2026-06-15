import {
  DoorOpen,
  BedDouble,
  Users,
  Building,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { getAllRoomsWithBeds, getDashboardMetrics } from "@/lib/queries";
import { RoomsClient } from "./RoomsClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const [roomsResult, metricsResult] = await Promise.all([
    getAllRoomsWithBeds(),
    getDashboardMetrics(),
  ]);

  const propertiesWithRooms = roomsResult.data ?? [];
  const metrics = metricsResult.data ?? {
    totalProperties: 0,
    totalRooms: 0,
    totalBeds: 0,
    beds: { total: 0, vacant: 0, reserved: 0, occupied: 0, unavailable: 0 },
    pendingApplications: 0,
    activeReservations: 0,
    rentDue: 0,
    openMaintenance: 0,
  };

  // Check if user has any properties
  const hasProperties = propertiesWithRooms.length > 0;
  const hasRooms = propertiesWithRooms.some((p) => p.rooms.length > 0);

  // Show empty state if no properties
  if (!hasProperties) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rooms & Beds</h1>
          <p className="text-slate-500">Manage rooms and beds across all your properties.</p>
        </div>

        {/* Empty State - No Properties */}
        <Card className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Building className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">
            Create a property first
          </h2>
          <p className="mt-2 max-w-md text-slate-500">
            You need to create a property before you can add rooms and beds.
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

  // Show empty state if properties exist but no rooms
  if (!hasRooms) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rooms & Beds</h1>
          <p className="text-slate-500">Manage rooms and beds across all your properties.</p>
        </div>

        {/* Stats Row - All zeros */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={<DoorOpen className="h-5 w-5" />}
            label="Total Rooms"
            value={0}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
          />
          <StatCard
            icon={<BedDouble className="h-5 w-5" />}
            label="Total Beds"
            value={0}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Occupied"
            value={0}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <StatCard
            icon={<DoorOpen className="h-5 w-5" />}
            label="Available"
            value={0}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
        </div>

        {/* Empty State - No Rooms */}
        <Card className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <DoorOpen className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">
            No rooms yet
          </h2>
          <p className="mt-2 max-w-md text-slate-500">
            Add rooms to your properties, then place beds inside them.
            Go to a property detail page to add rooms.
          </p>
          <Link
            href="/dashboard/properties"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            View Properties
          </Link>
        </Card>
      </div>
    );
  }

  // Transform data for client component
  const roomsData = propertiesWithRooms.map((p) => ({
    propertyId: p.property.id,
    propertyName: p.property.name,
    propertyAddress: [p.property.address, p.property.city, p.property.state].filter(Boolean).join(", "),
    rooms: p.rooms.map((r) => ({
      id: r.id,
      name: r.name,
      beds: r.beds.length,
      occupied: r.beds.filter((b) => b.status === "occupied").length,
      reserved: r.beds.filter((b) => b.status === "reserved").length,
      available: r.beds.filter((b) => b.status === "vacant").length,
      bedsList: r.beds.map((b) => ({
        id: b.id,
        label: b.label,
        status: b.status,
        monthlyRate: b.monthly_rent,
      })),
    })),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rooms & Beds</h1>
        <p className="text-slate-500">Manage rooms and beds across all your properties.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<DoorOpen className="h-5 w-5" />}
          label="Total Rooms"
          value={metrics.totalRooms}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatCard
          icon={<BedDouble className="h-5 w-5" />}
          label="Total Beds"
          value={metrics.totalBeds}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Occupied"
          value={metrics.beds.occupied}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          icon={<DoorOpen className="h-5 w-5" />}
          label="Available"
          value={metrics.beds.vacant}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Client-side interactive content */}
      <RoomsClient propertiesWithRooms={roomsData} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </Card>
  );
}
