import {
  Building2,
  BedDouble,
  Users,
  DoorOpen,
  CalendarCheck,
  Building,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PropertyFormModal } from "@/components/forms/PropertyFormModal";
import { getProperties, getDashboardMetrics } from "@/lib/queries";
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
    overdueRent: 0,
    openMaintenance: 0,
    availableNow: 0,
    freeingSoon: 0,
  };

  // Show empty state if no properties
  if (properties.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
            <p className="text-slate-500">
              Manage your properties, rooms, beds, and availability.
            </p>
          </div>
          <PropertyFormModal mode="create" triggerLabel="Add Property" />
        </div>

        <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Building className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">
            Add your first property
          </h2>
          <p className="mt-2 max-w-md text-slate-500">
            Start by creating a property, then add rooms and beds.
          </p>
          <div className="mt-6">
            <PropertyFormModal mode="create" triggerLabel="Add Property" />
          </div>
        </Card>
      </div>
    );
  }

  // Transform properties for the client component
  const propertyData = properties.map((p) => {
    const coverPhoto = p.media.find(
      (m) => m.media_type === "property" && m.is_cover
    );
    const firstPhoto = p.media.find((m) => m.media_type === "property");
    const imageUrl = coverPhoto?.public_url || firstPhoto?.public_url || null;
    const propertyPhotoCount = p.media.filter(
      (m) => m.media_type === "property"
    ).length;

    // Real "needs setup" signal: no rooms, no beds, or no property photos.
    const needsSetup =
      p.roomCount === 0 || p.bedCounts.total === 0 || propertyPhotoCount === 0;

    return {
      id: p.id,
      name: p.name,
      address: [p.address, p.city, p.state, p.zip].filter(Boolean).join(", "),
      image: imageUrl,
      is_hidden: p.is_hidden ?? false,
      property_type: p.property_type,
      // Raw fields preserved so the inline Edit form doesn't blank them out.
      edit: {
        id: p.id,
        name: p.name,
        property_type: p.property_type,
        address: p.address,
        city: p.city,
        state: p.state,
        zip: p.zip,
        description: p.description,
        house_rules: p.house_rules,
      },
      rooms: p.roomCount,
      beds: p.bedCounts.total,
      occupied: p.bedCounts.occupied,
      reserved: p.bedCounts.reserved,
      available: p.bedCounts.vacant,
      unavailable: p.bedCounts.unavailable,
      pendingApplications: p.pendingApplications,
      openMaintenance: p.openMaintenance,
      needsSetup,
      photos: p.media,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
          <p className="text-slate-500">
            Manage your properties, rooms, beds, and availability.
          </p>
        </div>
        <PropertyFormModal mode="create" triggerLabel="Add Property" />
      </div>

      {/* Portfolio summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          label="Properties"
          value={metrics.totalProperties}
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
          icon={<DoorOpen className="h-5 w-5" />}
          label="Vacant"
          value={metrics.beds.vacant}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          icon={<CalendarCheck className="h-5 w-5" />}
          label="Reserved"
          value={metrics.beds.reserved}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Occupied"
          value={metrics.beds.occupied}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
        />
      </div>

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
    <Card className="flex items-center gap-3 p-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </Card>
  );
}
