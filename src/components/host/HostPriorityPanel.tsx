import Link from "next/link";
import {
  AlertTriangle,
  ClipboardList,
  Wrench,
  CalendarCheck,
  CheckCircle2,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DashboardMetrics } from "@/lib/types";

interface PriorityItem {
  icon: LucideIcon;
  tone: "red" | "amber" | "blue";
  label: string;
  href: string;
}

const TONES: Record<PriorityItem["tone"], { bg: string; text: string }> = {
  red: { bg: "bg-red-50", text: "text-red-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
};

/**
 * "Today's Priorities" — only renders items that are backed by real,
 * non-zero data. Falls back to a positive empty state when all clear.
 */
export function HostPriorityPanel({ metrics }: { metrics: DashboardMetrics }) {
  const items: PriorityItem[] = [];

  if (metrics.overdueRent > 0) {
    items.push({
      icon: AlertTriangle,
      tone: "red",
      label: `${metrics.overdueRent} ${
        metrics.overdueRent === 1 ? "rent charge is" : "rent charges are"
      } overdue`,
      href: "/dashboard/rent",
    });
  }
  if (metrics.pendingApplications > 0) {
    items.push({
      icon: ClipboardList,
      tone: "amber",
      label: `${metrics.pendingApplications} ${
        metrics.pendingApplications === 1 ? "application" : "applications"
      } waiting for review`,
      href: "/dashboard/applications",
    });
  }
  if (metrics.openMaintenance > 0) {
    items.push({
      icon: Wrench,
      tone: "blue",
      label: `${metrics.openMaintenance} open maintenance ${
        metrics.openMaintenance === 1 ? "request" : "requests"
      }`,
      href: "/dashboard/maintenance",
    });
  }
  if (metrics.beds.reserved > 0) {
    items.push({
      icon: CalendarCheck,
      tone: "amber",
      label: `${metrics.beds.reserved} reserved ${
        metrics.beds.reserved === 1 ? "bed needs" : "beds need"
      } move-in confirmation`,
      href: "/dashboard/reservations",
    });
  }

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Today&apos;s Priorities</h2>
      <p className="mt-0.5 text-sm text-slate-500">
        Items that need your attention right now.
      </p>

      {items.length === 0 ? (
        <div className="mt-5 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          <p className="mt-3 text-sm font-medium text-slate-900">All caught up</p>
          <p className="mt-1 text-sm text-slate-500">
            No urgent items right now.
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {items.map((item, i) => {
            const Icon = item.icon;
            const tone = TONES[item.tone];
            return (
              <li key={i}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-3 py-3 transition-colors"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.bg}`}
                  >
                    <Icon className={`h-4 w-4 ${tone.text}`} />
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-700 group-hover:text-slate-900">
                    {item.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-500" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
