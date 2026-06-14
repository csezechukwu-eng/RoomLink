"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormAlert } from "@/components/forms/FormAlert";
import { initialActionState } from "@/lib/actions/types";
import { submitApplicationAction } from "@/lib/actions/applications";

export function ApplyForm({ bedId }: { bedId: string }) {
  const [state, formAction] = useActionState(
    submitApplicationAction,
    initialActionState
  );
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="bed_id" value={bedId} />
      <FormAlert state={state} />

      <FormField label="Full name" htmlFor="full_name" required error={fieldErrors.full_name}>
        <Input
          id="full_name"
          name="full_name"
          placeholder="Jordan Pilot"
          aria-invalid={Boolean(fieldErrors.full_name)}
          autoFocus
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Email" htmlFor="email" required error={fieldErrors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(fieldErrors.email)}
          />
        </FormField>
        <FormField label="Phone" htmlFor="phone">
          <Input id="phone" name="phone" placeholder="704-555-0102" />
        </FormField>
      </div>

      <FormField label="Desired move-in" htmlFor="desired_move_in">
        <Input id="desired_move_in" name="desired_move_in" type="date" />
      </FormField>

      <FormField label="Message to the host" htmlFor="message">
        <Textarea
          id="message"
          name="message"
          placeholder="Tell the host a little about yourself, your schedule, and why this works for you."
        />
      </FormField>

      <SubmitButton pendingLabel="Submitting…" className="w-full sm:w-auto">
        Submit application
      </SubmitButton>
    </form>
  );
}
