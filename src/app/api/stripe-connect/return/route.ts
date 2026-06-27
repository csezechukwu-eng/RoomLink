import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { getCurrentOwnerId } from "@/lib/auth";
import { getAccountStatus } from "@/lib/stripe/connect";

/**
 * Stripe Connect Onboarding Return URL
 *
 * This route is called when the landlord completes or exits Stripe onboarding.
 * It syncs the latest account status and redirects to the settings page.
 */

export async function GET(request: NextRequest) {
  try {
    // 1. Get authenticated landlord
    const ownerId = await getCurrentOwnerId();

    if (!ownerId) {
      // Not authenticated - redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // 2. Get landlord's Stripe account ID
    const supabase = getServiceClient();
    const { data: user } = await supabase
      .from("users")
      .select("stripe_account_id")
      .eq("id", ownerId)
      .maybeSingle();

    const accountId = user?.stripe_account_id;

    if (accountId) {
      // 3. Sync status from Stripe
      try {
        const status = await getAccountStatus(accountId);

        // 4. Update database with latest status
        await supabase
          .from("users")
          .update({
            stripe_connect_charges_enabled: status.chargesEnabled,
            stripe_connect_payouts_enabled: status.payoutsEnabled,
            stripe_connect_details_submitted: status.detailsSubmitted,
            stripe_connect_onboarding_complete: status.onboardingComplete,
            stripe_connect_requirements_due: status.requirementsDue,
            stripe_connect_enabled: status.onboardingComplete,
            stripe_connect_last_synced_at: new Date().toISOString(),
          })
          .eq("id", ownerId);

        console.log("[stripe-connect/return] Synced status for account:", accountId);
      } catch (err) {
        console.error("[stripe-connect/return] Error syncing status:", err);
        // Continue to redirect even if sync fails
      }
    }

    // 5. Redirect to settings page with success message
    const settingsUrl = new URL("/dashboard/settings", request.url);
    settingsUrl.searchParams.set("tab", "pricing");
    settingsUrl.searchParams.set("connect", "returned");

    return NextResponse.redirect(settingsUrl);
  } catch (err) {
    console.error("[stripe-connect/return] Error:", err);

    // Redirect to settings even on error
    const settingsUrl = new URL("/dashboard/settings", request.url);
    settingsUrl.searchParams.set("tab", "pricing");
    settingsUrl.searchParams.set("connect", "error");

    return NextResponse.redirect(settingsUrl);
  }
}
