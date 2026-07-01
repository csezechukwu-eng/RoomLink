"use client";

import * as React from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { signUp } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { GoogleSignInButton, AuthDivider } from "@/components/auth/GoogleSignInButton";
import { AlertCircle, Loader2, Mail, Lock, User, CheckCircle, BedDouble } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating account...
        </>
      ) : (
        "Create Account"
      )}
    </Button>
  );
}

export default function TenantJoinPage() {
  const [error, setError] = React.useState<string | null>(null);
  const [emailSent, setEmailSent] = React.useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setEmailSent(false);
    // Add tenant role to the form data
    formData.set("role", "tenant");
    const result = await signUp(formData);
    if (result?.error) {
      if (result.error.includes("check your email")) {
        setEmailSent(true);
      } else {
        setError(result.error);
      }
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Card className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Check your email
            </h2>
            <p className="mt-2 text-slate-600">
              We&apos;ve sent you a confirmation link. Please check your email to
              verify your account.
            </p>
            <Link
              href="/signin"
              className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Return to login
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 mb-4">
            <BedDouble className="h-7 w-7 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Find Your Next Bed</h1>
          <p className="mt-2 text-slate-600">
            Create an account to browse listings and apply for beds
          </p>
        </div>

        <Card className="p-6">
          {/* Google Sign Up */}
          <GoogleSignInButton role="tenant" label="Sign up with Google" />

          <AuthDivider />

          <form action={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-slate-700"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Smith"
                  required
                  autoComplete="name"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password (min. 6 characters)"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-slate-500">
                Must be at least 6 characters
              </p>
            </div>

            <SubmitButton />

            <p className="text-center text-xs text-slate-500">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-indigo-600 hover:text-indigo-700">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-indigo-600 hover:text-indigo-700">
                Privacy Policy
              </Link>
            </p>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              Sign in
            </Link>
          </div>
        </Card>

        <p className="mt-6 text-center text-sm text-slate-500">
          Are you a property owner?{" "}
          <Link
            href="/hosting"
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            Become a host
          </Link>
        </p>
      </div>
    </div>
  );
}
