import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { getCurrentOwnerId } from "@/lib/auth";
import { ok, fail, type Result } from "@/lib/result";
import type {
  LeaseTemplateField,
  LeaseTemplateFieldType,
  LeaseTemplateFieldAssignedTo,
} from "@/lib/types";
import { generateFieldKey as generateKey } from "@/lib/leaseTemplateFieldOptions";

// ---------------------------------------------------------------------------
// Field CRUD Operations
// ---------------------------------------------------------------------------

export interface CreateFieldInput {
  leaseTemplateId: string;
  fieldType: LeaseTemplateFieldType;
  label: string;
  required: boolean;
  assignedTo: LeaseTemplateFieldAssignedTo;
  pageNumber: number | null;
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
  placementNote: string | null;
}

export interface UpdateFieldInput {
  id: string;
  fieldType: LeaseTemplateFieldType;
  label: string;
  required: boolean;
  assignedTo: LeaseTemplateFieldAssignedTo;
  pageNumber: number | null;
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
  placementNote: string | null;
}

/** List all fields for a lease template (owner-scoped). */
export async function listTemplateFields(
  leaseTemplateId: string
): Promise<Result<LeaseTemplateField[]>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    // Verify ownership of the template
    const { data: template, error: tErr } = await supabase
      .from("lease_templates")
      .select("id")
      .eq("id", leaseTemplateId)
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (tErr) throw tErr;
    if (!template) {
      return fail("You do not have access to this lease template.");
    }

    const { data, error } = await supabase
      .from("lease_template_fields")
      .select("*")
      .eq("lease_template_id", leaseTemplateId)
      .eq("owner_id", ownerId)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return ok((data ?? []) as LeaseTemplateField[]);
  } catch (error) {
    return fail(error);
  }
}

/** Get all existing field_keys for a template (for unique key generation). */
async function getExistingFieldKeys(
  supabase: ReturnType<typeof getServiceClient>,
  leaseTemplateId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("lease_template_fields")
    .select("field_key")
    .eq("lease_template_id", leaseTemplateId)
    .not("field_key", "is", null);

  return (data ?? []).map((r) => r.field_key as string).filter(Boolean);
}

/** Create a new field on a lease template. */
export async function createTemplateField(
  input: CreateFieldInput
): Promise<Result<{ id: string; field_key: string }>> {
  console.log("[createTemplateField] Starting with input:", {
    leaseTemplateId: input.leaseTemplateId,
    fieldType: input.fieldType,
    pageNumber: input.pageNumber,
    x: input.x,
    y: input.y,
  });

  try {
    const ownerId = await getCurrentOwnerId();
    console.log("[createTemplateField] Owner ID:", ownerId);

    const supabase = getServiceClient();

    // Verify ownership of the template
    const { data: template, error: tErr } = await supabase
      .from("lease_templates")
      .select("id, status")
      .eq("id", input.leaseTemplateId)
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (tErr) {
      console.error("[createTemplateField] Template lookup error:", tErr);
      return fail(`Template lookup failed: ${tErr.message || JSON.stringify(tErr)}`);
    }
    if (!template) {
      console.error("[createTemplateField] Template not found or not owned by user");
      return fail("You do not have access to this lease template.");
    }
    console.log("[createTemplateField] Template verified:", template.id);

    // Get max sort_order for this template
    const { data: maxRow } = await supabase
      .from("lease_template_fields")
      .select("sort_order")
      .eq("lease_template_id", input.leaseTemplateId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSortOrder = (maxRow?.sort_order ?? -1) + 1;

    // Generate unique field_key
    const existingKeys = await getExistingFieldKeys(supabase, input.leaseTemplateId);
    const fieldKey = generateKey(input.fieldType, existingKeys);
    console.log("[createTemplateField] Generated field_key:", fieldKey);

    const insertData = {
      lease_template_id: input.leaseTemplateId,
      owner_id: ownerId,
      field_key: fieldKey,
      field_type: input.fieldType,
      label: input.label.trim(),
      required: input.required,
      assigned_to: input.assignedTo,
      page_number: input.pageNumber,
      x: input.x ?? null,
      y: input.y ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      placement_note: input.placementNote?.trim() || null,
      sort_order: nextSortOrder,
    };
    console.log("[createTemplateField] Insert data:", insertData);

    const { data: row, error: insertErr } = await supabase
      .from("lease_template_fields")
      .insert(insertData)
      .select("id, field_key")
      .single();

    if (insertErr) {
      console.error("[createTemplateField] Insert error:", {
        message: insertErr.message,
        details: insertErr.details,
        hint: insertErr.hint,
        code: insertErr.code,
      });
      // Return a more specific error message
      const errMsg = insertErr.message || "Database insert failed";
      const errCode = insertErr.code ? ` [${insertErr.code}]` : "";
      const errDetails = insertErr.details ? `: ${insertErr.details}` : "";
      return fail(`${errMsg}${errDetails}${errCode}`);
    }

    console.log("[createTemplateField] Insert success:", row);

    // Update template status based on fields
    await updateTemplateStatusFromFields(input.leaseTemplateId);

    return ok({ id: row.id as string, field_key: row.field_key as string });
  } catch (error) {
    console.error("[createTemplateField] Caught exception:", error);
    return fail(error);
  }
}

/** Update an existing field. */
export async function updateTemplateField(
  input: UpdateFieldInput
): Promise<Result<null>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    // Verify ownership of the field
    const { data: field, error: fErr } = await supabase
      .from("lease_template_fields")
      .select("id, lease_template_id, field_key, field_type")
      .eq("id", input.id)
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (fErr) throw fErr;
    if (!field) {
      return fail("You do not have access to this field.");
    }

    // If field_type changed, we may need to generate a new field_key
    let newFieldKey: string | undefined;
    if (field.field_type !== input.fieldType) {
      const existingKeys = await getExistingFieldKeys(supabase, field.lease_template_id);
      // Remove current key from existing keys since we're updating this field
      const filteredKeys = existingKeys.filter((k) => k !== field.field_key);
      newFieldKey = generateKey(input.fieldType, filteredKeys);
    }

    const updateData: Record<string, unknown> = {
      field_type: input.fieldType,
      label: input.label.trim(),
      required: input.required,
      assigned_to: input.assignedTo,
      page_number: input.pageNumber,
      x: input.x ?? null,
      y: input.y ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      placement_note: input.placementNote?.trim() || null,
    };

    if (newFieldKey) {
      updateData.field_key = newFieldKey;
    }

    const { error: updateErr } = await supabase
      .from("lease_template_fields")
      .update(updateData)
      .eq("id", input.id)
      .eq("owner_id", ownerId);

    if (updateErr) throw updateErr;

    // Update template status based on fields
    await updateTemplateStatusFromFields(field.lease_template_id);

    return ok(null);
  } catch (error) {
    return fail(error);
  }
}

