"use client";

import { Lightbulb } from "lucide-react";

interface StepHintSlotProps {
  /** Hint text from content.ts - renders nothing when empty */
  hint: string;
  /** Optional custom title */
  title?: string;
}

/**
 * StepHintSlot
 *
 * Renders a hint box styled like the "Why we ask?" box in MultiStepApplyForm.
 * Renders nothing when hint is empty string — Part 2 will fill in hints.
 */
export function StepHintSlot({ hint, title = "Why we ask?" }: StepHintSlotProps) {
  // Render nothing when hint is empty
  if (!hint || hint.trim() === "") {
    return null;
  }

  return (
    <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-indigo-700">
        <Lightbulb className="h-4 w-4" />
        {title}
      </div>
      <p className="mt-2 text-xs text-indigo-600">
        {hint}
      </p>
    </div>
  );
}
