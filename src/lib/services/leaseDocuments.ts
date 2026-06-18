import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { getCurrentOwnerId } from "@/lib/auth";
import { ok, fail, type Result } from "@/lib/result";
import { computeLeaseReadiness, type LeaseContext } from "@/lib/leaseReadiness";
import type {
  Application,
  Bed,
  LeaseDocument,
  LeaseTermType,
  Property,
  SignatureField,
} from "@/lib/types";
import { stampSignaturesOntoPdf } from "./pdfStamping";
import { scanPdfForSignatureFields } from "./pdfScanning";

const BUCKET = "lease-documents";

// Only accept PDF for the signing workflow
const ACCEPTED_DOCUMENT_TYPES = [
  "application/pdf",
];

const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/rtf": "rtf",
  "application/vnd.oasis.opendocument.text": "odt",
};

export interface ApplicationLeaseContext {
  ctx: LeaseContext;
  existing: LeaseDocument | null;
}

/**
 * Gather the lease context for an application (owner-verified): application,
 * property, room, bed (rent/deposit), plus any non-cancelled lease document.
 */
export async function getApplicationLeaseContext(
  applicationId: string
): Promise<Result<ApplicationLeaseContext | null>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    const { data: appRow, error: aErr } = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!appRow) return ok(null);
    const application = appRow as Application;

    // Ownership gate: the application's property must belong to this landlord.
    const { data: property, error: pErr } = await supabase
      .from("properties")
      .select("*")
      .eq("id", application.property_id)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!property) return ok(null); // not this owner's application

    const prop = property as Property;

    let bed: Bed | null = null;
    if (application.bed_id) {
      const { data: bedRow } = await supabase
        .from("beds")
        .select("*")
        .eq("id", application.bed_id)
        .maybeSingle();
      bed = (bedRow as Bed) ?? null;
    }
    const roomId = bed?.room_id ?? application.desired_room_id ?? null;
    let room: { id: string; name: string } | null = null;
    if (roomId) {
      const { data: roomRow } = await supabase
        .from("rooms")
        .select("id, name")
        .eq("id", roomId)
        .maybeSingle();
      room = (roomRow as { id: string; name: string }) ?? null;
    }

    const { data: existingRows } = await supabase
      .from("lease_documents")
      .select("*")
      .eq("application_id", applicationId)
      .eq("owner_id", ownerId)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(1);
    const existing = ((existingRows ?? [])[0] as LeaseDocument) ?? null;

    const ctx: LeaseContext = {
      application: {
        id: application.id,
        status: application.status,
        full_name:
          application.full_name ||
          `${application.first_name ?? ""} ${application.last_name ?? ""}`.trim() ||
          null,
        email: application.email ?? null,
        desired_move_in: application.desired_move_in,
        applicant_id: application.applicant_id,
      },
      property: { id: prop.id, name: prop.name, address: prop.address },
      room,
      bed: bed
        ? {
            id: bed.id,
            label: bed.label,
            monthly_rent: bed.monthly_rent,
            deposit_amount: bed.deposit_amount,
          }
        : null,
    };

    return ok({ ctx, existing });
  } catch (error) {
    return fail(error);
  }
}

export interface CreateLeaseDocumentInput {
  applicationId: string;
  title: string;
  leaseStartDate: string | null;
  leaseEndDate: string | null;
  leaseTermType: LeaseTermType | null;
  file: { name: string; type: string; bytes: ArrayBuffer; size: number };
}

const MAX_FILE_SIZE = 20 * 1024 * 1024;

