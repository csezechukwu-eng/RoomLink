"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Camera } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormAlert } from "@/components/forms/FormAlert";
import { PhotoUpload } from "@/components/PhotoUpload";
import { initialActionState } from "@/lib/actions/types";
import { createRoom, updateRoom } from "@/lib/actions/rooms";
import { uploadMedia, deleteMedia, setCoverMedia } from "@/lib/actions/media";
import type { Room, PropertyMedia } from "@/lib/types";

interface RoomFormModalProps {
  mode: "create" | "edit";
  propertyId: string;
  room?: Room;
  photos?: PropertyMedia[];
  triggerVariant?: "primary" | "outline" | "secondary" | "ghost";
  triggerLabel?: string;
  iconOnly?: boolean;
}

export function RoomFormModal({
  mode,
  propertyId,
  room,
  photos = [],
  triggerVariant = mode === "create" ? "outline" : "ghost",
  triggerLabel,
  iconOnly,
}: RoomFormModalProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const action = mode === "create" ? createRoom : updateRoom;
  const [state, formAction] = useActionState(action, initialActionState);

  React.useEffect(() => {
    if (open && state.status === "success") {
      setOpen(false);
      router.refresh();
    }
  }, [state, open, router]);

  const handleUpload = async (formData: FormData) => {
    const result = await uploadMedia({ status: "idle" }, formData);
    if (result.status === "success") {
      router.refresh();
    }
    return result;
  };

  const handleDelete = async (formData: FormData) => {
    const result = await deleteMedia({ status: "idle" }, formData);
    if (result.status === "success") {
      router.refresh();
    }
    return result;
  };

  const handleSetCover = async (formData: FormData) => {
    const result = await setCoverMedia({ status: "idle" }, formData);
    if (result.status === "success") {
      router.refresh();
    }
    return result;
  };

  const label = triggerLabel ?? (mode === "create" ? "Add Room" : "Edit");
  const fieldErrors = state.fieldErrors ?? {};

  // Filter photos for this room (edit mode only)
  const roomPhotos = room
    ? photos.filter((p) => p.media_type === "room" && p.room_id === room.id)
    : [];

  return (
    <>
      <Button
        variant={triggerVariant}
        size={iconOnly ? "icon" : "md"}
        onClick={() => setOpen(true)}
        aria-label={iconOnly ? label : undefined}
      >
        {mode === "create" ? (
          <Plus className="h-4 w-4" />
        ) : (
          <Pencil className="h-4 w-4" />
        )}
        {!iconOnly && label}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={mode === "create" ? "Add room" : "Edit room"}
      >
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="property_id" value={propertyId} />
          {mode === "edit" && room ? (
            <input type="hidden" name="id" value={room.id} />
          ) : null}

          <FormAlert state={state} />

          <FormField
            label="Room name"
            htmlFor="room-name"
            required
            error={fieldErrors.name}
          >
            <Input
              id="room-name"
              name="name"
              defaultValue={room?.name ?? ""}
              placeholder="Room A"
              aria-invalid={Boolean(fieldErrors.name)}
              autoFocus
            />
          </FormField>

          <FormField
            label="Max occupancy"
            htmlFor="room-max-occupancy"
            hint="How many people can sleep in this room."
            error={fieldErrors.max_occupancy}
          >
            <Input
              id="room-max-occupancy"
              name="max_occupancy"
              type="number"
              min={0}
              step={1}
              defaultValue={room?.max_occupancy ?? 4}
              aria-invalid={Boolean(fieldErrors.max_occupancy)}
            />
          </FormField>

          <FormField label="Description" htmlFor="room-description">
            <Textarea
              id="room-description"
              name="description"
              defaultValue={room?.description ?? ""}
              placeholder="Front bedroom, two bunks…"
            />
          </FormField>

          {/* Photo section for edit mode only */}
          {mode === "edit" && room && (
            <div className="border-t border-slate-200 pt-4">
              <div className="mb-3 flex items-center gap-2">
                <Camera className="h-4 w-4 text-slate-400" />
                <h4 className="text-sm font-medium text-slate-700">
                  Room Photos
                </h4>
              </div>
              <PhotoUpload
                propertyId={propertyId}
                mediaType="room"
                roomId={room.id}
                existingPhotos={roomPhotos}
                onUpload={handleUpload}
                onDelete={handleDelete}
                onSetCover={handleSetCover}
                maxPhotos={5}
              />
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <SubmitButton>
              {mode === "create" ? "Add room" : "Save changes"}
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
