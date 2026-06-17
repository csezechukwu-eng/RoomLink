"use client";

import * as React from "react";
import { useActionState } from "react";
import { FileText, Upload } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormAlert } from "@/components/forms/FormAlert";
import { initialActionState } from "@/lib/actions/types";
import { uploadLeaseDocument } from "@/lib/actions/leaseDocuments";
import { LEASE_TERM_OPTIONS } from "@/lib/leaseReadiness";

interface UploadLeaseModalProps {
  applicationId: string;
  defaults?: {
    title?: string;
    leaseStartDate?: string | null;
  };
}

export function UploadLeaseModal({ applicationId, defaults }: UploadLeaseModalProps) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState(uploadLeaseDocument, initialActionState);
  const [fileError, setFileError] = React.useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type !== "application/pdf") {
      setFileError("Only PDF files are accepted.");
    } else {
      setFileError(null);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" />
        Upload Lease PDF
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Upload lease document"
        description="Upload your lease PDF. We'll snapshot the current terms so later edits don't change this lease."
      >
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="application_id" value={applicationId} />
          <FormAlert state={state} />

          <FormField label="Lease title" htmlFor="lease-title" required>
            <Input
              id="lease-title"
              name="title"
              defaultValue={defaults?.title ?? "Lease Agreement"}
              placeholder="Lease Agreement"
            />
          </FormField>

          <FormField label="Lease PDF" htmlFor="lease-file" required error={fileError ?? undefined}>
            <input
              id="lease-file"
              name="file"
              type="file"
              accept="application/pdf"
              required
              onChange={onFileChange}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </FormField>

          <FormField label="Lease term type" htmlFor="lease-term">
            <Select id="lease-term" name="lease_term_type" defaultValue="short_term_bed">
              {LEASE_TERM_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Lease start date" htmlFor="lease-start">
              <Input
                id="lease-start"
                name="lease_start_date"
                type="date"
                defaultValue={defaults?.leaseStartDate ?? ""}
              />
            </FormField>
            <FormField label="Lease end date" htmlFor="lease-end">
              <Input id="lease-end" name="lease_end_date" type="date" />
            </FormField>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton>
              <FileText className="h-4 w-4" />
              Create lease document
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
