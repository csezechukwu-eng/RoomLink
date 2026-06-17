"use client";

import { useState, useActionState } from "react";
import { Check, FileSignature } from "lucide-react";
import { SignaturePad } from "@/components/SignaturePad";
import { signLeaseAsTenant } from "@/lib/actions/leaseDocuments";
import { Button } from "@/components/ui/button";

interface Props {
  leaseId: string;
  tenantName: string;
}

export function SignLeaseForm({ leaseId, tenantName }: Props) {
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [state, formAction, isPending] = useActionState(signLeaseAsTenant, { status: "idle" });

  const handleSignatureCapture = (data: string) => {
    setSignatureData(data);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!signatureData || !agreedToTerms) return;

    const formData = new FormData();
    formData.set("id", leaseId);
    formData.set("signature_data", signatureData);
    formAction(formData);
  };

  if (state.status === "success") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-emerald-900">Lease Signed Successfully</h3>
        <p className="mt-2 text-emerald-700">
          Thank you for signing the lease agreement. You will receive a confirmation email shortly.
        </p>
        <p className="mt-4 text-sm text-emerald-600">
          A copy of the signed lease will be available for download once both parties have signed.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
        <FileSignature className="h-5 w-5 text-indigo-600" />
        Sign Agreement
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Draw or type your signature below to sign the lease agreement.
      </p>

      {state.status === "error" && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Signature Capture */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Your Signature
          </label>
          {signatureData ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-sm text-slate-500">Signature preview:</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signatureData}
                  alt="Your signature"
                  className="mx-auto h-16 object-contain"
                />
              </div>
              <button
                type="button"
                onClick={() => setSignatureData(null)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Clear and re-sign
              </button>
            </div>
          ) : (
            <SignaturePad onSave={handleSignatureCapture} />
          )}
        </div>

        {/* Agreement Checkbox */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700">
              I, <strong>{tenantName}</strong>, agree that by signing this document electronically,
              I am bound by the terms of this lease agreement. I understand that my electronic signature
              has the same legal effect as a handwritten signature.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!signatureData || !agreedToTerms || isPending}
          className="w-full h-12"
        >
          {isPending ? (
            "Signing..."
          ) : (
            <>
              <Check className="mr-2 h-5 w-5" />
              Sign Lease Agreement
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
