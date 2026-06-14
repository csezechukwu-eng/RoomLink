import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/StatusPill";
import { InlineStatusSelect } from "@/components/forms/InlineStatusSelect";
import { setRentChargeStatusAction } from "@/lib/actions/rent";
import { RENT_STATUS_STYLES, RENT_STATUSES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { RentChargeWithRefs } from "@/lib/services/rent";

function formatPeriod(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
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

export function RentCard({ charge }: { charge: RentChargeWithRefs }) {
  const due = formatDate(charge.due_date);
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-900">
              {charge.tenant_name ?? "Tenant"}
            </p>
            <StatusPill tone={RENT_STATUS_STYLES[charge.status]} />
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            {formatPeriod(charge.period_start)}
            {charge.bed_label ? ` · ${charge.bed_label}` : ""}
            {due ? ` · due ${due}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-slate-900">
            {formatCurrency(charge.amount)}
          </span>
          <InlineStatusSelect
            action={setRentChargeStatusAction}
            fields={{ id: charge.id }}
            name="status"
            value={charge.status}
            options={RENT_STATUSES}
            ariaLabel="Set rent status"
          />
        </div>
      </div>
    </Card>
  );
}
