"use server";

import {
  createLeaseTemplate,
  archiveLeaseTemplate as archiveLeaseTemplateService,
  getLeaseTemplateSignedUrl,
} from "@/lib/services/leaseTemplates";
import type { LeaseCategory, LeaseStayType } from "@/lib/types";
import {
  type ActionState,
  errorState,
  messageFrom,
  optionalStr,
  revalidateApp,
  str,
  successState,
} from "@/lib/actions/_shared";

// Valid enum values
const LEASE_CATEGORIES = new Set<LeaseCategory>([
  "month_to_month_room_lease",
  "fixed_term_lease",
  "midterm_lease",
  "short_term_bed_rental",
  "crash_pad_agreement",
  "student_housing_agreement",
  "travel_nurse_housing_agreement",
  "other",
]);

const STAY_TYPES = new Set<LeaseStayType>([
  "month_to_month",
  "yearly",
  "midterm",
  "short_term",
  "bed_rental",
  "room_rental",
  "crash_pad",
  "student_housing",
  "travel_nurse_housing",
]);

// Only accept PDF for MVP
const ACCEPTED_DOCUMENT_TYPES = new Set(["application/pdf"]);

/** Landlord: upload a reusable lease template. */
export async function uploadLeaseTemplate(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const title = str(formData, "title");
  if (!title) return errorState("Lease title is required.");

  const rawCategory = str(formData, "lease_category");
  if (!LEASE_CATEGORIES.has(rawCategory as LeaseCategory)) {
    return errorState("Please select a lease category.");
  }
  const leaseCategory = rawCategory as LeaseCategory;

  const rawStayType = str(formData, "stay_type");
  if (!STAY_TYPES.has(rawStayType as LeaseStayType)) {
    return errorState("Please select a stay type.");
  }
  const stayType = rawStayType as LeaseStayType;

  const propertyId = optionalStr(formData, "property_id");
  const notes = optionalStr(formData, "notes");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return errorState("Please select a PDF file to upload.");
  }
  if (!ACCEPTED_DOCUMENT_TYPES.has(file.type)) {
    return errorState("PDF is supported now. Word document support coming later.");
  }

  try {
    const bytes = await file.arrayBuffer();
    const result = await createLeaseTemplate({
      title,
      leaseCategory,
      stayType,
      propertyId,
      notes,
      file: { name: file.name, type: file.type, bytes, size: file.size },
    });

    if (result.error !== null) {
      return errorState(result.error);
    }

    revalidateApp();
    return successState("Lease template uploaded successfully.", {
      id: result.data.id,
    });
  } catch (error) {
    return errorState(messageFrom(error));
  }
}

/** Landlord: archive a lease template. */
export async function archiveLeaseTemplate(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  if (!id) return errorState("Missing template id.");

  try {
    const result = await archiveLeaseTemplateService(id);
    if (result.error !== null) {
      return errorState(result.error);
    }

    revalidateApp();
    return successState("Lease template archived.");
  } catch (error) {
    return errorState(messageFrom(error));
  }
}

/** Get a signed URL for viewing a lease template PDF. */
export async function fetchTemplatePdfUrl(
  templateId: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    if (!templateId) {
      return { url: null, error: "No template ID provided" };
    }

    const result = await getLeaseTemplateSignedUrl(templateId);

    if (result.error !== null) {
      // Log server-side for debugging (not exposed to client)
      console.error("[fetchTemplatePdfUrl] Error:", result.error);
      return { url: null, error: result.error };
    }

    if (!result.data) {
      return { url: null, error: "Template not found or no file uploaded" };
    }

    return { url: result.data, error: null };
  } catch (error) {
    console.error("[fetchTemplatePdfUrl] Exception:", error);
    return { url: null, error: messageFrom(error) };
  }
}
