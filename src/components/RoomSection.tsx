import { BedDouble } from "lucide-react";
import { BedCard } from "@/components/BedCard";
import { EmptyState } from "@/components/EmptyState";
import { RoomFormModal } from "@/components/forms/RoomFormModal";
import { BedFormModal } from "@/components/forms/BedFormModal";
import { ConfirmDeleteButton } from "@/components/forms/ConfirmDeleteButton";
import { deleteRoom } from "@/lib/actions/rooms";
import type { Room, RoomWithBeds } from "@/lib/types";

interface RoomSectionProps {
  room: RoomWithBeds;
  rooms: Pick<Room, "id" | "name">[];
  propertyId: string;
}

export function RoomSection({ room, rooms, propertyId }: RoomSectionProps) {
  const beds = room.beds;
  const occupied = beds.filter((b) => b.status === "occupied").length;
  const filled = beds.filter(
    (b) => b.status === "occupied" || b.status === "reserved"
  ).length;

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/60">
      <header className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {room.name}
            </h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
              {beds.length} {beds.length === 1 ? "bed" : "beds"}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            {filled} of {beds.length || room.max_occupancy} filled
            {occupied !== filled ? ` · ${occupied} occupied` : ""}
            {room.description ? ` · ${room.description}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <BedFormModal
            mode="create"
            propertyId={propertyId}
            rooms={rooms}
            defaultRoomId={room.id}
            triggerLabel="Add Bed"
            triggerVariant="outline"
          />
          <RoomFormModal
            mode="edit"
            propertyId={propertyId}
            room={room}
            iconOnly
            triggerLabel="Edit room"
          />
          {beds.length === 0 ? (
            <ConfirmDeleteButton
              action={deleteRoom}
              fields={{ id: room.id, property_id: propertyId }}
              title="Delete room"
              description={`Delete "${room.name}"? This can't be undone.`}
              triggerLabel="Delete room"
              iconOnly
              triggerSize="icon"
            />
          ) : null}
        </div>
      </header>

      <div className="p-4">
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
            className="border-slate-200 bg-white"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {beds.map((bed) => (
              <BedCard key={bed.id} bed={bed} rooms={rooms} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
