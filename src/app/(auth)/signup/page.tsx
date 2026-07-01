"use client";

import * as React from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { signUp } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertCircle, Loader2, Mail, Lock, User, CheckCircle } from "lucide-react";

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

export default function SignupPage() {
  const [error, setError] = React.useState<string | null>(null);
  const [emailSent, setEmailSent] = React.useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setEmailSent(false);
    const result = await signUp(formData);
    if (result?.error) {
      // Check if it's a "check your email" message (not really an error)
      if (result.error.includes("check your email")) {
        setEmailSent(true);
      } else {
        setError(result.error);
      }
    }
  }

  if (emailSent) {
    return (
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
            href="/login"
            className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Return to login
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Become a Host</h1>
        <p className="mt-2 text-slate-600">
          Create your host account to list and manage your rental property
        </p>
      </div>

      <Card className="p-6">
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
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
