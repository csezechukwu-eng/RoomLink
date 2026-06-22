import { LogIn, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatShortDate } from "@/lib/bedAvailability";
import { splitRoster } from "@/lib/tenantOps";
import type { RosterEntry } from "@/lib/services/tenants";

/**
 * Turnover board: who's scheduled to move in, and who's leaving soon.
 * Derived from active reservations' start/end dates.
 */
export function MoveBoard({
  entries,
  showProperty = false,
}: {
  entries: RosterEntry[];
  showProperty?: boolean;
}) {
  const { movingIn, movingOut } = splitRoster(entries);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Column
        icon={<LogIn className="h-4 w-4 text-emerald-600" />}
        title="Moving in"
        empty="No scheduled move-ins."
        entries={movingIn}
        dateOf={(e) => e.startDate}
        showProperty={showProperty}
      />
      <Column
        icon={<LogOut className="h-4 w-4 text-amber-600" />}
        title="Moving out soon"
        empty="No upcoming move-outs."
        entries={movingOut}
        dateOf={(e) => e.endDate}
        showProperty={showProperty}
      />
    </div>
  );
}

function Column({
  icon,
  title,
  empty,
  entries,
  dateOf,
  showProperty,
}: {
  icon: React.ReactNode;
  title: string;
  empty: string;
  entries: RosterEntry[];
  dateOf: (e: RosterEntry) => string | null;
  showProperty: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="text-xs font-medium text-slate-400">{entries.length}</span>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li
              key={e.reservationId}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {e.tenantName ?? "Unknown tenant"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {[
                    showProperty ? e.propertyName : null,
                    [e.roomName, e.bedLabel].filter(Boolean).join(" · "),
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-slate-600">
                {formatShortDate(dateOf(e)) ?? "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
