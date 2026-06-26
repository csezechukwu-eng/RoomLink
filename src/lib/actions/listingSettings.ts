"use server";

import { getCurrentOwnerId } from "@/lib/auth";
import { createAuthenticatedClient } from "@/lib/supabase/server";
import type { PropertyOccupancyType } from "@/lib/types";
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

const VALID_OCCUPANCY_TYPES = new Set<string>([
  "coed",
  "women_only_house",
  "women_only_rooms_available",
]);

/**
 * Update listing settings for a property.
 * Handles: visibility, occupancy type, checkout photo requirement.
 *
 * Note: Monthly rent and deposit are per-bed, not property-level.
 * Minimum stay is fixed at 30 days for Room Link marketplace.
 */
export async function updateListingSettings(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  if (!id) return errorState("Missing property id.");

  // Parse form values
  const isHidden = str(formData, "is_hidden") === "true";
  const occupancyTypeRaw = optionalStr(formData, "occupancy_type");
  const checkoutPhotoRequired = str(formData, "checkout_photo_required") === "true";
  const defaultMinStayDaysStr = optionalStr(formData, "default_min_stay_days");

  // Validate occupancy type
  let occupancyType: PropertyOccupancyType | null = null;
  if (occupancyTypeRaw && occupancyTypeRaw !== "") {
    if (!VALID_OCCUPANCY_TYPES.has(occupancyTypeRaw)) {
      return errorState("Invalid occupancy type selected.", {
        occupancy_type: "Please select a valid occupancy type.",
      });
    }
    occupancyType = occupancyTypeRaw as PropertyOccupancyType;
  }

  // Parse minimum stay days (should always be 30 for Room Link)
  let defaultMinStayDays = 30;
  if (defaultMinStayDaysStr) {
    const parsed = parseInt(defaultMinStayDaysStr, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      defaultMinStayDays = parsed;
    }
  }

  try {
    const supabase = await createAuthenticatedClient();
    const ownerId = await getCurrentOwnerId();
    await assertPropertyOwned(supabase, id, ownerId);

    const { error } = await supabase
      .from("properties")
      .update({
        is_hidden: isHidden,
        occupancy_type: occupancyType,
        checkout_photo_required: checkoutPhotoRequired,
        default_min_stay_days: defaultMinStayDays,
      })
      .eq("id", id)
      .eq("owner_id", ownerId);

    if (error) throw error;

    revalidateLandlord(id);
    return successState(
      isHidden
        ? "Listing hidden from public."
        : "Listing settings saved and published."
    );
  } catch (error) {
    return errorState(messageFrom(error));
  }
}
