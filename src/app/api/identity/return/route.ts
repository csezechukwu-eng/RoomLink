import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/stripe/server";
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
 */
export async function GET() {
  const baseUrl = getBaseUrl();

  // Get authenticated user
  const authUser = await getAuthUser();
  if (!authUser) {
    console.error("[identity/return] User not authenticated - redirecting to login");
    const loginUrl = new URL("/login", baseUrl);
    loginUrl.searchParams.set("redirect", "/onboarding/landlord?step=identity");
    return NextResponse.redirect(loginUrl);
  }

  const ownerId = authUser.id;
  console.log("[identity/return] Processing return for user:", ownerId);

  // Check configurations
  if (!isStripeIdentityConfigured()) {
    console.error("[identity/return] Stripe Identity not configured");
    return NextResponse.redirect(
      new URL("/onboarding/landlord?step=identity&error=stripe_not_configured", baseUrl)
    );
  }

  if (!isServiceRoleConfigured()) {
    console.error("[identity/return] Service role not configured");
    return NextResponse.redirect(
      new URL("/onboarding/landlord?step=identity&error=db_not_configured", baseUrl)
    );
  }

  try {
    const supabase = getServiceClient();

    // Get stored session ID for this user
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("identity_verification_session_id")
      .eq("id", ownerId)
      .maybeSingle();

    if (fetchError) {
      console.error("[identity/return] Failed to fetch user data:", fetchError);
      return NextResponse.redirect(
        new URL("/onboarding/landlord?step=identity&error=fetch_failed", baseUrl)
      );
    }

    const sessionId = userData?.identity_verification_session_id;
    if (!sessionId) {
      console.log("[identity/return] No verification session found for user");
      return NextResponse.redirect(
        new URL("/onboarding/landlord?step=identity", baseUrl)
      );
    }

    console.log("[identity/return] Fetching status for session:", sessionId);

    // Fetch status from Stripe
    const stripeStatus = await getIdentityVerificationStatus(sessionId);
    console.log("[identity/return] Stripe returned status:", stripeStatus.status);

    // Update database with the status
    const updateData: Record<string, unknown> = {
      verification_status: stripeStatus.status,
    };

    if (stripeStatus.status === "verified") {
      updateData.identity_verified_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", ownerId);

    if (updateError) {
      console.error("[identity/return] Failed to update user status:", updateError);
      // Continue to redirect anyway - status can be refreshed later
    } else {
      console.log("[identity/return] Successfully updated status to:", stripeStatus.status);
    }

    // Revalidate pages to pick up the new status
    revalidatePath("/onboarding/landlord");
    revalidatePath("/dashboard");

  } catch (error) {
    console.error("[identity/return] Error processing return:", error);
    // Continue to redirect - the webhook will eventually update the status
  }

  // Redirect back to onboarding identity step
  return NextResponse.redirect(
    new URL("/onboarding/landlord?step=identity", baseUrl)
  );
}
