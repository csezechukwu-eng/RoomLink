"use server";

import { getCurrentOwnerId, getCurrentTenantId } from "@/lib/auth";
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

  const result = await sendMessage({
    propertyId,
    tenantId,
    senderId: getCurrentOwnerId(),
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
