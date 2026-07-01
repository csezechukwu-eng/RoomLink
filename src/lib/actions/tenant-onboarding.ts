"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, isDemoMode } from "@/lib/auth";
import { getServiceClient, isServiceRoleConfigured, createAuthenticatedClient } from "@/lib/supabase/server";

type ActionResult = { error?: string; success?: boolean; avatarUrl?: string };

const AVATAR_BUCKET = "avatars";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Update tenant basic info (name, phone, preferences)
 */
export async function updateTenantBasicInfo(formData: FormData): Promise<ActionResult> {
  if (isDemoMode()) {
    return { success: true };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  if (!isServiceRoleConfigured()) {
    return { error: "Database not configured" };
  }

  const fullName = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;
  const moveInDate = formData.get("moveInDate") as string;
  const budget = formData.get("budget") as string;
  const preferredCity = formData.get("preferredCity") as string;
  const roommatePreference = formData.get("roommatePreference") as string;
  const lifestyle = formData.get("lifestyle") as string;
  const aboutMe = formData.get("aboutMe") as string;

  // Parse budget range
  let budgetMin: number | null = null;
  let budgetMax: number | null = null;
  if (budget) {
    const [min, max] = budget.split("-");
    budgetMin = parseInt(min) || null;
    budgetMax = max === "+" ? 9999 : parseInt(max) || null;
  }

  const supabase = getServiceClient();

  const { error } = await supabase
    .from("users")
    .update({
      full_name: fullName || null,
      phone: phone || null,
      move_in_date: moveInDate || null,
      budget_min: budgetMin,
      budget_max: budgetMax,
      preferred_city: preferredCity || null,
      roommate_preference: roommatePreference || null,
      lifestyle: lifestyle || null,
      about_me: aboutMe || null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("[updateTenantBasicInfo] Error:", error);
    return { error: "Failed to update profile" };
  }

  revalidatePath("/onboarding/tenant");
  return { success: true };
}

/**
 * Update tenant housing preferences
 */
export async function updateTenantHousingPreferences(formData: FormData): Promise<ActionResult> {
  if (isDemoMode()) {
    return { success: true };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  if (!isServiceRoleConfigured()) {
    return { error: "Database not configured" };
  }

  const preferredCity = formData.get("preferredCity") as string;
  const budgetMin = formData.get("budgetMin") as string;
  const budgetMax = formData.get("budgetMax") as string;
  const moveInDate = formData.get("moveInDate") as string;

  const supabase = getServiceClient();

  const { error } = await supabase
    .from("users")
    .update({
      preferred_city: preferredCity || null,
      budget_min: parseInt(budgetMin) || null,
      budget_max: parseInt(budgetMax) || null,
      move_in_date: moveInDate || null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("[updateTenantHousingPreferences] Error:", error);
    return { error: "Failed to update preferences" };
  }

  revalidatePath("/onboarding/tenant");
  return { success: true };
}

/**
 * Accept house rules
 */
export async function acceptHouseRules(): Promise<ActionResult> {
  if (isDemoMode()) {
    return { success: true };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  if (!isServiceRoleConfigured()) {
    return { error: "Database not configured" };
  }

  const supabase = getServiceClient();

  const { error } = await supabase
    .from("users")
    .update({
      house_rules_accepted: true,
      house_rules_accepted_at: new Date().toISOString(),
      communication_prefs_set: true,
    })
    .eq("id", user.id);

  if (error) {
    console.error("[acceptHouseRules] Error:", error);
    return { error: "Failed to accept house rules" };
  }

  revalidatePath("/onboarding/tenant");
  return { success: true };
}

/**
 * Complete tenant onboarding
 */
export async function completeTenantOnboarding(): Promise<ActionResult> {
  if (isDemoMode()) {
    return { success: true };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  if (!isServiceRoleConfigured()) {
    return { error: "Database not configured" };
  }

  const supabase = getServiceClient();

  const { error } = await supabase
    .from("users")
    .update({
      tenant_onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("[completeTenantOnboarding] Error:", error);
    return { error: "Failed to complete onboarding" };
  }

  revalidatePath("/onboarding/tenant");
  revalidatePath("/availability");
  return { success: true };
}

/**
 * Upload profile photo for tenant
 */
export async function uploadProfilePhoto(formData: FormData): Promise<ActionResult> {
  if (isDemoMode()) {
    return { success: true, avatarUrl: "/images/demo-avatar.png" };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    return { error: "No file uploaded" };
  }

  // Validate file
  if (file.size > MAX_FILE_SIZE) {
    return { error: "File is too large. Maximum size is 5MB." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Invalid file type. Use JPEG, PNG, or WebP." };
  }

  try {
    const supabase = await createAuthenticatedClient();

    // Generate unique filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const timestamp = Date.now();
    const filename = `${user.id}/${timestamp}.${ext}`;

    // Upload to storage
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filename, arrayBuffer, {
        contentType: file.type,
        upsert: true, // Allow overwriting existing avatar
      });

    if (uploadError) {
      console.error("[uploadProfilePhoto] Storage upload error:", uploadError);
      return { error: "Failed to upload photo. Please try again." };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filename);

    // Update user record with new avatar URL
    if (!isServiceRoleConfigured()) {
      return { error: "Database not configured" };
    }

    const serviceClient = getServiceClient();
    const { error: updateError } = await serviceClient
      .from("users")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (updateError) {
      console.error("[uploadProfilePhoto] Update error:", updateError);
      return { error: "Failed to save photo. Please try again." };
    }

    revalidatePath("/onboarding/tenant");
    return { success: true, avatarUrl: publicUrl };
  } catch (error) {
    console.error("[uploadProfilePhoto] Error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
