import { NextResponse, NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getBaseUrl } from "@/lib/stripe/server";
import {
  validateStateTokenAndGetAttempt,
  markAttemptReturnConsumed,
  syncIdentityStatusFromStripe,
  isStripeIdentityConfigured,
} from "@/lib/stripe/identity";
import { isServiceRoleConfigured } from "@/lib/supabase/server";

/**
 * Identity verification return handler (PUBLIC ROUTE).
 *
 * ARCHITECTURE:
 * This route uses state-token validation instead of relying on session cookies.
 *
 * Flow:
 * 1. Stripe redirects here with ?state=<token>
 * 2. We hash the token and find the matching attempt
 * 3. We retrieve the Stripe session status
 * 4. We update the database (user record + attempt record)
 * 5. We redirect to onboarding with fresh status
 *
 * IMPORTANT:
 * - This route MUST be public (no auth required)
 * - Database updates use service role, not user session
 * - State token validates the request, not the session cookie
 *
 * If validation fails, redirect to login with redirect param.
 */
export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl();
  const timestamp = Date.now();

  console.log("[identity/return] ===== STRIPE IDENTITY RETURN START =====");
  console.log("[identity/return] Timestamp:", timestamp);
  console.log("[identity/return] Request URL:", request.url);
  console.log("[identity/return] Base URL:", baseUrl);

  // 1. Get state token from query
  const { searchParams } = request.nextUrl;
  const stateToken = searchParams.get("state");

  if (!stateToken) {
    console.error("[identity/return] ERROR: No state token in URL");
    return redirectToLoginWithError(baseUrl, "missing_state");
  }

  console.log("[identity/return] State token received (length):", stateToken.length);

  // 2. Check configurations
  if (!isStripeIdentityConfigured()) {
    console.error("[identity/return] ERROR: Stripe not configured");
    return redirectToOnboardingWithError(baseUrl, "stripe_not_configured");
  }

  if (!isServiceRoleConfigured()) {
    console.error("[identity/return] ERROR: Database not configured");
    return redirectToOnboardingWithError(baseUrl, "db_not_configured");
  }

  // 3. Validate state token and find attempt
  console.log("[identity/return] Validating state token...");
  const validation = await validateStateTokenAndGetAttempt(stateToken);

  if (!validation.valid) {
    console.error("[identity/return] ERROR: State token validation failed");
    console.error("[identity/return] Expired:", validation.expired);

    if (validation.expired) {
      return redirectToOnboardingWithError(baseUrl, "token_expired");
    }
    return redirectToLoginWithError(baseUrl, "invalid_state");
  }

  const { attemptId, userId, sessionId } = validation;
  console.log("[identity/return] Validation successful:");
  console.log("[identity/return]   - Attempt ID:", attemptId);
  console.log("[identity/return]   - User ID:", userId);
  console.log("[identity/return]   - Session ID:", sessionId?.substring(0, 15) + "...");

  if (!userId || !sessionId) {
    console.error("[identity/return] ERROR: Missing user ID or session ID");
    return redirectToLoginWithError(baseUrl, "incomplete_attempt");
  }

  // 4. Mark attempt as consumed
  if (attemptId) {
    await markAttemptReturnConsumed(attemptId);
    console.log("[identity/return] Attempt marked as consumed");
  }

  // 5. Sync status from Stripe to database
  try {
    console.log("[identity/return] Syncing status from Stripe...");
    const syncResult = await syncIdentityStatusFromStripe(userId, sessionId);

    console.log("[identity/return] Sync complete:");
    console.log("[identity/return]   - Status:", syncResult.status);
    console.log("[identity/return]   - Updated:", syncResult.updated);
    console.log("[identity/return]   - Verified at:", syncResult.verifiedAt);

    // 6. Revalidate pages to clear cache
    console.log("[identity/return] Revalidating pages...");
    revalidatePath("/onboarding/landlord", "page");
    revalidatePath("/dashboard", "page");

  } catch (error) {
    console.error("[identity/return] ERROR syncing status:", error);
    // Continue to redirect even if sync fails - user can refresh
  }

  // 7. Redirect to onboarding
  console.log("[identity/return] ===== STRIPE IDENTITY RETURN END =====");
  console.log("[identity/return] Redirecting to onboarding...");

  const redirectUrl = new URL("/onboarding/landlord", baseUrl);
  redirectUrl.searchParams.set("step", "identity");
  redirectUrl.searchParams.set("synced", "true");
  redirectUrl.searchParams.set("t", String(timestamp));

  return NextResponse.redirect(redirectUrl);
}

/**
 * Redirect to login page with redirect back to onboarding.
 */
function redirectToLoginWithError(baseUrl: string, error: string): NextResponse {
  const loginUrl = new URL("/login", baseUrl);
  loginUrl.searchParams.set("redirect", "/onboarding/landlord?step=identity");
  if (error) {
    loginUrl.searchParams.set("error", error);
  }
  console.log("[identity/return] Redirecting to login:", loginUrl.toString());
  return NextResponse.redirect(loginUrl);
}

/**
 * Redirect to onboarding with error param.
 */
function redirectToOnboardingWithError(baseUrl: string, error: string): NextResponse {
  const url = new URL("/onboarding/landlord", baseUrl);
  url.searchParams.set("step", "identity");
  url.searchParams.set("error", error);
  console.log("[identity/return] Redirecting to onboarding with error:", url.toString());
  return NextResponse.redirect(url);
}
