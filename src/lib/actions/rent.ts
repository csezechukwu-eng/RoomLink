"use server";

import { setRentChargeStatus } from "@/lib/services/rent";
import { RENT_STATUSES } from "@/lib/constants";
import type { RentStatus } from "@/lib/types";
import {
  type ActionState,
  errorState,
  revalidateApp,
  str,
  successState,
} from "@/lib/actions/_shared";

const VALID = new Set(RENT_STATUSES.map((s) => s.value));

export async function setRentChargeStatusAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  const status = str(formData, "status") as RentStatus;
  if (!id) return errorState("Missing rent charge id.");
  if (!VALID.has(status)) return errorState("Invalid rent status.");

  const result = await setRentChargeStatus(id, status);
  if (result.error !== null) return errorState(result.error);
  revalidateApp();
  return successState("Rent status updated.");
}
