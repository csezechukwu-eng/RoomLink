"use server";

import { redirect } from "next/navigation";
import { createAuthenticatedClient, getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/stripe/server";

export type AuthActionResult = {
  error?: string;
};

/**
 * Check if a user has completed landlord onboarding.
 * Returns the appropriate redirect URL.
 */
async function getPostAuthRedirect(userId: string): Promise<string> {
  if (!isServiceRoleConfigured()) {
    // Default to onboarding if we can't check
    return "/onboarding/landlord";
  }

  try {
    const supabase = getServiceClient();
    const { data: userData, error } = await supabase
      .from("users")
      .select("onboarding_completed_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[getPostAuthRedirect] Error:", error);
      return "/onboarding/landlord";
    }

    // If no user row or onboarding not complete, go to onboarding
    if (!userData || !userData.onboarding_completed_at) {
      return "/onboarding/landlord";
    }

    // Onboarding complete - go to dashboard
    return "/dashboard";
  } catch (err) {
    console.error("[getPostAuthRedirect] Unexpected error:", err);
    return "/onboarding/landlord";
  }
}

export async function signUp(formData: FormData): Promise<AuthActionResult> {
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

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
    const emailRedirectTo = `${baseUrl}/auth/callback`;

    console.log("[signUp] Email redirect URL:", emailRedirectTo);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
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

  // Redirect to onboarding on success (new landlord signups start onboarding)
  redirect("/onboarding/landlord");
}

export async function signIn(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  let userId: string | null = null;

  try {
    const supabase = await createAuthenticatedClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
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
  } catch (err) {
    console.error("Signin error:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }

  // Determine redirect based on onboarding status
  const redirectUrl = userId ? await getPostAuthRedirect(userId) : "/onboarding/landlord";
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
