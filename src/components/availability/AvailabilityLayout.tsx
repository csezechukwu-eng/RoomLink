"use client";

import { useState } from "react";
import { Map, List, X } from "lucide-react";
import dynamic from "next/dynamic";
import type { AvailabilityProperty } from "@/lib/services/availability";

// Dynamic import for map to avoid SSR issues with Leaflet
const PropertyMap = dynamic(
  () => import("./PropertyMap").then(mod => mod.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center">
        <div className="text-slate-400">Loading map...</div>
      </div>
    ),
  }
);

interface AvailabilityLayoutProps {
  properties: AvailabilityProperty[];
  children: React.ReactNode;
}

export function AvailabilityLayout({ properties, children }: AvailabilityLayoutProps) {
  const [showMap, setShowMap] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  return (
    <>
      {/* Desktop Layout - Split View */}
      <div className="hidden lg:flex h-[calc(100vh-140px)] -mx-4 sm:-mx-6 lg:-mx-8">
        {/* Listings Side */}
        <div
          className={`overflow-y-auto transition-all duration-300 ${
            showMap ? "w-[55%]" : "w-full"
          } px-4 sm:px-6 lg:px-8`}
        >
          {children}
        </div>

        {/* Map Side */}
        {showMap && (
          <div className="w-[45%] sticky top-0 h-full border-l border-slate-200">
            <PropertyMap
              properties={properties}
              selectedPropertyId={selectedPropertyId ?? undefined}
              onPropertySelect={setSelectedPropertyId}
            />
          </div>
        )}
      </div>

      {/* Mobile Layout - List Only with Map Toggle */}
      <div className="lg:hidden">
        {children}
      </div>

      {/* Map Toggle Button - Desktop */}
      <button
        onClick={() => setShowMap(!showMap)}
        className="hidden lg:flex fixed bottom-6 left-1/2 -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 transition-colors z-50"
      >
        {showMap ? (
          <>
            <List className="h-4 w-4" />
            Hide map
          </>
        ) : (
          <>
            <Map className="h-4 w-4" />
            Show map
          </>
        )}
      </button>

      {/* Mobile Map Button */}
      <MobileMapModal properties={properties} />
    </>
  );
}

function MobileMapModal({ properties }: { properties: AvailabilityProperty[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Map Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 transition-colors z-50"
      >
        <Map className="h-4 w-4" />
        Map
      </button>

      {/* Mobile Map Modal */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-white/95 backdrop-blur px-4 py-3 border-b">
            <h2 className="font-semibold text-slate-900">
              {properties.length} {properties.length === 1 ? "property" : "properties"}
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>

          {/* Map */}
          <div className="h-full pt-14">
            <PropertyMap properties={properties} />
          </div>
        </div>
      )}
    </>
  );
}
