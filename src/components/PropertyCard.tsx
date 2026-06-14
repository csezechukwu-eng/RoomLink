import Link from "next/link";
import { ArrowRight, Building2, DoorOpen, BedDouble } from "lucide-react";
import { Card } from "@/components/ui/card";
import { labelForPropertyType } from "@/lib/constants";
import type { BedStatusCounts, Property } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  property: Property;
  roomCount: number;
  bedCounts: BedStatusCounts;
}

function formatLocation(p: Property): string | null {
  const parts = [p.city, p.state].filter(Boolean);
  return parts.length ? parts.join(", ") : p.address || null;
}

export function PropertyCard({
  property,
  roomCount,
  bedCounts,
}: PropertyCardProps) {
  const location = formatLocation(property);

  return (
    <Link href={`/dashboard/properties/${property.id}`} className="group block">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                <Building2 className="h-3 w-3" />
                {labelForPropertyType(property.property_type)}
              </span>
              <h3 className="truncate text-base font-semibold text-slate-900">
                {property.name}
              </h3>
              {location ? (
                <p className="truncate text-sm text-slate-500">{location}</p>
              ) : null}
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition-colors group-hover:text-indigo-500" />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <DoorOpen className="h-4 w-4 text-slate-400" />
              {roomCount} {roomCount === 1 ? "room" : "rooms"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BedDouble className="h-4 w-4 text-slate-400" />
              {bedCounts.total} {bedCounts.total === 1 ? "bed" : "beds"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3 text-xs font-medium">
            <Stat label="Vacant" value={bedCounts.vacant} dot="bg-emerald-500" />
            <Stat label="Reserved" value={bedCounts.reserved} dot="bg-blue-500" />
            <Stat label="Occupied" value={bedCounts.occupied} dot="bg-slate-700" />
            <Stat
              label="Unavailable"
              value={bedCounts.unavailable}
              dot="bg-slate-300"
            />
          </div>
        </div>
      </Card>
    </Link>
  );
}

function Stat({
  label,
  value,
  dot,
}: {
  label: string;
  value: number;
  dot: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-slate-500">
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {value} {label}
    </span>
  );
}
