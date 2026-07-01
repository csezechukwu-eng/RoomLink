"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import {
  SlidersHorizontal,
  X,
  Wifi,
  Car,
  Snowflake,
  Utensils,
  Tv,
  WashingMachine,
  Users,
  PawPrint,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { US_STATES } from "@/lib/usStates";
import { PROPERTY_OCCUPANCY_TYPES } from "@/lib/constants";

const QUICK_FILTERS = [
  { key: "wifi", label: "WiFi", icon: Wifi },
  { key: "parking", label: "Free parking", icon: Car },
  { key: "ac", label: "Air conditioning", icon: Snowflake },
  { key: "kitchen", label: "Kitchen", icon: Utensils },
  { key: "tv", label: "TV", icon: Tv },
  { key: "washer", label: "Washer", icon: WashingMachine },
];

export function AvailabilityFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showAllFilters, setShowAllFilters] = useState(false);

  const currentCity = searchParams.get("city") ?? "";
  const currentState = searchParams.get("state") ?? "";
  const currentOccupancy = searchParams.get("occupancy") ?? "";
  const currentMinBeds = searchParams.get("minBeds") ?? "";
  const currentMinRent = searchParams.get("minRent") ?? "";
  const currentMaxRent = searchParams.get("maxRent") ?? "";
  const currentAmenities = searchParams.get("amenities")?.split(",") ?? [];

  const activeFilterCount = [
    currentCity,
    currentState,
    currentOccupancy,
    currentMinBeds,
    currentMinRent,
    currentMaxRent,
    ...currentAmenities,
  ].filter(Boolean).length;

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

  const toggleAmenity = useCallback(
    (amenity: string) => {
      const current = new Set(currentAmenities);
      if (current.has(amenity)) {
        current.delete(amenity);
      } else {
        current.add(amenity);
      }
      const amenitiesStr = Array.from(current).join(",");
      updateFilters({ amenities: amenitiesStr });
    },
    [currentAmenities, updateFilters]
  );

  const clearFilters = useCallback(() => {
    startTransition(() => {
      router.push("/availability");
    });
    setShowAllFilters(false);
  }, [router]);

  return (
    <>
      {/* Filter Pills Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {/* Filters Button */}
        <button
          onClick={() => setShowAllFilters(true)}
          className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
            activeFilterCount > 0
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:border-slate-900"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs text-slate-900">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Quick Filter Pills */}
        {QUICK_FILTERS.map((filter) => {
          const isActive = currentAmenities.includes(filter.key);
          return (
            <button
              key={filter.key}
              onClick={() => toggleAmenity(filter.key)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-900"
              }`}
            >
              <filter.icon className="h-4 w-4" />
              {filter.label}
            </button>
          );
        })}

        {/* Co-ed / Women Only */}
        <button
          onClick={() =>
            updateFilters({
              occupancy: currentOccupancy === "women_only_rooms" ? "" : "women_only_rooms",
            })
          }
          className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
            currentOccupancy === "women_only_rooms"
              ? "border-slate-900 bg-slate-50"
              : "border-slate-300 bg-white text-slate-700 hover:border-slate-900"
          }`}
        >
          <Users className="h-4 w-4" />
          Women only
        </button>
      </div>

      {/* All Filters Modal */}
      {showAllFilters && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAllFilters(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
              <button
                onClick={() => setShowAllFilters(false)}
                className="rounded-full p-2 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold">Filters</h2>
              <div className="w-9" /> {/* Spacer for centering */}
            </div>

            {/* Filter Content */}
            <div className="p-6 space-y-8">
              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Location</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      City
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter city..."
                      defaultValue={currentCity}
                      onBlur={(e) => updateFilters({ city: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updateFilters({ city: (e.target as HTMLInputElement).value });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      State
                    </label>
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
                  </div>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Price range</h3>
                <p className="text-sm text-slate-500 mb-4">Monthly rent before fees</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Minimum
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        $
                      </span>
                      <Input
                        type="number"
                        placeholder="0"
                        defaultValue={currentMinRent}
                        className="pl-7"
                        min={0}
                        onBlur={(e) => updateFilters({ minRent: e.target.value })}
                      />
                    </div>
                  </div>
                  <span className="text-slate-400 mt-6">–</span>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Maximum
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        $
                      </span>
                      <Input
                        type="number"
                        placeholder="Any"
                        defaultValue={currentMaxRent}
                        className="pl-7"
                        min={0}
                        onBlur={(e) => updateFilters({ maxRent: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Beds Available */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Beds available</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "", label: "Any" },
                    { value: "1", label: "1+" },
                    { value: "2", label: "2+" },
                    { value: "3", label: "3+" },
                    { value: "5", label: "5+" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateFilters({ minBeds: opt.value })}
                      className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-colors ${
                        currentMinBeds === opt.value
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 hover:border-slate-900"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Occupancy Type */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Occupancy type</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateFilters({ occupancy: "" })}
                    className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-colors ${
                      !currentOccupancy
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 hover:border-slate-900"
                    }`}
                  >
                    Any
                  </button>
                  {PROPERTY_OCCUPANCY_TYPES.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateFilters({ occupancy: opt.value })}
                      className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-colors ${
                        currentOccupancy === opt.value
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 hover:border-slate-900"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Amenities</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "wifi", label: "WiFi", icon: Wifi },
                    { key: "parking", label: "Free parking", icon: Car },
                    { key: "ac", label: "Air conditioning", icon: Snowflake },
                    { key: "kitchen", label: "Kitchen", icon: Utensils },
                    { key: "tv", label: "TV", icon: Tv },
                    { key: "washer", label: "Washer", icon: WashingMachine },
                    { key: "pets", label: "Pets allowed", icon: PawPrint },
                  ].map((amenity) => {
                    const isActive = currentAmenities.includes(amenity.key);
                    return (
                      <button
                        key={amenity.key}
                        onClick={() => toggleAmenity(amenity.key)}
                        className={`flex items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                          isActive
                            ? "border-slate-900 bg-slate-50"
                            : "border-slate-200 hover:border-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <amenity.icon className="h-6 w-6 text-slate-600" />
                          <span className="font-medium">{amenity.label}</span>
                        </div>
                        {isActive && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center justify-between border-t bg-white px-6 py-4">
              <button
                onClick={clearFilters}
                className="text-sm font-semibold underline"
              >
                Clear all
              </button>
              <Button
                onClick={() => setShowAllFilters(false)}
                className="bg-slate-900 hover:bg-slate-800 px-6"
              >
                Show results
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isPending && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
          Updating results...
        </div>
      )}
    </>
  );
}