/** Create a lease document: validate readiness, upload the file, snapshot terms. */
export async function createLeaseDocument(
  input: CreateLeaseDocumentInput
): Promise<Result<{ id: string }>> {
  try {
    if (!ACCEPTED_DOCUMENT_TYPES.includes(input.file.type))
      return fail("Please upload a PDF, Word document (.doc, .docx), RTF, or ODT file.");
    if (input.file.size > MAX_FILE_SIZE)
      return fail("That file is too large (20MB max).");

    const ctxResult = await getApplicationLeaseContext(input.applicationId);
    if (ctxResult.error !== null) return fail(ctxResult.error);
    if (!ctxResult.data)
      return fail("You do not have access to this application.");

    const { ctx, existing } = ctxResult.data;
    if (existing)
      return fail("A lease document already exists for this applicant.");

    const readiness = computeLeaseReadiness(ctx);
    if (!readiness.ready)
      return fail("Complete the lease readiness checklist before uploading.");

    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    const stamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const ext = "pdf";

    // Upload the PDF to the private bucket under the owner's folder.
    const path = `${ownerId}/${input.applicationId}/${stamp}-${rand}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, input.file.bytes, { contentType: "application/pdf", upsert: false });
    if (upErr) throw upErr;

    // Scan PDF for signature fields and set default positions
    let detectedSignatureFields: SignatureField[] = [];
    try {
      const scanResult = await scanPdfForSignatureFields(input.file.bytes);
      if (scanResult.landlord) {
        detectedSignatureFields.push(scanResult.landlord);
      }
      if (scanResult.tenant) {
        detectedSignatureFields.push(scanResult.tenant);
      }
    } catch (scanError) {
      console.error("PDF scanning failed, using defaults:", scanError);
    }

    // Always ensure we have default signature fields for drag-and-drop
    if (detectedSignatureFields.length === 0) {
      detectedSignatureFields = [
        { type: "landlord", page: 0, x: 0.55, y: 0.75, width: 0.35, height: 0.08 },
        { type: "tenant", page: 0, x: 0.1, y: 0.75, width: 0.35, height: 0.08 },
      ];
    }

    const { ctx: c } = ctxResult.data;
    const { data: row, error: insErr } = await supabase
      .from("lease_documents")
      .insert({
        owner_id: ownerId,
        property_id: c.property!.id,
        room_id: c.room?.id ?? null,
        bed_id: c.bed?.id ?? null,
        tenant_id: c.application.applicant_id,
        application_id: c.application.id,
        title: input.title.trim() || "Lease",
        status: "preparing",
        original_file_path: path,
        lease_start_date: input.leaseStartDate,
        lease_end_date: input.leaseEndDate,
        lease_term_type: input.leaseTermType,
        monthly_rent_snapshot: c.bed?.monthly_rent ?? null,
        deposit_amount_snapshot: c.bed?.deposit_amount ?? null,
        property_snapshot: { name: c.property?.name ?? null, address: c.property?.address ?? null },
        room_snapshot: { name: c.room?.name ?? null },
        bed_snapshot: { label: c.bed?.label ?? null },
        tenant_snapshot: { name: c.application.full_name, email: c.application.email },
        // Auto-detected signature fields
        signature_fields: detectedSignatureFields.length > 0 ? detectedSignatureFields : null,
      })
      .select("id")
      .single();
    if (insErr) {
      // Roll back the uploaded file so we don't orphan it.
      await supabase.storage.from(BUCKET).remove([path]);
      throw insErr;
    }

    return ok({ id: row.id as string });
  } catch (error) {
    return fail(error);
  }
}

/** Owner-scoped fetch of one lease document. */
export async function getLeaseDocument(
  id: string
): Promise<Result<LeaseDocument | null>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("lease_documents")
      .select("*")
      .eq("id", id)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (error) throw error;
    return ok((data as LeaseDocument) ?? null);
  } catch (error) {
    return fail(error);
  }
}

/** Short-lived signed URL for viewing the private PDF (owner-verified). */
export async function getLeaseDocumentSignedUrl(
  id: string
): Promise<Result<string | null>> {
  try {
    const docResult = await getLeaseDocument(id);
    if (docResult.error !== null) return fail(docResult.error);
    const doc = docResult.data;
    if (!doc || !doc.original_file_path) return ok(null);

    const supabase = getServiceClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.original_file_path, 60 * 60);
    if (error) throw error;
    return ok(data?.signedUrl ?? null);
  } catch (error) {
    return fail(error);
  }
}

/** Replace the document on a draft/preparing lease document (owner-scoped). */
export async function replaceLeaseDocumentFile(
  id: string,
  file: { name: string; type: string; bytes: ArrayBuffer; size: number }
): Promise<Result<null>> {
  try {
    if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type))
      return fail("Please upload a PDF file.");
    if (file.size > MAX_FILE_SIZE) return fail("That file is too large (20MB max).");

    const docResult = await getLeaseDocument(id);
    if (docResult.error !== null) return fail(docResult.error);
    const doc = docResult.data;
    if (!doc) return fail("You do not have access to this lease document.");
    if (doc.status === "cancelled")
      return fail("This lease document can no longer be changed.");

    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();
    const stamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const ext = "pdf";

    const path = `${ownerId}/${doc.application_id ?? doc.id}/${stamp}-${rand}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file.bytes, { contentType: "application/pdf", upsert: false });
    if (upErr) throw upErr;

    // Scan PDF for signature fields
    let detectedSignatureFields: SignatureField[] = [];
    try {
      const scanResult = await scanPdfForSignatureFields(file.bytes);
      if (scanResult.landlord) {
        detectedSignatureFields.push(scanResult.landlord);
      }
      if (scanResult.tenant) {
        detectedSignatureFields.push(scanResult.tenant);
      }
    } catch (scanError) {
      console.error("PDF scanning failed on replace:", scanError);
    }

    // Always ensure we have default signature fields
    if (detectedSignatureFields.length === 0) {
      detectedSignatureFields = [
        { type: "landlord", page: 0, x: 0.55, y: 0.75, width: 0.35, height: 0.08 },
        { type: "tenant", page: 0, x: 0.1, y: 0.75, width: 0.35, height: 0.08 },
      ];
    }

    const { error: updErr } = await supabase
      .from("lease_documents")
      .update({
        original_file_path: path,
        // Update signature fields with new detected positions
        signature_fields: detectedSignatureFields,
        // Clear any previous signed file since we're replacing the original
        signed_file_path: null,
      })
      .eq("id", id)
      .eq("owner_id", ownerId);
    if (updErr) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw updErr;
    }

    // Best-effort cleanup of the previous file.
    if (doc.original_file_path) {
      await supabase.storage.from(BUCKET).remove([doc.original_file_path]);
    }
    return ok(null);
  } catch (error) {
    return fail(error);
  }
}

