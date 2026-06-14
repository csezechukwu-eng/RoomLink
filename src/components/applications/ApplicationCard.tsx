import { Mail, Phone, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/StatusPill";
import { ApplicationActions } from "@/components/applications/ApplicationActions";
import { APPLICATION_STATUS_STYLES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { ApplicationWithRefs } from "@/lib/services/applications";

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ApplicationCard({ application }: { application: ApplicationWithRefs }) {
  const bedLine = [application.room_name, application.bed_label]
    .filter(Boolean)
    .join(" · ");
  const moveIn = formatDate(application.desired_move_in);

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold text-slate-900">
                {application.full_name}
              </h3>
              <StatusPill tone={APPLICATION_STATUS_STYLES[application.status]} />
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {application.property_name}
              {bedLine ? ` · ${bedLine}` : ""}
              {application.monthly_rent !== null
                ? ` · ${formatCurrency(application.monthly_rent)}/mo`
                : ""}
            </p>
          </div>
          {application.status === "pending" ? (
            <ApplicationActions applicationId={application.id} />
          ) : null}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            {application.email}
          </span>
          {application.phone ? (
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              {application.phone}
            </span>
          ) : null}
          {moveIn ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
              Move-in {moveIn}
            </span>
          ) : null}
        </div>

        {application.message ? (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            “{application.message}”
          </p>
        ) : null}
      </div>
    </Card>
  );
}
