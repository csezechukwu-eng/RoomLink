"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";
import { Search, MapPin, DollarSign, BedDouble, X } from "lucide-react";
import { US_STATES } from "@/lib/usStates";

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Current values from URL
  const currentCity = searchParams.get("city") ?? "";
  const currentState = searchParams.get("state") ?? "";
  const currentMinRent = searchParams.get("minRent") ?? "";
  const currentMaxRent = searchParams.get("maxRent") ?? "";
  const currentMinBeds = searchParams.get("minBeds") ?? "";

  // Local state for inputs
  const [city, setCity] = useState(currentCity);
  const [state, setState] = useState(currentState);
  const [minRent, setMinRent] = useState(currentMinRent);
  const [maxRent, setMaxRent] = useState(currentMaxRent);
  const [minBeds, setMinBeds] = useState(currentMinBeds);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveSection(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (state) params.set("state", state);
    if (minRent) params.set("minRent", minRent);
    if (maxRent) params.set("maxRent", maxRent);
    if (minBeds) params.set("minBeds", minBeds);

    // Preserve amenities if set
    const amenities = searchParams.get("amenities");
    if (amenities) params.set("amenities", amenities);

    const occupancy = searchParams.get("occupancy");
    if (occupancy) params.set("occupancy", occupancy);

    router.push(`/availability?${params.toString()}`);
    setActiveSection(null);
  }, [city, state, minRent, maxRent, minBeds, searchParams, router]);

  const getLocationDisplay = () => {
    if (city && state) return `${city}, ${state}`;
    if (city) return city;
    if (state) {
      const stateObj = US_STATES.find(s => s.value === state);
      return stateObj?.label ?? state;
    }
    return "Anywhere";
  };

  const getPriceDisplay = () => {
    if (minRent && maxRent) return `$${minRent} - $${maxRent}`;
    if (minRent) return `$${minRent}+`;
    if (maxRent) return `Up to $${maxRent}`;
    return "Any price";
  };

  const getBedsDisplay = () => {
    if (minBeds) return `${minBeds}+ beds`;
    return "Any";
  };

  const clearFilters = () => {
    setCity("");
    setState("");
    setMinRent("");
    setMaxRent("");
    setMinBeds("");
  };

  const hasFilters = city || state || minRent || maxRent || minBeds;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Bar Container */}
      <div className="flex items-center rounded-full border border-slate-300 bg-white shadow-sm hover:shadow-md transition-shadow">
        {/* Where Section */}
        <button
          onClick={() => setActiveSection(activeSection === "where" ? null : "where")}
          className={`flex-1 min-w-0 px-6 py-3.5 text-left rounded-l-full transition-colors ${
            activeSection === "where" ? "bg-slate-100" : "hover:bg-slate-50"
          }`}
        >
          <div className="text-xs font-semibold text-slate-800">Where</div>
          <div className="text-sm text-slate-500 truncate">{getLocationDisplay()}</div>
        </button>

        <div className="h-8 w-px bg-slate-200" />

        {/* Price Section */}
        <button
          onClick={() => setActiveSection(activeSection === "price" ? null : "price")}
          className={`flex-1 min-w-0 px-6 py-3.5 text-left transition-colors ${
            activeSection === "price" ? "bg-slate-100" : "hover:bg-slate-50"
          }`}
        >
          <div className="text-xs font-semibold text-slate-800">Price</div>
          <div className="text-sm text-slate-500 truncate">{getPriceDisplay()}</div>
        </button>

        <div className="h-8 w-px bg-slate-200" />

        {/* Beds Section */}
        <button
          onClick={() => setActiveSection(activeSection === "beds" ? null : "beds")}
          className={`flex-1 min-w-0 px-6 py-3.5 text-left transition-colors ${
            activeSection === "beds" ? "bg-slate-100" : "hover:bg-slate-50"
          }`}
        >
          <div className="text-xs font-semibold text-slate-800">Beds</div>
          <div className="text-sm text-slate-500 truncate">{getBedsDisplay()}</div>
        </button>

        {/* Search Button */}
        <div className="pr-2 pl-2">
          <button
            onClick={handleSearch}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-700"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Dropdown Panels */}
      {activeSection === "where" && (
        <div className="absolute left-0 top-full mt-2 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 z-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
              <MapPin className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Where are you looking?</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter a city..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="">All states</option>
                {US_STATES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSearch}
            className="mt-6 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Search
          </button>
        </div>
      )}

      {activeSection === "price" && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 z-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
              <DollarSign className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Monthly budget</h3>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Min</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  value={minRent}
                  onChange={(e) => setMinRent(e.target.value)}
                  placeholder="0"
                  min={0}
                  className="w-full rounded-lg border border-slate-300 pl-7 pr-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <span className="text-slate-400 mt-6">–</span>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Max</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  value={maxRent}
                  onChange={(e) => setMaxRent(e.target.value)}
                  placeholder="Any"
                  min={0}
                  className="w-full rounded-lg border border-slate-300 pl-7 pr-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Price Options */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { min: "", max: "500", label: "Under $500" },
              { min: "500", max: "800", label: "$500 - $800" },
              { min: "800", max: "1200", label: "$800 - $1,200" },
              { min: "1200", max: "", label: "$1,200+" },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => {
                  setMinRent(opt.min);
                  setMaxRent(opt.max);
                }}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  minRent === opt.min && maxRent === opt.max
                    ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                    : "border-slate-300 text-slate-600 hover:border-slate-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleSearch}
            className="mt-6 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Search
          </button>
        </div>
      )}

      {activeSection === "beds" && (
        <div className="absolute right-0 top-full mt-2 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200 z-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
              <BedDouble className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Beds needed</h3>
          </div>

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
                onClick={() => setMinBeds(opt.value)}
                className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-colors ${
                  minBeds === opt.value
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-300 text-slate-600 hover:border-slate-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleSearch}
            className="mt-6 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Search
          </button>
        </div>
      )}
    </div>
  );
}
