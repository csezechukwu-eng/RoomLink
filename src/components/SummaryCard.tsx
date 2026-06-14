import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  /** Optional accent dot color (e.g. for bed-status cards). */
  accentClassName?: string;
  className?: string;
}

export function SummaryCard({
  label,
  value,
  icon,
  accentClassName,
  className,
}: SummaryCardProps) {
  return (
    <Card className={cn("p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-500">
          {accentClassName ? (
            <span className={cn("h-2 w-2 rounded-full", accentClassName)} />
          ) : null}
          {label}
        </span>
        {icon ? <span className="text-slate-400">{icon}</span> : null}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        {value}
      </p>
    </Card>
  );
}
