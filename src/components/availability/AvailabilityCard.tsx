import Link from "next/link";
import { ArrowRight, MapPin, BedDouble } from "lucide-react";
import { Card } from "@/components/ui/card";
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
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                {labelForPropertyType(property.property_type)}
              </span>
              <h3 className="truncate text-base font-semibold text-slate-900">
                {property.name}
              </h3>
              {location ? (
                <p className="flex items-center gap-1 truncate text-sm text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {location}
                </p>
              ) : null}
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition-colors group-hover:text-indigo-500" />
          </div>

          <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
            <div>
              {price ? (
                <p className="text-sm">
                  <span className="font-semibold text-slate-900">{price}</span>
                  <span className="text-slate-500">/mo</span>
                </p>
              ) : (
                <p className="text-sm text-slate-500">Pricing varies</p>
              )}
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                <BedDouble className="h-3.5 w-3.5" />
                {property.totalBeds} beds
              </p>
            </div>
            <span
              className={
                hasVacancy
                  ? "inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                  : "inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500"
              }
            >
              {hasVacancy
                ? `${property.vacantBeds} bed${property.vacantBeds === 1 ? "" : "s"} available`
                : "Fully booked"}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
