"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  ChevronUp,
  MapPin,
  BedDouble,
  DoorOpen,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

interface BedData {
  id: string;
  label: string;
  status: string;
  monthlyRate: number | null;
}

interface RoomData {
  id: string;
  name: string;
  beds: number;
  occupied: number;
  reserved: number;
  available: number;
  bedsList: BedData[];
}

interface PropertyWithRooms {
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  rooms: RoomData[];
}

interface RoomsClientProps {
  propertiesWithRooms: PropertyWithRooms[];
}

export function RoomsClient({ propertiesWithRooms }: RoomsClientProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedProperties, setExpandedProperties] = React.useState<Set<string>>(
    new Set(propertiesWithRooms.map((p) => p.propertyId))
  );

  const toggleProperty = (propertyId: string) => {
    setExpandedProperties((prev) => {
      const next = new Set(prev);
      if (next.has(propertyId)) {
        next.delete(propertyId);
      } else {
        next.add(propertyId);
      }
      return next;
    });
  };

  // Filter based on search
  const filteredProperties = propertiesWithRooms
    .map((p) => ({
      ...p,
      rooms: p.rooms.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.propertyName.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((p) => p.rooms.length > 0 || searchQuery === "");

  return (
    <>
      {/* Search */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Properties with Rooms */}
      <div className="space-y-4">
        {filteredProperties.map((property) => (
          <Card key={property.propertyId} className="overflow-hidden">
            {/* Property Header */}
            <button
              onClick={() => toggleProperty(property.propertyId)}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50"
            >
              <div>
                <h3 className="font-semibold text-slate-900">{property.propertyName}</h3>
                {property.propertyAddress && (
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {property.propertyAddress}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right text-sm">
                  <span className="font-medium text-slate-900">{property.rooms.length}</span>
                  <span className="ml-1 text-slate-500">rooms</span>
                </div>
                {expandedProperties.has(property.propertyId) ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </button>

            {/* Rooms List */}
            {expandedProperties.has(property.propertyId) && (
              <div className="border-t border-slate-100">
                {property.rooms.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    No rooms in this property yet.
                    <Link
                      href={`/dashboard/properties/${property.propertyId}`}
                      className="ml-1 text-indigo-600 hover:text-indigo-700"
                    >
                      Add a room
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {property.rooms.map((room) => (
                      <RoomRow key={room.id} room={room} propertyId={property.propertyId} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredProperties.length === 0 && searchQuery && (
        <Card className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <p className="text-slate-500">No rooms match your search.</p>
        </Card>
      )}
    </>
  );
}

function RoomRow({ room, propertyId }: { room: RoomData; propertyId: string }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <DoorOpen className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h4 className="font-medium text-slate-900">{room.name}</h4>
            <p className="text-sm text-slate-500">{room.beds} beds</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-sm">
            <span>
              <span className="font-medium text-amber-600">{room.occupied}</span>
              <span className="ml-1 text-slate-500">occupied</span>
            </span>
            <span>
              <span className="font-medium text-indigo-600">{room.reserved}</span>
              <span className="ml-1 text-slate-500">reserved</span>
            </span>
            <span>
              <span className="font-medium text-emerald-600">{room.available}</span>
              <span className="ml-1 text-slate-500">available</span>
            </span>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Beds List */}
      {expanded && room.bedsList.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {room.bedsList.map((bed) => (
              <BedCard key={bed.id} bed={bed} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BedCard({ bed }: { bed: BedData }) {
  const statusColors: Record<string, string> = {
    vacant: "bg-emerald-100 text-emerald-700 border-emerald-200",
    reserved: "bg-indigo-100 text-indigo-700 border-indigo-200",
    occupied: "bg-amber-100 text-amber-700 border-amber-200",
    unavailable: "bg-slate-100 text-slate-500 border-slate-200",
  };

  const statusLabels: Record<string, string> = {
    vacant: "Available",
    reserved: "Reserved",
    occupied: "Occupied",
    unavailable: "Unavailable",
  };

  return (
    <div className={`rounded-lg border p-3 ${statusColors[bed.status] || statusColors.unavailable}`}>
      <div className="flex items-center gap-2">
        <BedDouble className="h-4 w-4" />
        <span className="font-medium">{bed.label}</span>
      </div>
      <p className="mt-1 text-xs">{statusLabels[bed.status] || bed.status}</p>
      {bed.monthlyRate && (
        <p className="mt-1 text-xs font-medium">{formatCurrency(bed.monthlyRate)}/mo</p>
      )}
    </div>
  );
}
