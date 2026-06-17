import { notFound, redirect } from "next/navigation";
import { getServiceClient } from "@/lib/supabase/server";
import type { Lease } from "@/lib/types";
import { SignLeaseForm } from "./SignLeaseForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ leaseId: string }>;
}

async function getLease(leaseId: string): Promise<Lease | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("leases")
    .select("*")
    .eq("id", leaseId)
    .maybeSingle();
  return (data as Lease) ?? null;
}

async function getPropertyName(propertyId: string): Promise<string> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("properties")
    .select("name, address, city, state")
    .eq("id", propertyId)
    .maybeSingle();
  if (!data) return "Property";
  return data.name || [data.address, data.city, data.state].filter(Boolean).join(", ") || "Property";
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function SignLeasePage({ params }: Props) {
  const { leaseId } = await params;
  const lease = await getLease(leaseId);

  if (!lease) {
    notFound();
  }

  // Already signed - show confirmation
  if (lease.tenant_signed_at) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Already Signed</h1>
          <p className="mt-2 text-slate-600">
            You have already signed this lease agreement on {formatDate(lease.tenant_signed_at)}.
          </p>
          {lease.status === "completed" && (
            <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
              This lease is fully executed. Both parties have signed.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Lease not in signable state
  if (lease.status !== "sent" && lease.status !== "delivered") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Lease Not Available</h1>
          <p className="mt-2 text-slate-600">
            This lease is not currently available for signing. Please contact your landlord.
          </p>
        </div>
      </div>
    );
  }

  const propertyName = await getPropertyName(lease.property_id);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
              RL
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Room Link</h1>
              <p className="text-sm text-slate-500">Lease Agreement</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Hello, {lease.tenant_name || "Tenant"}
          </h2>
          <p className="mt-2 text-slate-600">
            Please review the lease agreement below and sign to complete.
          </p>
        </div>

        {/* Lease Details Card */}
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Lease Agreement Details</h3>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Property</p>
              <p className="font-medium text-slate-900">{propertyName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Tenant</p>
              <p className="font-medium text-slate-900">{lease.tenant_name || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Monthly Rent</p>
              <p className="font-medium text-slate-900">{formatCurrency(lease.monthly_rent)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Security Deposit</p>
              <p className="font-medium text-slate-900">{formatCurrency(lease.deposit_amount)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Lease Start</p>
              <p className="font-medium text-slate-900">{formatDate(lease.lease_start)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Lease End</p>
              <p className="font-medium text-slate-900">{formatDate(lease.lease_end)}</p>
            </div>
          </div>

          {/* Landlord Signature */}
          {lease.landlord_signature_data && (
            <div className="mt-6 border-t border-slate-100 pt-6">
              <p className="text-sm text-slate-500">Landlord Signature</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="rounded-lg bg-slate-50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={lease.landlord_signature_data}
                    alt="Landlord signature"
                    className="h-12 object-contain"
                  />
                </div>
                <div className="text-sm text-slate-500">
                  Signed {formatDate(lease.landlord_signed_at)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sign Form */}
        <SignLeaseForm leaseId={lease.id} tenantName={lease.tenant_name || "Tenant"} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-3xl px-4 text-center text-sm text-slate-500">
          <p>By signing this agreement, you agree to the terms and conditions of the lease.</p>
          <p className="mt-2">Room Link &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
