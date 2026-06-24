import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getAuthUser } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/auth";
import { getSubscriptionStatus } from "@/lib/actions/billing";
import { isStripeConfigured } from "@/lib/stripe/server";
import { BillingClient } from "./BillingClient";

export const dynamic = "force-dynamic";

interface SearchParams {
  success?: string;
  canceled?: string;
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Auth check
  if (!isDemoMode()) {
    const user = await getAuthUser();
    if (!user) redirect("/login");
  }

  const params = await searchParams;
  const showSuccess = params.success === "true";
  const showCanceled = params.canceled === "true";

  // Check Stripe configuration
  const stripeConfigured = isStripeConfigured();

  // Get subscription status
  const subscriptionData = await getSubscriptionStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Settings
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing & Subscription</h1>
        <p className="text-slate-500">
          Manage your Room Link subscription and payment methods.
        </p>
      </div>

      {/* Status Messages */}
      {showSuccess && (
        <Card className="border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">
            Stripe is confirming your subscription. This page will update after payment is confirmed.
          </p>
        </Card>
      )}

      {showCanceled && (
        <Card className="border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            Subscription checkout was canceled. You can try again when you&apos;re ready.
          </p>
        </Card>
      )}

      {/* Stripe Not Configured Warning */}
      {!stripeConfigured && (
        <Card className="border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            Stripe billing is not configured. Please contact support or check environment variables.
          </p>
        </Card>
      )}

      {/* Main Billing Content */}
      <Suspense fallback={<BillingLoadingSkeleton />}>
        <BillingClient
          subscriptionData={subscriptionData}
          stripeConfigured={stripeConfigured}
        />
      </Suspense>

      {/* Rent Collection Notice */}
      <Card className="border-blue-200 bg-blue-50 p-6">
        <h3 className="font-semibold text-blue-900">About Rent Collection</h3>
        <p className="mt-2 text-sm text-blue-700">
          Tenant rent collection is managed separately in{" "}
          <Link href="/dashboard/rent" className="font-medium underline hover:no-underline">
            Rent & Payments
          </Link>
          . Your Room Link subscription payment method does not need to be the same account that
          receives rent.
        </p>
      </Card>
    </div>
  );
}

function BillingLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-slate-200" />
          <div className="h-4 w-64 rounded bg-slate-200" />
          <div className="h-10 w-40 rounded bg-slate-200" />
        </div>
      </Card>
    </div>
  );
}
