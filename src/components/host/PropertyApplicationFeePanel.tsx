"use client";

import * as React from "react";
import { useActionState } from "react";
import { DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/FormField";
import { FormAlert } from "@/components/forms/FormAlert";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { updateApplicationFeeSettings } from "@/lib/actions/properties";
import { initialActionState } from "@/lib/actions/types";
import type { Property } from "@/lib/types";

interface PropertyApplicationFeePanelProps {
  property: Property;
}

export function PropertyApplicationFeePanel({ property }: PropertyApplicationFeePanelProps) {
  const [state, formAction] = useActionState(updateApplicationFeeSettings, initialActionState);
  const [feeRequired, setFeeRequired] = React.useState(property.application_fee_required);
  const [feeAmount, setFeeAmount] = React.useState(
    property.application_fee_amount?.toString() || ""
  );
  const [instructions, setInstructions] = React.useState(
    property.application_fee_instructions || ""
  );

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Application Fee
      </h2>
      <Card className="p-5">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={property.id} />
          <input
            type="hidden"
            name="application_fee_required"
            value={feeRequired ? "true" : "false"}
          />

          <FormAlert state={state} />

          {/* Fee Required Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-slate-400" />
              <div>
                <p className="font-medium text-slate-900">Require Application Fee</p>
                <p className="text-sm text-slate-500">
                  Charge applicants a fee before reviewing their application
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={feeRequired}
              onClick={() => setFeeRequired(!feeRequired)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                feeRequired ? "bg-indigo-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                  feeRequired ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Fee Amount - only show if required */}
          {feeRequired && (
            <>
              <FormField
                label="Fee Amount"
                htmlFor="application_fee_amount"
                required
                error={fieldErrors.application_fee_amount}
              >
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    $
                  </span>
                  <Input
                    id="application_fee_amount"
                    name="application_fee_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    className="pl-7"
                    placeholder="45.00"
                    aria-invalid={Boolean(fieldErrors.application_fee_amount)}
                  />
                </div>
              </FormField>

              <FormField
                label="Payment Instructions"
                htmlFor="application_fee_instructions"
                hint="Tell applicants how to pay (e.g., Venmo, Zelle, or in person)"
              >
                <Textarea
                  id="application_fee_instructions"
                  name="application_fee_instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  placeholder="Application fee is due before your application can be reviewed. Please send payment via Venmo to @landlord or contact us for other options."
                />
              </FormField>

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <strong>Manual tracking:</strong> renta bed does not collect payments
                automatically. You&apos;ll mark fees as paid or waived on each application.
              </div>
            </>
          )}

          <SubmitButton className="w-full" pendingLabel="Saving...">
            Save Application Fee Settings
          </SubmitButton>
        </form>
      </Card>
    </section>
  );
}
