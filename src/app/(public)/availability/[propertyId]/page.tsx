import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BedDouble,
  DoorOpen,
  ChevronDown,
  ImageIcon,
  Calendar,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ErrorState";
import { getAvailabilityDetail } from "@/lib/services/availability";
import { labelForBunkType, labelForOccupancyType } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { computeBedAvailability } from "@/lib/bedAvailability";
import type { PropertyMedia } from "@/lib/types";

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

  const { property, rooms, totalBeds, media } = result.data;
  const propertyPhotos = media.filter((m) => m.media_type === "property");
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
      <PhotoGallery photos={propertyPhotos} />

      {/* Monthly Stay Notice */}
      <div className="flex items-start gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
        <Calendar className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-indigo-900">Monthly Stay Rental</p>
          <p className="text-sm text-indigo-700">
            Minimum 30-day stay required. Rent is collected monthly.
          </p>
        </div>
      </div>

      {/* Property Info */}
      <div className="flex flex-wrap gap-4 text-sm">
        <AmenityBadge icon={<BedDouble className="h-4 w-4" />} label={`${totalBeds} Beds`} />
        <AmenityBadge icon={<DoorOpen className="h-4 w-4" />} label={`${rooms.length} Rooms`} />
        <AmenityBadge icon={<Calendar className="h-4 w-4" />} label="Min 30 days" />
        {property.occupancy_type && (
          <AmenityBadge
            icon={<Users className="h-4 w-4" />}
            label={labelForOccupancyType(property.occupancy_type)}
          />
        )}
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

      {/* Beds & Pricing */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Beds & Monthly Pricing</h2>

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
                                {computeBedAvailability(bed).label}
                              </span>
                              <Link href={`/apply/${bed.id}`}>
                                <Button size="sm">Request Stay</Button>
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
      Back to Listings
    </Link>
  );
}

function PhotoGallery({ photos }: { photos: PropertyMedia[] }) {
  // Show placeholder if no photos
  if (photos.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-2 text-sm text-slate-500">No photos yet</p>
        </div>
      </div>
    );
  }

  // Sort to put cover photo first
  const sortedPhotos = [...photos].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return a.sort_order - b.sort_order;
  });

  const mainPhoto = sortedPhotos[0];
  const smallPhotos = sortedPhotos.slice(1, 5);
  const remainingCount = sortedPhotos.length - 5;

  return (
    <div className="grid gap-2 sm:grid-cols-4 sm:grid-rows-2">
      {/* Main large image */}
      <div className="relative sm:col-span-2 sm:row-span-2">
        <div className="relative h-64 overflow-hidden rounded-xl sm:h-full">
          {mainPhoto.public_url ? (
            <Image
              src={mainPhoto.public_url}
              alt={mainPhoto.alt_text || "Property photo"}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="h-full bg-gradient-to-br from-slate-200 to-slate-300" />
          )}
        </div>
      </div>
      {/* Smaller images */}
      {smallPhotos.map((photo, index) => (
        <div key={photo.id} className="hidden sm:block">
          <div className="relative h-32 overflow-hidden rounded-xl">
            {photo.public_url ? (
              <Image
                src={photo.public_url}
                alt={photo.alt_text || "Property photo"}
                fill
                className="object-cover"
                sizes="25vw"
              />
            ) : (
              <div className="h-full bg-gradient-to-br from-slate-100 to-slate-200" />
            )}
            {/* Show remaining count on last visible small photo */}
            {index === smallPhotos.length - 1 && remainingCount > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60">
                <span className="text-lg font-semibold text-white">
                  +{remainingCount}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
      {/* Fill empty slots with placeholders if less than 4 small photos */}
      {Array.from({ length: Math.max(0, 4 - smallPhotos.length) }).map(
        (_, index) => (
          <div key={`placeholder-${index}`} className="hidden sm:block">
            <div className="h-32 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200" />
          </div>
        )
      )}
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
