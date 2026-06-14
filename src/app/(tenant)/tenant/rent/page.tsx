import { DollarSign } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SummaryCard } from "@/components/SummaryCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { StatusPill } from "@/components/StatusPill";
import { Card } from "@/components/ui/card";
import { getCurrentTenantId } from "@/lib/auth";
import { getTenantRent } from "@/lib/services/rent";
import { RENT_STATUS_STYLES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

function formatPeriod(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function TenantRentPage() {
  const tenantId = await getCurrentTenantId();
  const result = await getTenantRent(tenantId);

  if (result.error !== null) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rent" />
        <ErrorState title="Couldn't load your rent" message={result.error} />
      </div>
    );
  }

  const charges = result.data;
  const dueTotal = charges
    .filter((c) => c.status === "due" || c.status === "overdue")
    .reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rent"
        description="Your rent charges and their status."
      />

      {charges.length > 0 ? (
        <SummaryCard
          label="Outstanding balance"
          value={formatCurrency(dueTotal)}
          accentClassName={dueTotal > 0 ? "bg-amber-500" : "bg-emerald-500"}
        />
      ) : null}

      {charges.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="h-5 w-5" />}
          title="No rent charges"
          description="You don't have any rent charges yet."
        />
      ) : (
        <div className="space-y-3">
          {charges.map((c) => {
            const due = formatDate(c.due_date);
            return (
              <Card key={c.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">
                      {formatPeriod(c.period_start)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {due ? `Due ${due}` : "No due date"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-semibold text-slate-900">
                      {formatCurrency(c.amount)}
                    </span>
                    <StatusPill tone={RENT_STATUS_STYLES[c.status]} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
