"use server";

import { revalidatePath } from "next/cache";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/server";
import { isDemoMode, DEMO_OWNER_ID } from "@/lib/auth";
import type { ActionState } from "@/lib/actions/types";
import { errorState, successState, str, optionalStr } from "@/lib/actions/_shared";

/**
 * Server actions for landlord onboarding.
 *
 * SECURITY:
 * - All actions require authenticated landlord
 * - Owner ID is read from supabase.auth.getUser() for RLS
 * - DEMO_MODE supported for testing
 */

// -----------------------------------------------------------------------------
// Profile Actions
// -----------------------------------------------------------------------------

/**
 * Update landlord profile during onboarding.
 * Upserts the public.users row with profile fields.
 */
export async function updateLandlordProfileAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // Get owner ID and email from auth
  let ownerId: string;
  let userEmail: string;

  if (isDemoMode()) {
    ownerId = DEMO_OWNER_ID;
    userEmail = "demo@roomlink.local";
  } else {
    const authUser = await getAuthUser();
    if (!authUser) {
      return errorState("Not authenticated. Please sign in.");
    }
    ownerId = authUser.id;
    userEmail = authUser.email || "";

    if (!userEmail) {
      return errorState("User email is required. Please check your account.");
    }
  }

  // Parse form data
  const fullName = str(formData, "full_name");
  const displayName = optionalStr(formData, "display_name");
  const phone = str(formData, "phone");
  const landlordType = str(formData, "landlord_type");
  const emergencyContactName = optionalStr(formData, "emergency_contact_name");
  const emergencyContactPhone = optionalStr(formData, "emergency_contact_phone");

  // Validate required fields
  const fieldErrors: Record<string, string> = {};

  if (!fullName) {
    fieldErrors.full_name = "Legal name is required";
  }

  if (!phone) {
    fieldErrors.phone = "Phone number is required";
  }

  if (!landlordType) {
    fieldErrors.landlord_type = "Please select your landlord type";
  } else if (!["individual", "company", "property_manager"].includes(landlordType)) {
    fieldErrors.landlord_type = "Invalid landlord type";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return errorState("Please fix the errors below.", fieldErrors);
  }

  // Check if service role is configured
  if (!isServiceRoleConfigured()) {
    return errorState("Database is not configured for this environment.");
  }

  try {
    const supabase = getServiceClient();

    // Check if user row exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .eq("id", ownerId)
      .maybeSingle();

    if (fetchError) {
      console.error("[updateLandlordProfileAction] Fetch error:", fetchError);
      return errorState("Failed to fetch user. Please try again.");
    }

    const profileData = {
      full_name: fullName,
      display_name: displayName,
      phone,
      landlord_type: landlordType,
      emergency_contact_name: emergencyContactName,
      emergency_contact_phone: emergencyContactPhone,
    };

    if (existingUser) {
      // Update existing row
      const { error: updateError } = await supabase
        .from("users")
        .update(profileData)
        .eq("id", ownerId);

      if (updateError) {
        console.error("[updateLandlordProfileAction] Update error:", {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
        });
        if (updateError.code === "42703") {
          return errorState(`Database schema issue: ${updateError.message}. Please contact support.`);
        }
        return errorState(`Failed to update profile: ${updateError.message || "Please try again."}`);
      }
    } else {
      // Insert new row - must include email (NOT NULL field)
      const { error: insertError } = await supabase
        .from("users")
        .insert({
          id: ownerId,
          email: userEmail,
          ...profileData,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("[updateLandlordProfileAction] Insert error:", {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        });
        // Provide more specific error messages
        if (insertError.code === "23505") {
          // Unique constraint violation - user already exists, try update instead
          const { error: retryUpdateError } = await supabase
            .from("users")
            .update(profileData)
            .eq("id", ownerId);

          if (retryUpdateError) {
            console.error("[updateLandlordProfileAction] Retry update error:", retryUpdateError);
            return errorState("Failed to save profile. Please try again.");
          }
          // Update succeeded on retry
        } else if (insertError.code === "23502") {
          // NOT NULL violation
          return errorState("Required profile information is missing. Please fill in all required fields.");
        } else if (insertError.code === "42703") {
          // Column does not exist - migration not run
          return errorState(`Database schema issue: ${insertError.message}. Please contact support.`);
        } else if (insertError.code === "42P01") {
          // Table does not exist
          return errorState("Database table not found. Please contact support.");
        } else {
          // Return actual error message for debugging
          return errorState(`Failed to create profile: ${insertError.message || insertError.code || "Unknown error"}`);
        }
      }
    }

    // Revalidate to refresh state
    revalidatePath("/onboarding/landlord");
    revalidatePath("/dashboard");

    return successState("Profile updated successfully.");
  } catch (error) {
    console.error("[updateLandlordProfileAction] Error:", error);
    return errorState("An unexpected error occurred. Please try again.");
  }
}

