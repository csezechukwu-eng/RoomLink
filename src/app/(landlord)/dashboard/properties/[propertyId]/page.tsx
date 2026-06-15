import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, DoorOpen, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SummaryCard } from "@/components/SummaryCard";
import { RoomSection } from "@/components/RoomSection";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Card } from "@/components/ui/card";
import { PropertyFormModal } from "@/components/forms/PropertyFormModal";
import { RoomFormModal } from "@/components/forms/RoomFormModal";
import { BedFormModal } from "@/components/forms/BedFormModal";
import { ConfirmDeleteButton } from "@/components/forms/ConfirmDeleteButton";
import { PropertyPhotosSection } from "@/components/PropertyPhotosSection";
import { deleteProperty } from "@/lib/actions/properties";
import { getPropertyDetail } from "@/lib/queries";
import { labelForPropertyType } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const result = await getPropertyDetail(propertyId);

  if (result.error !== null) {
    return (
      <div className="space-y-6">
        <BackLink />
        <ErrorState
          title="Couldn't load this property"
          message={result.error}
        />
      </div>
    );
  }

  if (!result.data) notFound();

  const { property, rooms, bedCounts, media } = result.data;
  const roomOptions = rooms.map((r) => ({ id: r.id, name: r.name }));
  const location = [property.address, property.city, property.state, property.zip]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <BackLink />

      <PageHeader
        title={property.name}
        description={location || undefined}
        actions={
          <>
            {rooms.length > 0 ? (
              <BedFormModal
                mode="create"
                propertyId={property.id}
                rooms={roomOptions}
                triggerLabel="Add Bed"
                triggerVariant="primary"
              />
            ) : null}
            <RoomFormModal mode="create" propertyId={property.id} />
            <PropertyFormModal mode="edit" property={property} />
            {rooms.length === 0 ? (
              <ConfirmDeleteButton
                action={deleteProperty}
                fields={{ id: property.id }}
                title="Delete property"
                description={`Delete "${property.name}"? This can't be undone.`}
                triggerLabel="Delete"
                triggerVariant="outline"
              />
            ) : null}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
          {labelForPropertyType(property.property_type)}
        </span>
        {location ? (
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            {location}
          </span>
        ) : null}
      </div>

      {/* Bed status summary for this property */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard label="Total beds" value={bedCounts.total} />
        <SummaryCard
          label="Vacant"
          value={bedCounts.vacant}
          accentClassName="bg-emerald-500"
        />
        <SummaryCard
          label="Reserved"
          value={bedCounts.reserved}
          accentClassName="bg-blue-500"
        />
        <SummaryCard
          label="Occupied"
          value={bedCounts.occupied}
          accentClassName="bg-slate-700"
        />
        <SummaryCard
          label="Unavailable"
          value={bedCounts.unavailable}
          accentClassName="bg-slate-300"
        />
      </div>

      {/* Property photos */}
      <PropertyPhotosSection propertyId={property.id} photos={media} />

      {/* About / house rules */}
      {property.description || property.house_rules ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {property.description ? (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900">About</h3>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                {property.description}
              </p>
            </Card>
          ) : null}
          {property.house_rules ? (
            <Card className="p-5">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <ScrollText className="h-4 w-4 text-slate-400" />
                House rules
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                {property.house_rules}
              </p>
            </Card>
          ) : null}
        </div>
      ) : null}

      {/* Rooms + beds */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Rooms &amp; beds
          </h2>
        </div>

        {rooms.length === 0 ? (
          <EmptyState
            icon={<DoorOpen className="h-5 w-5" />}
            title="No rooms yet"
            description="Add a room, then start placing beds inside it."
            action={<RoomFormModal mode="create" propertyId={property.id} />}
          />
        ) : (
          <div className="space-y-4">
            {rooms.map((room) => (
              <RoomSection
                key={room.id}
                room={room}
                rooms={roomOptions}
                propertyId={property.id}
                media={media}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/properties"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
    >
      <ArrowLeft className="h-4 w-4" />
      All properties
    </Link>
  );
}
