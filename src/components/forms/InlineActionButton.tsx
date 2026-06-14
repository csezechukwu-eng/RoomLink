"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { type ButtonProps } from "@/components/ui/button";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import { cn } from "@/lib/utils";

interface InlineActionButtonProps {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  children: React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  pendingLabel?: string;
  className?: string;
  /** Called on success (in addition to refreshing the route). */
  onDone?: () => void;
}

/** One-click form-backed action button (no confirm dialog). */
export function InlineActionButton({
  action,
  fields,
  children,
  variant = "outline",
  size = "sm",
  pendingLabel,
  className,
  onDone,
}: InlineActionButtonProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, initialActionState);

  React.useEffect(() => {
    if (state.status === "success") {
      router.refresh();
      onDone?.();
    }
  }, [state, router, onDone]);

  return (
    <form action={formAction} className="contents">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <SubmitButton
        variant={variant}
        size={size}
        pendingLabel={pendingLabel}
        className={className}
      >
        {children}
      </SubmitButton>
      {state.status === "error" && state.message ? (
        <span className={cn("text-xs font-medium text-red-600")}>
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
