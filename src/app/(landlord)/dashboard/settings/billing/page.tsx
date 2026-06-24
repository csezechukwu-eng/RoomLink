import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Check,
  Sparkles,
  Building2,
  Users,
  FileSignature,
  BarChart3,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { getLandlordBillingData } from "@/lib/auth";
import type { SubscriptionPlan, StripeSubscriptionStatus } from "@/lib/types";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const dynamic = "force-dynamic";

// Plan definitions with features
const PLANS: {
  id: SubscriptionPlan;
  name: string;
  price: number | null;
  priceLabel: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceLabel: "Free forever",
    description: "Get started with basic property management",
    features: [
      "Up to 5 beds",
      "Basic application tracking",
      "Manual rent tracking",
      "Email support",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: 29,
    priceLabel: "$29/month",
    description: "For small landlords getting started",
    features: [
      "Up to 25 beds",
      "Application management",
      "Digital lease signing",
      "Rent tracking & reminders",
      "Priority email support",
    ],
  },
  {
    id: "pro",
    name: "Professional",
    price: 99,
    priceLabel: "$99/month",
    description: "For growing property portfolios",
    features: [
      "Up to 100 beds",
      "All Starter features",
      "Advanced reporting",
      "Team member access",
      "API access",
      "Phone support",
    ],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    priceLabel: "Custom pricing",
    description: "For large property management companies",
    features: [
      "Unlimited beds",
      "All Professional features",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantees",
      "On-site training",
    ],
  },
];

function getStatusBadge(status: StripeSubscriptionStatus | null): {
  label: string;
  className: string;
} {
  switch (status) {
    case "active":
      return { label: "Active", className: "bg-emerald-100 text-emerald-700" };
    case "trialing":
      return { label: "Trial", className: "bg-blue-100 text-blue-700" };
    case "past_due":
      return { label: "Past Due", className: "bg-amber-100 text-amber-700" };
    case "canceled":
      return { label: "Canceled", className: "bg-slate-100 text-slate-700" };
    case "unpaid":
      return { label: "Unpaid", className: "bg-red-100 text-red-700" };
    case "paused":
      return { label: "Paused", className: "bg-slate-100 text-slate-700" };
    default:
      return { label: "Free", className: "bg-slate-100 text-slate-700" };
  }
}

export default async function BillingPage() {
  const billingData = await getLandlordBillingData();
  if (!billingData) redirect("/login");

  const currentPlan = billingData.subscription_plan || "free";
  const subscriptionStatus = billingData.stripe_subscription_status as StripeSubscriptionStatus | null;
  const periodEnd = billingData.stripe_current_period_end;
  const cancelAtPeriodEnd = billingData.stripe_cancel_at_period_end;
  const statusBadge = getStatusBadge(subscriptionStatus);

  const currentPlanData = PLANS.find((p) => p.id === currentPlan) || PLANS[0];

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

      {/* Current Plan */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Current Plan</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge.className}`}
              >
                {statusBadge.label}
              </span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-indigo-600">{currentPlanData.name}</p>
              <p className="text-sm text-slate-500">{currentPlanData.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">
              {currentPlanData.price !== null ? `$${currentPlanData.price}` : "Custom"}
              {currentPlanData.price !== null && (
                <span className="text-sm font-normal text-slate-500">/mo</span>
              )}
            </p>
            {periodEnd && (
              <p className="mt-1 text-sm text-slate-500">
                {cancelAtPeriodEnd ? "Cancels" : "Renews"} {formatDate(periodEnd)}
              </p>
            )}
          </div>
        </div>

        {cancelAtPeriodEnd && subscriptionStatus === "active" && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your subscription is set to cancel at the end of the billing period. You&apos;ll
            continue to have access until {periodEnd ? formatDate(periodEnd) : "the end of your billing period"}.
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            disabled
          >
            Manage Subscription
          </button>
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            disabled
          >
            View Invoices
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Subscription management coming soon. Contact support for billing changes.
        </p>
      </Card>

      {/* Plan Comparison */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Available Plans</h2>
        <div className="grid gap-6 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            return (
              <Card
                key={plan.id}
                className={`relative p-5 ${
                  plan.highlighted
                    ? "border-2 border-indigo-500 shadow-lg"
                    : "border-slate-200"
                } ${isCurrent ? "bg-indigo-50" : ""}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white">
                      <Sparkles className="h-3 w-3" />
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {plan.price !== null ? `$${plan.price}` : "Custom"}
                    {plan.price !== null && plan.price > 0 && (
                      <span className="text-sm font-normal text-slate-500">/mo</span>
                    )}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{plan.description}</p>
                </div>
                <ul className="mb-6 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isCurrent
                      ? "bg-slate-200 text-slate-500 cursor-default"
                      : plan.highlighted
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                  disabled={isCurrent}
                >
                  {isCurrent
                    ? "Current Plan"
                    : plan.price === null
                      ? "Contact Sales"
                      : plan.price > (currentPlanData.price || 0)
                        ? "Upgrade"
                        : "Downgrade"}
                </button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Features Overview */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">What&apos;s Included</h2>
        <p className="mt-1 text-sm text-slate-500">
          All plans include these core features to manage your properties.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
              <Building2 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Property Management</p>
              <p className="text-sm text-slate-500">Track rooms, beds, and occupancy</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Tenant Applications</p>
              <p className="text-sm text-slate-500">Review and manage applications</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <FileSignature className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Digital Leases</p>
              <p className="text-sm text-slate-500">E-sign leases in-app</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Reporting</p>
              <p className="text-sm text-slate-500">Track income and occupancy</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Method Placeholder */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Payment Method</h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage how you pay for your Room Link subscription.
            </p>
          </div>
          <button
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            disabled
          >
            <CreditCard className="h-4 w-4" />
            Add Payment Method
          </button>
        </div>
        {currentPlan === "free" ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
            <Zap className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm text-slate-500">
              No payment method required for the free plan.
            </p>
            <p className="text-sm text-slate-500">
              Add a payment method when you&apos;re ready to upgrade.
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm text-slate-500">
              Payment method management coming soon.
            </p>
          </div>
        )}
      </Card>

      {/* Stripe Connect Notice */}
      <Card className="border-blue-200 bg-blue-50 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
            <CreditCard className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">Rent Collection (Coming Soon)</h3>
            <p className="mt-1 text-sm text-blue-700">
              Soon you&apos;ll be able to collect rent payments directly from tenants using Stripe
              Connect. This is separate from your Room Link subscription billing.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
