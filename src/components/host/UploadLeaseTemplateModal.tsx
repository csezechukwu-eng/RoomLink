"use client";

import * as React from "react";
import { useActionState } from "react";
import { FileText, Upload } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormAlert } from "@/components/forms/FormAlert";
import { initialActionState } from "@/lib/actions/types";
import { uploadLeaseTemplate } from "@/lib/actions/leaseTemplates";
import {
  LEASE_CATEGORY_OPTIONS,
  STAY_TYPE_OPTIONS,
} from "@/lib/leaseTemplateOptions";

interface Property {
  id: string;
  name: string;
}

interface UploadLeaseTemplateModalProps {
  properties: Property[];
}

export function UploadLeaseTemplateModal({
  properties,
}: UploadLeaseTemplateModalProps) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState(
    uploadLeaseTemplate,
    initialActionState
  );
  const [fileError, setFileError] = React.useState<string | null>(null);

  // Close modal on success
  React.useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
    }
  }, [state.status]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type !== "application/pdf") {
      setFileError("PDF is supported now. Word document support coming later.");
    } else {
      setFileError(null);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Upload className="mr-1.5 h-4 w-4" />
        Upload Lease
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Upload lease template"
        description="Upload a reusable lease document. You can tag it by category and stay type for easy organization."
      >
        <form action={formAction} className="space-y-4">
          <FormAlert state={state} />

          <FormField label="Lease title" htmlFor="template-title" required>
            <Input
              id="template-title"
              name="title"
              placeholder="e.g., Standard Room Lease"
              required
            />
          </FormField>

          <FormField
            label="Lease category"
            htmlFor="template-category"
            required
          >
            <Select id="template-category" name="lease_category" required>
              <option value="">Select category...</option>
              {LEASE_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Stay type" htmlFor="template-stay-type" required>
            <Select id="template-stay-type" name="stay_type" required>
              <option value="">Select stay type...</option>
              {STAY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Linked property"
            htmlFor="template-property"
            hint="Optional. Link to a specific property or leave blank for all properties."
          >
            <Select id="template-property" name="property_id">
              <option value="">All properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Lease document"
            htmlFor="template-file"
            required
            error={fileError ?? undefined}
            hint="PDF is supported now. Word document support coming later."
          >
            <input
              id="template-file"
              name="file"
              type="file"
              accept=".pdf,application/pdf"
              required
              onChange={onFileChange}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </FormField>

          <FormField
            label="Internal notes"
            htmlFor="template-notes"
            hint="Optional. Add private notes about this template."
          >
            <Textarea
              id="template-notes"
              name="notes"
              placeholder="e.g., Use for month-to-month tenants only"
              rows={2}
            />
          </FormField>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton>
              <FileText className="h-4 w-4" />
              Upload Template
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
