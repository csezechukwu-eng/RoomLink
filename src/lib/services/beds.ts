import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { ok, fail, type Result } from "@/lib/result";
import type { Bed, BedStatus } from "@/lib/types";

/**
 * Change a bed's status. Shared by the landlord bed manager and by the
 * application approval flow. Platform-agnostic — mobile can call this too.
 */
export async function setBedStatus(
  bedId: string,
  status: BedStatus,
  propertyId?: string
): Promise<Result<Bed>> {
  try {
    const supabase = getServiceClient();
    let query = supabase.from("beds").update({ status }).eq("id", bedId);
    if (propertyId) query = query.eq("property_id", propertyId);
    const { data, error } = await query.select("*").single();
    if (error) throw error;
    return ok(data as Bed);
  } catch (error) {
    return fail(error);
  }
}