/**
 * Upload landlord avatar photo.
 * Stores to property-media bucket under {user_id}/avatar/ path.
 */
export async function uploadLandlordAvatarAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // Get owner ID and email from auth
  let ownerId: string;
  let userEmail: string;

  if (isDemoMode()) {
    ownerId = DEMO_OWNER_ID;
    userEmail = "demo@roomlink.local";
  } else {
    const authUser = await getAuthUser();
    if (!authUser) {
      return errorState("Not authenticated. Please sign in.");
    }
    ownerId = authUser.id;
    userEmail = authUser.email || "";
  }

  // Get file from form data
  const file = formData.get("avatar") as File | null;

  if (!file || file.size === 0) {
    return errorState("No file selected.");
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return errorState("Please upload a JPEG, PNG, or WebP image.");
  }

  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return errorState("Image must be smaller than 5MB.");
  }

  // Check if service role is configured
  if (!isServiceRoleConfigured()) {
    return errorState("Storage is not configured for this environment.");
  }

  try {
    const supabase = getServiceClient();

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${ownerId}/avatar/avatar-${Date.now()}.${ext}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("property-media")
      .upload(filename, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[uploadLandlordAvatarAction] Upload error:", {
        message: uploadError.message,
        name: uploadError.name,
        cause: uploadError.cause,
      });
      // Surface specific storage errors
      if (uploadError.message?.includes("Bucket not found")) {
        return errorState("Storage bucket not configured. Please contact support.");
      }
      return errorState(`Failed to upload image: ${uploadError.message || "Please try again."}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("property-media")
      .getPublicUrl(filename);

    const avatarUrl = urlData.publicUrl;

    // Check if user row exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .eq("id", ownerId)
      .maybeSingle();

    if (fetchError) {
      console.error("[uploadLandlordAvatarAction] Fetch error:", fetchError);
      return errorState("Failed to verify user record. Please try again.");
    }

    if (existingUser) {
      // Update existing user record with avatar URL
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", ownerId);

      if (updateError) {
        console.error("[uploadLandlordAvatarAction] Update error:", {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
        });
        if (updateError.code === "42703") {
          return errorState(`Database schema issue: ${updateError.message}. Please contact support.`);
        }
        return errorState(`Failed to save avatar: ${updateError.message || "Please try again."}`);
      }
    } else {
      // Create user row with avatar URL (user row doesn't exist yet)
      const { error: insertError } = await supabase
        .from("users")
        .insert({
          id: ownerId,
          email: userEmail,
          avatar_url: avatarUrl,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("[uploadLandlordAvatarAction] Insert error:", {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        });
        // Handle duplicate key error (race condition)
        if (insertError.code === "23505") {
          // Row was created by another request, try update
          const { error: retryError } = await supabase
            .from("users")
            .update({ avatar_url: avatarUrl })
            .eq("id", ownerId);

          if (retryError) {
            console.error("[uploadLandlordAvatarAction] Retry error:", retryError);
            return errorState(`Failed to save avatar: ${retryError.message || "Please try again."}`);
          }
        } else if (insertError.code === "42703") {
          return errorState(`Database schema issue: ${insertError.message}. Please contact support.`);
        } else {
          return errorState(`Failed to save avatar: ${insertError.message || "Please try again."}`);
        }
      }
    }

    // Revalidate
    revalidatePath("/onboarding/landlord");
    revalidatePath("/dashboard");

    return successState("Avatar uploaded successfully.", { avatarUrl });
  } catch (error) {
    console.error("[uploadLandlordAvatarAction] Error:", error);
    return errorState("An unexpected error occurred. Please try again.");
  }
}

// -----------------------------------------------------------------------------
// Property Listing Actions
// -----------------------------------------------------------------------------

/**
 * Create or update the property listing during onboarding.
 * On first save, creates a new property and stores it as the draft.
 */
export async function createOrUpdatePropertyListingAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // Get owner ID from auth
  let ownerId: string;

  if (isDemoMode()) {
    ownerId = DEMO_OWNER_ID;
  } else {
    const authUser = await getAuthUser();
    if (!authUser) {
      return errorState("Not authenticated. Please sign in.");
    }
    ownerId = authUser.id;
  }

  // Parse form data
  const propertyId = optionalStr(formData, "property_id");
  const name = str(formData, "name");
  const propertyType = str(formData, "property_type");
  const address = str(formData, "address");
  const city = optionalStr(formData, "city");
  const state = optionalStr(formData, "state");
  const zip = optionalStr(formData, "zip");
  const description = optionalStr(formData, "description");
  const isCoed = formData.get("is_coed") === "true";
  const hasWomenOnlyRooms = formData.get("has_women_only_rooms") === "true";
  const defaultMinStayDays = optionalStr(formData, "default_min_stay_days");

  // Property details (required)
  const numBedrooms = str(formData, "num_bedrooms");
  const numBathrooms = str(formData, "num_bathrooms");

  // Additional details
  const laundry = optionalStr(formData, "laundry");
  const parking = optionalStr(formData, "parking");

  // Bathroom & Laundry amenities
  const hasDryer = formData.get("has_dryer") === "true";
  const hasPaidLaundry = formData.get("has_paid_laundry") === "true";
  const toiletPaperProvided = formData.get("toilet_paper_provided") === "true";

  // Comfort amenities
  const hasAirConditioning = formData.get("has_air_conditioning") === "true";
  const hasBalcony = formData.get("has_balcony") === "true";
  const hasHeating = formData.get("has_heating") === "true";
  const linenProvided = formData.get("linen_provided") === "true";
  const hasBlackoutBlinds = formData.get("has_blackout_blinds") === "true";
  const bedroomEssentials = formData.get("bedroom_essentials") === "true";
  const bedroomDoorLock = formData.get("bedroom_door_lock") === "true";

  // Community amenities
  const hasChillOutArea = formData.get("has_chill_out_area") === "true";
  const hasSharedLivingArea = formData.get("has_shared_living_area") === "true";
  const hasBbqArea = formData.get("has_bbq_area") === "true";
  const hasDiningArea = formData.get("has_dining_area") === "true";
  const hasDishwasher = formData.get("has_dishwasher") === "true";

  // Outdoors amenities
  const hasOutdoorSpace = formData.get("has_outdoor_space") === "true";

  // Services amenities
  const commonAreaCleaning = formData.get("common_area_cleaning") === "true";
  const roomCleaning = formData.get("room_cleaning") === "true";

  // Transport amenities
  const hasBicycles = formData.get("has_bicycles") === "true";
  const hasFreeStreetParking = formData.get("has_free_street_parking") === "true";
  const hasOnSiteParking = formData.get("has_on_site_parking") === "true";
  const hasPaidParking = formData.get("has_paid_parking") === "true";

  // Wellness amenities
  const hasGym = formData.get("has_gym") === "true";
  const hasYogaSpace = formData.get("has_yoga_space") === "true";

  // Work amenities
  const hasHighSpeedWifi = formData.get("has_high_speed_wifi") === "true";
  const hasMeetingRooms = formData.get("has_meeting_rooms") === "true";
  const hasPrivateCallRoom = formData.get("has_private_call_room") === "true";
  const hasWorkspace = formData.get("has_workspace") === "true";
  const hasDeskWorkspace = formData.get("has_desk_workspace") === "true";

  // Validate required fields
  const fieldErrors: Record<string, string> = {};

  if (!name) {
    fieldErrors.name = "Property name is required";
  }

  if (!propertyType) {
    fieldErrors.property_type = "Property type is required";
  } else if (!["house", "apartment", "condo"].includes(propertyType)) {
    fieldErrors.property_type = "Invalid property type";
  }

  if (!address) {
    fieldErrors.address = "Address is required";
  }

  if (!numBedrooms) {
    fieldErrors.num_bedrooms = "Number of bedrooms is required";
  } else {
    const beds = parseInt(numBedrooms, 10);
    if (isNaN(beds) || beds < 1) {
      fieldErrors.num_bedrooms = "Bedrooms must be at least 1";
    }
  }

  if (!numBathrooms) {
    fieldErrors.num_bathrooms = "Number of bathrooms is required";
  } else {
    const baths = parseInt(numBathrooms, 10);
    if (isNaN(baths) || baths < 1) {
      fieldErrors.num_bathrooms = "Bathrooms must be at least 1";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return errorState("Please fix the errors below.", fieldErrors);
  }

  if (!isServiceRoleConfigured()) {
    return errorState("Database is not configured for this environment.");
  }

  try {
    const supabase = getServiceClient();

    const propertyData = {
      name,
      property_type: propertyType,
      address,
      city,
      state,
      zip,
      description,
      is_coed: isCoed,
      has_women_only_rooms: hasWomenOnlyRooms,
      default_min_stay_days: defaultMinStayDays ? parseInt(defaultMinStayDays, 10) : 30,
      // Property details (required)
      num_bedrooms: parseInt(numBedrooms, 10),
      num_bathrooms: parseInt(numBathrooms, 10),
      // Standard inclusions - always true for Room Link properties
      furnished: true,
      utilities_included: true,
      wifi: true,
      // Additional details
      laundry,
      parking,
      // Bathroom & Laundry
      has_dryer: hasDryer,
      has_paid_laundry: hasPaidLaundry,
      toilet_paper_provided: toiletPaperProvided,
      // Comfort
      has_air_conditioning: hasAirConditioning,
      has_balcony: hasBalcony,
      has_heating: hasHeating,
      linen_provided: linenProvided,
      has_blackout_blinds: hasBlackoutBlinds,
      bedroom_essentials: bedroomEssentials,
      bedroom_door_lock: bedroomDoorLock,
      // Community
      has_chill_out_area: hasChillOutArea,
      has_shared_living_area: hasSharedLivingArea,
      has_bbq_area: hasBbqArea,
      has_dining_area: hasDiningArea,
      has_dishwasher: hasDishwasher,
      // Outdoors
      has_outdoor_space: hasOutdoorSpace,
      // Services
      common_area_cleaning: commonAreaCleaning,
      room_cleaning: roomCleaning,
      // Transport
      has_bicycles: hasBicycles,
      has_free_street_parking: hasFreeStreetParking,
      has_on_site_parking: hasOnSiteParking,
      has_paid_parking: hasPaidParking,
      // Wellness
      has_gym: hasGym,
      has_yoga_space: hasYogaSpace,
      // Work
      has_high_speed_wifi: hasHighSpeedWifi,
      has_meeting_rooms: hasMeetingRooms,
      has_private_call_room: hasPrivateCallRoom,
      has_workspace: hasWorkspace,
      has_desk_workspace: hasDeskWorkspace,
      is_hidden: true, // Draft properties start hidden
    };

    let newPropertyId = propertyId;

    if (propertyId) {
      // Update existing property
      const { error: updateError } = await supabase
        .from("properties")
        .update(propertyData)
        .eq("id", propertyId)
        .eq("owner_id", ownerId);

      if (updateError) {
        console.error("[createOrUpdatePropertyListingAction] Update error:", updateError);
        return errorState("Failed to update property. Please try again.");
      }
    } else {
      // Create new property
      const { data: newProperty, error: insertError } = await supabase
        .from("properties")
        .insert({
          ...propertyData,
          owner_id: ownerId,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("[createOrUpdatePropertyListingAction] Insert error:", {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        });
        // Provide more specific error messages
        if (insertError.code === "23503") {
          // Foreign key violation
          return errorState("User account not found. Please complete account setup first.");
        }
        if (insertError.code === "23502") {
          // NOT NULL violation
          return errorState(`Missing required field: ${insertError.message}`);
        }
        if (insertError.code === "23514") {
          // Check constraint violation
          return errorState(`Invalid value: ${insertError.message}`);
        }
        if (insertError.code === "42703") {
          // Column doesn't exist
          return errorState(`Database schema issue: ${insertError.message}. Please contact support.`);
        }
        return errorState(`Failed to create property: ${insertError.message || "Please try again."}`);
      }

      newPropertyId = newProperty.id;

      // Store as draft property
      const { error: draftError } = await supabase
        .from("users")
        .update({ onboarding_draft_property_id: newPropertyId })
        .eq("id", ownerId);

      if (draftError) {
        console.error("[createOrUpdatePropertyListingAction] Draft update error:", draftError);
        // Continue anyway - property was created
      }
    }

    revalidatePath("/onboarding/landlord");
    revalidatePath("/dashboard");

    return successState("Property saved.", { propertyId: newPropertyId });
  } catch (error) {
    console.error("[createOrUpdatePropertyListingAction] Error:", error);
    return errorState("An unexpected error occurred. Please try again.");
  }
}

/**
 * Create a room and bed for the property during onboarding.
 * Creates a single room with a single bed for MVP.
 */
export async function createRoomAndBedAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // Get owner ID from auth
  let ownerId: string;

  if (isDemoMode()) {
    ownerId = DEMO_OWNER_ID;
  } else {
    const authUser = await getAuthUser();
    if (!authUser) {
      return errorState("Not authenticated. Please sign in.");
    }
    ownerId = authUser.id;
  }

  // Parse form data
  const propertyId = str(formData, "property_id");
  const roomId = optionalStr(formData, "room_id");
  const bedId = optionalStr(formData, "bed_id");
  const roomName = str(formData, "room_name");
  const bedLabel = str(formData, "bed_label");
  const monthlyRent = str(formData, "monthly_rent");
  const depositAmount = optionalStr(formData, "deposit_amount");
  const availableFrom = optionalStr(formData, "available_from");
  const minStayDays = optionalStr(formData, "min_stay_days");
  const maxStayDays = optionalStr(formData, "max_stay_days");
  const bunkType = optionalStr(formData, "bunk_type") || "single";

  // Validate required fields
  const fieldErrors: Record<string, string> = {};

  if (!propertyId) {
    fieldErrors.property_id = "Property is required";
  }

  if (!roomName) {
    fieldErrors.room_name = "Room name is required";
  }

  if (!bedLabel) {
    fieldErrors.bed_label = "Bed label is required";
  }

  if (!monthlyRent) {
    fieldErrors.monthly_rent = "Monthly rent is required";
  } else {
    const rent = parseFloat(monthlyRent);
    if (isNaN(rent) || rent <= 0) {
      fieldErrors.monthly_rent = "Monthly rent must be greater than 0";
    }
  }

  if (depositAmount) {
    const deposit = parseFloat(depositAmount);
    if (isNaN(deposit) || deposit < 0) {
      fieldErrors.deposit_amount = "Deposit must be 0 or greater";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return errorState("Please fix the errors below.", fieldErrors);
  }

  if (!isServiceRoleConfigured()) {
    return errorState("Database is not configured for this environment.");
  }

  try {
    const supabase = getServiceClient();

    // Verify property belongs to user
    const { data: property, error: propError } = await supabase
      .from("properties")
      .select("id")
      .eq("id", propertyId)
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (propError || !property) {
      return errorState("Property not found or access denied.");
    }

    let finalRoomId = roomId;
    let finalBedId = bedId;

    // Create or update room
    if (roomId) {
      // Update existing room
      const { error: roomUpdateError } = await supabase
        .from("rooms")
        .update({ name: roomName })
        .eq("id", roomId)
        .eq("property_id", propertyId);

      if (roomUpdateError) {
        console.error("[createRoomAndBedAction] Room update error:", roomUpdateError);
        return errorState("Failed to update room. Please try again.");
      }
    } else {
      // Create new room
      const { data: newRoom, error: roomInsertError } = await supabase
        .from("rooms")
        .insert({
          property_id: propertyId,
          name: roomName,
          max_occupancy: 1,
        })
        .select("id")
        .single();

      if (roomInsertError) {
        console.error("[createRoomAndBedAction] Room insert error:", roomInsertError);
        return errorState("Failed to create room. Please try again.");
      }

      finalRoomId = newRoom.id;
    }

    // Prepare bed data
    const bedData = {
      label: bedLabel,
      bunk_type: bunkType,
      monthly_rent: parseFloat(monthlyRent),
      deposit_amount: depositAmount ? parseFloat(depositAmount) : 0,
      status: "vacant" as const,
      available_from: availableFrom || null,
      min_stay_days: minStayDays ? parseInt(minStayDays, 10) : null,
      max_stay_days: maxStayDays ? parseInt(maxStayDays, 10) : null,
    };

    // Create or update bed
    if (bedId) {
      // Update existing bed
      const { error: bedUpdateError } = await supabase
        .from("beds")
        .update({ ...bedData, room_id: finalRoomId })
        .eq("id", bedId)
        .eq("property_id", propertyId);

      if (bedUpdateError) {
        console.error("[createRoomAndBedAction] Bed update error:", bedUpdateError);
        return errorState("Failed to update bed. Please try again.");
      }
    } else {
      // Create new bed
      const { data: newBed, error: bedInsertError } = await supabase
        .from("beds")
        .insert({
          ...bedData,
          property_id: propertyId,
          room_id: finalRoomId,
        })
        .select("id")
        .single();

      if (bedInsertError) {
        console.error("[createRoomAndBedAction] Bed insert error:", bedInsertError);
        return errorState("Failed to create bed. Please try again.");
      }

      finalBedId = newBed.id;
    }

    revalidatePath("/onboarding/landlord");
    revalidatePath("/dashboard");

    return successState("Room and bed saved.", { roomId: finalRoomId, bedId: finalBedId });
  } catch (error) {
    console.error("[createRoomAndBedAction] Error:", error);
    return errorState("An unexpected error occurred. Please try again.");
  }
}

/**
 * Update listing content during onboarding (description, neighborhood).
 */
export async function updateListingContentAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // Get owner ID from auth
  let ownerId: string;

  if (isDemoMode()) {
    ownerId = DEMO_OWNER_ID;
  } else {
    const authUser = await getAuthUser();
    if (!authUser) {
      return errorState("Not authenticated. Please sign in.");
    }
    ownerId = authUser.id;
  }

  const propertyId = str(formData, "property_id");
  const description = optionalStr(formData, "description");
  const neighborhood = optionalStr(formData, "neighborhood");

  if (!propertyId) {
    return errorState("Property ID is required.");
  }

  if (!isServiceRoleConfigured()) {
    return errorState("Database is not configured for this environment.");
  }

  try {
    const supabase = getServiceClient();

    // Verify property belongs to user
    const { data: property, error: propError } = await supabase
      .from("properties")
      .select("id")
      .eq("id", propertyId)
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (propError || !property) {
      return errorState("Property not found or access denied.");
    }

    const { error: updateError } = await supabase
      .from("properties")
      .update({
        description,
        neighborhood,
      })
      .eq("id", propertyId)
      .eq("owner_id", ownerId);

    if (updateError) {
      console.error("[updateListingContentAction] Update error:", updateError);
      return errorState("Failed to update listing. Please try again.");
    }

    revalidatePath("/onboarding/landlord");
    revalidatePath("/dashboard");

    return successState("Listing content saved.");
  } catch (error) {
    console.error("[updateListingContentAction] Error:", error);
    return errorState("An unexpected error occurred. Please try again.");
  }
}

/**
 * Save house rules during onboarding.
 */
export async function saveHouseRulesAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // Get owner ID from auth
  let ownerId: string;

  if (isDemoMode()) {
    ownerId = DEMO_OWNER_ID;
  } else {
    const authUser = await getAuthUser();
    if (!authUser) {
      return errorState("Not authenticated. Please sign in.");
    }
    ownerId = authUser.id;
  }

  const propertyId = str(formData, "property_id");
  const houseRules = optionalStr(formData, "house_rules");

  if (!propertyId) {
    return errorState("Property ID is required.");
  }

  if (!isServiceRoleConfigured()) {
    return errorState("Database is not configured for this environment.");
  }

  try {
    const supabase = getServiceClient();

    const { error: updateError } = await supabase
      .from("properties")
      .update({ house_rules: houseRules })
      .eq("id", propertyId)
      .eq("owner_id", ownerId);

    if (updateError) {
      console.error("[saveHouseRulesAction] Update error:", updateError);
      return errorState("Failed to save house rules. Please try again.");
    }

    revalidatePath("/onboarding/landlord");
    return successState("House rules saved.");
  } catch (error) {
    console.error("[saveHouseRulesAction] Error:", error);
    return errorState("An unexpected error occurred. Please try again.");
  }
}

/**
 * Save compliance acknowledgment during onboarding.
 */
export async function saveComplianceAckAction(): Promise<ActionState> {
  // Get owner ID from auth
  let ownerId: string;

  if (isDemoMode()) {
    ownerId = DEMO_OWNER_ID;
  } else {
    const authUser = await getAuthUser();
    if (!authUser) {
      return errorState("Not authenticated. Please sign in.");
    }
    ownerId = authUser.id;
  }

  if (!isServiceRoleConfigured()) {
    return errorState("Database is not configured for this environment.");
  }

  try {
    const supabase = getServiceClient();

    const { error } = await supabase
      .from("users")
      .update({ compliance_ack_at: new Date().toISOString() })
      .eq("id", ownerId);

    if (error) {
      console.error("[saveComplianceAckAction] Error:", error);
      return errorState("Failed to save acknowledgment. Please try again.");
    }

    revalidatePath("/onboarding/landlord");
    return successState("Compliance acknowledged.");
  } catch (error) {
    console.error("[saveComplianceAckAction] Error:", error);
    return errorState("An unexpected error occurred. Please try again.");
  }
}

/**
 * Publish the listing - sets property as visible and marks onboarding complete.
 */
export async function publishListingAction(): Promise<ActionState> {
  // Get owner ID from auth
  let ownerId: string;

  if (isDemoMode()) {
    ownerId = DEMO_OWNER_ID;
  } else {
    const authUser = await getAuthUser();
    if (!authUser) {
      return errorState("Not authenticated. Please sign in.");
    }
    ownerId = authUser.id;
  }

  if (!isServiceRoleConfigured()) {
    return errorState("Database is not configured for this environment.");
  }

  try {
    const supabase = getServiceClient();

    // Get user's draft property
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("onboarding_draft_property_id")
      .eq("id", ownerId)
      .maybeSingle();

    if (userError || !userData?.onboarding_draft_property_id) {
      return errorState("No property to publish.");
    }

    const propertyId = userData.onboarding_draft_property_id;

    // Publish the property (make visible)
    const { error: publishError } = await supabase
      .from("properties")
      .update({ is_hidden: false })
      .eq("id", propertyId)
      .eq("owner_id", ownerId);

    if (publishError) {
      console.error("[publishListingAction] Publish error:", publishError);
      return errorState("Failed to publish listing. Please try again.");
    }

    // Mark onboarding as complete
    const { error: completeError } = await supabase
      .from("users")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", ownerId);

    if (completeError) {
      console.error("[publishListingAction] Complete error:", completeError);
      // Continue anyway - property is published
    }

    revalidatePath("/onboarding/landlord");
    revalidatePath("/dashboard");
    revalidatePath(`/properties/${propertyId}`);

    return successState("Listing published!", { propertyId });
  } catch (error) {
    console.error("[publishListingAction] Error:", error);
    return errorState("An unexpected error occurred. Please try again.");
  }
}

// -----------------------------------------------------------------------------
// Draft Property Actions
// -----------------------------------------------------------------------------

/**
 * Set the draft property ID for onboarding.
 */
export async function setOnboardingDraftPropertyAction(
  propertyId: string
): Promise<ActionState> {
  // Get owner ID from auth
  let ownerId: string;

  if (isDemoMode()) {
    ownerId = DEMO_OWNER_ID;
  } else {
    const authUser = await getAuthUser();
    if (!authUser) {
      return errorState("Not authenticated. Please sign in.");
    }
    ownerId = authUser.id;
  }

  if (!isServiceRoleConfigured()) {
    return errorState("Database is not configured for this environment.");
  }

  try {
    const supabase = getServiceClient();

    const { error } = await supabase
      .from("users")
      .update({ onboarding_draft_property_id: propertyId })
      .eq("id", ownerId);

    if (error) {
      console.error("[setOnboardingDraftPropertyAction] Error:", error);
      return errorState("Failed to save draft property. Please try again.");
    }

    revalidatePath("/onboarding/landlord");

    return successState("Draft property saved.");
  } catch (error) {
    console.error("[setOnboardingDraftPropertyAction] Error:", error);
    return errorState("An unexpected error occurred. Please try again.");
  }
}
