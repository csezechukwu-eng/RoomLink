import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { getCurrentOwnerId } from "@/lib/auth";
import { ok, fail, type Result } from "@/lib/result";
import type {
  Application,
  Bed,
  LeaseStayType,
  LeaseTemplate,
  LeaseTemplateField,
  PreparedLease,
  PreparedLeaseField,
  PreparedLeaseWithDetails,
  Property,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LeaseAutomationContext {
  application: Application & {
    property_name: string | null;
    room_name: string | null;
    bed_label: string | null;
    monthly_rent: number | null;
    deposit_amount: number | null;
  };
  linkedTemplate: LeaseTemplate | null;
  templateFieldCount: number;
  hasRequiredSignature: boolean;
  existingPreparedLease: PreparedLease | null;
  missingRequirements: string[];
  canSendLease: boolean;
}

export interface ApproveAndSendLeaseResult {
  preparedLeaseId: string;
  reservationId: string;
}

// ---------------------------------------------------------------------------
// Lease Reference Number Generation
// ---------------------------------------------------------------------------

/**
 * Generate a unique lease reference number.
 * Format: RL-LEASE-YYYY-NNNNNN
 * Uses the database to ensure uniqueness.
 */
async function generateLeaseReferenceNumber(): Promise<string> {
  const supabase = getServiceClient();
  const year = new Date().getFullYear();
  const prefix = `RL-LEASE-${year}-`;

  // Get the highest existing sequence number for this year
  const { data, error } = await supabase
    .from("prepared_leases")
    .select("lease_reference_number")
    .like("lease_reference_number", `${prefix}%`)
    .order("lease_reference_number", { ascending: false })
    .limit(1);

  if (error) throw error;

  let nextSequence = 1;
  if (data && data.length > 0 && data[0].lease_reference_number) {
    const lastRef = data[0].lease_reference_number as string;
    const lastSeq = parseInt(lastRef.substring(prefix.length), 10);
    if (!isNaN(lastSeq)) {
      nextSequence = lastSeq + 1;
    }
  }

  return `${prefix}${nextSequence.toString().padStart(6, "0")}`;
}

// ---------------------------------------------------------------------------
// Signature Reference Number Generation
// ---------------------------------------------------------------------------

/** Field types that require signature reference numbers */
const SIGNATURE_FIELD_TYPES = [
  "tenant_signature",
  "landlord_signature",
  "tenant_initials",
  "landlord_initials",
  "date_signed",
  "tenant_full_name",
  "landlord_full_name",
] as const;

/** Get the type prefix for a signature field type */
function getSignatureTypePrefix(fieldType: string): string | null {
  switch (fieldType) {
    case "tenant_signature":
    case "landlord_signature":
      return "SIGN";
    case "tenant_initials":
    case "landlord_initials":
      return "INIT";
    case "date_signed":
      return "DATE";
    case "tenant_full_name":
    case "landlord_full_name":
      return "NAME";
    default:
      return null;
  }
}

/**
 * Generate a unique signature reference number.
 * Format: RL-{TYPE}-YYYY-NNNNNN-NNN
 * Where TYPE is SIGN/INIT/DATE/NAME, NNNNNN is the lease sequence,
 * and NNN is the field sequence within the lease.
 */
function generateSignatureReferenceNumber(
  leaseReferenceNumber: string,
  fieldType: string,
  fieldIndex: number
): string | null {
  const prefix = getSignatureTypePrefix(fieldType);
  if (!prefix) return null;

  // Extract year and sequence from lease reference: RL-LEASE-YYYY-NNNNNN
  const parts = leaseReferenceNumber.split("-");
  if (parts.length < 4) return null;

  const year = parts[2]; // YYYY
  const leaseSeq = parts[3]; // NNNNNN
  const fieldSeq = (fieldIndex + 1).toString().padStart(3, "0");

  return `RL-${prefix}-${year}-${leaseSeq}-${fieldSeq}`;
}

function generatePreparedFieldKey(templateFieldKey: string, index: number): string {
  const suffix = (index + 1).toString().padStart(3, "0");
  return `PF-${templateFieldKey || `FIELD-${suffix}`}`;
}

// ---------------------------------------------------------------------------
// Find linked lease template by stay_type
// ---------------------------------------------------------------------------

/**
 * Find the lease template linked to an application's stay_type.
 * Priority:
 * 1. Ready template matching stay_type + property_id
 * 2. Ready template matching stay_type (generic, no property_id)
 */
export async function findLinkedLeaseTemplate(
  ownerId: string,
  stayType: LeaseStayType | null,
  propertyId: string
): Promise<Result<LeaseTemplate | null>> {
  try {
    if (!stayType) {
      return ok(null);
    }

    const supabase = getServiceClient();

    // First try: property-specific ready template
    const { data: propertyTemplate, error: pErr } = await supabase
      .from("lease_templates")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("stay_type", stayType)
      .eq("property_id", propertyId)
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pErr) throw pErr;
    if (propertyTemplate) {
      return ok(propertyTemplate as LeaseTemplate);
    }

    // Second try: generic ready template (no property_id)
    const { data: genericTemplate, error: gErr } = await supabase
      .from("lease_templates")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("stay_type", stayType)
      .is("property_id", null)
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (gErr) throw gErr;
    if (genericTemplate) {
      return ok(genericTemplate as LeaseTemplate);
    }

    // No match found
    return ok(null);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Check if a lease template has a required tenant_signature field.
 */
export async function checkTemplateHasRequiredSignature(
  templateId: string
): Promise<Result<boolean>> {
  try {
    const supabase = getServiceClient();
    const { count, error } = await supabase
      .from("lease_template_fields")
      .select("id", { count: "exact", head: true })
      .eq("lease_template_id", templateId)
      .eq("field_type", "tenant_signature")
      .eq("required", true);
    if (error) throw error;
    return ok((count ?? 0) > 0);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Get template field count.
 */
export async function getTemplateFieldCount(
  templateId: string
): Promise<Result<number>> {
  try {
    const supabase = getServiceClient();
    const { count, error } = await supabase
      .from("lease_template_fields")
      .select("id", { count: "exact", head: true })
      .eq("lease_template_id", templateId);
    if (error) throw error;
    return ok(count ?? 0);
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// Get lease automation context for an application
// ---------------------------------------------------------------------------

export async function getLeaseAutomationContext(
  applicationId: string
): Promise<Result<LeaseAutomationContext | null>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    // Get the application
    const { data: appRow, error: aErr } = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!appRow) return ok(null);
    const application = appRow as Application;

    // Verify ownership via property
    const { data: property, error: pErr } = await supabase
      .from("properties")
      .select("*")
      .eq("id", application.property_id)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!property) return ok(null); // Not this owner's application

    const prop = property as Property;

    // Get bed details
    let bed: Bed | null = null;
    let roomName: string | null = null;
    if (application.bed_id) {
      const { data: bedRow } = await supabase
        .from("beds")
        .select("*")
        .eq("id", application.bed_id)
        .maybeSingle();
      bed = (bedRow as Bed) ?? null;

      if (bed?.room_id) {
        const { data: roomRow } = await supabase
          .from("rooms")
          .select("name")
          .eq("id", bed.room_id)
          .maybeSingle();
        roomName = roomRow?.name ?? null;
      }
    } else if (application.desired_room_id) {
      const { data: roomRow } = await supabase
        .from("rooms")
        .select("name")
        .eq("id", application.desired_room_id)
        .maybeSingle();
      roomName = roomRow?.name ?? null;
    }

    // Find linked template
    const templateResult = await findLinkedLeaseTemplate(
      ownerId,
      application.stay_type,
      application.property_id
    );
    const linkedTemplate = templateResult.data ?? null;

    // Get template field info
    let templateFieldCount = 0;
    let hasRequiredSignature = false;
    if (linkedTemplate) {
      const countResult = await getTemplateFieldCount(linkedTemplate.id);
      templateFieldCount = countResult.data ?? 0;
      const sigResult = await checkTemplateHasRequiredSignature(linkedTemplate.id);
      hasRequiredSignature = sigResult.data ?? false;
    }

    // Check for existing prepared lease
    const { data: existingLease } = await supabase
      .from("prepared_leases")
      .select("*")
      .eq("application_id", applicationId)
      .eq("owner_id", ownerId)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Build missing requirements list
    const missingRequirements: string[] = [];

    if (!application.stay_type) {
      missingRequirements.push("Application does not have a rental/stay type assigned");
    }
    if (!linkedTemplate && application.stay_type) {
      missingRequirements.push(`No lease template linked to "${application.stay_type}" rental type`);
    }
    if (linkedTemplate && linkedTemplate.status !== "ready") {
      missingRequirements.push("Lease template needs field setup");
    }
    if (linkedTemplate && templateFieldCount === 0) {
      missingRequirements.push("Lease template has no signature fields placed");
    }
    if (linkedTemplate && !hasRequiredSignature) {
      missingRequirements.push("Lease template missing required tenant signature field");
    }
    if (!application.bed_id) {
      missingRequirements.push("Application is not assigned to a specific bed");
    }
    if (existingLease && existingLease.status !== "cancelled") {
      missingRequirements.push("A lease has already been sent for this application");
    }

    const canSendLease =
      missingRequirements.length === 0 &&
      linkedTemplate !== null &&
      linkedTemplate.status === "ready" &&
      hasRequiredSignature &&
      application.bed_id !== null &&
      !existingLease;

    return ok({
      application: {
        ...application,
        property_name: prop.name,
        room_name: roomName,
        bed_label: bed?.label ?? null,
        monthly_rent: bed?.monthly_rent ?? null,
        deposit_amount: bed?.deposit_amount ?? null,
      },
      linkedTemplate,
      templateFieldCount,
      hasRequiredSignature,
      existingPreparedLease: (existingLease as PreparedLease) ?? null,
      missingRequirements,
      canSendLease,
    });
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// Approve application and send lease
// ---------------------------------------------------------------------------

export async function approveAndSendLease(
  applicationId: string
): Promise<Result<ApproveAndSendLeaseResult>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    // Get automation context
    const ctxResult = await getLeaseAutomationContext(applicationId);
    if (ctxResult.error !== null) return fail(ctxResult.error);
    if (!ctxResult.data) return fail("Application not found or access denied.");

    const ctx = ctxResult.data;

    // Validate we can send
    if (!ctx.canSendLease) {
      const issues = ctx.missingRequirements.join("; ");
      return fail(`Cannot send lease: ${issues}`);
    }

    const { application, linkedTemplate } = ctx;
    if (!linkedTemplate) return fail("No linked lease template found.");

    // Validate application can be approved
    const approvableStatuses = ["submitted", "under_review", "waitlisted"];
    if (!approvableStatuses.includes(application.status)) {
      return fail(`Application cannot be approved from "${application.status}" status.`);
    }
    if (!application.applicant_id) {
      return fail("Application has no linked applicant.");
    }
    if (!application.bed_id) {
      return fail("Application is not tied to a specific bed.");
    }

    // Get bed to validate vacancy
    const { data: bedRow, error: bErr } = await supabase
      .from("beds")
      .select("*")
      .eq("id", application.bed_id)
      .maybeSingle();
    if (bErr) throw bErr;
    if (!bedRow) return fail("The applied-for bed no longer exists.");
    const bed = bedRow as Bed;
    if (bed.status !== "vacant") {
      return fail("That bed is no longer vacant.");
    }

    // Get template fields to copy
    const { data: templateFields, error: tfErr } = await supabase
      .from("lease_template_fields")
      .select("*")
      .eq("lease_template_id", linkedTemplate.id)
      .order("sort_order", { ascending: true });
    if (tfErr) throw tfErr;

    // --- Start transaction-like operations ---

    // 1. Reserve the bed
    const { error: bedErr } = await supabase
      .from("beds")
      .update({ status: "reserved" })
      .eq("id", bed.id);
    if (bedErr) throw bedErr;

    // 2. Create reservation
    const { data: reservation, error: rErr } = await supabase
      .from("reservations")
      .insert({
        property_id: application.property_id,
        bed_id: bed.id,
        tenant_id: application.applicant_id,
        application_id: application.id,
        status: "active",
        start_date: application.desired_move_in || new Date().toISOString().slice(0, 10),
        deposit_amount: bed.deposit_amount,
        deposit_status: "unpaid",
      })
      .select("id")
      .single();
    if (rErr) throw rErr;

    // 3. Update application status to approved
    const now = new Date().toISOString();
    const { error: appErr } = await supabase
      .from("applications")
      .update({ status: "approved", decided_at: now })
      .eq("id", application.id);
    if (appErr) throw appErr;

    // 4. Auto-reject competing applications for the same bed
    await supabase
      .from("applications")
      .update({ status: "rejected", decided_at: now })
      .eq("bed_id", bed.id)
      .in("status", ["submitted", "under_review", "waitlisted"])
      .neq("id", application.id);

    // 5. Build snapshots
    const applicantSnapshot = {
      name: `${application.first_name} ${application.last_name || ""}`.trim(),
      email: application.email,
      phone: application.phone,
    };

    const propertySnapshot = {
      name: application.property_name,
      address: null, // Would need to fetch from property
    };

    const roomSnapshot = application.room_name ? { name: application.room_name } : null;
    const bedSnapshot = application.bed_label ? { label: application.bed_label } : null;
    const rentSnapshot = { monthly_rent: application.monthly_rent };
    const depositSnapshot = { deposit_amount: application.deposit_amount };

    const autofillSnapshot = {
      tenantName: applicantSnapshot.name,
      tenantEmail: application.email,
      tenantPhone: application.phone,
      monthlyIncome: application.monthly_income,
      employer: application.employer_name,
      propertyName: application.property_name,
      roomName: application.room_name,
      bedLabel: application.bed_label,
      monthlyRent: application.monthly_rent,
      depositAmount: application.deposit_amount,
      moveInDate: application.desired_move_in,
      rentalType: application.stay_type,
      stayType: application.stay_type,
    };

    // 6. Generate lease reference number
    const leaseReferenceNumber = await generateLeaseReferenceNumber();

    // 7. Create prepared lease
    // Check if this is a demo application to propagate is_demo flag
    const isDemo = (application as { is_demo?: boolean }).is_demo ?? false;

    const { data: preparedLease, error: plErr } = await supabase
      .from("prepared_leases")
      .insert({
        owner_id: ownerId,
        application_id: application.id,
        lease_template_id: linkedTemplate.id,
        property_id: application.property_id,
        room_id: bed.room_id,
        bed_id: bed.id,
        tenant_id: application.applicant_id,
        rental_type: application.stay_type,
        status: "sent",
        lease_reference_number: leaseReferenceNumber,
        applicant_snapshot: applicantSnapshot,
        property_snapshot: propertySnapshot,
        room_snapshot: roomSnapshot,
        bed_snapshot: bedSnapshot,
        rent_snapshot: rentSnapshot,
        deposit_snapshot: depositSnapshot,
        autofill_snapshot: autofillSnapshot,
        sent_at: now,
        is_demo: isDemo,
      })
      .select("id")
      .single();
    if (plErr) throw plErr;

    // 8. Copy template fields to prepared lease fields with signature reference numbers
    const fields = (templateFields ?? []) as LeaseTemplateField[];
    let signatureFieldIndex = 0;
    const preparedFields = fields.map((field, index) => {
      // Generate signature reference number for signature-related fields
      const isSignatureField = SIGNATURE_FIELD_TYPES.includes(
        field.field_type as (typeof SIGNATURE_FIELD_TYPES)[number]
      );
      let signatureReferenceNumber: string | null = null;
      let signatureInstanceKey: string | null = null;

      if (isSignatureField) {
        signatureReferenceNumber = generateSignatureReferenceNumber(
          leaseReferenceNumber,
          field.field_type,
          signatureFieldIndex
        );
        // Also set signature_instance_key to match for backwards compatibility
        signatureInstanceKey = signatureReferenceNumber;
        signatureFieldIndex++;
      }

      return {
        prepared_lease_id: preparedLease.id,
        lease_template_field_id: field.id,
        template_field_key: field.field_key || `FIELD-${index + 1}`,
        prepared_field_key: generatePreparedFieldKey(field.field_key || "", index),
        signature_instance_key: signatureInstanceKey,
        signature_reference_number: signatureReferenceNumber,
        field_type: field.field_type,
        label: field.label,
        required: field.required,
        assigned_to: field.assigned_to,
        page_number: field.page_number,
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        placement_note: field.placement_note,
        sort_order: field.sort_order,
        is_demo: isDemo,
      };
    });

    if (preparedFields.length > 0) {
      const { error: pfErr } = await supabase
        .from("prepared_lease_fields")
        .insert(preparedFields);
      if (pfErr) throw pfErr;
    }

    return ok({
      preparedLeaseId: preparedLease.id,
      reservationId: reservation.id,
    });
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// List prepared leases for owner
// ---------------------------------------------------------------------------

export async function listPreparedLeases(): Promise<Result<PreparedLeaseWithDetails[]>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from("prepared_leases")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const leases = (data ?? []) as PreparedLease[];
    if (leases.length === 0) return ok([]);

    // Get template titles
    const templateIds = [...new Set(leases.map((l) => l.lease_template_id))];
    const { data: templates } = await supabase
      .from("lease_templates")
      .select("id, title")
      .in("id", templateIds);
    const templateTitles = new Map((templates ?? []).map((t) => [t.id, t.title]));

    // Get property names
    const propertyIds = [...new Set(leases.map((l) => l.property_id).filter(Boolean))] as string[];
    const { data: properties } = propertyIds.length > 0
      ? await supabase.from("properties").select("id, name").in("id", propertyIds)
      : { data: [] };
    const propertyNames = new Map((properties ?? []).map((p) => [p.id, p.name]));

    return ok(
      leases.map((l) => ({
        ...l,
        template_title: templateTitles.get(l.lease_template_id) ?? null,
        property_name: l.property_id ? propertyNames.get(l.property_id) ?? null : null,
        applicant_name: l.applicant_snapshot?.name ?? null,
      }))
    );
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// Get prepared lease field count
// ---------------------------------------------------------------------------

export async function getPreparedLeaseFieldCount(
  preparedLeaseId: string
): Promise<Result<number>> {
  try {
    const supabase = getServiceClient();
    const { count, error } = await supabase
      .from("prepared_lease_fields")
      .select("id", { count: "exact", head: true })
      .eq("prepared_lease_id", preparedLeaseId);
    if (error) throw error;
    return ok(count ?? 0);
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// Get prepared lease fields for signature tracking
// ---------------------------------------------------------------------------

export async function getPreparedLeaseFields(
  preparedLeaseId: string
): Promise<Result<PreparedLeaseField[]>> {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("prepared_lease_fields")
      .select("*")
      .eq("prepared_lease_id", preparedLeaseId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return ok((data ?? []) as PreparedLeaseField[]);
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// Get prepared lease by ID with full details
// ---------------------------------------------------------------------------

export async function getPreparedLeaseById(
  preparedLeaseId: string
): Promise<Result<PreparedLeaseWithDetails | null>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from("prepared_leases")
      .select("*")
      .eq("id", preparedLeaseId)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return ok(null);

    const lease = data as PreparedLease;

    // Get template title
    const { data: template } = await supabase
      .from("lease_templates")
      .select("title")
      .eq("id", lease.lease_template_id)
      .maybeSingle();

    // Get property name
    let propertyName: string | null = null;
    if (lease.property_id) {
      const { data: property } = await supabase
        .from("properties")
        .select("name")
        .eq("id", lease.property_id)
        .maybeSingle();
      propertyName = property?.name ?? null;
    }

    return ok({
      ...lease,
      template_title: template?.title ?? null,
      property_name: propertyName,
      applicant_name: lease.applicant_snapshot?.name ?? null,
    });
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// Search prepared leases by reference number
// ---------------------------------------------------------------------------

export async function searchPreparedLeases(
  query: string
): Promise<Result<PreparedLeaseWithDetails[]>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    // Search by lease_reference_number
    const { data, error } = await supabase
      .from("prepared_leases")
      .select("*")
      .eq("owner_id", ownerId)
      .ilike("lease_reference_number", `%${query}%`)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const leases = (data ?? []) as PreparedLease[];
    if (leases.length === 0) return ok([]);

    // Get template titles
    const templateIds = [...new Set(leases.map((l) => l.lease_template_id))];
    const { data: templates } = await supabase
      .from("lease_templates")
      .select("id, title")
      .in("id", templateIds);
    const templateTitles = new Map((templates ?? []).map((t) => [t.id, t.title]));

    // Get property names
    const propertyIds = [...new Set(leases.map((l) => l.property_id).filter(Boolean))] as string[];
    const { data: properties } = propertyIds.length > 0
      ? await supabase.from("properties").select("id, name").in("id", propertyIds)
      : { data: [] };
    const propertyNames = new Map((properties ?? []).map((p) => [p.id, p.name]));

    return ok(
      leases.map((l) => ({
        ...l,
        template_title: templateTitles.get(l.lease_template_id) ?? null,
        property_name: l.property_id ? propertyNames.get(l.property_id) ?? null : null,
        applicant_name: l.applicant_snapshot?.name ?? null,
      }))
    );
  } catch (error) {
    return fail(error);
  }
}
