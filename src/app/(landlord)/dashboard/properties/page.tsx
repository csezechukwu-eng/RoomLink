import {
  Building2,
  BedDouble,
  Users,
  DoorOpen,
  DollarSign,
  Building,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PropertyFormModal } from "@/components/forms/PropertyFormModal";
import { getProperties, getDashboardMetrics } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";
import { PropertiesClient } from "./PropertiesClient";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const [propertiesResult, metricsResult] = await Promise.all([
    getProperties(),
    getDashboardMetrics(),
  ]);

  const properties = propertiesResult.data ?? [];
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

  // Show empty state if no properties
  if (properties.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
            <p className="text-slate-500">Manage all of your crash pads and room-rental properties.</p>
          </div>
          <PropertyFormModal mode="create" triggerLabel="Add Property" />
        </div>

        {/* Empty State */}
        <Card className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Building className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">
            No properties yet
          </h2>
          <p className="mt-2 max-w-md text-slate-500">
            Create your first property to get started. Once you add properties,
            rooms, and beds, you&apos;ll see them here.
          </p>
          <div className="mt-6">
            <PropertyFormModal mode="create" triggerLabel="Create Your First Property" />
          </div>
        </Card>
      </div>
    );
  }

  // Transform properties for the client component
  const propertyData = properties.map((p) => {
    // Get cover photo URL if available
    const coverPhoto = p.media.find(
      (m) => m.media_type === "property" && m.is_cover
    );
    const firstPhoto = p.media.find((m) => m.media_type === "property");
    const imageUrl = coverPhoto?.public_url || firstPhoto?.public_url || null;

    return {
      id: p.id,
      name: p.name,
      address: [p.address, p.city, p.state, p.zip].filter(Boolean).join(", "),
      image: imageUrl,
      status: "active" as const,
      is_hidden: p.is_hidden ?? false,
      beds: p.bedCounts.total,
      occupied: p.bedCounts.occupied,
      reserved: p.bedCounts.reserved,
      available: p.bedCounts.vacant,
      revenue: 0, // Will be populated when we add rent tracking
      property_type: p.property_type,
      description: p.description,
      house_rules: p.house_rules,
      photos: p.media,
    };
  });

  const totals = {
    properties: properties.length,
    totalBeds: metrics.totalBeds,
    occupied: metrics.beds.occupied,
    vacant: metrics.beds.vacant,
    revenue: 0, // Will be populated when we add rent tracking
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
          <p className="text-slate-500">Manage all of your crash pads and room-rental properties.</p>
        </div>
        <PropertyFormModal mode="create" triggerLabel="Add Property" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          label="Properties"
          value={totals.properties}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatCard
          icon={<BedDouble className="h-5 w-5" />}
          label="Total Beds"
          value={totals.totalBeds}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Occupied"
          value={totals.occupied}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          icon={<DoorOpen className="h-5 w-5" />}
          label="Vacant"
          value={totals.vacant}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Monthly Revenue"
          value={formatCurrency(totals.revenue)}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
      </div>

      {/* Client-side interactive content */}
      <PropertiesClient properties={propertyData} />
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
  value: number | string;
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
