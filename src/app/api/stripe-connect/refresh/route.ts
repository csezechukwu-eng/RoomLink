import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
import { createOnboardingLink } from "@/lib/stripe/connect";

/**
 * Stripe Connect Onboarding Refresh URL
 *
 * This route is called when the Stripe onboarding link expires.
 * It creates a new onboarding link and redirects the landlord.
 */

export async function GET(request: NextRequest) {
  try {
    // 1. Get authenticated landlord
    const user = await getCurrentUser();

    if (!user) {
      // Not authenticated - redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const ownerId = user.id;

    // 2. Get landlord's Stripe account ID
    const supabase = getServiceClient();
    const { data: userData } = await supabase
      .from("users")
      .select("stripe_account_id")
      .eq("id", ownerId)
      .maybeSingle();

    const accountId = userData?.stripe_account_id;

    if (!accountId) {
      // No account - redirect to settings
      console.error("[stripe-connect/refresh] No account found for user:", ownerId);

      const settingsUrl = new URL("/dashboard/settings", request.url);
      settingsUrl.searchParams.set("tab", "pricing");
      settingsUrl.searchParams.set("connect", "no-account");

      return NextResponse.redirect(settingsUrl);
    }

    // 3. Create new onboarding link
    try {
      const result = await createOnboardingLink(accountId);

      console.log("[stripe-connect/refresh] Created new link for account:", accountId);

      // 4. Redirect to Stripe onboarding
      return NextResponse.redirect(result.url);
    } catch (err) {
      console.error("[stripe-connect/refresh] Error creating link:", err);

      // Redirect to settings with error
      const settingsUrl = new URL("/dashboard/settings", request.url);
      settingsUrl.searchParams.set("tab", "pricing");
      settingsUrl.searchParams.set("connect", "link-error");

      return NextResponse.redirect(settingsUrl);
    }
  } catch (err) {
    console.error("[stripe-connect/refresh] Error:", err);

    // Redirect to settings even on error
    const settingsUrl = new URL("/dashboard/settings", request.url);
    settingsUrl.searchParams.set("tab", "pricing");
    settingsUrl.searchParams.set("connect", "error");

    return NextResponse.redirect(settingsUrl);
  }
}
