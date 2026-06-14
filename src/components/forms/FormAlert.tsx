import { AlertCircle } from "lucide-react";
import type { ActionState } from "@/lib/actions/types";

/** Inline error banner for form-level action failures. */
export function FormAlert({ state }: { state: ActionState }) {
  if (state.status !== "error" || !state.message) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{state.message}</span>
    </div>
  );
}
