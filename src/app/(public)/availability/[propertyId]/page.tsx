import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BedDouble,
  DoorOpen,
  Users,
  ShieldCheck,
  CalendarDays,
  Camera,
  MapPin,
  ChevronDown,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ErrorState";
import { getAvailabilityDetail } from "@/lib/services/availability";
import { labelForBunkType, labelForOccupancyType } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { computeBedAvailability } from "@/lib/bedAvailability";
import type { Bed, PropertyMedia } from "@/lib/types";

export const dynamic = "force-dynamic";

const MIN_STAY_COPY =
  "Room Link is built for monthly stays. The minimum booking period is 30 days.";

function rentRange(beds: Bed[]): string | null {
  const rents = beds.map((b) => Number(b.monthly_rent)).filter((n) => n > 0);
  if (rents.length === 0) return null;
  const min = Math.min(...rents);
  const max = Math.max(...rents);
  return min === max
    ? formatCurrency(min)
    : `${formatCurrency(min)}–${formatCurrency(max)}`;
}

function depositRange(beds: Bed[]): string | null {
  const deposits = beds.map((b) => Number(b.deposit_amount)).filter((n) => n > 0);
  if (deposits.length === 0) return null;
  const min = Math.min(...deposits);
  const max = Math.max(...deposits);
  return min === max
    ? formatCurrency(min)
    : `${formatCurrency(min)}–${formatCurrency(max)}`;
}

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

  const { property, rooms, totalBeds, vacantBeds, media } = result.data;
  const propertyPhotos = media.filter((m) => m.media_type === "property");
  const location = [property.address, property.city, property.state, property.zip]
    .filter(Boolean)
    .join(", ");

  const allBeds = rooms.flatMap((r) => r.beds);
  const vacant = allBeds.filter((b) => b.status === "vacant");
  // Price/deposit shown for what a tenant can actually book (vacant beds);
  // fall back to the whole house if nothing is currently open.
  const priceSource = vacant.length > 0 ? vacant : allBeds;
  const rent = rentRange(priceSource);
  const deposit = depositRange(priceSource);
  const hasVacancy = vacantBeds > 0;

  return (
    <div className="space-y-6">
      <BackLink />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          {property.name}
        </h1>
        {location && (
          <p className="mt-1 flex items-center gap-1.5 text-slate-500">
            <MapPin className="h-4 w-4 shrink-0" />
            {location}
          </p>
        )}
      </div>

      {/* Photo Gallery */}
      <PhotoGallery photos={propertyPhotos} />

      {/* Key facts (real data only — no placeholder amenities) */}
      <div className="flex flex-wrap gap-3 text-sm">
        <Fact icon={<Users className="h-4 w-4" />} label={`Sleeps ${totalBeds}`} />
        <Fact
          icon={<BedDouble className="h-4 w-4" />}
          label={`${vacantBeds} of ${totalBeds} beds open`}
        />
        <Fact icon={<DoorOpen className="h-4 w-4" />} label={`${rooms.length} rooms`} />
        <Fact
          icon={<ShieldCheck className="h-4 w-4" />}
          label={labelForOccupancyType(property.occupancy_type)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: about, rules, beds */}
        <div className="space-y-6 lg:col-span-2">
          {/* About & House Rules */}
          {(property.description || property.house_rules) && (
            <div className="grid gap-6 sm:grid-cols-2">
              {property.description && (
                <Card className="p-5">
                  <h2 className="font-semibold text-slate-900">About</h2>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                    {property.description}
                  </p>
                </Card>
              )}
              {property.house_rules && (
                <Card className="p-5">
                  <h2 className="font-semibold text-slate-900">House rules</h2>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                    {property.house_rules}
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* Available Beds Section */}
          <div id="available-beds" className="scroll-mt-20">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Available beds
            </h2>

            {rooms.length === 0 ? (
              <p className="text-sm text-slate-500">No rooms listed yet.</p>
            ) : (
              <div className="space-y-4">
                {rooms.map((room) => {
                  const availableCount = room.beds.filter(
                    (b) => b.status === "vacant"
                  ).length;
                  const occupiedCount = room.beds.filter(
                    (b) => b.status === "occupied"
                  ).length;

                  return (
                    <Card key={room.id} className="overflow-hidden">
                      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-slate-900">
                            {room.name}
                          </h3>
                          <span className="text-sm text-slate-500">
                            {room.beds.length} beds · {occupiedCount} occupied ·{" "}
                            {availableCount} available
                          </span>
                        </div>
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      </div>

                      <div className="divide-y divide-slate-100">
                        {room.beds.map((bed) => (
                          <div
                            key={bed.id}
                            className="flex items-center justify-between px-5 py-4"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-slate-900">
                                  {bed.label}
                                </span>
                                <span className="text-sm text-slate-500">
                                  ({labelForBunkType(bed.bunk_type)})
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-slate-500">
                                {formatCurrency(bed.monthly_rent)} / month ·
                                Deposit: {formatCurrency(bed.deposit_amount)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              {bed.status === "vacant" ? (
                                <>
                                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                    {computeBedAvailability(bed).label}
                                  </span>
                                  <Link href={`/apply/${bed.id}`}>
                                    <Button size="sm">Request</Button>
                                  </Link>
                                </>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                  {bed.status === "occupied"
                                    ? "Occupied"
                                    : bed.status === "reserved"
                                      ? "Reserved"
                                      : "Unavailable"}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {room.beds.length === 0 && (
                          <p className="px-5 py-4 text-sm text-slate-500">
                            No beds in this room.
                          </p>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: booking summary (sticky on desktop) */}
        <aside className="lg:col-span-1">
          <Card className="p-5 lg:sticky lg:top-20">
            <div className="flex items-baseline gap-1">
              {rent ? (
                <>
                  <span className="text-2xl font-bold text-slate-900">{rent}</span>
                  <span className="text-slate-500">/month</span>
                </>
              ) : (
                <span className="text-lg font-semibold text-slate-700">
                  Pricing varies
                </span>
              )}
            </div>

            <dl className="mt-4 space-y-2.5 text-sm">
              <SummaryRow label="Deposit" value={deposit ?? "No deposit"} />
              <SummaryRow
                label="Occupancy"
                value={labelForOccupancyType(property.occupancy_type)}
              />
              <SummaryRow label="House capacity" value={`${totalBeds} beds`} />
              <SummaryRow
                label="Available now"
                value={`${vacantBeds} bed${vacantBeds === 1 ? "" : "s"}`}
              />
            </dl>

            {/* Minimum stay note + required copy */}
            <div className="mt-4 rounded-lg bg-indigo-50 p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-indigo-900">
                <CalendarDays className="h-4 w-4" />
                Minimum stay: 30 days
              </p>
              <p className="mt-1 text-xs leading-relaxed text-indigo-700">
                {MIN_STAY_COPY}
              </p>
            </div>

            {/* CTA */}
            {hasVacancy ? (
              <Link href="#available-beds" className="mt-4 block">
                <Button className="w-full">Request monthly stay</Button>
              </Link>
            ) : (
              <Button className="mt-4 w-full" disabled>
                No beds currently available
              </Button>
            )}

            {/* Checkout photo requirement (informational only) */}
            <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
              <Camera className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Checkout photos are required at move-out to confirm the bed&apos;s
              condition.
            </p>
          </Card>
        </aside>
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
      Back to listings
    </Link>
  );
}

function Fact({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
      <span className="text-slate-400">{icon}</span>
      {label}
    </span>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
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
