import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service Role Admin Client - BYPASSES RLS.
 *
 * USE ONLY FOR:
 * - Seed scripts
 * - Migrations
 * - Stripe webhooks (later)
 * - Carefully controlled server admin utilities
 *
 * NEVER USE FOR:
 * - Normal landlord dashboard reads/writes
 * - Any user-initiated operations
 * - Client components
 *
 * The service-role key never reaches the browser.
 */

export class SupabaseAdminNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase admin is not configured. Set SUPABASE_SERVICE_ROLE_KEY in environment."
    );
    this.name = "SupabaseAdminNotConfiguredError";
  }
}

let cachedAdminClient: SupabaseClient | null = null;

export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Get the Service Role Admin Client.
 * This bypasses RLS - use with extreme caution.
 * Only for admin operations, never for user-scoped data access.
 */
export function getAdminClient(): SupabaseClient {
  if (!isAdminConfigured()) {
    throw new SupabaseAdminNotConfiguredError();
  }
  if (cachedAdminClient) return cachedAdminClient;

  cachedAdminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
  return cachedAdminClient;
}
