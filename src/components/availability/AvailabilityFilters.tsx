"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, MapPin, Users, BedDouble, DollarSign, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { US_STATES } from "@/lib/usStates";
import { PROPERTY_OCCUPANCY_TYPES } from "@/lib/constants";

export function AvailabilityFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentCity = searchParams.get("city") ?? "";
  const currentState = searchParams.get("state") ?? "";
  const currentOccupancy = searchParams.get("occupancy") ?? "";
  const currentMinBeds = searchParams.get("minBeds") ?? "";
  const currentMinRent = searchParams.get("minRent") ?? "";
  const currentMaxRent = searchParams.get("maxRent") ?? "";

  const hasActiveFilters =
    currentCity ||
    currentState ||
    currentOccupancy ||
    currentMinBeds ||
    currentMinRent ||
    currentMaxRent;

  const updateFilters = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      startTransition(() => {
        router.push(`/availability?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const clearFilters = useCallback(() => {
    startTransition(() => {
      router.push("/availability");
    });
  }, [router]);

  return (
    <div className="space-y-4">
      {/* Main search row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* City/Location search */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="City or location..."
            defaultValue={currentCity}
            className="pl-10"
            onBlur={(e) => updateFilters({ city: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateFilters({ city: (e.target as HTMLInputElement).value });
              }
            }}
          />
        </div>

        {/* State selector */}
        <Select
          value={currentState}
          onChange={(e) => updateFilters({ state: e.target.value })}
        >
          <option value="">All states</option>
          {US_STATES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>

        {/* Occupancy type */}
        <div className="relative">
          <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Select
            value={currentOccupancy}
            onChange={(e) => updateFilters({ occupancy: e.target.value })}
            className="pl-10"
          >
            <option value="">All occupancy types</option>
            {PROPERTY_OCCUPANCY_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Available beds */}
        <div className="relative">
          <BedDouble className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Select
            value={currentMinBeds}
            onChange={(e) => updateFilters({ minBeds: e.target.value })}
            className="pl-10"
          >
            <option value="">Any availability</option>
            <option value="1">1+ beds available</option>
            <option value="2">2+ beds available</option>
            <option value="3">3+ beds available</option>
            <option value="5">5+ beds available</option>
          </Select>
        </div>
      </div>

      {/* Secondary filter row - rent range */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-600">Monthly rent:</span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            defaultValue={currentMinRent}
            className="w-24"
            min={0}
            onBlur={(e) => updateFilters({ minRent: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateFilters({ minRent: (e.target as HTMLInputElement).value });
              }
            }}
          />
          <span className="text-slate-400">–</span>
          <Input
            type="number"
            placeholder="Max"
            defaultValue={currentMaxRent}
            className="w-24"
            min={0}
            onBlur={(e) => updateFilters({ maxRent: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateFilters({ maxRent: (e.target as HTMLInputElement).value });
              }
            }}
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-auto text-slate-500 hover:text-slate-700"
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Search className="h-4 w-4 animate-pulse" />
          Searching...
        </div>
      )}
    </div>
  );
}
