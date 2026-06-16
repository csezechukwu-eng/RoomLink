import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/StatusPill";
import {
  MAINTENANCE_PRIORITY_STYLES,
  MAINTENANCE_STATUS_STYLES,
} from "@/lib/constants";
import type { MaintenanceWithRefs } from "@/lib/services/maintenance";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Property-scoped maintenance requests. Real data only. */
export function PropertyMaintenanceSnapshot({
  requests,
}: {
  requests: MaintenanceWithRefs[];
}) {
  return (
    <section id="maintenance" className="scroll-mt-24 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Maintenance
        </h2>
        {requests.length > 0 && (
          <Link
            href="/dashboard/maintenance"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all
          </Link>
        )}
      </div>

      {requests.length === 0 ? (
        <Card className="p-5 text-sm text-slate-500">
          No maintenance requests for this property.
        </Card>
      ) : (
        <Card className="divide-y divide-slate-100">
          {requests.map((req) => {
            const where = [req.room_name, req.bed_label].filter(Boolean).join(" · ");
            return (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{req.title}</p>
                    <StatusPill tone={MAINTENANCE_PRIORITY_STYLES[req.priority]} />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {where ? `${where} · ` : ""}
                    {formatDate(req.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill tone={MAINTENANCE_STATUS_STYLES[req.status]} />
                  <Link
                    href="/dashboard/maintenance"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </section>
  );
}
