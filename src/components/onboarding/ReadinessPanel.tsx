"use client";

import { Check, Circle, AlertCircle } from "lucide-react";
import { STEPS, type StepKey } from "@/lib/onboarding/content";
import type { StepState, OnboardingReadiness } from "@/lib/onboarding/state";
import { cn } from "@/lib/utils";

interface ReadinessPanelProps {
  readiness: OnboardingReadiness;
  steps: StepState[];
}

/**
 * ReadinessPanel
 *
 * Shows three buckets of requirements:
 * - Required to publish
 * - Required to get paid
 * - Recommended
 */
export function ReadinessPanel({ readiness, steps }: ReadinessPanelProps) {
  // Build requirement lists from step statuses
  const publishRequired = STEPS
    .filter((s) => s.requirement === "publish")
    .map((s) => ({
      key: s.key,
      title: s.title,
      isComplete: steps.find((st) => st.key === s.key)?.status === "complete",
    }));

  const payoutRequired = STEPS
    .filter((s) => s.requirement === "payout")
    .map((s) => ({
      key: s.key,
      title: s.title,
      isComplete: steps.find((st) => st.key === s.key)?.status === "complete",
    }));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Readiness</h3>

      {/* Required to Publish */}
      <ReadinessSection
        title="Required to publish"
        isReady={readiness.publishReady}
        items={publishRequired}
        color="red"
      />

      {/* Required to Get Paid */}
      <ReadinessSection
        title="Required to get paid"
        isReady={readiness.payoutReady}
        items={payoutRequired}
        color="amber"
        className="mt-4"
      />

      {/* Recommended */}
      {readiness.recommendedRemaining > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm">
            <Circle className="h-3 w-3 text-slate-400" />
            <span className="text-slate-600">
              {readiness.recommendedRemaining} recommended item{readiness.recommendedRemaining !== 1 ? "s" : ""} remaining
            </span>
          </div>
        </div>
      )}

      {/* Overall Status */}
      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
        <StatusRow
          label="Publish ready"
          isReady={readiness.publishReady}
        />
        <StatusRow
          label="Payout ready"
          isReady={readiness.payoutReady}
        />
      </div>
    </div>
  );
}

interface ReadinessSectionProps {
  title: string;
  isReady: boolean;
  items: Array<{ key: StepKey; title: string; isComplete: boolean }>;
  color: "red" | "amber";
  className?: string;
}

function ReadinessSection({ title, isReady, items, color, className }: ReadinessSectionProps) {
  const colorClasses = {
    red: {
      badge: "bg-red-50 text-red-700",
      readyBadge: "bg-emerald-50 text-emerald-700",
    },
    amber: {
      badge: "bg-amber-50 text-amber-700",
      readyBadge: "bg-emerald-50 text-emerald-700",
    },
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {title}
        </span>
        <span
          className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded",
            isReady ? colorClasses[color].readyBadge : colorClasses[color].badge
          )}
        >
          {isReady ? "Ready" : "Incomplete"}
        </span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-2 text-sm">
            {item.isComplete ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <AlertCircle className={cn("h-3.5 w-3.5", color === "red" ? "text-red-400" : "text-amber-400")} />
            )}
            <span className={item.isComplete ? "text-slate-500" : "text-slate-700"}>
              {item.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusRow({ label, isReady }: { label: string; isReady: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span
        className={cn(
          "font-medium",
          isReady ? "text-emerald-600" : "text-slate-400"
        )}
      >
        {isReady ? "Yes" : "No"}
      </span>
    </div>
  );
}
