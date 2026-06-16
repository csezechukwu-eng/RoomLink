import Link from "next/link";
import {
  AlertTriangle,
  ClipboardList,
  Wrench,
  CalendarCheck,
  Image as ImageIcon,
  BedDouble,
  DollarSign,
  Ban,
  CheckCircle2,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  SEVERITY_META,
  type AttentionIssue,
  type IssueSeverity,
} from "@/lib/needsAttention";

const KIND_ICONS: Record<AttentionIssue["kind"], LucideIcon> = {
  rent_overdue: DollarSign,
  maintenance_open: Wrench,
  bed_unavailable: Ban,
  application_pending: ClipboardList,
  bed_reserved: CalendarCheck,
  property_no_photos: ImageIcon,
  room_no_beds: BedDouble,
  bed_no_photos: ImageIcon,
  bed_missing_rent: DollarSign,
  bed_missing_deposit: DollarSign,
};

const GROUP_ORDER: IssueSeverity[] = ["urgent", "review", "setup"];
const MAX_PER_GROUP = 6;

export function NeedsAttentionPanel({ issues }: { issues: AttentionIssue[] }) {
  const grouped = GROUP_ORDER.map((severity) => ({
    severity,
    items: issues.filter((i) => i.severity === severity),
  })).filter((g) => g.items.length > 0);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div>
          <h2 className="text-base font-semibold text-slate-900">Needs Attention</h2>
          <p className="text-sm text-slate-500">Property-specific items to review.</p>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="mt-5 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          <p className="mt-3 text-sm font-medium text-slate-900">All set</p>
          <p className="mt-1 text-sm text-slate-500">
            No issues found for this property.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {grouped.map((group) => {
            const meta = SEVERITY_META[group.severity];
            const shown = group.items.slice(0, MAX_PER_GROUP);
            const remaining = group.items.length - shown.length;
            return (
              <div key={group.severity}>
                <div className="mb-2 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {meta.label}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    {group.items.length}
                  </span>
                </div>
                <ul className="space-y-2">
                  {shown.map((issue) => (
                    <IssueRow key={issue.id} issue={issue} />
                  ))}
                </ul>
                {remaining > 0 && (
                  <p className="mt-2 pl-1 text-xs text-slate-400">
                    +{remaining} more
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function IssueRow({ issue }: { issue: AttentionIssue }) {
  const Icon = KIND_ICONS[issue.kind];
  const isInternal = issue.href?.startsWith("#");

  const body = (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:border-slate-300 hover:bg-slate-50">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{issue.title}</p>
        <p className="truncate text-xs text-slate-500">{issue.description}</p>
        {issue.location && (
          <p className="mt-0.5 truncate text-xs font-medium text-slate-400">
            {issue.location}
          </p>
        )}
      </div>
      {issue.href && (
        <span className="inline-flex shrink-0 items-center gap-1 self-center text-xs font-semibold text-indigo-600">
          {issue.actionLabel}
          <ArrowRight className="h-3 w-3" />
        </span>
      )}
    </div>
  );

  if (!issue.href) return <li>{body}</li>;

  return (
    <li>
      {isInternal ? (
        <a href={issue.href}>{body}</a>
      ) : (
        <Link href={issue.href}>{body}</Link>
      )}
    </li>
  );
}
