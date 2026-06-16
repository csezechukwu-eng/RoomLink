"use client";

import * as React from "react";
import { BedDouble, ChevronDown } from "lucide-react";
import { BedCard } from "@/components/BedCard";
import { EmptyState } from "@/components/EmptyState";
import { RoomFormModal } from "@/components/forms/RoomFormModal";
import { BedFormModal } from "@/components/forms/BedFormModal";
import { ConfirmDeleteButton } from "@/components/forms/ConfirmDeleteButton";
import { RoomPhotosSection } from "@/components/PropertyPhotosSection";
import { deleteRoom } from "@/lib/actions/rooms";
import { cn } from "@/lib/utils";
import type { PropertyMedia, Room, RoomWithBeds } from "@/lib/types";
import type { BedAvailability } from "@/lib/bedAvailability";

interface RoomAccordionCardProps {
  room: RoomWithBeds;
  rooms: Pick<Room, "id" | "name">[];
  propertyId: string;
  media?: PropertyMedia[];
  defaultExpanded?: boolean;
  /** bed_id -> derived availability, for per-bed availability badges. */
  availabilityByBed?: Record<string, BedAvailability>;
}

export function RoomAccordionCard({
  room,
  rooms,
  propertyId,
  media = [],
  defaultExpanded = false,
  availabilityByBed = {},
}: RoomAccordionCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const contentId = `room-content-${room.id}`;
  const headerId = `room-header-${room.id}`;

  // Open (never force-close) when this room becomes the targeted one, e.g.
  // after a "Fix" link in the Needs Attention panel scrolls to it.
  React.useEffect(() => {
    if (defaultExpanded) setIsExpanded(true);
  }, [defaultExpanded]);

  const beds = room.beds;
  const totalBeds = beds.length;
  const vacant = beds.filter((b) => b.status === "vacant").length;
  const reserved = beds.filter((b) => b.status === "reserved").length;
  const occupied = beds.filter((b) => b.status === "occupied").length;
  const unavailable = beds.filter((b) => b.status === "unavailable").length;

  // Filter media for this room and its beds
  const roomMedia = media.filter(
    (m) => m.media_type === "room" && m.room_id === room.id
  );
  const bedMediaMap = new Map<string, PropertyMedia[]>();
  media
    .filter((m) => m.media_type === "bed" && m.room_id === room.id)
    .forEach((m) => {
      if (m.bed_id) {
        const existing = bedMediaMap.get(m.bed_id) ?? [];
        existing.push(m);
        bedMediaMap.set(m.bed_id, existing);
      }
    });

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Accordion Header */}
      <div
        id={headerId}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className="flex cursor-pointer items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-100/50"
      >
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {/* Room Name & Type */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold text-slate-900">
                {room.name}
              </h3>
              {room.description && (
                <span className="hidden truncate text-sm text-slate-500 sm:block">
                  {room.description}
                </span>
              )}
            </div>
            {/* Room Stats Row */}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="font-medium text-slate-600">
                {totalBeds} {totalBeds === 1 ? "bed" : "beds"}
              </span>
              {totalBeds > 0 && (
                <>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-500">{vacant} vacant</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span className="text-slate-500">{reserved} reserved</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                    <span className="text-slate-500">{occupied} occupied</span>
                  </span>
                  {unavailable > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                      <span className="text-slate-500">{unavailable} unavailable</span>
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons - stop propagation to prevent accordion toggle */}
        <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <BedFormModal
            mode="create"
            propertyId={propertyId}
            rooms={rooms}
            defaultRoomId={room.id}
            triggerLabel="Add Bed"
            triggerVariant="outline"
            triggerSize="sm"
          />
          <RoomFormModal
            mode="edit"
            propertyId={propertyId}
            room={room}
            iconOnly
            triggerLabel="Edit room"
          />
          {beds.length === 0 && (
            <ConfirmDeleteButton
              action={deleteRoom}
              fields={{ id: room.id, property_id: propertyId }}
              title="Delete room"
              description={`Delete "${room.name}"? This can't be undone.`}
              triggerLabel="Delete room"
              iconOnly
              triggerSize="icon"
            />
          )}
          {/* Expand/Collapse Chevron */}
          <button
            type="button"
            onClick={handleToggle}
            aria-label={isExpanded ? "Collapse room" : "Expand room"}
            className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
          >
            <ChevronDown
              className={cn(
                "h-5 w-5 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
          </button>
        </div>
      </div>

      {/* Accordion Content */}
      <div
        id={contentId}
        role="region"
        aria-labelledby={headerId}
        hidden={!isExpanded}
        className={cn(
          "transition-all duration-200",
          isExpanded ? "block" : "hidden"
        )}
      >
        <div className="p-4">
          {/* Room Photos */}
          <RoomPhotosSection
            propertyId={propertyId}
            roomId={room.id}
            roomName={room.name}
            photos={roomMedia}
          />

          {/* Beds Grid */}
          {beds.length === 0 ? (
            <EmptyState
              icon={<BedDouble className="h-5 w-5" />}
              title="No beds yet"
              description="Add beds to start tracking availability and rent for this room."
              action={
                <BedFormModal
                  mode="create"
                  propertyId={propertyId}
                  rooms={rooms}
                  defaultRoomId={room.id}
                  triggerLabel="Add Bed"
                />
              }
              className="mt-4 border-slate-200 bg-slate-50"
            />
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {beds.map((bed) => (
                <BedCard
                  key={bed.id}
                  bed={bed}
                  rooms={rooms}
                  photos={bedMediaMap.get(bed.id) ?? []}
                  availability={availabilityByBed[bed.id]}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
