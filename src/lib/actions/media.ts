"use server";

import { getCurrentOwnerId } from "@/lib/auth";
import { createAuthenticatedClient } from "@/lib/supabase/server";
import type { MediaType, PropertyMedia } from "@/lib/types";
import {
  type ActionState,
  assertPropertyOwned,
  errorState,
  messageFrom,
  revalidateLandlord,
  str,
  successState,
} from "@/lib/actions/_shared";

const BUCKET_NAME = "property-media";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Upload a photo for a property, room, or bed.
 * Files are stored in the format: {owner_id}/{property_id}/{media_type}/{filename}
 */
export async function uploadMedia(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const propertyId = str(formData, "property_id");
  const mediaType = str(formData, "media_type") as MediaType;
  const roomId = str(formData, "room_id") || null;
  const bedId = str(formData, "bed_id") || null;
  const file = formData.get("file") as File | null;

  if (!propertyId) return errorState("Property ID is required.");
  if (!["property", "room", "bed"].includes(mediaType)) {
    return errorState("Invalid media type.");
  }
  if (!file || !(file instanceof File)) {
    return errorState("No file uploaded.");
  }

  // Validate file
  if (file.size > MAX_FILE_SIZE) {
    return errorState("File is too large. Maximum size is 5MB.");
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return errorState("Invalid file type. Use JPEG, PNG, WebP, or GIF.");
  }

  try {
    const supabase = await createAuthenticatedClient();
    const ownerId = await getCurrentOwnerId();
    await assertPropertyOwned(supabase, propertyId, ownerId);

    // Generate unique filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${randomId}.${ext}`;

    // Build storage path: {owner_id}/{property_id}/{media_type}/{filename}
    let storagePath = `${ownerId}/${propertyId}/${mediaType}`;
    if (roomId) storagePath += `/${roomId}`;
    if (bedId) storagePath += `/${bedId}`;
    storagePath += `/${filename}`;

    // Upload to storage
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[uploadMedia] Storage upload error:", uploadError);
      throw uploadError;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);

    // Check if this is the first image for this property/room/bed (make it cover)
    const { count } = await supabase
      .from("property_media")
      .select("id", { count: "exact", head: true })
      .eq("property_id", propertyId)
      .eq("media_type", mediaType)
      .eq("room_id", roomId ?? "")
      .eq("bed_id", bedId ?? "");

    const isCover = (count ?? 0) === 0;

    // Insert media record
    const { error: insertError } = await supabase.from("property_media").insert({
      owner_id: ownerId,
      property_id: propertyId,
      room_id: roomId,
      bed_id: bedId,
      media_type: mediaType,
      storage_bucket: BUCKET_NAME,
      storage_path: storagePath,
      public_url: publicUrl,
      is_cover: isCover,
      sort_order: (count ?? 0) + 1,
    });

    if (insertError) {
      // Try to clean up uploaded file
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      console.error("[uploadMedia] Insert error:", insertError);
      throw insertError;
    }

    revalidateLandlord(propertyId);
    return successState("Photo uploaded successfully.");
  } catch (error) {
    console.error("[uploadMedia] Error:", error);
    return errorState(messageFrom(error));
  }
}

/**
 * Delete a media item and its storage file.
 */
