"use server";

import { getCurrentUser, getCurrentOwnerId } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
import { createLeaseForApplication, createLeaseWithCustomFields, createDirectLease } from "@/lib/services/leases";
import {
  type ActionState,
  errorState,
  revalidateApp,
  str,
  optionalStr,
  num,
  successState,
} from "@/lib/actions/_shared";

/** Landlord: generate + send the lease for an application via DocuSign. */
export async function sendLeaseAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const applicationId = str(formData, "application_id");
  if (!applicationId) return errorState("Missing application id.");

  const user = await getCurrentUser();
  if (!user?.email)
    return errorState("Your account needs an email to sign as the landlord.");

  const result = await createLeaseForApplication({
    applicationId,
    landlord: {
      name: user.user_metadata?.full_name || "Landlord",
      email: user.email,
    },
  });
  if (result.error !== null) return errorState(result.error);

  revalidateApp();
  return successState("Lease sent for signature.", { id: result.data.id });
}

/** Landlord: generate + send the lease with custom editable fields. */
export async function sendLeaseWithFieldsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const applicationId = str(formData, "application_id");
  if (!applicationId) return errorState("Missing application id.");

  const user = await getCurrentUser();
  if (!user?.email)
    return errorState("Your account needs an email to sign as the landlord.");

  const result = await createLeaseWithCustomFields({
    applicationId,
    landlord: {
      name: user.user_metadata?.full_name || "Landlord",
      email: user.email,
    },
    fields: {
      propertyName: optionalStr(formData, "property_name"),
      propertyAddress: optionalStr(formData, "property_address"),
      roomName: optionalStr(formData, "room_name"),
      bedLabel: optionalStr(formData, "bed_label"),
      monthlyRent: num(formData, "monthly_rent"),
      depositAmount: num(formData, "deposit_amount"),
      leaseStart: optionalStr(formData, "lease_start"),
      leaseEnd: optionalStr(formData, "lease_end"),
      tenantName: optionalStr(formData, "tenant_name"),
    },
  });
  if (result.error !== null) return errorState(result.error);

  revalidateApp();
  return successState("Lease sent for signature.", { id: result.data.id });
}

/** Landlord: send a lease directly without an application. */
export async function sendDirectLeaseAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const tenantName = str(formData, "tenant_name");
  const tenantEmail = str(formData, "tenant_email");
  const propertyId = str(formData, "property_id");
  const monthlyRent = num(formData, "monthly_rent");
  const leaseStart = str(formData, "lease_start");

  if (!tenantName) return errorState("Tenant name is required.");
  if (!tenantEmail) return errorState("Tenant email is required.");
  if (!propertyId) return errorState("Please select a property.");
  if (!monthlyRent) return errorState("Monthly rent is required.");
  if (!leaseStart) return errorState("Lease start date is required.");

  const ownerId = await getCurrentOwnerId();
  const user = await getCurrentUser();
  if (!user?.email)
    return errorState("Your account needs an email to sign as the landlord.");

  const result = await createDirectLease({
    propertyId,
    landlordId: ownerId,
    landlord: {
      name: user.user_metadata?.full_name || "Landlord",
      email: user.email,
    },
    tenant: {
      name: tenantName,
      email: tenantEmail,
    },
    fields: {
      propertyName: optionalStr(formData, "property_name"),
      propertyAddress: optionalStr(formData, "property_address"),
      roomName: optionalStr(formData, "room_name"),
      bedLabel: optionalStr(formData, "bed_label"),
      monthlyRent,
      depositAmount: num(formData, "deposit_amount"),
      leaseStart,
      leaseEnd: optionalStr(formData, "lease_end"),
      tenantName,
    },
  });
  if (result.error !== null) return errorState(result.error);

  revalidateApp();
  return successState("Lease sent for signature.", { id: result.data.id });
}

/** Tenant: sign a lease with their signature. */
export async function signLeaseAsTenantAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const leaseId = str(formData, "lease_id");
  const signatureData = str(formData, "signature_data");

  if (!leaseId) return errorState("Missing lease ID.");
  if (!signatureData) return errorState("Please provide your signature.");

  // Validate it's a valid data URL
  if (!signatureData.startsWith("data:image/png;base64,")) {
    return errorState("Invalid signature format.");
  }

  const supabase = getServiceClient();

  // Get the lease and verify it's in a signable state
  const { data: lease, error: fetchError } = await supabase
    .from("leases")
    .select("*")
    .eq("id", leaseId)
    .maybeSingle();

  if (fetchError || !lease) {
    return errorState("Lease not found.");
  }

  if (lease.tenant_signed_at) {
    return errorState("This lease has already been signed.");
  }

  if (lease.status !== "sent" && lease.status !== "delivered") {
    return errorState("This lease is not available for signing.");
  }

  // Update the lease with tenant signature
  const now = new Date().toISOString();
  const isFullySigned = !!lease.landlord_signed_at;

  const { error: updateError } = await supabase
    .from("leases")
    .update({
      tenant_signature_data: signatureData,
      tenant_signed_at: now,
      status: isFullySigned ? "completed" : "delivered",
      completed_at: isFullySigned ? now : null,
    })
    .eq("id", leaseId);

  if (updateError) {
    console.error("Error signing lease:", updateError);
    return errorState("Failed to sign lease. Please try again.");
  }

  revalidateApp();
  return successState("Lease signed successfully.");
}

/** Landlord: sign a lease with their stored signature. */
export async function signLeaseAsLandlordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const leaseId = str(formData, "lease_id");
  if (!leaseId) return errorState("Missing lease ID.");

  const ownerId = await getCurrentOwnerId();
  const supabase = getServiceClient();

  // Get landlord's stored signature
  const { data: userData } = await supabase
    .from("users")
    .select("signature_data")
    .eq("id", ownerId)
    .maybeSingle();

  if (!userData?.signature_data) {
    return errorState("Please set up your signature in Settings first.");
  }

  // Get the lease
  const { data: lease, error: fetchError } = await supabase
    .from("leases")
    .select("*")
    .eq("id", leaseId)
    .maybeSingle();

  if (fetchError || !lease) {
    return errorState("Lease not found.");
  }

  if (lease.landlord_signed_at) {
    return errorState("You have already signed this lease.");
  }

  // Update the lease with landlord signature
  const now = new Date().toISOString();
  const isFullySigned = !!lease.tenant_signed_at;

  const { error: updateError } = await supabase
    .from("leases")
    .update({
      landlord_signature_data: userData.signature_data,
      landlord_signed_at: now,
      status: isFullySigned ? "completed" : lease.status,
      completed_at: isFullySigned ? now : null,
    })
    .eq("id", leaseId);

  if (updateError) {
    console.error("Error signing lease:", updateError);
    return errorState("Failed to sign lease. Please try again.");
  }

  revalidateApp();
  return successState("Lease signed successfully.");
}
