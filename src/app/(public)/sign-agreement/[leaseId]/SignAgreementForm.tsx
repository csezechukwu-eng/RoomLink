"use client";

import * as React from "react";
import { useActionState } from "react";
import { FileSignature, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/forms/FormAlert";
import { signPreparedLeaseAction } from "@/lib/actions/preparedLeases";
import { initialActionState } from "@/lib/actions/types";

interface SignAgreementFormProps {
  leaseId: string;
  token: string;
  tenantName: string;
}

export function SignAgreementForm({ leaseId, token, tenantName }: SignAgreementFormProps) {
  const [state, action, isPending] = useActionState(signPreparedLeaseAction, initialActionState);
  const [confirmed, setConfirmed] = React.useState(false);

  // Show success state
  if (state.status === "success") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-emerald-900">Agreement Signed!</h3>
        <p className="mt-2 text-emerald-700">
          Your monthly stay agreement has been signed successfully. The host has been notified.
        </p>
        <p className="mt-4 text-sm text-emerald-600">
          You can close this page or return to your tenant dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Sign Agreement</h3>
      <p className="mt-2 text-sm text-slate-600">
        By signing below, I ({tenantName}) agree to the terms of this monthly stay agreement.
      </p>

      <div className="mt-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-700">
            I have read and agree to the terms of this monthly stay agreement. I understand this is a binding agreement for a minimum 30-day stay.
          </span>
        </label>
      </div>

      <FormAlert state={state} />

      <form action={action} className="mt-6">
        <input type="hidden" name="id" value={leaseId} />
        <input type="hidden" name="token" value={token} />
        <Button
          type="submit"
          disabled={!confirmed || isPending}
          className="w-full"
        >
          {isPending ? (
            "Signing..."
          ) : (
            <>
              <FileSignature className="mr-2 h-4 w-4" />
              Sign Agreement
            </>
          )}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-500">
        Your electronic signature is legally binding
      </p>
    </div>
  );
}