export interface LeaseDocumentWithProperty extends LeaseDocument {
  property_name: string | null;
}

/** All of the current owner's lease documents (newest first) with property name. */
export async function listLeaseDocuments(): Promise<
  Result<LeaseDocumentWithProperty[]>
> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("lease_documents")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const rows = (data ?? []) as LeaseDocument[];
    if (rows.length === 0) return ok([]);

    const propertyIds = [...new Set(rows.map((r) => r.property_id))];
    const { data: props } = await supabase
      .from("properties")
      .select("id, name")
      .in("id", propertyIds);
    const propName = new Map((props ?? []).map((p) => [p.id, p.name]));
    return ok(
      rows.map((r) => ({ ...r, property_name: propName.get(r.property_id) ?? null }))
    );
  } catch (error) {
    return fail(error);
  }
}

/** Tenant portal: lease documents assigned to a tenant (newest first). */
export async function getTenantLeaseDocuments(
  tenantId: string
): Promise<Result<LeaseDocumentWithProperty[]>> {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("lease_documents")
      .select("*")
      .eq("tenant_id", tenantId)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const rows = (data ?? []) as LeaseDocument[];
    if (rows.length === 0) return ok([]);
    const propertyIds = [...new Set(rows.map((r) => r.property_id))];
    const { data: props } = await supabase
      .from("properties")
      .select("id, name")
      .in("id", propertyIds);
    const propName = new Map((props ?? []).map((p) => [p.id, p.name]));
    return ok(
      rows.map((r) => ({ ...r, property_name: propName.get(r.property_id) ?? null }))
    );
  } catch (error) {
    return fail(error);
  }
}

