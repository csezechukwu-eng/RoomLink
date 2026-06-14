"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Select } from "@/components/ui/select";
import { initialActionState, type ActionState } from "@/lib/actions/types";

interface InlineStatusSelectProps {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  /** Hidden fields sent with the form (e.g. id). */
  fields: Record<string, string>;
  /** Name of the status field the select controls. */
  name: string;
  value: string;
  options: { value: string; label: string }[];
  ariaLabel: string;
  className?: string;
}

/** A small dropdown that submits a status change on change. */
export function InlineStatusSelect({
  action,
  fields,
  name,
  value,
  options,
  ariaLabel,
  className,
}: InlineStatusSelectProps) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    action,
    initialActionState
  );

  React.useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} ref={formRef} className="relative">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <Select
        name={name}
        defaultValue={value}
        disabled={isPending}
        aria-label={ariaLabel}
        className={className ?? "h-9 text-xs"}
        onChange={() => formRef.current?.requestSubmit()}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      {isPending ? (
        <Loader2 className="pointer-events-none absolute right-8 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-slate-400" />
      ) : null}
    </form>
  );
}
