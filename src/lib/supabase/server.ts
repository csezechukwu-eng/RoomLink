import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the service-role key.
 *
 * Phase 1A performs ALL data access on the server (Server Components + Server
 * Actions), so the service-role key never reaches the browser. RLS is enabled
 * on every table and the service role intentionally bypasses it until real
 * per-user auth policies arrive in a later phase.
 *
 * Throws a clear, catchable error when env vars are missing so the UI can show
 * a friendly "Supabase not configured" state instead of crashing the build.
 */
export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase is not configured. Copy .env.example to .env.local and set " +
        "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
    this.name = "SupabaseNotConfiguredError";
  }
}

let cached: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function getServiceClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new SupabaseNotConfiguredError();
  }
  if (cached) return cached;

  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
  return cached;
}
