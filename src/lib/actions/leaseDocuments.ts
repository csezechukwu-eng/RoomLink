"use server";

import { redirect } from "next/navigation";
import {
  createLeaseDocument,
  cancelLeaseDocument as cancelLeaseDocumentService,
  replaceLeaseDocumentFile,
  sendLeaseDocumentForSignature,
  signLeaseDocumentAsLandlord,
  signLeaseDocumentAsTenant,
  reviewSignAndSendLease,
  signLeaseDocumentAsTenantWithStamp,
} from "@/lib/services/leaseDocuments";
import type { LeaseTermType, SignatureField } from "@/lib/types";
import {
  type ActionState,
  errorState,
  messageFrom,
  optionalStr,
  revalidateApp,
  str,
  successState,
} from "@/lib/actions/_shared";

const TERM_TYPES = new Set<LeaseTermType>([
  "month_to_month",
  "fixed_term",
  "short_term_bed",
]);

// Only accept PDF for electronic signing
const ACCEPTED_DOCUMENT_TYPES = new Set([
  "application/pdf",
]);

/** Landlord: upload a lease document and create the lease document record. */
export async function uploadLeaseDocument(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const applicationId = str(formData, "application_id");
  if (!applicationId) return errorState("Missing application id.");

  const title = str(formData, "title") || "Lease";
  const leaseStartDate = optionalStr(formData, "lease_start_date");
  const leaseEndDate = optionalStr(formData, "lease_end_date");
  const rawTerm = str(formData, "lease_term_type");
  const leaseTermType = TERM_TYPES.has(rawTerm as LeaseTermType)
    ? (rawTerm as LeaseTermType)
    : null;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return errorState("Choose a lease document to upload.");
  if (!ACCEPTED_DOCUMENT_TYPES.has(file.type))
    return errorState("Please upload a PDF file for electronic signing.");

  let leaseId: string;
  try {
    const bytes = await file.arrayBuffer();
    const result = await createLeaseDocument({
      applicationId,
      title,
      leaseStartDate,
      leaseEndDate,
      leaseTermType,
      file: { name: file.name, type: file.type, bytes, size: file.size },
    });
    if (result.error !== null) return errorState(result.error);
    leaseId = result.data.id;
  } catch (error) {
    return errorState(messageFrom(error));
  }

  revalidateApp();
  redirect(`/dashboard/lease-documents/${leaseId}`);
}

/** Landlord: replace the document on a draft/preparing lease document. */
export async function replaceLeasePdf(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  if (!id) return errorState("Missing lease document id.");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return errorState("Choose a lease document to upload.");
  if (!ACCEPTED_DOCUMENT_TYPES.has(file.type))
    return errorState("Please upload a PDF file for electronic signing.");

  try {
    const bytes = await file.arrayBuffer();
    const result = await replaceLeaseDocumentFile(id, {
      name: file.name,
      type: file.type,
      bytes,
      size: file.size,
    });
    if (result.error !== null) return errorState(result.error);
  } catch (error) {
    return errorState(messageFrom(error));
  }

  revalidateApp();
  return successState("Lease document replaced.");
}

/** Landlord: send a prepared lease out for signature. */
export async function sendLeaseForSignature(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  if (!id) return errorState("Missing lease document id.");
  const result = await sendLeaseDocumentForSignature(id);
  if (result.error !== null) return errorState(result.error);
  revalidateApp();
  return successState("Lease sent for signature.");
}

/** Landlord: sign a lease with the saved signature. */
export async function signLeaseAsLandlord(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  if (!id) return errorState("Missing lease document id.");
  const result = await signLeaseDocumentAsLandlord(id);
  if (result.error !== null) return errorState(result.error);
  revalidateApp();
  return successState("Lease signed.");
}

/** Tenant (link-based): sign a lease with a drawn signature. */
export async function signLeaseAsTenant(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  const token = str(formData, "token");
  const signatureData = str(formData, "signature_data");
  if (!id) return errorState("Missing lease id.");
  if (!token) return errorState("Missing signing token.");
  if (!signatureData) return errorState("Please provide your signature.");
  const result = await signLeaseDocumentAsTenant(id, token, signatureData);
  if (result.error !== null) return errorState(result.error);
  revalidateApp();
  return successState("Lease signed successfully.");
}

/** Landlord: cancel a draft/preparing lease document. */
export async function cancelLeaseDocument(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  if (!id) return errorState("Missing lease document id.");

  const result = await cancelLeaseDocumentService(id);
  if (result.error !== null) return errorState(result.error);

  revalidateApp();
  return successState("Lease document cancelled.");
}

// ---------------------------------------------------------------------------
// Review & Sign workflow actions
// ---------------------------------------------------------------------------

/** Landlord: review, sign, and send a lease document (new combined flow). */
export async function reviewSignAndSend(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  if (!id) return errorState("Missing lease document id.");

  const signatureFieldsJson = str(formData, "signature_fields");
  if (!signatureFieldsJson) return errorState("Missing signature field placements.");

  let signatureFields: SignatureField[];
  try {
    signatureFields = JSON.parse(signatureFieldsJson);
    if (!Array.isArray(signatureFields)) throw new Error("Invalid format");
  } catch {
    return errorState("Invalid signature field data.");
  }

  try {
    const result = await reviewSignAndSendLease(id, signatureFields);
    if (result.error !== null) return errorState(result.error);
  } catch (error) {
    return errorState(messageFrom(error));
  }

  revalidateApp();
  redirect(`/dashboard/lease-documents/${id}`);
}

/** Tenant: sign a lease with a drawn signature (stamps onto PDF). */
export async function signLeaseAsTenantWithStamp(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  const token = str(formData, "token");
  const signatureData = str(formData, "signature_data");
  if (!id) return errorState("Missing lease id.");
  if (!token) return errorState("Missing signing token.");
  if (!signatureData) return errorState("Please provide your signature.");

  try {
    const result = await signLeaseDocumentAsTenantWithStamp(id, token, signatureData);
    if (result.error !== null) return errorState(result.error);
  } catch (error) {
    return errorState(messageFrom(error));
  }

  revalidateApp();
  return successState("Lease signed successfully.");
}
