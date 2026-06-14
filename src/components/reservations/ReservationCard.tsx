import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/StatusPill";
import { InlineActionButton } from "@/components/forms/InlineActionButton";
import { markDepositPaidAction } from "@/lib/actions/reservations";
import {
  DEPOSIT_STATUS_STYLES,
  RESERVATION_STATUS_STYLES,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { ReservationWithRefs } from "@/lib/services/reservations";

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ReservationCard({
  reservation,
}: {
  reservation: ReservationWithRefs;
}) {
  const bedLine = [reservation.room_name, reservation.bed_label]
    .filter(Boolean)
    .join(" · ");
  const start = formatDate(reservation.start_date);

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold text-slate-900">
                {reservation.tenant_name ?? reservation.tenant_email ?? "Tenant"}
              </h3>
              <StatusPill tone={RESERVATION_STATUS_STYLES[reservation.status]} />
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {reservation.property_name}
              {bedLine ? ` · ${bedLine}` : ""}
              {start ? ` · from ${start}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Deposit</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(reservation.deposit_amount)}
            </span>
            <StatusPill tone={DEPOSIT_STATUS_STYLES[reservation.deposit_status]} />
          </div>
          {reservation.deposit_status === "unpaid" ? (
            <InlineActionButton
              action={markDepositPaidAction}
              fields={{ id: reservation.id }}
              variant="outline"
              pendingLabel="Saving…"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark deposit paid
            </InlineActionButton>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