/** Delete a field from a lease template. */
export async function deleteTemplateField(id: string): Promise<Result<null>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    // Get field to know template ID for status update
    const { data: field, error: fErr } = await supabase
      .from("lease_template_fields")
      .select("id, lease_template_id")
      .eq("id", id)
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (fErr) throw fErr;
    if (!field) {
      return fail("You do not have access to this field.");
    }

    const { error: deleteErr } = await supabase
      .from("lease_template_fields")
      .delete()
      .eq("id", id)
      .eq("owner_id", ownerId);

    if (deleteErr) throw deleteErr;

    // Update template status based on remaining fields
    await updateTemplateStatusFromFields(field.lease_template_id);

    return ok(null);
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// Template Status Logic
// ---------------------------------------------------------------------------

/**
 * Update lease template status based on its fields.
 * - needs_setup: no required tenant_signature field exists
 * - ready: at least one required tenant_signature field exists
 * - archived: stays archived (not changed by this function)
 */
async function updateTemplateStatusFromFields(
  leaseTemplateId: string
): Promise<void> {
  const ownerId = await getCurrentOwnerId();
  const supabase = getServiceClient();

  // Check current status
  const { data: template, error: tErr } = await supabase
    .from("lease_templates")
    .select("status")
    .eq("id", leaseTemplateId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (tErr || !template) return;

  // Don't change archived templates
  if (template.status === "archived") return;

  // Check if there's a required tenant signature field
  const { data: sigField } = await supabase
    .from("lease_template_fields")
    .select("id")
    .eq("lease_template_id", leaseTemplateId)
    .eq("field_type", "tenant_signature")
    .eq("required", true)
    .eq("assigned_to", "tenant")
    .limit(1)
    .maybeSingle();

  const newStatus = sigField ? "ready" : "needs_setup";

  if (template.status !== newStatus) {
    await supabase
      .from("lease_templates")
      .update({ status: newStatus })
      .eq("id", leaseTemplateId)
      .eq("owner_id", ownerId);
  }
}

/** Get field count for a template (for display in cards). */
export async function getTemplateFieldCount(
  leaseTemplateId: string
): Promise<Result<number>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    const { count, error } = await supabase
      .from("lease_template_fields")
      .select("id", { count: "exact", head: true })
      .eq("lease_template_id", leaseTemplateId)
      .eq("owner_id", ownerId);

    if (error) throw error;
    return ok(count ?? 0);
  } catch (error) {
    return fail(error);
  }
}

/** Check if a template is ready (has required tenant signature). */
export async function checkTemplateReadiness(
  leaseTemplateId: string
): Promise<Result<{ ready: boolean; hasSignature: boolean; fieldCount: number }>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    // Get field count
    const { count: fieldCount, error: countErr } = await supabase
      .from("lease_template_fields")
      .select("id", { count: "exact", head: true })
      .eq("lease_template_id", leaseTemplateId)
      .eq("owner_id", ownerId);

    if (countErr) throw countErr;

    // Check for required tenant signature
    const { data: sigField } = await supabase
      .from("lease_template_fields")
      .select("id")
      .eq("lease_template_id", leaseTemplateId)
      .eq("owner_id", ownerId)
      .eq("field_type", "tenant_signature")
      .eq("required", true)
      .eq("assigned_to", "tenant")
      .limit(1)
      .maybeSingle();

    const hasSignature = Boolean(sigField);

    return ok({
      ready: hasSignature,
      hasSignature,
      fieldCount: fieldCount ?? 0,
    });
  } catch (error) {
    return fail(error);
  }
}
