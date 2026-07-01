import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { ok, fail, type Result } from "@/lib/result";
import type { Message, MessageSenderRole } from "@/lib/types";

export interface ThreadSummary {
  property_id: string;
  tenant_id: string;
  property_name: string | null;
  tenant_name: string | null;
  tenant_email: string | null;
  last_body: string;
  last_at: string;
  last_sender_role: MessageSenderRole;
  count: number;
  /** True if the tenant has an active reservation (is a current tenant) */
  is_current_tenant: boolean;
}

export interface TenantThread {
  propertyId: string;
  propertyName: string | null;
  messages: Message[];
}

export async function sendMessage(input: {
  propertyId: string;
  tenantId: string;
  senderId: string;
  senderRole: MessageSenderRole;
  body: string;
}): Promise<Result<Message>> {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({
        property_id: input.propertyId,
        tenant_id: input.tenantId,
        sender_id: input.senderId,
        sender_role: input.senderRole,
        body: input.body,
      })
      .select("*")
      .single();
    if (error) throw error;
    return ok(data as Message);
  } catch (error) {
    return fail(error);
  }
}

/** Landlord inbox: one summary per (property, tenant) thread. */
export async function listThreadsForOwner(
  ownerId: string
): Promise<Result<ThreadSummary[]>> {
  try {
    const supabase = getServiceClient();
    const { data: props, error: pErr } = await supabase
      .from("properties")
      .select("id, name")
      .eq("owner_id", ownerId);
    if (pErr) throw pErr;
    const propertyIds = (props ?? []).map((p) => p.id);
    if (propertyIds.length === 0) return ok([]);
    const propName = new Map((props ?? []).map((p) => [p.id, p.name]));

    const { data: msgs, error: mErr } = await supabase
      .from("messages")
      .select("*")
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false });
    if (mErr) throw mErr;
    const messages = (msgs ?? []) as Message[];
    if (messages.length === 0) return ok([]);

    const tenantIds = [...new Set(messages.map((m) => m.tenant_id))];
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", tenantIds);
    const userMap = new Map(
      (users ?? []).map((u) => [
        (u as { id: string }).id,
        u as { full_name: string | null; email: string },
      ])
    );

    // Fetch active reservations to identify current tenants
    const { data: reservations } = await supabase
      .from("reservations")
      .select("tenant_id, property_id")
      .in("property_id", propertyIds)
      .in("tenant_id", tenantIds)
      .eq("status", "active");

    // Create a set of "property:tenant" keys for active tenants
    const activeTenantKeys = new Set(
      (reservations ?? []).map((r) => `${r.property_id}:${r.tenant_id}`)
    );

    const threads = new Map<string, ThreadSummary>();
    for (const m of messages) {
      const key = `${m.property_id}:${m.tenant_id}`;
      const existing = threads.get(key);
      if (!existing) {
        const user = userMap.get(m.tenant_id);
        threads.set(key, {
          property_id: m.property_id,
          tenant_id: m.tenant_id,
          property_name: propName.get(m.property_id) ?? null,
          tenant_name: user?.full_name ?? null,
          tenant_email: user?.email ?? null,
          last_body: m.body,
          last_at: m.created_at,
          last_sender_role: m.sender_role,
          count: 1,
          is_current_tenant: activeTenantKeys.has(key),
        });
      } else {
        existing.count += 1;
      }
    }
    return ok([...threads.values()]);
  } catch (error) {
    return fail(error);
  }
}

/** Full message list for a single (property, tenant) thread, oldest first. */
export async function getThread(
  propertyId: string,
  tenantId: string
): Promise<Result<Message[]>> {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("property_id", propertyId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return ok((data ?? []) as Message[]);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Tenant portal thread context: resolves the tenant's property (from a
 * reservation, else a recent application) and returns the message history.
 */
export async function getTenantThread(
  tenantId: string
): Promise<Result<TenantThread | null>> {
  try {
    const supabase = getServiceClient();

    // Prefer a reservation's property; fall back to a recent application.
    const { data: res } = await supabase
      .from("reservations")
      .select("property_id")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1);
    let propertyId = res?.[0]?.property_id as string | undefined;

    if (!propertyId) {
      const { data: apps } = await supabase
        .from("applications")
        .select("property_id")
        .eq("applicant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(1);
      propertyId = apps?.[0]?.property_id as string | undefined;
    }
    if (!propertyId) return ok(null);

    const [{ data: property }, thread] = await Promise.all([
      supabase.from("properties").select("name").eq("id", propertyId).maybeSingle(),
      getThread(propertyId, tenantId),
    ]);
    if (thread.error !== null) return fail(thread.error);

    return ok({
      propertyId,
      propertyName: (property as { name: string } | null)?.name ?? null,
      messages: thread.data,
    });
  } catch (error) {
    return fail(error);
  }
}
