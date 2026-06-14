"use server";

import { getCurrentOwnerId } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
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

function readRoomForm(formData: FormData) {
  const name = str(formData, "name");
  const maxOccupancy = num(formData, "max_occupancy");

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Name is required.";
  if (maxOccupancy !== null && (maxOccupancy < 0 || !Number.isInteger(maxOccupancy)))
    fieldErrors.max_occupancy = "Enter a whole number (0 or more).";

  return {
    fieldErrors,
    values: {
      name,
      description: optionalStr(formData, "description"),
      max_occupancy: maxOccupancy ?? 1,
    },
  };
}

export async function createRoom(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const propertyId = str(formData, "property_id");
  if (!propertyId) return errorState("Missing property id.");

  const { fieldErrors, values } = readRoomForm(formData);
  if (Object.keys(fieldErrors).length > 0)
    return errorState("Please fix the highlighted fields.", fieldErrors);

  try {
    const supabase = getServiceClient();
    await assertPropertyOwned(supabase, propertyId, getCurrentOwnerId());

    const { error } = await supabase
      .from("rooms")
      .insert({ ...values, property_id: propertyId });
    if (error) throw error;

    revalidateLandlord(propertyId);
    return successState("Room added.");
  } catch (error) {
    return errorState(messageFrom(error));
  }
}

export async function updateRoom(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  const propertyId = str(formData, "property_id");
  if (!id || !propertyId) return errorState("Missing room id.");

  const { fieldErrors, values } = readRoomForm(formData);
  if (Object.keys(fieldErrors).length > 0)
    return errorState("Please fix the highlighted fields.", fieldErrors);

  try {
    const supabase = getServiceClient();
    await assertPropertyOwned(supabase, propertyId, getCurrentOwnerId());

    const { error } = await supabase
      .from("rooms")
      .update(values)
      .eq("id", id)
      .eq("property_id", propertyId);
    if (error) throw error;

    revalidateLandlord(propertyId);
    return successState("Room updated.");
  } catch (error) {
    return errorState(messageFrom(error));
  }
}

/** Delete a room only when it has no beds. */
export async function deleteRoom(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  const propertyId = str(formData, "property_id");
  if (!id || !propertyId) return errorState("Missing room id.");

  try {
    const supabase = getServiceClient();
    await assertPropertyOwned(supabase, propertyId, getCurrentOwnerId());

    const { count, error: countErr } = await supabase
      .from("beds")
      .select("id", { count: "exact", head: true })
      .eq("room_id", id);
    if (countErr) throw countErr;

    if ((count ?? 0) > 0) {
      return errorState("Remove all beds before deleting this room.");
    }

    const { error } = await supabase
      .from("rooms")
      .delete()
      .eq("id", id)
      .eq("property_id", propertyId);
    if (error) throw error;

    revalidateLandlord(propertyId);
    return successState("Room deleted.");
  } catch (error) {
    return errorState(messageFrom(error));
  }
}
