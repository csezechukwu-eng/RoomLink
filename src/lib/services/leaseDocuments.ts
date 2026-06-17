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
} from "@/lib/types";

const BUCKET = "lease-documents";

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

const MAX_PDF_SIZE = 20 * 1024 * 1024;

/** Create a lease document: validate readiness, upload the PDF, snapshot terms. */
export async function createLeaseDocument(
  input: CreateLeaseDocumentInput
): Promise<Result<{ id: string }>> {
  try {
    if (input.file.type !== "application/pdf")
      return fail("Please upload a PDF file.");
    if (input.file.size > MAX_PDF_SIZE)
      return fail("That PDF is too large (20MB max).");

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

    // Upload the PDF to the private bucket under the owner's folder.
    const stamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const path = `${ownerId}/${input.applicationId}/${stamp}-${rand}.pdf`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, input.file.bytes, { contentType: "application/pdf", upsert: false });
    if (upErr) throw upErr;

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

/** Replace the PDF on a draft/preparing lease document (owner-scoped). */
export async function replaceLeaseDocumentFile(
  id: string,
  file: { type: string; bytes: ArrayBuffer; size: number }
): Promise<Result<null>> {
  try {
    if (file.type !== "application/pdf") return fail("Please upload a PDF file.");
    if (file.size > MAX_PDF_SIZE) return fail("That PDF is too large (20MB max).");

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
    const path = `${ownerId}/${doc.application_id ?? doc.id}/${stamp}-${rand}.pdf`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file.bytes, { contentType: "application/pdf", upsert: false });
    if (upErr) throw upErr;

    const { error: updErr } = await supabase
      .from("lease_documents")
      .update({ original_file_path: path })
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
