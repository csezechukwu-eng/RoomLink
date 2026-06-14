import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { ok, fail, type Result } from "@/lib/result";
import type { Announcement } from "@/lib/types";

export interface AnnouncementWithRefs extends Announcement {
  property_name: string | null;
}

async function attachPropertyNames(
  rows: Announcement[]
): Promise<AnnouncementWithRefs[]> {
  if (rows.length === 0) return [];
  const supabase = getServiceClient();
  const propertyIds = [...new Set(rows.map((r) => r.property_id))];
  const { data: props } = await supabase
    .from("properties")
    .select("id, name")
    .in("id", propertyIds);
  const propName = new Map((props ?? []).map((p) => [p.id, p.name]));
  return rows.map((r) => ({
    ...r,
    property_name: propName.get(r.property_id) ?? null,
  }));
}

/** Property ids a tenant is connected to (via reservations or applications). */
async function tenantPropertyIds(tenantId: string): Promise<string[]> {
  const supabase = getServiceClient();
  const [{ data: res }, { data: apps }] = await Promise.all([
    supabase.from("reservations").select("property_id").eq("tenant_id", tenantId),
    supabase.from("applications").select("property_id").eq("applicant_id", tenantId),
  ]);
  return [
    ...new Set([
      ...(res ?? []).map((r) => r.property_id),
      ...(apps ?? []).map((a) => a.property_id),
    ]),
  ];
}

export async function createAnnouncement(input: {
  propertyId: string;
  authorId: string;
  title: string;
  body: string;
}): Promise<Result<Announcement>> {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("announcements")
      .insert({
        property_id: input.propertyId,
        author_id: input.authorId,
        title: input.title,
        body: input.body,
      })
      .select("*")
      .single();
    if (error) throw error;
    return ok(data as Announcement);
  } catch (error) {
    return fail(error);
  }
}

export async function listAnnouncements(opts: {
  ownerId?: string;
  propertyId?: string;
}): Promise<Result<AnnouncementWithRefs[]>> {
  try {
    const supabase = getServiceClient();
    let propertyIds: string[] = [];
    if (opts.propertyId) {
      propertyIds = [opts.propertyId];
    } else if (opts.ownerId) {
      const { data: props, error: pErr } = await supabase
        .from("properties")
        .select("id")
        .eq("owner_id", opts.ownerId);
      if (pErr) throw pErr;
      propertyIds = (props ?? []).map((p) => p.id);
    }
    if (propertyIds.length === 0) return ok([]);

    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ok(await attachPropertyNames((data ?? []) as Announcement[]));
  } catch (error) {
    return fail(error);
  }
}

export async function getTenantAnnouncements(
  tenantId: string
): Promise<Result<AnnouncementWithRefs[]>> {
  try {
    const supabase = getServiceClient();
    const propertyIds = await tenantPropertyIds(tenantId);
    if (propertyIds.length === 0) return ok([]);
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ok(await attachPropertyNames((data ?? []) as Announcement[]));
  } catch (error) {
    return fail(error);
  }
}
