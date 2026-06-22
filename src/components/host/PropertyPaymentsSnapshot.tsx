import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/StatusPill";
import { RENT_STATUS_STYLES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { RentChargeWithRefs } from "@/lib/services/rent";

function sumBy(
  charges: RentChargeWithRefs[],
  predicate: (c: RentChargeWithRefs) => boolean
): number {
  return charges
    .filter(predicate)
    .reduce((total, c) => total + Number(c.amount ?? 0), 0);
}

/** Property-scoped rent snapshot derived from real rent_charges. */
export function PropertyPaymentsSnapshot({
  charges,
}: {
  charges: RentChargeWithRefs[];
}) {
  return (
    <section id="payments" className="scroll-mt-24 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Rent &amp; Payments
        </h2>
        <Link
          href="/dashboard/rent"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Open ledger
        </Link>
      </div>

      {charges.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-sm font-medium text-slate-900">No rent charges yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Charges appear here once tenants are placed. Manage everything from{" "}
            <Link href="/dashboard/rent" className="text-indigo-600 hover:underline">
              Rent &amp; Payments
            </Link>
            .
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Totals */}
          <div className="grid grid-cols-2 gap-px border-b border-slate-100 bg-slate-100 sm:grid-cols-4">
            <Total label="Collected" value={sumBy(charges, (c) => c.status === "paid")} tone="text-emerald-600" />
            <Total label="Outstanding" value={sumBy(charges, (c) => c.status === "due")} tone="text-amber-600" />
            <Total label="Overdue" value={sumBy(charges, (c) => c.status === "overdue")} tone="text-red-600" />
            <Total label="Total billed" value={sumBy(charges, (c) => c.status !== "waived")} tone="text-slate-900" />
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {charges.slice(0, 6).map((c) => {
              const where = [c.tenant_name, c.bed_label].filter(Boolean).join(" · ");
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {where || "Rent charge"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatCurrency(c.amount)}
                      {c.due_date
                        ? ` · due ${new Date(c.due_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}`
                        : ""}
                    </p>
                  </div>
                  <StatusPill tone={RENT_STATUS_STYLES[c.status]} />
                </div>
              );
            })}
          </div>
          {charges.length > 6 && (
            <div className="border-t border-slate-100 p-3 text-center">
              <Link
                href="/dashboard/rent"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                View all {charges.length} charges
              </Link>
            </div>
          )}
        </Card>
      )}
    </section>
  );
}

function Total({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${tone}`}>{formatCurrency(value)}</p>
    </div>
  );
}
