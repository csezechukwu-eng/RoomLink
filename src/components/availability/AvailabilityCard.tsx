import Image from "next/image";
import Link from "next/link";
import { MapPin, BedDouble, ImageIcon, CalendarDays, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { labelForPropertyType, labelForOccupancyType } from "@/lib/constants";
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
      <Card className="flex h-full flex-col overflow-hidden transition-shadow group-hover:shadow-md">
        {/* Cover Photo */}
        <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200">
          {property.coverPhoto?.public_url ? (
            <Image
              src={property.coverPhoto.public_url}
              alt={property.coverPhoto.alt_text || property.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="h-10 w-10 text-slate-300" />
            </div>
          )}
          {/* Occupancy + availability badges over the photo */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-slate-700 shadow-sm backdrop-blur">
              {labelForOccupancyType(property.occupancy_type)}
            </span>
          </div>
          <div className="absolute right-3 top-3">
            <span
              className={
                hasVacancy
                  ? "inline-flex items-center rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
                  : "inline-flex items-center rounded-full bg-slate-700/90 px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
              }
            >
              {hasVacancy
                ? `${property.vacantBeds} bed${property.vacantBeds === 1 ? "" : "s"} available`
                : "Fully booked"}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="space-y-1">
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
              {labelForPropertyType(property.property_type)}
            </span>
            <h3 className="truncate text-base font-semibold text-slate-900">
              {property.name}
            </h3>
            {location ? (
              <p className="flex items-center gap-1 truncate text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {location}
              </p>
            ) : null}
          </div>

          {/* Price + deposit */}
          <div>
            {price ? (
              <p className="text-sm">
                <span className="text-lg font-semibold text-slate-900">{price}</span>
                <span className="text-slate-500">/mo</span>
              </p>
            ) : (
              <p className="text-sm text-slate-500">Pricing varies</p>
            )}
            {property.minDeposit ? (
              <p className="text-xs text-slate-500">
                Deposit from {formatCurrency(property.minDeposit)}
              </p>
            ) : null}
          </div>

          {/* Capacity + minimum stay */}
          <div className="mt-auto space-y-2 border-t border-slate-100 pt-3">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <BedDouble className="h-3.5 w-3.5" />
                {property.vacantBeds} of {property.totalBeds} beds open
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Sleeps {property.totalBeds}
              </span>
            </div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <CalendarDays className="h-3.5 w-3.5" />
              Minimum stay: 30 days
            </p>
            <span className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-indigo-600 text-sm font-medium text-white transition-colors group-hover:bg-indigo-700">
              View listing
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
