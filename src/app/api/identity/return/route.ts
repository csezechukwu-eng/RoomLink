import { NextResponse, NextRequest } from "next/server";
import { getBaseUrl, getUrlConfigDiagnostics } from "@/lib/stripe/server";
import { getAuthUser } from "@/lib/supabase/server";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/server";
import { getIdentityVerificationStatus, isStripeIdentityConfigured } from "@/lib/stripe/identity";
import { revalidatePath } from "next/cache";

/**
 * Identity verification return handler.
 *
 * After the user completes verification in Stripe's hosted UI,
 * they're redirected here. We refresh the status from Stripe,
 * update the database, and redirect back to the onboarding flow.
 *
 * CRITICAL: This route must:
 * 1. Authenticate the user from session cookies
 * 2. Find their Stripe Identity session ID
 * 3. Fetch latest status from Stripe
 * 4. Update Supabase
 * 5. Add refresh_status=true to trigger UI refresh
 */
export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl();
  const timestamp = Date.now();

  console.log("[identity/return] ===== STRIPE IDENTITY RETURN START =====");
  console.log("[identity/return] Timestamp:", timestamp);
  console.log("[identity/return] Request URL:", request.url);
  console.log("[identity/return] URL Config:", getUrlConfigDiagnostics());
  console.log("[identity/return] Base URL:", baseUrl);

  // Log cookie information (names only for security)
  const cookieNames = request.cookies.getAll().map(c => c.name);
  console.log("[identity/return] Cookies present:", cookieNames);
  console.log("[identity/return] Has sb-access-token:", cookieNames.some(n => n.includes("sb-") && n.includes("auth-token")));

  // Get authenticated user
  const authUser = await getAuthUser();
  if (!authUser) {
    console.error("[identity/return] FAILED: User not authenticated");
    console.error("[identity/return] Cookie count:", cookieNames.length);
    console.error("[identity/return] Supabase cookies:", cookieNames.filter(n => n.startsWith("sb-")));
    console.error("[identity/return] This likely means:");
    console.error("[identity/return]   1. Session expired, OR");
    console.error("[identity/return]   2. Cookie domain mismatch (original login was on different domain), OR");
    console.error("[identity/return]   3. Cookies not sent by browser");
    const loginUrl = new URL("/login", baseUrl);
    loginUrl.searchParams.set("redirect", "/onboarding/landlord?step=identity");
    console.log("[identity/return] Redirecting to:", loginUrl.toString());
    return NextResponse.redirect(loginUrl);
  }

  const ownerId = authUser.id;
  console.log("[identity/return] Authenticated user ID:", ownerId);
  console.log("[identity/return] User email:", authUser.email);

  // Check configurations
  if (!isStripeIdentityConfigured()) {
    console.error("[identity/return] FAILED: Stripe Identity not configured (STRIPE_SECRET_KEY missing)");
    return NextResponse.redirect(
      new URL("/onboarding/landlord?step=identity&error=stripe_not_configured", baseUrl)
    );
  }
  console.log("[identity/return] Stripe Identity: configured");

  if (!isServiceRoleConfigured()) {
    console.error("[identity/return] FAILED: Service role not configured (SUPABASE_SERVICE_ROLE_KEY missing)");
    return NextResponse.redirect(
      new URL("/onboarding/landlord?step=identity&error=db_not_configured", baseUrl)
    );
  }
  console.log("[identity/return] Supabase service role: configured");

  let finalStatus = "unverified";

  try {
    const supabase = getServiceClient();

    // Get stored session ID for this user
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("identity_verification_session_id, verification_status")
      .eq("id", ownerId)
      .maybeSingle();

    if (fetchError) {
      console.error("[identity/return] FAILED to fetch user data:", fetchError);
      return NextResponse.redirect(
        new URL("/onboarding/landlord?step=identity&error=fetch_failed&refresh_status=true", baseUrl)
      );
    }

    console.log("[identity/return] Current DB status:", userData?.verification_status);
    console.log("[identity/return] Session ID exists:", !!userData?.identity_verification_session_id);

    const sessionId = userData?.identity_verification_session_id;
    if (!sessionId) {
      console.log("[identity/return] No verification session found - user may not have started verification");
      return NextResponse.redirect(
        new URL("/onboarding/landlord?step=identity&refresh_status=true", baseUrl)
      );
    }

    console.log("[identity/return] Fetching Stripe status for session:", sessionId.substring(0, 10) + "...");

    // Fetch status from Stripe
    const stripeStatus = await getIdentityVerificationStatus(sessionId);
    console.log("[identity/return] Stripe API returned:");
    console.log("[identity/return]   - status:", stripeStatus.status);
    console.log("[identity/return]   - lastError:", stripeStatus.lastError);

    finalStatus = stripeStatus.status;

    // Update database with the status
    const updateData: Record<string, unknown> = {
      verification_status: stripeStatus.status,
    };

    if (stripeStatus.status === "verified") {
      updateData.identity_verified_at = new Date().toISOString();
      console.log("[identity/return] Setting identity_verified_at timestamp");
    }

    console.log("[identity/return] Updating database with:", updateData);

    const { error: updateError, data: updateResult } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", ownerId)
      .select("verification_status");

    if (updateError) {
      console.error("[identity/return] FAILED to update database:", updateError);
      console.error("[identity/return] Error code:", updateError.code);
      console.error("[identity/return] Error message:", updateError.message);
    } else {
      console.log("[identity/return] SUCCESS: Database updated");
      console.log("[identity/return] Updated row verification_status:", updateResult?.[0]?.verification_status);
    }

    // Force revalidate to clear any cached data
    console.log("[identity/return] Revalidating paths...");
    revalidatePath("/onboarding/landlord", "page");
    revalidatePath("/dashboard", "page");

  } catch (error) {
    console.error("[identity/return] EXCEPTION:", error);
    if (error instanceof Error) {
      console.error("[identity/return] Error name:", error.name);
      console.error("[identity/return] Error message:", error.message);
    }
  }

  console.log("[identity/return] ===== STRIPE IDENTITY RETURN END =====");
  console.log("[identity/return] Final status:", finalStatus);

  // Redirect with refresh_status=true to signal UI to refresh
  const redirectUrl = new URL("/onboarding/landlord", baseUrl);
  redirectUrl.searchParams.set("step", "identity");
  redirectUrl.searchParams.set("refresh_status", "true");
  redirectUrl.searchParams.set("t", String(timestamp)); // Cache buster

  return NextResponse.redirect(redirectUrl);
}
