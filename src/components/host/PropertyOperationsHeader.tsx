import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { PropertyFormModal } from "@/components/forms/PropertyFormModal";
import { RoomFormModal } from "@/components/forms/RoomFormModal";
import { ConfirmDeleteButton } from "@/components/forms/ConfirmDeleteButton";
import { deleteProperty } from "@/lib/actions/properties";
import { labelForPropertyType } from "@/lib/constants";
import type { Property } from "@/lib/types";

/**
 * Top of the property operations workspace: back link, name, location,
 * type badge, and the primary management actions. There is intentionally no
 * top-level "Add Bed" — beds are added inside room cards.
 */
export function PropertyOperationsHeader({
  property,
  roomCount,
}: {
  property: Property;
  roomCount: number;
}) {
  const location = [property.address, property.city, property.state, property.zip]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/properties"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Properties
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {property.name}
            </h1>
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
              {labelForPropertyType(property.property_type)}
            </span>
            {property.is_hidden && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                Hidden
              </span>
            )}
          </div>
          {location && (
            <p className="flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
              {location}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <RoomFormModal mode="create" propertyId={property.id} />
          <PropertyFormModal mode="edit" property={property} triggerLabel="Edit Property" />
          {roomCount === 0 && (
            <ConfirmDeleteButton
              action={deleteProperty}
              fields={{ id: property.id }}
              title="Delete property"
              description={`Delete "${property.name}"? This can't be undone.`}
              triggerLabel="Delete"
              triggerVariant="outline"
            />
          )}
        </div>
      </div>
    </div>
  );
}
