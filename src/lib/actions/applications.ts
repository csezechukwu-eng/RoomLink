"use server";

import { redirect } from "next/navigation";
import { setCurrentTenantId } from "@/lib/auth";
import {
  submitApplication,
  approveApplication,
  rejectApplication,
} from "@/lib/services/applications";
import {
  type ActionState,
  errorState,
  optionalStr,
  str,
  successState,
} from "@/lib/actions/_shared";
import { revalidateApp } from "@/lib/actions/_shared";

export async function submitApplicationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const bedId = str(formData, "bed_id");
  const fullName = str(formData, "full_name");
  const email = str(formData, "email");

  const fieldErrors: Record<string, string> = {};
  if (!bedId) fieldErrors.bed_id = "Missing bed.";
  if (!fullName) fieldErrors.full_name = "Your name is required.";
  if (!email || !email.includes("@"))
    fieldErrors.email = "A valid email is required.";
  if (Object.keys(fieldErrors).length > 0)
    return errorState("Please fix the highlighted fields.", fieldErrors);

  let tenantId: string | null = null;
  const result = await submitApplication({
    bedId,
    fullName,
    email,
    phone: optionalStr(formData, "phone"),
    message: optionalStr(formData, "message"),
    desiredMoveIn: optionalStr(formData, "desired_move_in"),
  });
  if (result.error !== null) return errorState(result.error);
  tenantId = result.data.tenantId;

  // Remember this applicant so the tenant portal shows their status.
  await setCurrentTenantId(tenantId);
  revalidateApp();
  redirect("/tenant/status?applied=1");
}

export async function approveApplicationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  if (!id) return errorState("Missing application id.");
  const result = await approveApplication(id);
  if (result.error !== null) return errorState(result.error);
  revalidateApp();
  return successState("Application approved — reservation created.");
}

export async function rejectApplicationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  if (!id) return errorState("Missing application id.");
  const result = await rejectApplication(id);
  if (result.error !== null) return errorState(result.error);
  revalidateApp();
  return successState("Application rejected.");
}
