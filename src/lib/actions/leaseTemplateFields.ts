"use server";

import {
  createTemplateField,
  updateTemplateField,
  deleteTemplateField,
} from "@/lib/services/leaseTemplateFields";
import type {
  LeaseTemplateFieldType,
  LeaseTemplateFieldAssignedTo,
} from "@/lib/types";
import {
  type ActionState,
  errorState,
  messageFrom,
  optionalStr,
  str,
  num,
  successState,
} from "@/lib/actions/_shared";

// Valid enum values - expanded to include new field types
const FIELD_TYPES = new Set<LeaseTemplateFieldType>([
  "tenant_signature",
  "tenant_initials",
  "date_signed",
  "tenant_full_name",
  "email",
  "phone",
  "text",
  "checkbox",
]);

const ASSIGNED_TO_VALUES = new Set<LeaseTemplateFieldAssignedTo>([
  "tenant",
  "landlord",
]);

/** Create a new field on a lease template. */
export async function addTemplateField(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const leaseTemplateId = str(formData, "lease_template_id");
  if (!leaseTemplateId) return errorState("Missing template ID.");

  const label = str(formData, "label");
  if (!label) return errorState("Field label is required.");

  const rawFieldType = str(formData, "field_type");
  if (!FIELD_TYPES.has(rawFieldType as LeaseTemplateFieldType)) {
    return errorState("Please select a valid field type.");
  }
  const fieldType = rawFieldType as LeaseTemplateFieldType;

  const rawAssignedTo = str(formData, "assigned_to");
  if (!ASSIGNED_TO_VALUES.has(rawAssignedTo as LeaseTemplateFieldAssignedTo)) {
    return errorState("Please select who this field is assigned to.");
  }
  const assignedTo = rawAssignedTo as LeaseTemplateFieldAssignedTo;

  const required = str(formData, "required") === "true";
  const pageNumber = num(formData, "page_number");
  const x = num(formData, "x");
  const y = num(formData, "y");
  const width = num(formData, "width");
  const height = num(formData, "height");
  const placementNote = optionalStr(formData, "placement_note");

  try {
    const result = await createTemplateField({
      leaseTemplateId,
      fieldType,
      label,
      required,
      assignedTo,
      pageNumber,
      x,
      y,
      width,
      height,
      placementNote,
    });

    if (result.error !== null) {
      return errorState(result.error);
    }

    // Note: We intentionally do NOT call revalidateApp() here.
    // The client-side state management in FieldDesigner handles UI updates.
    // Calling revalidateApp() would cause a page refresh that wipes client state
    // before the field can be displayed.
    return successState("Field added successfully.", {
      id: result.data.id,
      field_key: result.data.field_key,
    });
  } catch (error) {
    return errorState(messageFrom(error));
  }
}

/** Update an existing field. */
export async function editTemplateField(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  if (!id) return errorState("Missing field ID.");

  const label = str(formData, "label");
  if (!label) return errorState("Field label is required.");

  const rawFieldType = str(formData, "field_type");
  if (!FIELD_TYPES.has(rawFieldType as LeaseTemplateFieldType)) {
    return errorState("Please select a valid field type.");
  }
  const fieldType = rawFieldType as LeaseTemplateFieldType;

  const rawAssignedTo = str(formData, "assigned_to");
  if (!ASSIGNED_TO_VALUES.has(rawAssignedTo as LeaseTemplateFieldAssignedTo)) {
    return errorState("Please select who this field is assigned to.");
  }
  const assignedTo = rawAssignedTo as LeaseTemplateFieldAssignedTo;

  const required = str(formData, "required") === "true";
  const pageNumber = num(formData, "page_number");
  const x = num(formData, "x");
  const y = num(formData, "y");
  const width = num(formData, "width");
  const height = num(formData, "height");
  const placementNote = optionalStr(formData, "placement_note");

  try {
    const result = await updateTemplateField({
      id,
      fieldType,
      label,
      required,
      assignedTo,
      pageNumber,
      x,
      y,
      width,
      height,
      placementNote,
    });

    if (result.error !== null) {
      return errorState(result.error);
    }

    // Note: We intentionally do NOT call revalidateApp() here.
    // The client-side state management handles UI updates for field edits.
    return successState("Field updated successfully.");
  } catch (error) {
    return errorState(messageFrom(error));
  }
}

/** Delete a field from a lease template. */
export async function removeTemplateField(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  if (!id) return errorState("Missing field ID.");

  try {
    const result = await deleteTemplateField(id);

    if (result.error !== null) {
      return errorState(result.error);
    }

    // Note: We intentionally do NOT call revalidateApp() here.
    // The client-side state management handles UI updates for field deletion.
    return successState("Field deleted.");
  } catch (error) {
    return errorState(messageFrom(error));
  }
}
