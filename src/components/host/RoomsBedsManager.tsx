"use client";

import * as React from "react";
import { Search, DoorOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { RoomAccordionCard } from "@/components/RoomAccordionCard";
import { RoomFormModal } from "@/components/forms/RoomFormModal";
import type { BedStatus, PropertyMedia, Room, RoomWithBeds } from "@/lib/types";

type Filter = "all" | BedStatus | "setup";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "vacant", label: "Vacant" },
  { value: "reserved", label: "Reserved" },
  { value: "occupied", label: "Occupied" },
  { value: "unavailable", label: "Unavailable" },
  { value: "setup", label: "Missing Setup" },
];

interface RoomsBedsManagerProps {
  rooms: RoomWithBeds[];
  roomOptions: Pick<Room, "id" | "name">[];
  propertyId: string;
  media: PropertyMedia[];
}

export function RoomsBedsManager({
  rooms,
  roomOptions,
  propertyId,
  media,
}: RoomsBedsManagerProps) {
  const [filter, setFilter] = React.useState<Filter>("all");
  const [search, setSearch] = React.useState("");

  // Expand the room targeted by the URL hash (e.g. from "Needs Attention").
  const [openRoomId, setOpenRoomId] = React.useState<string | null>(null);
  React.useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#room-")) setOpenRoomId(hash.slice("#room-".length));
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const bedHasPhotos = React.useCallback(
    (bedId: string) =>
      media.some((m) => m.media_type === "bed" && m.bed_id === bedId),
    [media]
  );

  const q = search.trim().toLowerCase();
  const filtersActive = filter !== "all" || q.length > 0;

  const visibleRooms = rooms
    .map((room) => {
      const roomMatches = q ? room.name.toLowerCase().includes(q) : false;
      const beds = room.beds.filter((bed) => {
        // Status / setup filter
        if (filter === "setup") {
          const missingSetup =
            !bed.monthly_rent ||
            bed.monthly_rent <= 0 ||
            !bed.deposit_amount ||
            bed.deposit_amount <= 0 ||
            !bedHasPhotos(bed.id);
          if (!missingSetup) return false;
        } else if (filter !== "all" && bed.status !== filter) {
          return false;
        }
        // Search filter (room name match keeps all its beds)
        if (q && !roomMatches && !bed.label.toLowerCase().includes(q)) return false;
        return true;
      });
      return { ...room, beds } as RoomWithBeds;
    })
    .filter((room) => {
      if (!filtersActive) return true;
      // When filtering, only show rooms with matching beds (or name match).
      if (q && room.name.toLowerCase().includes(q)) return true;
      return room.beds.length > 0;
    });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Rooms &amp; Beds
        </h2>
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon={<DoorOpen className="h-5 w-5" />}
          title="No rooms yet"
          description="Add a room, then start placing beds inside it."
          action={<RoomFormModal mode="create" propertyId={propertyId} />}
        />
      ) : (
        <>
          {/* Filters + search */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    filter === f.value
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search room or bed..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {visibleRooms.length === 0 ? (
            <EmptyState
              title="No matches"
              description="No rooms or beds match your filters."
            />
          ) : (
            <div className="space-y-4">
              {visibleRooms.map((room, index) => (
                <div key={room.id} id={`room-${room.id}`} className="scroll-mt-24">
                  <RoomAccordionCard
                    room={room}
                    rooms={roomOptions}
                    propertyId={propertyId}
                    media={media}
                    defaultExpanded={
                      openRoomId
                        ? room.id === openRoomId
                        : !filtersActive && index === 0
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
