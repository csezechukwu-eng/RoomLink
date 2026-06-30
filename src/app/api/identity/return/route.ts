import { NextResponse } from "next/server";
import { refreshIdentityStatusAction } from "@/lib/actions/identity";
import { getBaseUrl } from "@/lib/stripe/server";

/**
 * Identity verification return handler.
 *
 * After the user completes verification in Stripe's hosted UI,
 * they're redirected here. We refresh the status and redirect
 * back to the onboarding flow.
 */
export async function GET() {
  // Refresh status from Stripe
  await refreshIdentityStatusAction();

  // Redirect back to onboarding identity step
  return NextResponse.redirect(
    new URL("/onboarding/landlord?step=identity", getBaseUrl())
  );
}
