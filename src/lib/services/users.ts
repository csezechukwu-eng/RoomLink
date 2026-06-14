import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { ok, fail, type Result } from "@/lib/result";
import type { User } from "@/lib/types";

export async function getUser(id: string): Promise<Result<User | null>> {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return ok((data as User) ?? null);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Find a person by email or create one (role: tenant). Used by the public
 * application flow so an applicant becomes a first-class user/tenant.
 */
export async function upsertApplicantByEmail(input: {
  email: string;
  fullName: string;
  phone?: string | null;
}): Promise<Result<User>> {
  try {
    const supabase = getServiceClient();
    const email = input.email.toLowerCase();

    const { data: existing, error: findErr } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();
    if (findErr) throw findErr;

    if (existing) {
      // Backfill name/phone if we didn't have them yet.
      const patch: Record<string, string> = {};
      if (!existing.full_name && input.fullName) patch.full_name = input.fullName;
      if (!existing.phone && input.phone) patch.phone = input.phone;
      if (Object.keys(patch).length > 0) {
        const { data: updated, error: updErr } = await supabase
          .from("users")
          .update(patch)
          .eq("id", existing.id)
          .select("*")
          .single();
        if (updErr) throw updErr;
        return ok(updated as User);
      }
      return ok(existing as User);
    }

    const { data: created, error: insErr } = await supabase
      .from("users")
      .insert({
        email,
        full_name: input.fullName,
        phone: input.phone ?? null,
        role: "tenant",
      })
      .select("*")
      .single();
    if (insErr) throw insErr;
    return ok(created as User);
  } catch (error) {
    return fail(error);
  }
}
