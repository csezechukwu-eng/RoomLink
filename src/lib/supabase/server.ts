import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase clients.
 *
 * Two client types:
 * 1. Service Role Client - bypasses RLS, for admin operations only
 * 2. Authenticated Client - respects RLS, uses user session from cookies
 *
 * The service-role key never reaches the browser. RLS is enabled
 * on every table and the service role intentionally bypasses it until real
 * per-user auth policies arrive in a later phase.
 */

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase is not configured. Copy .env.example to .env.local and set " +
        "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY."
    );
    this.name = "SupabaseNotConfiguredError";
  }
}

let cachedServiceClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Service Role Client - bypasses RLS.
 *
 * @deprecated For new code, import from "@/lib/supabase/admin" instead.
 * This function is kept for backward compatibility with services that
 * haven't been converted to use authenticated client yet.
 *
 * Use only for admin operations that require elevated privileges.
 * Never use for normal landlord dashboard reads/writes.
 * Never expose to client-side code.
 */
export function getServiceClient(): SupabaseClient {
  if (!isServiceRoleConfigured()) {
    throw new SupabaseNotConfiguredError();
  }
  if (cachedServiceClient) return cachedServiceClient;

  cachedServiceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
  return cachedServiceClient;
}

/**
 * Authenticated Server Client - respects RLS.
 * Uses session from cookies for user authentication.
 * Use for user-scoped operations in Server Components and Server Actions.
 */
export async function createAuthenticatedClient() {
  if (!isSupabaseConfigured()) {
    throw new SupabaseNotConfiguredError();
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

/**
 * Get the current authenticated user from session.
 * Returns null if not authenticated.
 */
export async function getAuthUser() {
  try {
    const supabase = await createAuthenticatedClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * Get the current session from cookies.
 * Returns null if no session exists.
 */
export async function getSession() {
  try {
    const supabase = await createAuthenticatedClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}
