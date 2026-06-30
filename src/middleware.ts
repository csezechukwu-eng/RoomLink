import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware to protect landlord routes and handle auth sessions.
 *
 * Protected routes:
 * - /dashboard and all sub-routes
 *
 * Public routes (always accessible):
 * - / (landing)
 * - /availability and sub-routes
 * - /apply and sub-routes
 * - /login
 * - /signup
 * - Static assets and Next.js internals
 */

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/onboarding"];

// Routes that authenticated users should not access (redirect to dashboard)
const AUTH_ROUTES = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, Next.js internals, and auth routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") || // Auth callback handles its own flow
    pathname.includes(".") // Static files like images, fonts, etc.
  ) {
    return NextResponse.next();
  }

  // DEMO MODE — bypass authentication when DEMO_MODE=true is set.
  // This allows viewing the dashboard without logging in for testing purposes.
  if (process.env.DEMO_MODE === "true") {
    return NextResponse.next();
  }

  // Create a response to modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client for middleware
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
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if needed (important for keeping sessions alive)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;

  // Check if route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if it's an auth route (login/signup)
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth routes
  // Send to onboarding first - it will redirect to dashboard if already complete
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/onboarding/landlord", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
