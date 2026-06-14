"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormAlert } from "@/components/forms/FormAlert";
import { BED_STATUSES, BUNK_TYPES } from "@/lib/constants";
import { initialActionState } from "@/lib/actions/types";
import { createBed, updateBed } from "@/lib/actions/beds";
import type { Bed, Room } from "@/lib/types";

interface BedFormModalProps {
  mode: "create" | "edit";
  propertyId: string;
  rooms: Pick<Room, "id" | "name">[];
  bed?: Bed;
  defaultRoomId?: string;
  triggerVariant?: "primary" | "outline" | "secondary" | "ghost";
  triggerLabel?: string;
  triggerSize?: "sm" | "md";
  iconOnly?: boolean;
}

export function BedFormModal({
  mode,
  propertyId,
  rooms,
  bed,
  defaultRoomId,
  triggerVariant = mode === "create" ? "primary" : "ghost",
  triggerLabel,
  triggerSize = "md",
  iconOnly,
}: BedFormModalProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const action = mode === "create" ? createBed : updateBed;
  const [state, formAction] = useActionState(action, initialActionState);

  React.useEffect(() => {
    if (open && state.status === "success") {
      setOpen(false);
      router.refresh();
    }
  }, [state, open, router]);

  const label = triggerLabel ?? (mode === "create" ? "Add Bed" : "Edit");
  const fieldErrors = state.fieldErrors ?? {};
  const selectedRoom = bed?.room_id ?? defaultRoomId ?? rooms[0]?.id ?? "";

  return (
    <>
      <Button
        variant={triggerVariant}
        size={iconOnly ? "icon" : triggerSize}
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
        title={mode === "create" ? "Add bed" : "Edit bed"}
      >
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="property_id" value={propertyId} />
          {mode === "edit" && bed ? (
            <input type="hidden" name="id" value={bed.id} />
          ) : null}

          <FormAlert state={state} />

          <FormField
            label="Room"
            htmlFor="bed-room"
            required
            error={fieldErrors.room_id}
          >
            <Select
              id="bed-room"
              name="room_id"
              defaultValue={selectedRoom}
              aria-invalid={Boolean(fieldErrors.room_id)}
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Label"
            htmlFor="bed-label"
            required
            error={fieldErrors.label}
          >
            <Input
              id="bed-label"
              name="label"
              defaultValue={bed?.label ?? ""}
              placeholder="Bed 1 Top Bunk"
              aria-invalid={Boolean(fieldErrors.label)}
              autoFocus
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Bunk type"
              htmlFor="bed-bunk-type"
              error={fieldErrors.bunk_type}
            >
              <Select
                id="bed-bunk-type"
                name="bunk_type"
                defaultValue={bed?.bunk_type ?? "single"}
              >
                {BUNK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Status"
              htmlFor="bed-status"
              error={fieldErrors.status}
            >
              <Select
                id="bed-status"
                name="status"
                defaultValue={bed?.status ?? "vacant"}
              >
                {BED_STATUSES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Monthly rent"
              htmlFor="bed-monthly-rent"
              error={fieldErrors.monthly_rent}
            >
              <Input
                id="bed-monthly-rent"
                name="monthly_rent"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                defaultValue={bed?.monthly_rent ?? ""}
                placeholder="750"
                aria-invalid={Boolean(fieldErrors.monthly_rent)}
              />
            </FormField>

            <FormField
              label="Deposit amount"
              htmlFor="bed-deposit"
              error={fieldErrors.deposit_amount}
            >
              <Input
                id="bed-deposit"
                name="deposit_amount"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                defaultValue={bed?.deposit_amount ?? ""}
                placeholder="150"
                aria-invalid={Boolean(fieldErrors.deposit_amount)}
              />
            </FormField>
          </div>

          <FormField label="Description" htmlFor="bed-description">
            <Textarea
              id="bed-description"
              name="description"
              defaultValue={bed?.description ?? ""}
              placeholder="Notes about this bed (optional)"
            />
          </FormField>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <SubmitButton>
              {mode === "create" ? "Add bed" : "Save changes"}
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
