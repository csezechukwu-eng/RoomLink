"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Star, ImageIcon } from "lucide-react";
import { labelForPropertyType } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { AvailabilityProperty } from "@/lib/services/availability";

export function AvailabilityCard({ property }: { property: AvailabilityProperty }) {
  const location = [property.city, property.state].filter(Boolean).join(", ");
  const hasVacancy = property.vacantBeds > 0;
  const price =
    property.minRent !== null
      ? property.minRent === property.maxRent
        ? formatCurrency(property.minRent)
        : `${formatCurrency(property.minRent)}–${formatCurrency(property.maxRent)}`
      : null;

  return (
    <Link href={`/availability/${property.id}`} className="group block">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
        {property.coverPhoto?.public_url ? (
          <Image
            src={property.coverPhoto.public_url}
            alt={property.coverPhoto.alt_text || property.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-12 w-12 text-slate-300" />
          </div>
        )}

        {/* Favorite Button */}
        <button
          className="absolute right-3 top-3 rounded-full p-2 transition-transform hover:scale-110"
          onClick={(e) => {
            e.preventDefault();
            // TODO: Implement favorites
          }}
        >
          <Heart className="h-6 w-6 text-white drop-shadow-md" strokeWidth={2} />
        </button>

        {/* Badge */}
        {hasVacancy && property.vacantBeds >= 3 && (
          <div className="absolute left-3 top-3 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-md">
            {property.vacantBeds} beds open
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mt-3">
        {/* Title Row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 truncate">
            {property.name}
          </h3>
          {/* Rating placeholder - can be implemented later */}
          <div className="flex items-center gap-1 shrink-0">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm">New</span>
          </div>
        </div>

        {/* Location */}
        {location && (
          <p className="text-sm text-slate-500 truncate">{location}</p>
        )}

        {/* Property Type */}
        <p className="text-sm text-slate-500">
          {labelForPropertyType(property.property_type)} · {property.totalBeds} beds total
        </p>

        {/* Availability */}
        <p className="text-sm text-slate-500">
          {hasVacancy ? (
            <span className="text-emerald-600 font-medium">
              {property.vacantBeds} bed{property.vacantBeds === 1 ? "" : "s"} available
            </span>
          ) : (
            <span className="text-slate-400">Fully booked</span>
          )}
        </p>

        {/* Price */}
        <p className="mt-1.5">
          {price ? (
            <>
              <span className="font-semibold">{price}</span>
              <span className="text-slate-500"> /month</span>
            </>
          ) : (
            <span className="text-slate-500">Pricing varies</span>
          )}
        </p>
      </div>
    </Link>
  );
}