export async function deleteMedia(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const mediaId = str(formData, "media_id");
  if (!mediaId) return errorState("Media ID is required.");

  try {
    const supabase = await createAuthenticatedClient();
    const ownerId = await getCurrentOwnerId();

    // Get media record
    const { data: media, error: fetchError } = await supabase
      .from("property_media")
      .select("*")
      .eq("id", mediaId)
      .eq("owner_id", ownerId)
      .single();

    if (fetchError || !media) {
      return errorState("Media not found.");
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([media.storage_path]);

    if (storageError) {
      console.error("[deleteMedia] Storage delete error:", storageError);
      // Continue to delete record even if storage fails
    }

    // Delete record
    const { error: deleteError } = await supabase
      .from("property_media")
      .delete()
      .eq("id", mediaId)
      .eq("owner_id", ownerId);

    if (deleteError) {
      throw deleteError;
    }

    // If this was the cover, promote another image
    if (media.is_cover) {
      const { data: nextMedia } = await supabase
        .from("property_media")
        .select("id")
        .eq("property_id", media.property_id)
        .eq("media_type", media.media_type)
        .eq("room_id", media.room_id ?? "")
        .eq("bed_id", media.bed_id ?? "")
        .order("sort_order", { ascending: true })
        .limit(1)
        .single();

      if (nextMedia) {
        await supabase
          .from("property_media")
          .update({ is_cover: true })
          .eq("id", nextMedia.id);
      }
    }

    revalidateLandlord(media.property_id);
    return successState("Photo deleted.");
  } catch (error) {
    console.error("[deleteMedia] Error:", error);
    return errorState(messageFrom(error));
  }
}

/**
 * Set a specific media item as the cover photo.
 */
export async function setCoverMedia(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const mediaId = str(formData, "media_id");
  if (!mediaId) return errorState("Media ID is required.");

  try {
    const supabase = await createAuthenticatedClient();
    const ownerId = await getCurrentOwnerId();

    // Get the media record
    const { data: media, error: fetchError } = await supabase
      .from("property_media")
      .select("*")
      .eq("id", mediaId)
      .eq("owner_id", ownerId)
      .single();

    if (fetchError || !media) {
      return errorState("Media not found.");
    }

    // Unset any existing cover for this property/room/bed + type
    await supabase
      .from("property_media")
      .update({ is_cover: false })
      .eq("property_id", media.property_id)
      .eq("media_type", media.media_type)
      .eq("room_id", media.room_id ?? "")
      .eq("bed_id", media.bed_id ?? "")
      .eq("is_cover", true);

    // Set new cover
    const { error: updateError } = await supabase
      .from("property_media")
      .update({ is_cover: true })
      .eq("id", mediaId)
      .eq("owner_id", ownerId);

    if (updateError) {
      throw updateError;
    }

    revalidateLandlord(media.property_id);
    return successState("Cover photo updated.");
  } catch (error) {
    console.error("[setCoverMedia] Error:", error);
    return errorState(messageFrom(error));
  }
}

/**
 * Get all media for a property (including room and bed photos).
 * This is a read operation, not an action.
 */
export async function getPropertyMedia(
  propertyId: string
): Promise<PropertyMedia[]> {
  try {
    const supabase = await createAuthenticatedClient();
    const ownerId = await getCurrentOwnerId();

    const { data, error } = await supabase
      .from("property_media")
      .select("*")
      .eq("property_id", propertyId)
      .eq("owner_id", ownerId)
      .order("media_type")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[getPropertyMedia] Error:", error);
      return [];
    }

    return (data as PropertyMedia[]) ?? [];
  } catch {
    return [];
  }
}

/**
 * Get media for a specific entity (property, room, or bed).
 */
export async function getMediaForEntity(options: {
  propertyId: string;
  mediaType: MediaType;
  roomId?: string;
  bedId?: string;
}): Promise<PropertyMedia[]> {
  try {
    const supabase = await createAuthenticatedClient();
    const ownerId = await getCurrentOwnerId();

    let query = supabase
      .from("property_media")
      .select("*")
      .eq("property_id", options.propertyId)
      .eq("owner_id", ownerId)
      .eq("media_type", options.mediaType);

    if (options.roomId) {
      query = query.eq("room_id", options.roomId);
    } else {
      query = query.is("room_id", null);
    }

    if (options.bedId) {
      query = query.eq("bed_id", options.bedId);
    } else {
      query = query.is("bed_id", null);
    }

    const { data, error } = await query.order("sort_order", {
      ascending: true,
    });

    if (error) {
      console.error("[getMediaForEntity] Error:", error);
      return [];
    }

    return (data as PropertyMedia[]) ?? [];
  } catch {
    return [];
  }
}
