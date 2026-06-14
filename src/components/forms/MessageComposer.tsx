"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { initialActionState, type ActionState } from "@/lib/actions/types";

interface MessageComposerProps {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  placeholder?: string;
}

/** Compact message input used by both landlord and tenant threads. */
export function MessageComposer({
  action,
  fields,
  placeholder = "Write a message…",
}: MessageComposerProps) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(action, initialActionState);

  React.useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} ref={formRef} className="flex flex-col gap-2">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <Textarea name="body" rows={2} placeholder={placeholder} required />
      {state.status === "error" && state.message ? (
        <p className="text-xs font-medium text-red-600">{state.message}</p>
      ) : null}
      <div className="flex justify-end">
        <SubmitButton size="sm" pendingLabel="Sending…">
          <Send className="h-4 w-4" />
          Send
        </SubmitButton>
      </div>
    </form>
  );
}
