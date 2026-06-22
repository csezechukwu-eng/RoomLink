import Link from "next/link";
import { CalendarDays, ArrowRight, FileSignature } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/StatusPill";
import { APPLICATION_STATUS_STYLES, labelForCommuterStatus } from "@/lib/constants";
import type { ApplicationWithRefs } from "@/lib/services/applications";

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Applications scoped to one property. Real data only. */
export function PropertyApplicationsPanel({
  applications,
}: {
  applications: ApplicationWithRefs[];
}) {
  return (
    <section id="applications" className="scroll-mt-24 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Applications
        </h2>
        {applications.length > 0 && (
          <Link
            href="/dashboard/applications"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all
          </Link>
        )}
      </div>

      {applications.length === 0 ? (
        <Card className="p-5 text-sm text-slate-500">
          No applications for this property yet.
        </Card>
      ) : (
        <Card className="divide-y divide-slate-100">
          {applications.map((app) => {
            const where = [app.room_name, app.bed_label].filter(Boolean).join(" · ");
            const moveIn = formatDate(app.desired_move_in);
            return (
              <div
                key={app.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{app.full_name}</p>
                    <StatusPill tone={APPLICATION_STATUS_STYLES[app.status]} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {where && <span>{where}</span>}
                    {app.commuter_status && (
                      <span>{labelForCommuterStatus(app.commuter_status)}</span>
                    )}
                    {moveIn && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        Move-in {moveIn}
                      </span>
                    )}
                  </div>
                </div>
                {app.status === "approved" ? (
                  <Link
                    href={`/dashboard/applications/${app.id}#lease`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    <FileSignature className="h-3.5 w-3.5" />
                    Prepare Lease
                  </Link>
                ) : (
                  <Link
                    href={`/dashboard/applications/${app.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Review
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            );
          })}
        </Card>
      )}
    </section>
  );
}
