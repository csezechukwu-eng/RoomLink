import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { ok, fail, type Result } from "@/lib/result";
import type {
  MaintenancePriority,
  MaintenanceRequest,
  MaintenanceStatus,
} from "@/lib/types";

export interface MaintenanceWithRefs extends MaintenanceRequest {
  property_name: string | null;
  room_name: string | null;
  bed_label: string | null;
  tenant_name: string | null;
}

async function enrich(
  rows: MaintenanceRequest[]
): Promise<MaintenanceWithRefs[]> {
  if (rows.length === 0) return [];
  const supabase = getServiceClient();

  const propertyIds = [...new Set(rows.map((r) => r.property_id))];
  const roomIds = [...new Set(rows.map((r) => r.room_id).filter(Boolean))] as string[];
  const bedIds = [...new Set(rows.map((r) => r.bed_id).filter(Boolean))] as string[];
  const tenantIds = [...new Set(rows.map((r) => r.tenant_id).filter(Boolean))] as string[];

  const [{ data: props }, { data: rooms }, { data: beds }, { data: users }] =
    await Promise.all([
      supabase.from("properties").select("id, name").in("id", propertyIds),
      roomIds.length
        ? supabase.from("rooms").select("id, name").in("id", roomIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      bedIds.length
        ? supabase.from("beds").select("id, label").in("id", bedIds)
        : Promise.resolve({ data: [] as { id: string; label: string }[] }),
      tenantIds.length
        ? supabase.from("users").select("id, full_name").in("id", tenantIds)
        : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    ]);

  const propName = new Map((props ?? []).map((p) => [p.id, p.name]));
  const roomName = new Map((rooms ?? []).map((r) => [r.id, r.name]));
  const bedLabel = new Map((beds ?? []).map((b) => [b.id, b.label]));
  const userName = new Map((users ?? []).map((u) => [u.id, u.full_name]));

  return rows.map((r) => ({
    ...r,
    property_name: propName.get(r.property_id) ?? null,
    room_name: r.room_id ? roomName.get(r.room_id) ?? null : null,
    bed_label: r.bed_id ? bedLabel.get(r.bed_id) ?? null : null,
    tenant_name: r.tenant_id ? userName.get(r.tenant_id) ?? null : null,
  }));
}

export async function submitMaintenanceRequest(input: {
  propertyId: string;
  tenantId?: string | null;
  roomId?: string | null;
  bedId?: string | null;
  title: string;
  description?: string | null;
  priority?: MaintenancePriority;
}): Promise<Result<MaintenanceRequest>> {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("maintenance_requests")
      .insert({
        property_id: input.propertyId,
        tenant_id: input.tenantId ?? null,
        room_id: input.roomId ?? null,
        bed_id: input.bedId ?? null,
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? "normal",
        status: "open",
      })
      .select("*")
      .single();
    if (error) throw error;
    return ok(data as MaintenanceRequest);
  } catch (error) {
    return fail(error);
  }
}

export async function listMaintenance(opts: {
  ownerId?: string;
  propertyId?: string;
}): Promise<Result<MaintenanceWithRefs[]>> {
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
      .from("maintenance_requests")
      .select("*")
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ok(await enrich((data ?? []) as MaintenanceRequest[]));
  } catch (error) {
    return fail(error);
  }
}

export async function getTenantMaintenance(
  tenantId: string
): Promise<Result<MaintenanceWithRefs[]>> {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("maintenance_requests")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ok(await enrich((data ?? []) as MaintenanceRequest[]));
  } catch (error) {
    return fail(error);
  }
}

export async function setMaintenanceStatus(
  requestId: string,
  status: MaintenanceStatus
): Promise<Result<null>> {
  try {
    const supabase = getServiceClient();
    const resolved = status === "resolved" || status === "closed";
    const { error } = await supabase
      .from("maintenance_requests")
      .update({
        status,
        resolved_at: resolved ? new Date().toISOString() : null,
      })
      .eq("id", requestId);
    if (error) throw error;
    return ok(null);
  } catch (error) {
    return fail(error);
  }
}
