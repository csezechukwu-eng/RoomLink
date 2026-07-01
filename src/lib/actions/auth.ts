"use server";

import { redirect } from "next/navigation";
import { createAuthenticatedClient, getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/stripe/server";

export type AuthActionResult = {
  error?: string;
};

/**
 * Check if a user has completed onboarding based on their role.
 * Returns the appropriate redirect URL.
 */
async function getPostAuthRedirect(userId: string): Promise<string> {
  if (!isServiceRoleConfigured()) {
    // Default to landlord onboarding if we can't check
    return "/onboarding/landlord";
  }

  try {
    const supabase = getServiceClient();
    const { data: userData, error } = await supabase
      .from("users")
      .select("role, onboarding_completed_at, tenant_onboarding_completed_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[getPostAuthRedirect] Error:", error);
      return "/onboarding/landlord";
    }

    // If no user row, default to landlord onboarding
    if (!userData) {
      return "/onboarding/landlord";
    }

    // Check user role and redirect accordingly
    if (userData.role === "tenant") {
      // Tenant flow
      if (!userData.tenant_onboarding_completed_at) {
        return "/onboarding/tenant";
      }
      // Tenant onboarding complete - go to tenant dashboard/availability
      return "/tenant";
    } else {
      // Landlord flow (default)
      if (!userData.onboarding_completed_at) {
        return "/onboarding/landlord";
      }
      // Landlord onboarding complete - go to dashboard
      return "/dashboard";
    }
  } catch (err) {
    console.error("[getPostAuthRedirect] Unexpected error:", err);
    return "/onboarding/landlord";
  }
}

export async function signUp(formData: FormData): Promise<AuthActionResult> {
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) || "landlord"; // Default to landlord for backwards compatibility

  if (!fullName || !email || !password) {
    return { error: "All fields are required" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  try {
    const supabase = await createAuthenticatedClient();

    // Get base URL for email confirmation redirect
    const baseUrl = getBaseUrl();
    // Redirect to appropriate onboarding based on role
    const onboardingPath = role === "tenant" ? "/onboarding/tenant" : "/onboarding/landlord";
    const emailRedirectTo = `${baseUrl}/auth/callback?redirect=${encodeURIComponent(onboardingPath)}`;

    console.log("[signUp] Role:", role);
    console.log("[signUp] Email redirect URL:", emailRedirectTo);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
        emailRedirectTo,
      },
    });

    if (error) {
      // Handle specific Supabase auth errors
      if (error.message.includes("already registered")) {
        return { error: "An account with this email already exists" };
      }
      return { error: error.message };
    }

    if (!data.user) {
      return { error: "Failed to create account. Please try again." };
    }

    // If email confirmation is required, inform the user
    if (data.user && !data.session) {
      return { error: "Please check your email to confirm your account" };
    }
  } catch (err) {
    console.error("Signup error:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }

  // Redirect to appropriate onboarding on success
  const redirectPath = role === "tenant" ? "/onboarding/tenant" : "/onboarding/landlord";
  redirect(redirectPath);
}

export async function signIn(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectParam = formData.get("redirect") as string | null;
  const source = formData.get("source") as string | null; // "tenant" if from tenant login page

  console.log("[signIn] ===== SIGN IN START =====");
  console.log("[signIn] Email:", email);
  console.log("[signIn] Redirect param received:", redirectParam);
  console.log("[signIn] Source:", source);

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  let userId: string | null = null;

  try {
    const supabase = await createAuthenticatedClient();

    console.log("[signIn] Attempting authentication...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[signIn] Auth error:", error.message);
      // Handle specific Supabase auth errors
      if (error.message.includes("Invalid login credentials")) {
        return { error: "Invalid email or password" };
      }
      if (error.message.includes("Email not confirmed")) {
        return { error: "Please confirm your email before signing in" };
      }
      return { error: error.message };
    }

    userId = data.user?.id || null;
    console.log("[signIn] Authentication successful, user ID:", userId);

    // If logging in from tenant login page, update user role to tenant
    if (source === "tenant" && userId && isServiceRoleConfigured()) {
      const serviceClient = getServiceClient();
      await serviceClient
        .from("users")
        .update({ role: "tenant" })
        .eq("id", userId);
      console.log("[signIn] Updated user role to tenant");
    }
  } catch (err) {
    console.error("[signIn] Unexpected error:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }

  // If a redirect was specified and it's a valid internal path, use it
  if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
    console.log("[signIn] ===== REDIRECTING TO PARAM =====");
    console.log("[signIn] Redirect destination:", redirectParam);
    redirect(redirectParam);
  }

  // If logging in from tenant page, go to tenant flow
  if (source === "tenant") {
    const redirectUrl = userId ? await getPostAuthRedirect(userId) : "/onboarding/tenant";
    console.log("[signIn] ===== REDIRECTING TENANT =====");
    console.log("[signIn] Tenant redirect:", redirectUrl);
    redirect(redirectUrl);
  }

  // Otherwise, determine redirect based on onboarding status
  const redirectUrl = userId ? await getPostAuthRedirect(userId) : "/onboarding/landlord";
  console.log("[signIn] ===== REDIRECTING TO DEFAULT =====");
  console.log("[signIn] Default redirect:", redirectUrl);
  redirect(redirectUrl);
}

export async function signOut(): Promise<void> {
  try {
    const supabase = await createAuthenticatedClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Signout error:", err);
  }

  redirect("/login");
}

/**
 * Initiate Google OAuth sign-in flow
 */
export async function signInWithGoogle(role: "landlord" | "tenant" = "landlord"): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = await createAuthenticatedClient();
    const baseUrl = getBaseUrl();

    // Set redirect based on role
    const onboardingPath = role === "tenant" ? "/onboarding/tenant" : "/onboarding/landlord";
    const redirectTo = `${baseUrl}/auth/callback?redirect=${encodeURIComponent(onboardingPath)}`;

    console.log("[signInWithGoogle] Role:", role);
    console.log("[signInWithGoogle] Redirect URL:", redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("[signInWithGoogle] Error:", error.message);
      return { error: error.message };
    }

    if (data.url) {
      return { url: data.url };
    }

    return { error: "Failed to get OAuth URL" };
  } catch (err) {
    console.error("[signInWithGoogle] Unexpected error:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
