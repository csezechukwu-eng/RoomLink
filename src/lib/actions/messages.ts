"use server";

import { getCurrentOwnerId, getCurrentTenantId, getCurrentUser } from "@/lib/auth";
import { sendMessage } from "@/lib/services/messages";
import {
  type ActionState,
  errorState,
  revalidateApp,
  str,
  successState,
} from "@/lib/actions/_shared";

/** Landlord replies in a (property, tenant) thread. */
export async function sendOwnerMessageAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const propertyId = str(formData, "property_id");
  const tenantId = str(formData, "tenant_id");
  const body = str(formData, "body");
  if (!propertyId || !tenantId) return errorState("Missing thread.");
  if (!body) return errorState("Message can't be empty.");

  const ownerId = await getCurrentOwnerId();
  const result = await sendMessage({
    propertyId,
    tenantId,
    senderId: ownerId,
    senderRole: "owner",
    body,
  });
  if (result.error !== null) return errorState(result.error);
  revalidateApp();
  return successState("Sent.");
}

/** Tenant sends a message to their property's landlord. */
export async function sendTenantMessageAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const propertyId = str(formData, "property_id");
  const body = str(formData, "body");
  if (!propertyId) return errorState("No property linked to your account yet.");
  if (!body) return errorState("Message can't be empty.");

  const tenantId = await getCurrentTenantId();
  const result = await sendMessage({
    propertyId,
    tenantId,
    senderId: tenantId,
    senderRole: "tenant",
    body,
  });
  if (result.error !== null) return errorState(result.error);
  revalidateApp();
  return successState("Sent.");
}

/** Send an inquiry message from the listings page (requires login). */
export async function sendInquiryMessageAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const propertyId = str(formData, "property_id");
  const body = str(formData, "body");
  if (!propertyId) return errorState("Property not found.");
  if (!body) return errorState("Message can't be empty.");

  // Require user to be logged in
  const user = await getCurrentUser();
  if (!user) {
    return errorState("Please sign in to send a message.");
  }

  const result = await sendMessage({
    propertyId,
    tenantId: user.id,
    senderId: user.id,
    senderRole: "tenant",
    body,
  });
  if (result.error !== null) return errorState(result.error);
  revalidateApp();
  return successState("Message sent! The host will respond soon.");
}
