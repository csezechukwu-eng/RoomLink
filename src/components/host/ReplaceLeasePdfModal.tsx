"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormAlert } from "@/components/forms/FormAlert";
import { initialActionState } from "@/lib/actions/types";
import { replaceLeasePdf } from "@/lib/actions/leaseDocuments";

export function ReplaceLeasePdfModal({ leaseDocumentId }: { leaseDocumentId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState(replaceLeasePdf, initialActionState);

  React.useEffect(() => {
    if (open && state.status === "success") {
      setOpen(false);
      router.refresh();
    }
  }, [state, open, router]);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <RefreshCw className="h-4 w-4" />
        Replace PDF
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Replace lease PDF">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={leaseDocumentId} />
          <FormAlert state={state} />
          <FormField label="New lease PDF" htmlFor="replace-file" required>
            <input
              id="replace-file"
              name="file"
              type="file"
              accept="application/pdf"
              required
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </FormField>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pendingLabel="Uploading…">Replace PDF</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
