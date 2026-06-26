"use server";

import { revalidatePath } from "next/cache";
import { signPreparedLease } from "@/lib/services/preparedLeases";
import { errorState, successState, type ActionState } from "./types";

export async function signPreparedLeaseAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get("id")?.toString();
  const token = formData.get("token")?.toString();

  if (!id || !token) {
    return errorState("Missing agreement ID or signing token.");
  }

  const result = await signPreparedLease(id, token);
  if (result.error !== null) {
    return errorState(result.error);
  }

  revalidatePath("/tenant/status");
  return successState("Agreement signed successfully!");
}
