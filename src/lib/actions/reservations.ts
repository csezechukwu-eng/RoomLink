"use server";

import { markDepositPaid } from "@/lib/services/reservations";
import {
  type ActionState,
  errorState,
  revalidateApp,
  str,
  successState,
} from "@/lib/actions/_shared";

export async function markDepositPaidAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  if (!id) return errorState("Missing reservation id.");
  const result = await markDepositPaid(id);
  if (result.error !== null) return errorState(result.error);
  revalidateApp();
  return successState("Deposit marked as paid.");
}