/** Public (link-based) fetch of a lease document for the tenant signing page. */
export async function getLeaseDocumentForSigning(
  id: string
): Promise<Result<LeaseDocumentWithProperty | null>> {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("lease_documents")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return ok(null);
    const doc = data as LeaseDocument;
    const { data: prop } = await supabase
      .from("properties")
      .select("name")
      .eq("id", doc.property_id)
      .maybeSingle();
    return ok({ ...doc, property_name: prop?.name ?? null });
  } catch (error) {
    return fail(error);
  }
}

/** Landlord: send a prepared lease out for signature (owner-scoped). */
export async function sendLeaseDocumentForSignature(
  id: string
): Promise<Result<null>> {
  try {
    const docResult = await getLeaseDocument(id);
    if (docResult.error !== null) return fail(docResult.error);
    const doc = docResult.data;
    if (!doc) return fail("You do not have access to this lease document.");
    if (!doc.original_file_path) return fail("Upload a lease PDF before sending.");
    if (doc.status === "cancelled") return fail("This lease was cancelled.");
    if (doc.status === "completed") return fail("This lease is already completed.");

    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();
    const { error } = await supabase
      .from("lease_documents")
      .update({ status: "out_for_signature", sent_at: new Date().toISOString() })
      .eq("id", id)
      .eq("owner_id", ownerId);
    if (error) throw error;
    return ok(null);
  } catch (error) {
    return fail(error);
  }
}

/** Landlord: apply the landlord's saved signature to a lease (owner-scoped). */
export async function signLeaseDocumentAsLandlord(
  id: string
): Promise<Result<null>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    const { data: userRow } = await supabase
      .from("users")
      .select("signature_data")
      .eq("id", ownerId)
      .maybeSingle();
    if (!userRow?.signature_data)
      return fail("Set up your signature in Settings first.");

    const docResult = await getLeaseDocument(id);
    if (docResult.error !== null) return fail(docResult.error);
    const doc = docResult.data;
    if (!doc) return fail("You do not have access to this lease document.");
    if (doc.status === "cancelled") return fail("This lease was cancelled.");
    if (doc.landlord_signed_at) return fail("You have already signed this lease.");

    const now = new Date().toISOString();
    const completed = Boolean(doc.tenant_signed_at);
    const { error } = await supabase
      .from("lease_documents")
      .update({
        landlord_signature_data: userRow.signature_data,
        landlord_signed_at: now,
        status: completed ? "completed" : "out_for_signature",
        completed_at: completed ? now : null,
      })
      .eq("id", id)
      .eq("owner_id", ownerId);
    if (error) throw error;
    return ok(null);
  } catch (error) {
    return fail(error);
  }
}

/** Tenant (link-based): apply the tenant's drawn signature to a lease. */
export async function signLeaseDocumentAsTenant(
  id: string,
  signatureData: string
): Promise<Result<null>> {
  try {
    if (!signatureData.startsWith("data:image/png;base64,"))
      return fail("Invalid signature format.");

    const supabase = getServiceClient();
    const { data, error: fErr } = await supabase
      .from("lease_documents")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (fErr) throw fErr;
    const doc = (data as LeaseDocument) ?? null;
    if (!doc) return fail("Lease not found.");
    if (doc.tenant_signed_at) return fail("This lease has already been signed.");
    if (doc.status !== "out_for_signature")
      return fail("This lease is not available for signing.");

    const now = new Date().toISOString();
    const completed = Boolean(doc.landlord_signed_at);
    const { error } = await supabase
      .from("lease_documents")
      .update({
        tenant_signature_data: signatureData,
        tenant_signed_at: now,
        status: completed ? "completed" : "out_for_signature",
        completed_at: completed ? now : null,
      })
      .eq("id", id);
    if (error) throw error;
    return ok(null);
  } catch (error) {
    return fail(error);
  }
}

