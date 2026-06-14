"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormAlert } from "@/components/forms/FormAlert";
import { MAINTENANCE_PRIORITIES } from "@/lib/constants";
import { initialActionState } from "@/lib/actions/types";
import { submitMaintenanceAction } from "@/lib/actions/maintenance";

export function TenantMaintenanceForm({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState(
    submitMaintenanceAction,
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
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New request
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Report an issue"
        description="Tell your host what needs fixing."
      >
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="property_id" value={propertyId} />
          <FormAlert state={state} />

          <FormField label="Title" htmlFor="mr-title" required error={fieldErrors.title}>
            <Input
              id="mr-title"
              name="title"
              placeholder="AC not cooling in Room A"
              aria-invalid={Boolean(fieldErrors.title)}
              autoFocus
            />
          </FormField>

          <FormField label="Priority" htmlFor="mr-priority" error={fieldErrors.priority}>
            <Select id="mr-priority" name="priority" defaultValue="normal">
              {MAINTENANCE_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Details" htmlFor="mr-description">
            <Textarea
              id="mr-description"
              name="description"
              rows={4}
              placeholder="Describe the issue, when it started, and anything else useful."
            />
          </FormField>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pendingLabel="Submitting…">Submit request</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
