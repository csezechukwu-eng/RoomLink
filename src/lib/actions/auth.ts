"use server";

import { redirect } from "next/navigation";
import { createAuthenticatedClient } from "@/lib/supabase/server";

export type AuthActionResult = {
  error?: string;
};

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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
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

  // Redirect to dashboard on success
  redirect("/dashboard");
}

export async function signIn(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const supabase = await createAuthenticatedClient();

    const { error } = await supabase.auth.signInWithPassword({
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
  } catch (err) {
    console.error("Signin error:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }

  // Redirect to dashboard on success
  redirect("/dashboard");
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
