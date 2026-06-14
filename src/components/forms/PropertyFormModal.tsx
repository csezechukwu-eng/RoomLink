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
import { PROPERTY_TYPES } from "@/lib/constants";
import { initialActionState } from "@/lib/actions/types";
import { createProperty, updateProperty } from "@/lib/actions/properties";
import type { Property } from "@/lib/types";

interface PropertyFormModalProps {
  mode: "create" | "edit";
  property?: Property;
  triggerVariant?: "primary" | "outline" | "secondary";
  triggerLabel?: string;
  iconOnly?: boolean;
}

export function PropertyFormModal({
  mode,
  property,
  triggerVariant = mode === "create" ? "primary" : "outline",
  triggerLabel,
  iconOnly,
}: PropertyFormModalProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const action = mode === "create" ? createProperty : updateProperty;
  const [state, formAction] = useActionState(action, initialActionState);

  // Edit success -> close + refresh. (Create redirects server-side.)
  React.useEffect(() => {
    if (open && mode === "edit" && state.status === "success") {
      setOpen(false);
      router.refresh();
    }
  }, [state, open, mode, router]);

  const label = triggerLabel ?? (mode === "create" ? "New Property" : "Edit");
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <>
      <Button
        variant={triggerVariant}
        size={iconOnly ? "sm" : "md"}
        onClick={() => setOpen(true)}
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
        title={mode === "create" ? "New property" : "Edit property"}
        description={
          mode === "create"
            ? "Add a crash pad or shared-housing property to your portfolio."
            : undefined
        }
      >
        <form action={formAction} className="space-y-4">
          {mode === "edit" && property ? (
            <input type="hidden" name="id" value={property.id} />
          ) : null}

          <FormAlert state={state} />

          <FormField
            label="Property name"
            htmlFor="property-name"
            required
            error={fieldErrors.name}
          >
            <Input
              id="property-name"
              name="name"
              defaultValue={property?.name ?? ""}
              placeholder="Charlotte Flight Crew Crash Pad"
              aria-invalid={Boolean(fieldErrors.name)}
              autoFocus
            />
          </FormField>

          <FormField
            label="Property type"
            htmlFor="property-type"
            required
            error={fieldErrors.property_type}
          >
            <Select
              id="property-type"
              name="property_type"
              defaultValue={property?.property_type ?? "crash_pad"}
              aria-invalid={Boolean(fieldErrors.property_type)}
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Address" htmlFor="property-address">
            <Input
              id="property-address"
              name="address"
              defaultValue={property?.address ?? ""}
              placeholder="4821 Yorkmont Rd"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="City" htmlFor="property-city">
              <Input
                id="property-city"
                name="city"
                defaultValue={property?.city ?? ""}
                placeholder="Charlotte"
              />
            </FormField>
            <FormField label="State" htmlFor="property-state">
              <Input
                id="property-state"
                name="state"
                defaultValue={property?.state ?? ""}
                placeholder="NC"
              />
            </FormField>
            <FormField label="ZIP" htmlFor="property-zip">
              <Input
                id="property-zip"
                name="zip"
                defaultValue={property?.zip ?? ""}
                placeholder="28208"
              />
            </FormField>
          </div>

          <FormField label="Description" htmlFor="property-description">
            <Textarea
              id="property-description"
              name="description"
              defaultValue={property?.description ?? ""}
              placeholder="Who is this place for? Location highlights, vibe, etc."
            />
          </FormField>

          <FormField label="House rules" htmlFor="property-house-rules">
            <Textarea
              id="property-house-rules"
              name="house_rules"
              defaultValue={property?.house_rules ?? ""}
              placeholder="Quiet hours, smoking policy, guests…"
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
              {mode === "create" ? "Create property" : "Save changes"}
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
