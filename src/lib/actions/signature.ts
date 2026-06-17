"use server";

import { getCurrentOwnerId } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
import {
  type ActionState,
  errorState,
  successState,
} from "@/lib/actions/_shared";

/** Save or update the landlord's signature */
export async function saveSignatureAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const signatureData = formData.get("signature_data");

  if (!signatureData || typeof signatureData !== "string") {
    return errorState("No signature data provided.");
  }

  // Validate it's a valid data URL (basic check)
  if (!signatureData.startsWith("data:image/png;base64,")) {
    return errorState("Invalid signature format. Must be a PNG image.");
  }

  const ownerId = await getCurrentOwnerId();
  const supabase = getServiceClient();

  // First check if user exists in users table, if not create them
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", ownerId)
    .single();

  if (!existingUser) {
    // Get user info from Supabase Auth
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(ownerId);

    // Create user record
    const { error: insertError } = await supabase.from("users").insert({
      id: ownerId,
      email: authUser?.email ?? `user-${ownerId}@roomlink.app`,
      full_name: authUser?.user_metadata?.full_name ?? null,
      role: "owner",
      signature_data: signatureData,
      signature_updated_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Error creating user:", insertError);
      return errorState("Failed to save signature. Please try again.");
    }
  } else {
    // Update existing user's signature
    const { error: updateError } = await supabase
      .from("users")
      .update({
        signature_data: signatureData,
        signature_updated_at: new Date().toISOString(),
      })
      .eq("id", ownerId);

    if (updateError) {
      console.error("Error updating signature:", updateError);
      return errorState("Failed to save signature. Please try again.");
    }
  }

  return successState("Signature saved successfully.");
}

/** Get the current landlord's signature */
export async function getSignature(): Promise<string | null> {
  const ownerId = await getCurrentOwnerId();
  const supabase = getServiceClient();

  const { data } = await supabase
    .from("users")
    .select("signature_data")
    .eq("id", ownerId)
    .single();

  return data?.signature_data ?? null;
}

/** Delete the landlord's signature */
export async function deleteSignatureAction(): Promise<ActionState> {
  const ownerId = await getCurrentOwnerId();
  const supabase = getServiceClient();

  const { error } = await supabase
    .from("users")
    .update({
      signature_data: null,
      signature_updated_at: null,
    })
    .eq("id", ownerId);

  if (error) {
    console.error("Error deleting signature:", error);
    return errorState("Failed to delete signature. Please try again.");
  }

  return successState("Signature deleted.");
}