/** Cancel a draft/preparing lease document (owner-scoped). */
export async function cancelLeaseDocument(id: string): Promise<Result<null>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();
    const { data: doc, error } = await supabase
      .from("lease_documents")
      .select("id, status")
      .eq("id", id)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (error) throw error;
    if (!doc) return fail("You do not have access to this lease document.");
    if (doc.status === "cancelled") return ok(null);
    if (doc.status === "completed") return fail("A completed lease can't be cancelled.");

    const { error: updErr } = await supabase
      .from("lease_documents")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("owner_id", ownerId);
    if (updErr) throw updErr;
    return ok(null);
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// Review & Sign workflow (new functions)
// ---------------------------------------------------------------------------

/** Save signature field placements for a lease document (owner-scoped). */
export async function saveSignatureFields(
  id: string,
  fields: SignatureField[]
): Promise<Result<null>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    const { data: doc, error: fetchErr } = await supabase
      .from("lease_documents")
      .select("id, status")
      .eq("id", id)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!doc) return fail("You do not have access to this lease document.");
    if (doc.status === "cancelled") return fail("This lease was cancelled.");
    if (doc.status === "completed") return fail("This lease is already completed.");

    const { error } = await supabase
      .from("lease_documents")
      .update({ signature_fields: fields })
      .eq("id", id)
      .eq("owner_id", ownerId);
    if (error) throw error;
    return ok(null);
  } catch (error) {
    return fail(error);
  }
}

/** Get landlord's saved signature (for preview). */
export async function getLandlordSignature(): Promise<Result<string | null>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("users")
      .select("signature_data")
      .eq("id", ownerId)
      .maybeSingle();
    if (error) throw error;
    return ok(data?.signature_data ?? null);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Review, sign, and send a lease document.
 * This is the new combined flow:
 * 1. Stamps the landlord's signature onto the PDF
 * 2. Uploads the signed PDF
 * 3. Updates the lease document with signature data and sends it
 */
export async function reviewSignAndSendLease(
  id: string,
  signatureFields: SignatureField[]
): Promise<Result<null>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    // Get landlord's signature
    const { data: userRow } = await supabase
      .from("users")
      .select("signature_data")
      .eq("id", ownerId)
      .maybeSingle();
    if (!userRow?.signature_data)
      return fail("Set up your signature in Settings first.");

    // Validate signature fields
    const landlordField = signatureFields.find((f) => f.type === "landlord");
    const tenantField = signatureFields.find((f) => f.type === "tenant");
    if (!landlordField)
      return fail("Please place your signature on the document.");
    if (!tenantField)
      return fail("Please place a signature box for the tenant.");

    // Get the lease document
    const docResult = await getLeaseDocument(id);
    if (docResult.error !== null) return fail(docResult.error);
    const doc = docResult.data;
    if (!doc) return fail("You do not have access to this lease document.");
    if (!doc.original_file_path) return fail("Upload a lease document first.");
    if (doc.status === "cancelled") return fail("This lease was cancelled.");
    if (doc.status === "completed") return fail("This lease is already completed.");
    if (doc.status === "out_for_signature")
      return fail("This lease has already been sent for signature.");

    // Download the original PDF
    const { data: fileData, error: dlErr } = await supabase.storage
      .from(BUCKET)
      .download(doc.original_file_path);
    if (dlErr) throw dlErr;
    if (!fileData) return fail("Could not download the lease document.");

    const pdfBytes = await fileData.arrayBuffer();

    // Stamp the landlord's signature onto the PDF
    const stampedPdf = await stampSignaturesOntoPdf({
      pdfBytes,
      signatureFields,
      landlordSignature: userRow.signature_data,
      tenantSignature: null, // Tenant hasn't signed yet
    });

    // Upload the signed PDF
    const stamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const signedPath = `${ownerId}/${doc.application_id ?? doc.id}/${stamp}-${rand}-signed.pdf`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(signedPath, stampedPdf, { contentType: "application/pdf", upsert: false });
    if (upErr) throw upErr;

    // Update the lease document
    const now = new Date().toISOString();
    const { error: updErr } = await supabase
      .from("lease_documents")
      .update({
        signature_fields: signatureFields,
        signed_file_path: signedPath,
        landlord_signature_data: userRow.signature_data,
        landlord_signed_at: now,
        status: "out_for_signature",
        sent_at: now,
      })
      .eq("id", id)
      .eq("owner_id", ownerId);
    if (updErr) {
      // Cleanup uploaded file on failure
      await supabase.storage.from(BUCKET).remove([signedPath]);
      throw updErr;
    }

    return ok(null);
  } catch (error) {
    return fail(error);
  }
}

