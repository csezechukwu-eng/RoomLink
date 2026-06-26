import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Auth helpers for RoomLink.
 *
 * Supports two modes:
 * 1. Production mode: Uses real Supabase Auth
 * 2. Demo mode: Uses hardcoded demo UUIDs when DEMO_MODE=true
 */

// Demo UUIDs - only used in local demo mode
// These match the seed.sql data
export const DEMO_OWNER_ID = "d0d7c1e3-5b4a-4b9f-8c3d-1e2f3a4b5c6d";
export const DEMO_TENANT_ID = "00000000-0000-0000-0000-000000000002";

export const TENANT_COOKIE = "rl_tenant";

/**
 * Check if demo mode is enabled.
 * Demo mode is active when DEMO_MODE=true is set in environment.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

/**
 * AuthError thrown when authentication is required but user is not authenticated.
 */
export class AuthError extends Error {
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Get the current authenticated user.
 * Returns null if not authenticated.
 *
 * In demo mode, returns a mock user object.
 */
export async function getCurrentUser(): Promise<User | null> {
  // Demo mode: return mock user
  if (isDemoMode()) {
    return {
      id: DEMO_OWNER_ID,
      email: "demo@roomlink.local",
      app_metadata: {},
      user_metadata: { full_name: "Demo Landlord" },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User;
  }

  // Production mode: get real authenticated user
  const user = await getAuthUser();
  return user;
}

/**
 * Require an authenticated user.
 * Redirects to login if not authenticated.
 *
 * Use this in Server Components and Server Actions that require auth.
 */
export async function requireCurrentUser(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * Get the current landlord's owner ID.
 *
 * In demo mode, returns the demo owner UUID.
 * In production mode, returns the authenticated user's ID.
 *
 * Throws AuthError if not authenticated (in production mode).
 */
export async function getCurrentOwnerId(): Promise<string> {
  // Demo mode: return demo owner ID
  if (isDemoMode()) {
    return DEMO_OWNER_ID;
  }

  // Production mode: get authenticated user's ID
  const user = await getAuthUser();

  if (!user) {
    throw new AuthError("Not authenticated. Please sign in.");
  }

  return user.id;
}

/**
 * Try to get the current owner ID without throwing.
 * Returns null if not authenticated.
 */
export async function tryGetCurrentOwnerId(): Promise<string | null> {
  if (isDemoMode()) {
    return DEMO_OWNER_ID;
  }

  const user = await getAuthUser();
  return user?.id ?? null;
}

/**
 * Current tenant's user id (cookie session, demo fallback).
 * Note: Tenant auth is separate from landlord auth and uses cookie-based sessions.
 */
export async function getCurrentTenantId(): Promise<string> {
  const store = await cookies();
  return store.get(TENANT_COOKIE)?.value || DEMO_TENANT_ID;
}

/**
 * Set the tenant cookie after an application is submitted.
 */
export async function setCurrentTenantId(tenantId: string): Promise<void> {
  const store = await cookies();
  store.set(TENANT_COOKIE, tenantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days
  });
}

// ---------------------------------------------------------------------------
// Stripe Connect Status (Future: Marketplace Payouts)
// ---------------------------------------------------------------------------

export interface LandlordPayoutStatus {
  id: string;
  email: string;
  full_name: string | null;
  /** Whether Stripe Connect is set up for payouts */
  stripe_connect_enabled: boolean;
}

/**
 * Get the current landlord's payout status from the users table.
 * Used for future Stripe Connect marketplace payouts.
 * Returns null if not authenticated or user not found.
 */
export async function getLandlordPayoutStatus(): Promise<LandlordPayoutStatus | null> {
  const { createAuthenticatedClient } = await import("@/lib/supabase/server");

  // Demo mode: return mock data
  if (isDemoMode()) {
    return {
      id: DEMO_OWNER_ID,
      email: "demo@roomlink.local",
      full_name: "Demo Landlord",
      stripe_connect_enabled: false,
    };
  }

  // Production mode: fetch from database
  const supabase = await createAuthenticatedClient();
  const authUser = await getAuthUser();

  if (!authUser) return null;

  const { data, error } = await supabase
    .from("users")
    .select(`
      id,
      email,
      full_name,
      stripe_connect_enabled
    `)
    .eq("id", authUser.id)
    .single();

  if (error || !data) {
    // User might not exist in users table yet - return defaults
    return {
      id: authUser.id,
      email: authUser.email || "",
      full_name: authUser.user_metadata?.full_name || null,
      stripe_connect_enabled: false,
    };
  }

  return data as LandlordPayoutStatus;
}
