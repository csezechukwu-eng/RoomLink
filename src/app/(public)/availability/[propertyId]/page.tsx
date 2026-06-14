import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BedDouble,
  DoorOpen,
  Bath,
  Wifi,
  WashingMachine,
  Car,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ErrorState";
import { getAvailabilityDetail } from "@/lib/services/availability";
import { labelForBunkType } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AvailabilityDetailPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const result = await getAvailabilityDetail(propertyId);

  if (result.error !== null) {
    return (
      <div className="space-y-6">
        <BackLink />
        <ErrorState title="Couldn't load this listing" message={result.error} />
      </div>
    );
  }
  if (!result.data) notFound();

  const { property, rooms, totalBeds, vacantBeds } = result.data;
  const location = [property.address, property.city, property.state, property.zip]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <BackLink />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          {property.name}
        </h1>
        {location && (
          <p className="mt-1 text-slate-500">{location}</p>
        )}
      </div>

      {/* Photo Gallery */}
      <PhotoGallery />

      {/* Amenities */}
      <div className="flex flex-wrap gap-4 text-sm">
        <AmenityBadge icon={<BedDouble className="h-4 w-4" />} label={`${totalBeds} Beds`} />
        <AmenityBadge icon={<DoorOpen className="h-4 w-4" />} label={`${rooms.length} Rooms`} />
        <AmenityBadge icon={<Bath className="h-4 w-4" />} label="3 Bathrooms" />
        <AmenityBadge icon={<Wifi className="h-4 w-4" />} label="WiFi" />
        <AmenityBadge icon={<WashingMachine className="h-4 w-4" />} label="Laundry" />
        <AmenityBadge icon={<Car className="h-4 w-4" />} label="Parking" />
      </div>

      {/* About & House Rules */}
      {(property.description || property.house_rules) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {property.description && (
            <Card className="p-5">
              <h2 className="font-semibold text-slate-900">About</h2>
              <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">
                {property.description}
              </p>
            </Card>
          )}
          {property.house_rules && (
            <Card className="p-5">
              <h2 className="font-semibold text-slate-900">House Rules</h2>
              <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">
                {property.house_rules}
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Available Beds Section */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Available Beds</h2>

        {rooms.length === 0 ? (
          <p className="text-sm text-slate-500">No rooms listed yet.</p>
        ) : (
          <div className="space-y-4">
            {rooms.map((room) => {
              const availableCount = room.beds.filter((b) => b.status === "vacant").length;
              const occupiedCount = room.beds.filter((b) => b.status === "occupied").length;

              return (
                <Card key={room.id} className="overflow-hidden">
                  {/* Room Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-900">{room.name}</h3>
                      <span className="text-sm text-slate-500">
                        {room.beds.length} Beds · {occupiedCount} Occupied · {availableCount} Available
                      </span>
                    </div>
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  </div>

                  {/* Beds List */}
                  <div className="divide-y divide-slate-100">
                    {room.beds.map((bed) => (
                      <div
                        key={bed.id}
                        className="flex items-center justify-between px-5 py-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-slate-900">{bed.label}</span>
                            <span className="text-sm text-slate-500">
                              ({labelForBunkType(bed.bunk_type)})
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatCurrency(bed.monthly_rent)} / month · Deposit: {formatCurrency(bed.deposit_amount)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {bed.status === "vacant" ? (
                            <>
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                Available
                              </span>
                              <Link href={`/apply/${bed.id}`}>
                                <Button size="sm">Apply</Button>
                              </Link>
                            </>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              {bed.status === "occupied" ? "Occupied" : bed.status === "reserved" ? "Reserved" : "Unavailable"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {room.beds.length === 0 && (
                      <p className="px-5 py-4 text-sm text-slate-500">No beds in this room.</p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/availability"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Properties
    </Link>
  );
}

function PhotoGallery() {
  return (
    <div className="grid gap-2 sm:grid-cols-4 sm:grid-rows-2">
      {/* Main large image */}
      <div className="relative sm:col-span-2 sm:row-span-2">
        <div className="h-64 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 sm:h-full" />
      </div>
      {/* Smaller images */}
      <div className="hidden sm:block">
        <div className="h-32 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200" />
      </div>
      <div className="hidden sm:block">
        <div className="h-32 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200" />
      </div>
      <div className="hidden sm:block">
        <div className="h-32 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200" />
      </div>
      <div className="hidden sm:block relative">
        <div className="h-32 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200" />
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-900/60">
          <span className="text-lg font-semibold text-white">+12</span>
        </div>
      </div>
    </div>
  );
}

function AmenityBadge({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
      <span className="text-slate-400">{icon}</span>
      {label}
    </span>
  );
}
