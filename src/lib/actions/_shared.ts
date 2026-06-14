import "server-only";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

// Re-export the client-safe helpers so server action files can import
// everything from one place.
export * from "@/lib/actions/types";

/** Verify a property exists and belongs to the given owner. Throws otherwise. */
export async function assertPropertyOwned(
  supabase: SupabaseClient,
  propertyId: string,
  ownerId: string
): Promise<void> {
  const { data, error } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Property not found.");
}

/**
 * Revalidate the whole app after a mutation. Phase 1 mutations frequently
 * touch several areas at once (e.g. approving an application updates
 * applications, reservations, rent, availability, the dashboard and the tenant
 * portal), so we invalidate everything under the root layout for correctness.
 */
export function revalidateApp() {
  revalidatePath("/", "layout");
}

/** Back-compat alias used by the property/room/bed actions. */
export function revalidateLandlord(propertyId?: string) {
  revalidateApp();
  if (propertyId) revalidatePath(`/dashboard/properties/${propertyId}`);
}
