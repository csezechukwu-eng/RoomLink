import { notFound } from "next/navigation";
import { getPreparedLeaseForSigning } from "@/lib/services/preparedLeases";
import { SignAgreementForm } from "./SignAgreementForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ leaseId: string }>;
  searchParams: Promise<{ token?: string }>;
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

export default async function SignAgreementPage({ params, searchParams }: Props) {
  const { leaseId } = await params;
  const { token } = await searchParams;
  const result = await getPreparedLeaseForSigning(leaseId);
  const lease = result.error === null ? result.data : null;

  // Require the document's signing token
  if (!lease || !token || token !== lease.signing_token) notFound();

  const tenantName = lease.tenant_name || "Tenant";

  // Already signed by tenant.
  if (lease.tenant_signed_at) {
    return (
      <CenteredCard tone="emerald" title="Already signed">
        You signed this agreement on {formatDate(lease.tenant_signed_at)}.
        <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          Your monthly stay agreement is complete. The host has been notified.
        </p>
      </CenteredCard>
    );
  }

  // Not in a signable state.
  if (!["sent", "viewed"].includes(lease.status)) {
    return (
      <CenteredCard tone="amber" title="Agreement not available">
        This agreement isn&apos;t currently available for signing. Please contact your
        host.
      </CenteredCard>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">
              rb
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">renta bed</h1>
              <p className="text-sm text-slate-500">Monthly Stay Agreement</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Hello, {tenantName}</h2>
          <p className="mt-2 text-slate-600">
            Please review the agreement details below and sign to confirm your monthly stay.
          </p>
        </div>

        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Agreement details</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Detail label="Property" value={lease.property_name ?? "—"} />
            <Detail
              label="Room / Bed"
              value={
                [lease.room_snapshot?.name, lease.bed_snapshot?.label]
                  .filter(Boolean)
                  .join(" · ") || "—"
              }
            />
            <Detail label="Monthly rent" value={formatCurrency(lease.monthly_rent_snapshot)} />
            <Detail label="Security deposit" value={formatCurrency(lease.deposit_amount_snapshot)} />
            <Detail label="Move-in date" value={formatDate(lease.lease_start_date)} />
            <Detail label="Agreement ref" value={lease.lease_reference_number} />
          </div>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 mb-8">
          <h3 className="font-semibold text-indigo-900">Monthly Stay Terms</h3>
          <ul className="mt-3 space-y-2 text-sm text-indigo-700">
            <li>• This is a 30-day minimum monthly stay agreement</li>
            <li>• Rent is due monthly at the start of each period</li>
            <li>• Security deposit is refundable per agreement terms</li>
            <li>• By signing, you agree to the terms of this monthly stay</li>
          </ul>
        </div>

        <SignAgreementForm leaseId={lease.id} token={token} tenantName={tenantName} />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-3xl px-4 text-center text-sm text-slate-500">
          <p>By signing, you agree to the terms of this monthly stay agreement.</p>
          <p className="mt-2">renta bed &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-medium text-slate-900">{value}</p>
    </div>
  );
}

function CenteredCard({
  tone,
  title,
  children,
}: {
  tone: "emerald" | "amber";
  title: string;
  children: React.ReactNode;
}) {
  const ring =
    tone === "emerald" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600";
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${ring}`}>
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <div className="mt-2 text-slate-600">{children}</div>
      </div>
    </div>
  );
}
