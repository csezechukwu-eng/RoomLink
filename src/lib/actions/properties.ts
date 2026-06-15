"use server";

import { redirect } from "next/navigation";
import { getCurrentOwnerId } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
import type { PropertyType } from "@/lib/types";
import { PROPERTY_TYPES } from "@/lib/constants";
import {
  type ActionState,
  assertPropertyOwned,
  errorState,
  messageFrom,
  optionalStr,
  revalidateLandlord,
  str,
  successState,
} from "@/lib/actions/_shared";

const VALID_TYPES = new Set(PROPERTY_TYPES.map((t) => t.value));

function readPropertyForm(formData: FormData) {
  const name = str(formData, "name");
  const property_type = str(formData, "property_type") as PropertyType;

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Name is required.";
  if (!VALID_TYPES.has(property_type))
    fieldErrors.property_type = "Choose a property type.";

  return {
    fieldErrors,
    values: {
      name,
      property_type,
      address: optionalStr(formData, "address"),
      city: optionalStr(formData, "city"),
      state: optionalStr(formData, "state"),
      zip: optionalStr(formData, "zip"),
      description: optionalStr(formData, "description"),
      house_rules: optionalStr(formData, "house_rules"),
    },
  };
}

export async function createProperty(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { fieldErrors, values } = readPropertyForm(formData);
  if (Object.keys(fieldErrors).length > 0)
    return errorState("Please fix the highlighted fields.", fieldErrors);

  let newId: string | null = null;
  try {
    const supabase = getServiceClient();
    const ownerId = await getCurrentOwnerId();
    const { data, error } = await supabase
      .from("properties")
      .insert({ ...values, owner_id: ownerId })
      .select("id")
      .single();
    if (error) throw error;
    newId = data.id as string;
    revalidateLandlord(newId);
  } catch (error) {
    return errorState(messageFrom(error));
  }

  // Redirect to the new property's detail page on success.
  redirect(`/dashboard/properties/${newId}`);
}

export async function updateProperty(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  if (!id) return errorState("Missing property id.");

  const { fieldErrors, values } = readPropertyForm(formData);
  if (Object.keys(fieldErrors).length > 0)
    return errorState("Please fix the highlighted fields.", fieldErrors);

  try {
    const supabase = getServiceClient();
    const ownerId = await getCurrentOwnerId();
    await assertPropertyOwned(supabase, id, ownerId);

    const { error } = await supabase
      .from("properties")
      .update(values)
      .eq("id", id)
      .eq("owner_id", ownerId);
    if (error) throw error;

    revalidateLandlord(id);
    return successState("Property updated.");
  } catch (error) {
    return errorState(messageFrom(error));
  }
}

/** Delete a property only when it is safe (has no rooms). */
export async function deleteProperty(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  if (!id) return errorState("Missing property id.");

  try {
    const supabase = getServiceClient();
    const ownerId = await getCurrentOwnerId();
    await assertPropertyOwned(supabase, id, ownerId);

    const { count, error: countErr } = await supabase
      .from("rooms")
      .select("id", { count: "exact", head: true })
      .eq("property_id", id);
    if (countErr) throw countErr;

    if ((count ?? 0) > 0) {
      return errorState(
        "Remove all rooms before deleting this property."
      );
    }

    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", id)
      .eq("owner_id", ownerId);
    if (error) throw error;
  } catch (error) {
    return errorState(messageFrom(error));
  }

  revalidateLandlord();
  redirect("/dashboard/properties");
}
