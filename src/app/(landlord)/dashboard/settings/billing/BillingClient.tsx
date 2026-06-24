"use client";

import { useState, useTransition } from "react";
import {
  CreditCard,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Receipt,
  Settings,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  createRoomLinkSubscriptionCheckout,
  createRoomLinkBillingPortalSession,
} from "@/lib/actions/billing";

interface SubscriptionData {
  hasSubscription: boolean;
  subscription: {
    status: string | null;
    plan: string | null;
    priceId?: string | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
    startedAt?: string | null;
    canceledAt?: string | null;
  } | null;
  stripeCustomerId: string | null;
  error: string | null;
}

interface BillingClientProps {
  subscriptionData: SubscriptionData;
  stripeConfigured: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
  active: { label: "Active", icon: CheckCircle, className: "text-emerald-600 bg-emerald-50" },
  trialing: { label: "Trial", icon: Clock, className: "text-blue-600 bg-blue-50" },
  past_due: { label: "Past Due", icon: AlertCircle, className: "text-amber-600 bg-amber-50" },
  unpaid: { label: "Unpaid", icon: AlertCircle, className: "text-red-600 bg-red-50" },
  canceled: { label: "Canceled", icon: XCircle, className: "text-slate-600 bg-slate-100" },
  incomplete: { label: "Incomplete", icon: Clock, className: "text-amber-600 bg-amber-50" },
  incomplete_expired: { label: "Expired", icon: XCircle, className: "text-red-600 bg-red-50" },
  paused: { label: "Paused", icon: Clock, className: "text-slate-600 bg-slate-100" },
};

const PLAN_DETAILS: Record<string, { name: string; price: string; features: string[] }> = {
  free: {
    name: "Free",
    price: "$0/month",
    features: ["Up to 5 beds", "Basic features"],
  },
  starter: {
    name: "Starter",
    price: "$29/month",
    features: ["Up to 25 beds", "Digital lease signing", "Email support"],
  },
  pro: {
    name: "Professional",
    price: "$99/month",
    features: ["Up to 100 beds", "All features", "Priority support", "API access"],
  },
  enterprise: {
    name: "Enterprise",
    price: "Custom",
    features: ["Unlimited beds", "Custom integrations", "Dedicated support"],
  },
};

export function BillingClient({ subscriptionData, stripeConfigured }: BillingClientProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { hasSubscription, subscription, stripeCustomerId } = subscriptionData;
  const status = subscription?.status || null;
  const plan = subscription?.plan || "free";
  const planDetails = PLAN_DETAILS[plan] || PLAN_DETAILS.free;
  const statusConfig = status ? STATUS_CONFIG[status] : null;

  const needsAttention = status === "past_due" || status === "unpaid" || status === "canceled";

  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  async function handleStartSubscription() {
    setError(null);
    startTransition(async () => {
      const result = await createRoomLinkSubscriptionCheckout();
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        setError(result.error || "Failed to start checkout");
      }
    });
  }

  async function handleManageBilling() {
    setError(null);
    startTransition(async () => {
      const result = await createRoomLinkBillingPortalSession();
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        setError(result.error || "Failed to open billing portal");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </Card>
      )}

      {/* Current Subscription Section */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Current Subscription</h2>
            <div className="mt-4 space-y-3">
              {/* Plan Name */}
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-indigo-600">{planDetails.name}</span>
                {statusConfig && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
                  >
                    <statusConfig.icon className="h-3.5 w-3.5" />
                    {statusConfig.label}
                  </span>
                )}
              </div>

              {/* Price */}
              <p className="text-xl font-semibold text-slate-900">{planDetails.price}</p>

              {/* Period Info */}
              {hasSubscription && subscription?.currentPeriodEnd && (
                <p className="text-sm text-slate-500">
                  {subscription.cancelAtPeriodEnd ? "Cancels" : "Renews"}{" "}
                  {formatDate(subscription.currentPeriodEnd)}
                </p>
              )}

              {/* Cancel at period end warning */}
              {subscription?.cancelAtPeriodEnd && status === "active" && (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Your subscription is set to cancel at the end of the billing period.
                </div>
              )}
            </div>
          </div>

          {/* Status Icon */}
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              hasSubscription ? "bg-indigo-100" : "bg-slate-100"
            }`}
          >
            <CreditCard className={`h-6 w-6 ${hasSubscription ? "text-indigo-600" : "text-slate-400"}`} />
          </div>
        </div>

        {/* Needs Attention Alert */}
        {needsAttention && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">
                Your Room Link subscription needs attention.
              </p>
            </div>
          </div>
        )}

        {/* No Subscription Message */}
        {!hasSubscription && !needsAttention && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center">
            <Zap className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 font-medium text-slate-900">No active subscription</p>
            <p className="text-sm text-slate-500">
              Start your Room Link subscription to access all landlord management tools.
            </p>
          </div>
        )}
      </Card>

      {/* Payment Method Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Payment Method</h2>
        <p className="mt-1 text-sm text-slate-500">Managed securely by Stripe</p>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
          {stripeCustomerId ? (
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Payment method on file
                </p>
                <p className="text-xs text-slate-500">
                  Manage your payment method through the billing portal
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <CreditCard className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-sm text-slate-500">No payment method on file yet</p>
            </div>
          )}
        </div>
      </Card>

      {/* Billing Actions Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Billing Actions</h2>
        <p className="mt-1 text-sm text-slate-500">Manage your subscription and payments</p>

        <div className="mt-6 flex flex-wrap gap-3">
          {/* Start Subscription Button */}
          {(!hasSubscription || needsAttention) && stripeConfigured && (
            <button
              onClick={handleStartSubscription}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Start Subscription
            </button>
          )}

          {/* Manage Billing Button */}
          {stripeCustomerId && (
            <button
              onClick={handleManageBilling}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Settings className="h-4 w-4" />
              )}
              Manage Billing
            </button>
          )}

          {/* View Invoices Button */}
          {stripeCustomerId && (
            <button
              onClick={handleManageBilling}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Receipt className="h-4 w-4" />
              )}
              View Invoices
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </button>
          )}
        </div>

        {!stripeConfigured && (
          <p className="mt-4 text-sm text-slate-500">
            Stripe billing is not configured. Please contact support.
          </p>
        )}
      </Card>

      {/* Plan Features */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Plan Features</h2>
        <p className="mt-1 text-sm text-slate-500">What&apos;s included in your {planDetails.name} plan</p>

        <ul className="mt-4 space-y-2">
          {planDetails.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              {feature}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
