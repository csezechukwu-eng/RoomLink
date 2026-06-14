"use server";

import { getCurrentTenantId } from "@/lib/auth";
import {
  submitMaintenanceRequest,
  setMaintenanceStatus,
} from "@/lib/services/maintenance";
import { MAINTENANCE_PRIORITIES, MAINTENANCE_STATUSES } from "@/lib/constants";
import type { MaintenancePriority, MaintenanceStatus } from "@/lib/types";
import {
  type ActionState,
  errorState,
  optionalStr,
  revalidateApp,
  str,
  successState,
} from "@/lib/actions/_shared";

const VALID_PRIORITY = new Set(MAINTENANCE_PRIORITIES.map((p) => p.value));
const VALID_STATUS = new Set(MAINTENANCE_STATUSES.map((s) => s.value));

/** Tenant submits a maintenance request for their property. */
export async function submitMaintenanceAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const propertyId = str(formData, "property_id");
  const title = str(formData, "title");
  const priority = (str(formData, "priority") || "normal") as MaintenancePriority;

  const fieldErrors: Record<string, string> = {};
  if (!propertyId) fieldErrors.property_id = "No property linked yet.";
  if (!title) fieldErrors.title = "A short title is required.";
  if (!VALID_PRIORITY.has(priority)) fieldErrors.priority = "Choose a priority.";
  if (Object.keys(fieldErrors).length > 0)
    return errorState("Please fix the highlighted fields.", fieldErrors);

  const tenantId = await getCurrentTenantId();
  const result = await submitMaintenanceRequest({
    propertyId,
    tenantId,
    roomId: optionalStr(formData, "room_id"),
    bedId: optionalStr(formData, "bed_id"),
    title,
    description: optionalStr(formData, "description"),
    priority,
  });
  if (result.error !== null) return errorState(result.error);
  revalidateApp();
  return successState("Maintenance request submitted.");
}

/** Landlord updates the status of a maintenance request. */
export async function setMaintenanceStatusAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  const status = str(formData, "status") as MaintenanceStatus;
  if (!id) return errorState("Missing request id.");
  if (!VALID_STATUS.has(status)) return errorState("Invalid status.");

  const result = await setMaintenanceStatus(id, status);
  if (result.error !== null) return errorState(result.error);
  revalidateApp();
  return successState("Status updated.");
}