/** Get signed URL for the stamped/signed PDF (if exists), otherwise original. */
export async function getLeaseDocumentPdfUrl(
  id: string,
  preferSigned: boolean = true
): Promise<Result<string | null>> {
  try {
    const docResult = await getLeaseDocument(id);
    if (docResult.error !== null) return fail(docResult.error);
    const doc = docResult.data;
    if (!doc) return ok(null);

    const filePath =
      preferSigned && doc.signed_file_path
        ? doc.signed_file_path
        : doc.original_file_path;
    if (!filePath) return ok(null);

    const supabase = getServiceClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 60 * 60); // 1 hour
    if (error) throw error;
    return ok(data?.signedUrl ?? null);
  } catch (error) {
    return fail(error);
  }
}

/** Public: Get signed URL for tenant signing page (uses signed PDF if available). */
export async function getLeaseDocumentPdfUrlForSigning(
  id: string
): Promise<Result<string | null>> {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("lease_documents")
      .select("original_file_path, signed_file_path")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return ok(null);

    // Prefer signed PDF for tenant viewing
    const filePath = data.signed_file_path ?? data.original_file_path;
    if (!filePath) return ok(null);

    const { data: urlData, error: urlErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 60 * 60);
    if (urlErr) throw urlErr;
    return ok(urlData?.signedUrl ?? null);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Tenant signs: stamp their signature onto the signed PDF.
 * Updates signed_file_path with the fully-signed version.
 */
export async function signLeaseDocumentAsTenantWithStamp(
  id: string,
  signatureData: string
): Promise<Result<null>> {
  try {
    if (!signatureData.startsWith("data:image/png;base64,"))
      return fail("Invalid signature format.");

    const supabase = getServiceClient();
    const { data, error: fErr } = await supabase
      .from("lease_documents")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (fErr) throw fErr;
    const doc = (data as LeaseDocument) ?? null;
    if (!doc) return fail("Lease not found.");
    if (doc.tenant_signed_at) return fail("This lease has already been signed.");
    if (doc.status !== "out_for_signature")
      return fail("This lease is not available for signing.");
    if (!doc.signature_fields || doc.signature_fields.length === 0)
      return fail("Signature fields not configured.");

    // Download the current signed PDF (which has landlord signature)
    const pdfPath = doc.signed_file_path ?? doc.original_file_path;
    if (!pdfPath) return fail("Lease document not found.");

    const { data: fileData, error: dlErr } = await supabase.storage
      .from(BUCKET)
      .download(pdfPath);
    if (dlErr) throw dlErr;
    if (!fileData) return fail("Could not download the lease document.");

    const pdfBytes = await fileData.arrayBuffer();

    // Stamp the tenant's signature onto the PDF
    const stampedPdf = await stampSignaturesOntoPdf({
      pdfBytes,
      signatureFields: doc.signature_fields,
      landlordSignature: null, // Already stamped
      tenantSignature: signatureData,
    });

    // Upload the fully-signed PDF (replace the previous signed PDF path name)
    const stamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const finalPath = `${doc.owner_id}/${doc.application_id ?? doc.id}/${stamp}-${rand}-final.pdf`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(finalPath, stampedPdf, { contentType: "application/pdf", upsert: false });
    if (upErr) throw upErr;

    const now = new Date().toISOString();
    const { error: updErr } = await supabase
      .from("lease_documents")
      .update({
        tenant_signature_data: signatureData,
        tenant_signed_at: now,
        signed_file_path: finalPath,
        status: "completed",
        completed_at: now,
      })
      .eq("id", id);
    if (updErr) {
      await supabase.storage.from(BUCKET).remove([finalPath]);
      throw updErr;
    }

    return ok(null);
  } catch (error) {
    return fail(error);
  }
}
