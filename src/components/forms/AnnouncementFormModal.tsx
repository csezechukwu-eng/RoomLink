"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormAlert } from "@/components/forms/FormAlert";
import { initialActionState } from "@/lib/actions/types";
import { createAnnouncementAction } from "@/lib/actions/announcements";

export function AnnouncementFormModal({
  properties,
}: {
  properties: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState(
    createAnnouncementAction,
    initialActionState
  );
  const fieldErrors = state.fieldErrors ?? {};

  React.useEffect(() => {
    if (open && state.status === "success") {
      setOpen(false);
      router.refresh();
    }
  }, [state, open, router]);

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={properties.length === 0}>
        <Megaphone className="h-4 w-4" />
        New announcement
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New announcement"
        description="Posted to everyone connected to the selected property."
      >
        <form action={formAction} className="space-y-4">
          <FormAlert state={state} />

          <FormField
            label="Property"
            htmlFor="ann-property"
            required
            error={fieldErrors.property_id}
          >
            <Select id="ann-property" name="property_id" defaultValue={properties[0]?.id ?? ""}>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Title" htmlFor="ann-title" required error={fieldErrors.title}>
            <Input
              id="ann-title"
              name="title"
              placeholder="Parking + new linens"
              aria-invalid={Boolean(fieldErrors.title)}
              autoFocus
            />
          </FormField>

          <FormField label="Message" htmlFor="ann-body" required error={fieldErrors.body}>
            <Textarea
              id="ann-body"
              name="body"
              rows={5}
              placeholder="Share an update with your tenants…"
              aria-invalid={Boolean(fieldErrors.body)}
            />
          </FormField>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pendingLabel="Sending…">Send announcement</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
