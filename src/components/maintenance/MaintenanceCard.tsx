import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/StatusPill";
import { InlineStatusSelect } from "@/components/forms/InlineStatusSelect";
import { setMaintenanceStatusAction } from "@/lib/actions/maintenance";
import {
  MAINTENANCE_PRIORITY_STYLES,
  MAINTENANCE_STATUS_STYLES,
  MAINTENANCE_STATUSES,
} from "@/lib/constants";
import type { MaintenanceWithRefs } from "@/lib/services/maintenance";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MaintenanceCard({
  request,
  editable = false,
  showTenant = false,
}: {
  request: MaintenanceWithRefs;
  /** Landlord view: allow changing the status inline. */
  editable?: boolean;
  showTenant?: boolean;
}) {
  const where = [request.room_name, request.bed_label].filter(Boolean).join(" · ");

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-medium text-slate-900">{request.title}</h3>
              <StatusPill tone={MAINTENANCE_PRIORITY_STYLES[request.priority]} />
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {request.property_name}
              {where ? ` · ${where}` : ""}
              {showTenant && request.tenant_name ? ` · ${request.tenant_name}` : ""}
              {` · ${formatDate(request.created_at)}`}
            </p>
          </div>
          {editable ? (
            <InlineStatusSelect
              action={setMaintenanceStatusAction}
              fields={{ id: request.id }}
              name="status"
              value={request.status}
              options={MAINTENANCE_STATUSES}
              ariaLabel="Set maintenance status"
            />
          ) : (
            <StatusPill tone={MAINTENANCE_STATUS_STYLES[request.status]} />
          )}
        </div>
        {request.description ? (
          <p className="text-sm text-slate-600">{request.description}</p>
        ) : null}
      </div>
    </Card>
  );
}
