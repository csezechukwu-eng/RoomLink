"use server";

import { redirect } from "next/navigation";
import { getCurrentOwnerId } from "@/lib/auth";
import { createAuthenticatedClient } from "@/lib/supabase/server";
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
    const supabase = await createAuthenticatedClient();

    // Get owner ID directly from the authenticated session.
    // This ensures owner_id matches auth.uid() for RLS compliance.
    // Do NOT use getCurrentOwnerId() here - it may return a demo ID that
    // doesn't match the actual authenticated user's auth.uid().
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[createProperty] Auth error:", authError);
      return errorState(
        "Your session has expired. Please sign in again to create a property."
      );
    }

    const ownerId = user.id;
    console.log("[createProperty] Using owner_id from authenticated session:", ownerId);

    const { data, error } = await supabase
      .from("properties")
      .insert({ ...values, owner_id: ownerId })
      .select("id")
      .single();

    if (error) {
      console.error("[createProperty] Insert error:", error);
      console.error("[createProperty] Error code:", error.code);
      // Provide a user-friendly message for RLS errors
      if (error.code === "42501") {
        return errorState(
          "Unable to create property. Your account may not have permission. Please sign out and sign in again."
        );
      }
      throw error;
    }
    if (!data) {
      console.error("[createProperty] No data returned from insert");
      return errorState("Failed to create property - no data returned");
    }
    newId = data.id as string;
    revalidateLandlord(newId);
  } catch (error) {
    console.error("[createProperty] Caught error:", error);
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
    const supabase = await createAuthenticatedClient();
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
    const supabase = await createAuthenticatedClient();
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

/** Toggle property visibility (hidden/visible). */
export async function togglePropertyVisibility(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  const isHidden = str(formData, "is_hidden") === "true";
  if (!id) return errorState("Missing property id.");

  try {
    const supabase = await createAuthenticatedClient();
    const ownerId = await getCurrentOwnerId();
    await assertPropertyOwned(supabase, id, ownerId);

    const { error } = await supabase
      .from("properties")
      .update({ is_hidden: isHidden })
      .eq("id", id)
      .eq("owner_id", ownerId);
    if (error) throw error;

    revalidateLandlord(id);
    return successState(isHidden ? "Property hidden." : "Property visible.");
  } catch (error) {
    return errorState(messageFrom(error));
  }
}

/** Update property application fee settings. */
export async function updateApplicationFeeSettings(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  if (!id) return errorState("Missing property id.");

  const feeRequired = str(formData, "application_fee_required") === "true";
  const feeAmountStr = optionalStr(formData, "application_fee_amount");
  const feeInstructions = optionalStr(formData, "application_fee_instructions");

  // Parse and validate fee amount
  let feeAmount: number | null = null;
  if (feeAmountStr) {
    feeAmount = parseFloat(feeAmountStr);
    if (isNaN(feeAmount) || feeAmount < 0) {
      return errorState("Please enter a valid fee amount.", {
        application_fee_amount: "Enter a valid amount (0 or more).",
      });
    }
  }

  // If fee is required, amount should be set
  if (feeRequired && (!feeAmount || feeAmount <= 0)) {
    return errorState("Please enter a fee amount.", {
      application_fee_amount: "Fee amount is required when fee is enabled.",
    });
  }

  try {
    const supabase = await createAuthenticatedClient();
    const ownerId = await getCurrentOwnerId();
    await assertPropertyOwned(supabase, id, ownerId);

    const { error } = await supabase
      .from("properties")
      .update({
        application_fee_required: feeRequired,
        application_fee_amount: feeAmount,
        application_fee_instructions: feeInstructions || null,
      })
      .eq("id", id)
      .eq("owner_id", ownerId);
    if (error) throw error;

    revalidateLandlord(id);
    return successState("Application fee settings saved.");
  } catch (error) {
    return errorState(messageFrom(error));
  }
}
