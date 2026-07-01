import { DollarSign, Building, CreditCard, Banknote, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getProperties } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";
import { getCurrentOwnerId } from "@/lib/auth";
import {
  listRentCharges,
  listLandlordPayments,
  getLandlordPaymentStats,
  type PaymentWithRefs,
} from "@/lib/services/rent";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RentPage() {
  const ownerId = await getCurrentOwnerId();
  if (!ownerId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rent & Payments</h1>
          <p className="text-slate-500">Please sign in to view your rent and payments.</p>
        </div>
      </div>
    );
  }

  const propertiesResult = await getProperties();
  const properties = propertiesResult.data ?? [];

  // Show empty state if no properties
  if (properties.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rent & Payments</h1>
          <p className="text-slate-500">Track rent payments and manage charges across your properties.</p>
        </div>

        <Card className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Building className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">
            Create a property first
          </h2>
          <p className="mt-2 max-w-md text-slate-500">
            You need to create properties with beds and tenants before you can track rent payments.
            Go to Properties to get started.
          </p>
          <Link
            href="/dashboard/properties"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Go to Properties
          </Link>
        </Card>
      </div>
    );
  }

  // Fetch rent charges and payments
  const [chargesResult, paymentsResult, statsResult] = await Promise.all([
    listRentCharges({ ownerId }),
    listLandlordPayments(ownerId),
    getLandlordPaymentStats(ownerId),
  ]);

  const charges = chargesResult.error === null ? chargesResult.data : [];
  const payments = paymentsResult.error === null ? paymentsResult.data : [];
  const stats = statsResult.error === null ? statsResult.data : null;

  // Calculate stats from rent charges for expected/outstanding
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  let expectedThisMonth = 0;
  let collectedThisMonth = 0;
  let outstanding = 0;
  let overdue = 0;

  for (const charge of charges) {
    const dueDate = charge.due_date ? new Date(charge.due_date) : null;
    const amountCents = Math.round(Number(charge.amount) * 100);

    // Check if due this month
    if (dueDate && dueDate >= thisMonth && dueDate < nextMonth) {
      expectedThisMonth += amountCents;
      if (charge.status === "paid") {
        collectedThisMonth += amountCents;
      }
    }

    // Outstanding = due but not paid
    if (charge.status === "due" || charge.status === "overdue") {
      outstanding += amountCents;
    }

    // Overdue = past due date and not paid
    if (charge.status === "overdue" || (dueDate && dueDate < now && charge.status === "due")) {
      overdue += amountCents;
    }
  }

  // Show rent page with data
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rent & Payments</h1>
        <p className="text-slate-500">Track rent payments and manage charges across your properties.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Expected This Month" value={formatCurrency(expectedThisMonth / 100)} />
        <StatCard label="Collected" value={formatCurrency(collectedThisMonth / 100)} color="emerald" />
        <StatCard label="Outstanding" value={formatCurrency(outstanding / 100)} color="amber" />
        <StatCard label="Overdue" value={formatCurrency(overdue / 100)} color="red" />
      </div>

      {/* Stripe Connect Earnings Summary */}
      {stats && (stats.stripePaymentCount > 0 || stats.manualPaymentCount > 0) && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Earnings Summary</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Total Rent Collected</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatCurrency(stats.totalRentCents / 100)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {stats.stripePaymentCount + stats.manualPaymentCount} payment(s)
              </p>
            </div>
            <div className="rounded-lg bg-indigo-50 p-4">
              <p className="text-sm text-indigo-600">renta bed Fee (5%)</p>
              <p className="mt-1 text-2xl font-bold text-indigo-700">
                {formatCurrency(stats.totalHostFeeCents / 100)}
              </p>
              <p className="mt-1 text-xs text-indigo-400">
                {stats.stripePaymentCount} Stripe payment(s)
              </p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-4">
              <p className="text-sm text-emerald-600">Your Payout</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">
                {formatCurrency(stats.totalLandlordPayoutCents / 100)}
              </p>
              <p className="mt-1 text-xs text-emerald-500">
                After fees
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Payments List */}
      {payments.length > 0 ? (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Payments</h2>
          <div className="space-y-4">
            {payments.slice(0, 10).map((payment) => (
              <PaymentRow key={payment.id} payment={payment} />
            ))}
          </div>
          {payments.length > 10 && (
            <p className="mt-4 text-sm text-slate-500 text-center">
              Showing 10 of {payments.length} payments
            </p>
          )}
        </Card>
      ) : (
        <Card className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <DollarSign className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">
            No payments yet
          </h2>
          <p className="mt-2 max-w-md text-slate-500">
            When tenants pay rent via Stripe or you record manual payments, they will appear here
            with a breakdown of fees and your payout.
          </p>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color = "slate"
}: {
  label: string;
  value: string;
  color?: "slate" | "emerald" | "amber" | "red";
}) {
  const colorClasses = {
    slate: "text-slate-900",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-600",
  };

  return (
    <Card className="p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
    </Card>
  );
}

function PaymentRow({ payment }: { payment: PaymentWithRefs }) {
  const amountCents = Math.round(Number(payment.amount) * 100);
  const isStripe = payment.payment_provider === "stripe";
  const hostFeeCents = payment.host_fee_cents ?? 0;
  const landlordPayoutCents = payment.landlord_payout_cents ?? amountCents;

  const recordedDate = payment.recorded_at
    ? new Date(payment.recorded_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown";

  const periodLabel = payment.rent_charge_period_start
    ? new Date(payment.rent_charge_period_start).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex items-start gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      {/* Icon */}
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${
          isStripe ? "bg-indigo-50" : "bg-slate-100"
        }`}
      >
        {isStripe ? (
          <CreditCard className="h-5 w-5 text-indigo-600" />
        ) : (
          <Banknote className="h-5 w-5 text-slate-600" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-slate-900 truncate">
            {payment.tenant_name ?? "Unknown Tenant"}
          </p>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              isStripe
                ? "bg-indigo-100 text-indigo-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {isStripe ? "Stripe" : "Manual"}
          </span>
        </div>
        <p className="text-sm text-slate-500">
          {payment.property_name ?? "Unknown Property"}
          {periodLabel && ` • ${periodLabel}`}
        </p>
        <p className="text-xs text-slate-400 mt-1">Paid {recordedDate}</p>
      </div>

      {/* Amounts */}
      <div className="text-right">
        <p className="font-semibold text-slate-900">{formatCurrency(amountCents / 100)}</p>
        {isStripe && hostFeeCents > 0 && (
          <div className="mt-1 flex items-center justify-end gap-1 text-xs">
            <span className="text-slate-400">Fee:</span>
            <span className="text-indigo-600">-{formatCurrency(hostFeeCents / 100)}</span>
            <ArrowRight className="h-3 w-3 text-slate-400" />
            <span className="text-emerald-600 font-medium">
              {formatCurrency(landlordPayoutCents / 100)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
