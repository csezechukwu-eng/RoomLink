import "server-only";
import { cookies } from "next/headers";

// Phase 1 auth stub.
//
// Real auth (Supabase Auth) lands in a later phase. Until then:
//   • the landlord side is treated as a single demo owner;
//   • the tenant side is identified by a lightweight cookie set when a person
//     applies for a bed, falling back to the seeded demo tenant so the portal
//     is never empty in the demo.
//
// Everything funnels through these helpers, so swapping in a real session
// later touches only this file.

export const DEMO_OWNER_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_TENANT_ID = "00000000-0000-0000-0000-000000000002";

export const TENANT_COOKIE = "rl_tenant";

/** Current landlord's user id. */
export function getCurrentOwnerId(): string {
  return DEMO_OWNER_ID;
}

/** Current tenant's user id (cookie session, demo fallback). */
export async function getCurrentTenantId(): Promise<string> {
  const store = await cookies();
  return store.get(TENANT_COOKIE)?.value || DEMO_TENANT_ID;
}

/** Set the tenant cookie after an application is submitted. */
export async function setCurrentTenantId(tenantId: string): Promise<void> {
  const store = await cookies();
  store.set(TENANT_COOKIE, tenantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days
  });
}
