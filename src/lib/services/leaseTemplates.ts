import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { getCurrentOwnerId } from "@/lib/auth";
import { ok, fail, type Result } from "@/lib/result";
import type {
  LeaseTemplate,
  LeaseTemplateWithProperty,
  LeaseCategory,
  LeaseStayType,
} from "@/lib/types";

const BUCKET = "lease-documents";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// Only accept PDF for MVP
const ACCEPTED_DOCUMENT_TYPES = ["application/pdf"];

export interface CreateLeaseTemplateInput {
  title: string;
  leaseCategory: LeaseCategory;
  stayType: LeaseStayType;
  propertyId: string | null;
  notes: string | null;
  file: { name: string; type: string; bytes: ArrayBuffer; size: number };
}

/** Create a new lease template with file upload. */
export async function createLeaseTemplate(
  input: CreateLeaseTemplateInput
): Promise<Result<{ id: string }>> {
  try {
    if (!ACCEPTED_DOCUMENT_TYPES.includes(input.file.type)) {
      return fail(
        "PDF is supported now. Word document support coming later."
      );
    }
    if (input.file.size > MAX_FILE_SIZE) {
      return fail("File is too large (20MB max).");
    }
    if (!input.title.trim()) {
      return fail("Lease title is required.");
    }

    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    // Upload file to the private bucket under owner's templates folder
    const stamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const safeName = input.file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const path = `${ownerId}/templates/${stamp}-${rand}-${safeName}`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, input.file.bytes, {
        contentType: input.file.type,
        upsert: false,
      });
    if (uploadErr) throw uploadErr;

    // Create the template record
    const { data: row, error: insertErr } = await supabase
      .from("lease_templates")
      .insert({
        owner_id: ownerId,
        title: input.title.trim(),
        lease_category: input.leaseCategory,
        stay_type: input.stayType,
        property_id: input.propertyId,
        file_path: path,
        file_name: input.file.name,
        file_type: input.file.type,
        status: "needs_setup",
        notes: input.notes,
      })
      .select("id")
      .single();

    if (insertErr) {
      // Roll back the uploaded file
      await supabase.storage.from(BUCKET).remove([path]);
      throw insertErr;
    }

    return ok({ id: row.id as string });
  } catch (error) {
    return fail(error);
  }
}

/** List all lease templates for the current owner. */
export async function listLeaseTemplates(): Promise<
  Result<LeaseTemplateWithProperty[]>
> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from("lease_templates")
      .select("*")
      .eq("owner_id", ownerId)
      .neq("status", "archived")
      .order("created_at", { ascending: false });

    if (error) throw error;
    const templates = (data ?? []) as LeaseTemplate[];

    if (templates.length === 0) {
      return ok([]);
    }

    // Fetch property names for linked templates
    const propertyIds = [
      ...new Set(templates.map((t) => t.property_id).filter(Boolean)),
    ] as string[];

    let propertyNames = new Map<string, string>();
    if (propertyIds.length > 0) {
      const { data: props } = await supabase
        .from("properties")
        .select("id, name")
        .in("id", propertyIds);
      propertyNames = new Map((props ?? []).map((p) => [p.id, p.name]));
    }

    return ok(
      templates.map((t) => ({
        ...t,
        property_name: t.property_id ? propertyNames.get(t.property_id) ?? null : null,
      }))
    );
  } catch (error) {
    return fail(error);
  }
}

/** Get a single lease template by ID (owner-scoped). */
export async function getLeaseTemplate(
  id: string
): Promise<Result<LeaseTemplateWithProperty | null>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from("lease_templates")
      .select("*")
      .eq("id", id)
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return ok(null);

    const template = data as LeaseTemplate;
    let propertyName: string | null = null;

    if (template.property_id) {
      const { data: prop } = await supabase
        .from("properties")
        .select("name")
        .eq("id", template.property_id)
        .maybeSingle();
      propertyName = prop?.name ?? null;
    }

    return ok({ ...template, property_name: propertyName });
  } catch (error) {
    return fail(error);
  }
}

/** Archive a lease template (soft delete). */
export async function archiveLeaseTemplate(id: string): Promise<Result<null>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    const { error } = await supabase
      .from("lease_templates")
      .update({ status: "archived" })
      .eq("id", id)
      .eq("owner_id", ownerId);

    if (error) throw error;
    return ok(null);
  } catch (error) {
    return fail(error);
  }
}

/** Get a signed URL for viewing the template PDF. */
export async function getLeaseTemplateSignedUrl(
  id: string
): Promise<Result<string | null>> {
  try {
    const result = await getLeaseTemplate(id);
    if (result.error !== null) {
      console.error("[getLeaseTemplateSignedUrl] getLeaseTemplate failed:", result.error);
      return fail(result.error);
    }
    if (!result.data) {
      console.log("[getLeaseTemplateSignedUrl] Template not found:", id);
      return ok(null);
    }

    const template = result.data;
    console.log("[getLeaseTemplateSignedUrl] Template:", {
      id: template.id,
      file_path: template.file_path,
      file_name: template.file_name,
      file_type: template.file_type,
    });

    if (!template.file_path) {
      return fail("Template has no uploaded file");
    }

    const supabase = getServiceClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(template.file_path, 60 * 60); // 1 hour

    if (error) {
      console.error("[getLeaseTemplateSignedUrl] Signed URL error:", {
        message: error.message,
        bucket: BUCKET,
        path: template.file_path,
      });
      throw error;
    }

    if (!data?.signedUrl) {
      console.error("[getLeaseTemplateSignedUrl] No signed URL returned");
      return fail("Failed to generate document URL");
    }

    return ok(data.signedUrl);
  } catch (error) {
    console.error("[getLeaseTemplateSignedUrl] Exception:", error);
    return fail(error);
  }
}

// Re-export options from shared file (can be used by client components)
export {
  LEASE_CATEGORY_OPTIONS,
  STAY_TYPE_OPTIONS,
  getLeaseCategoryLabel,
  getStayTypeLabel,
} from "@/lib/leaseTemplateOptions";
