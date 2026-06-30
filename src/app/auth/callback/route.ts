import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/server";

/**
 * Auth Callback Route
 *
 * Handles OAuth and email confirmation callbacks from Supabase Auth.
 * After authentication, checks onboarding status and redirects appropriately.
 *
 * Flow:
 * 1. Exchange auth code for session
 * 2. Ensure public.users row exists (create if missing)
 * 3. Check onboarding completion status
 * 4. Redirect to onboarding if incomplete, dashboard if complete
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (!code) {
    // No code provided - redirect to login
    console.error("[auth/callback] No code provided");
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  try {
    // Create Supabase client for auth code exchange
    let response = NextResponse.next({
      request: { headers: request.headers },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] Code exchange error:", error.message);
      return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
    }

    if (!data.user) {
      console.error("[auth/callback] No user returned after code exchange");
      return NextResponse.redirect(new URL("/login?error=no_user", request.url));
    }

    const userId = data.user.id;
    const email = data.user.email || "";
    const fullName = data.user.user_metadata?.full_name || null;

    // Ensure public.users row exists and check onboarding status
    let redirectUrl = next;

    if (isServiceRoleConfigured()) {
      const serviceClient = getServiceClient();

      // Check if user row exists
      const { data: existingUser, error: fetchError } = await serviceClient
        .from("users")
        .select("id, onboarding_completed_at")
        .eq("id", userId)
        .maybeSingle();

      if (fetchError) {
        console.error("[auth/callback] User fetch error:", fetchError);
        // Continue to onboarding on error - safer than dashboard
        redirectUrl = "/onboarding/landlord";
      } else if (!existingUser) {
        // Create user row - new signup
        console.log("[auth/callback] Creating new user row for:", userId);
        const { error: insertError } = await serviceClient
          .from("users")
          .insert({
            id: userId,
            email: email,
            full_name: fullName,
            role: "owner", // New signups are landlords
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error("[auth/callback] User insert error:", insertError);
        }

        // New user - redirect to onboarding
        redirectUrl = "/onboarding/landlord";
      } else {
        // User exists - check onboarding status
        if (existingUser.onboarding_completed_at) {
          // Onboarding complete - go to dashboard
          redirectUrl = "/dashboard";
        } else {
          // Onboarding incomplete - go to onboarding
          redirectUrl = "/onboarding/landlord";
        }
      }
    } else {
      // No service role - default to onboarding (safer)
      redirectUrl = "/onboarding/landlord";
    }

    console.log("[auth/callback] Redirecting to:", redirectUrl);

    // Create redirect response with cookies
    const redirectResponse = NextResponse.redirect(new URL(redirectUrl, request.url));

    // Copy cookies from the auth exchange response
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite as "lax" | "strict" | "none" | undefined,
        path: cookie.path,
        domain: cookie.domain,
        maxAge: cookie.maxAge,
        expires: cookie.expires,
      });
    });

    return redirectResponse;
  } catch (error) {
    console.error("[auth/callback] Unexpected error:", error);
    return NextResponse.redirect(new URL("/login?error=unexpected", request.url));
  }
}
