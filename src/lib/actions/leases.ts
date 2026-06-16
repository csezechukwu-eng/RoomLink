"use server";

import { getCurrentUser } from "@/lib/auth";
import { createLeaseForApplication } from "@/lib/services/leases";
import {
  type ActionState,
  errorState,
  revalidateApp,
  str,
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
