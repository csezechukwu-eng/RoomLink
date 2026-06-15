"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  MapPin,
  MoreVertical,
  Building,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export interface PropertyData {
  id: string;
  name: string;
  address: string;
  image: string | null;
  status: "active" | "inactive";
  beds: number;
  occupied: number;
  reserved: number;
  available: number;
  revenue: number;
  property_type: string;
  description: string | null;
  house_rules: string | null;
}

interface PropertiesClientProps {
  properties: PropertyData[];
}

export function PropertiesClient({ properties }: PropertiesClientProps) {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter properties based on search
  const filteredProperties = properties.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Status</span>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
            All
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Sort By</span>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
            Newest
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* View Toggle */}
        <div className="ml-auto flex items-center rounded-lg border border-slate-200 bg-white p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-md p-1.5 ${viewMode === "grid" ? "bg-slate-100 text-slate-900" : "text-slate-400"}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-md p-1.5 ${viewMode === "list" ? "bg-slate-100 text-slate-900" : "text-slate-400"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Property Grid */}
      {filteredProperties.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <p className="text-slate-500">No properties match your search.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </>
  );
}

function PropertyCard({ property }: { property: PropertyData }) {
  return (
    <Card className="overflow-hidden">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-slate-200 to-slate-300">
        {property.image ? (
          <img
            src={property.image}
            alt={property.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Building className="h-12 w-12 text-slate-400" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white">
          Active
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900">{property.name}</h3>
        {property.address && (
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            {property.address}
          </p>
        )}

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div>
            <span className="font-bold text-slate-900">{property.beds}</span>
            <span className="ml-1 text-slate-500">Beds</span>
          </div>
          <div>
            <span className="font-bold text-amber-600">{property.occupied}</span>
            <span className="ml-1 text-slate-500">Occupied</span>
          </div>
          <div>
            <span className="font-bold text-indigo-600">{property.reserved}</span>
            <span className="ml-1 text-slate-500">Reserved</span>
          </div>
          <div>
            <span className="font-bold text-emerald-600">{property.available}</span>
            <span className="ml-1 text-slate-500">Available</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <Link
            href={`/dashboard/properties/${property.id}`}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View Property
          </Link>
          <button className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
