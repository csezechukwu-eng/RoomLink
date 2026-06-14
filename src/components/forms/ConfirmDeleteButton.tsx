"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormAlert } from "@/components/forms/FormAlert";
import { initialActionState, type ActionState } from "@/lib/actions/types";

interface ConfirmDeleteButtonProps {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  title: string;
  description: string;
  confirmLabel?: string;
  triggerLabel?: string;
  iconOnly?: boolean;
  triggerSize?: "sm" | "md" | "icon";
  triggerVariant?: "outline" | "ghost" | "danger";
}

export function ConfirmDeleteButton({
  action,
  fields,
  title,
  description,
  confirmLabel = "Delete",
  triggerLabel = "Delete",
  iconOnly,
  triggerSize = "md",
  triggerVariant = "ghost",
}: ConfirmDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState(action, initialActionState);

  // Success closes the dialog + refreshes. (Property delete redirects instead.)
  React.useEffect(() => {
    if (open && state.status === "success") {
      setOpen(false);
      router.refresh();
    }
  }, [state, open, router]);

  return (
    <>
      <Button
        variant={triggerVariant}
        size={iconOnly ? "icon" : triggerSize}
        onClick={() => setOpen(true)}
        aria-label={iconOnly ? triggerLabel : undefined}
        className={triggerVariant === "ghost" ? "text-red-600 hover:bg-red-50" : undefined}
      >
        <Trash2 className="h-4 w-4" />
        {!iconOnly && triggerLabel}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        <form action={formAction} className="space-y-4">
          {Object.entries(fields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}

          <FormAlert state={state} />
          <p className="text-sm text-slate-600">{description}</p>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <SubmitButton variant="danger" pendingLabel="Deleting…">
              {confirmLabel}
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
