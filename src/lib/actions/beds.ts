"use server";

import { getCurrentOwnerId } from "@/lib/auth";
import { createAuthenticatedClient } from "@/lib/supabase/server";
import type { BedStatus, BunkType } from "@/lib/types";
import { BED_STATUSES, BUNK_TYPES } from "@/lib/constants";
import {
  type ActionState,
  assertPropertyOwned,
  errorState,
  messageFrom,
  num,
  optionalStr,
  revalidateLandlord,
  str,
  successState,
} from "@/lib/actions/_shared";

const VALID_BUNK = new Set(BUNK_TYPES.map((t) => t.value));
const VALID_STATUS = new Set(BED_STATUSES.map((t) => t.value));

function readBedForm(formData: FormData) {
  const label = str(formData, "label");
  const room_id = str(formData, "room_id");
  const bunk_type = str(formData, "bunk_type") as BunkType;
  const status = str(formData, "status") as BedStatus;
  const monthly_rent = num(formData, "monthly_rent");
  const deposit_amount = num(formData, "deposit_amount");

  const fieldErrors: Record<string, string> = {};
  if (!label) fieldErrors.label = "Label is required.";
  if (!room_id) fieldErrors.room_id = "Choose a room.";
  if (!VALID_BUNK.has(bunk_type)) fieldErrors.bunk_type = "Choose a bunk type.";
  if (!VALID_STATUS.has(status)) fieldErrors.status = "Choose a status.";
  if (monthly_rent !== null && monthly_rent < 0)
    fieldErrors.monthly_rent = "Rent can't be negative.";
  if (deposit_amount !== null && deposit_amount < 0)
    fieldErrors.deposit_amount = "Deposit can't be negative.";

  return {
    room_id,
    fieldErrors,
    values: {
      label,
      bunk_type,
      status,
      monthly_rent: monthly_rent ?? 0,
      deposit_amount: deposit_amount ?? 0,
      description: optionalStr(formData, "description"),
    },
  };
}

export async function createBed(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const propertyId = str(formData, "property_id");
  if (!propertyId) return errorState("Missing property id.");

  const { room_id, fieldErrors, values } = readBedForm(formData);
  if (Object.keys(fieldErrors).length > 0)
    return errorState("Please fix the highlighted fields.", fieldErrors);

  try {
    const supabase = await createAuthenticatedClient();
    const ownerId = await getCurrentOwnerId();
    await assertPropertyOwned(supabase, propertyId, ownerId);

    // Ensure the chosen room belongs to this property.
    const { data: room, error: roomErr } = await supabase
      .from("rooms")
      .select("id")
      .eq("id", room_id)
      .eq("property_id", propertyId)
      .maybeSingle();
    if (roomErr) throw roomErr;
    if (!room) return errorState("Selected room is not in this property.");

    const { error } = await supabase
      .from("beds")
      .insert({ ...values, room_id, property_id: propertyId });
    if (error) throw error;

    revalidateLandlord(propertyId);
    return successState("Bed added.");
  } catch (error) {
    return errorState(messageFrom(error));
  }
}

export async function updateBed(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  const propertyId = str(formData, "property_id");
  if (!id || !propertyId) return errorState("Missing bed id.");

  const { room_id, fieldErrors, values } = readBedForm(formData);
  if (Object.keys(fieldErrors).length > 0)
    return errorState("Please fix the highlighted fields.", fieldErrors);

  try {
    const supabase = await createAuthenticatedClient();
    const ownerId = await getCurrentOwnerId();
    await assertPropertyOwned(supabase, propertyId, ownerId);

    const { data: room, error: roomErr } = await supabase
      .from("rooms")
      .select("id")
      .eq("id", room_id)
      .eq("property_id", propertyId)
      .maybeSingle();
    if (roomErr) throw roomErr;
    if (!room) return errorState("Selected room is not in this property.");

    const { error } = await supabase
      .from("beds")
      .update({ ...values, room_id })
      .eq("id", id)
      .eq("property_id", propertyId);
    if (error) throw error;

    revalidateLandlord(propertyId);
    return successState("Bed updated.");
  } catch (error) {
    return errorState(messageFrom(error));
  }
}

export async function deleteBed(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  const propertyId = str(formData, "property_id");
  if (!id || !propertyId) return errorState("Missing bed id.");

  try {
    const supabase = await createAuthenticatedClient();
    const ownerId = await getCurrentOwnerId();
    await assertPropertyOwned(supabase, propertyId, ownerId);

    const { error } = await supabase
      .from("beds")
      .delete()
      .eq("id", id)
      .eq("property_id", propertyId);
    if (error) throw error;

    revalidateLandlord(propertyId);
    return successState("Bed deleted.");
  } catch (error) {
    return errorState(messageFrom(error));
  }
}

/** Quick inline status change from the bed card. */
export async function changeBedStatus(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  const propertyId = str(formData, "property_id");
  const status = str(formData, "status") as BedStatus;
  if (!id || !propertyId) return errorState("Missing bed id.");
  if (!VALID_STATUS.has(status)) return errorState("Invalid status.");

  try {
    const supabase = await createAuthenticatedClient();
    const ownerId = await getCurrentOwnerId();
    await assertPropertyOwned(supabase, propertyId, ownerId);

    const { error } = await supabase
      .from("beds")
      .update({ status })
      .eq("id", id)
      .eq("property_id", propertyId);
    if (error) throw error;

    revalidateLandlord(propertyId);
    return successState("Status updated.");
  } catch (error) {
    return errorState(messageFrom(error));
  }
}
