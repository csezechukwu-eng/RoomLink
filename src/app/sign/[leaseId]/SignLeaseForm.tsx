"use client";

import { useState, useActionState } from "react";
import { Check, FileSignature, FileText, ExternalLink } from "lucide-react";
import { SignaturePad } from "@/components/SignaturePad";
import { PdfViewer } from "@/components/pdf/PdfViewer";
import { SignatureBox } from "@/components/pdf/SignatureBox";
import { signLeaseAsTenantWithStamp } from "@/lib/actions/leaseDocuments";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SignatureField } from "@/lib/types";

interface Props {
  leaseId: string;
  tenantName: string;
  pdfUrl: string | null;
  signatureFields: SignatureField[];
}

const PDF_WIDTH = 600;

export function SignLeaseForm({
  leaseId,
  tenantName,
  pdfUrl,
  signatureFields,
}: Props) {
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [state, formAction, isPending] = useActionState(
    signLeaseAsTenantWithStamp,
    { status: "idle" }
  );

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

  // Find the tenant signature field
  const tenantField = signatureFields.find((f) => f.type === "tenant");

  const renderOverlay = (pageIndex: number, width: number, height: number) => {
    // Show tenant signature box on the correct page
    const pageFields = signatureFields.filter((f) => f.page === pageIndex);
    return (
      <>
        {pageFields.map((field) => (
          <SignatureBox
            key={field.type}
            type={field.type}
            signatureImage={
              field.type === "tenant" ? signatureData : null
            }
            x={field.x * width}
            y={field.y * height}
            width={field.width * width}
            height={field.height * height}
            containerWidth={width}
            containerHeight={height}
            editable={false}
          />
        ))}
      </>
    );
  };

  if (state.status === "success") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-emerald-900">
          Lease Signed Successfully
        </h3>
        <p className="mt-2 text-emerald-700">
          Thank you for signing the lease agreement. You will receive a
          confirmation email shortly.
        </p>
        <p className="mt-4 text-sm text-emerald-600">
          A copy of the signed lease will be available for download once both
          parties have signed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PDF Viewer Section */}
      {pdfUrl && (
        <Card className="overflow-hidden p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <FileText className="h-5 w-5 text-indigo-600" />
              Lease Document
            </h3>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Open in new tab <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="flex justify-center">
            <PdfViewer
              url={pdfUrl}
              width={PDF_WIDTH}
              onLoadSuccess={setNumPages}
              onPageChange={setCurrentPage}
              currentPage={currentPage}
              renderOverlay={renderOverlay}
            />
          </div>
          {tenantField && (
            <p className="mt-4 text-center text-sm text-slate-500">
              Your signature will be placed on page {tenantField.page + 1}.
              {tenantField.page + 1 !== currentPage && (
                <button
                  type="button"
                  onClick={() => setCurrentPage(tenantField.page + 1)}
                  className="ml-2 font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Go to that page
                </button>
              )}
            </p>
          )}
        </Card>
      )}

      {/* Signing Form */}
      <Card className="p-6">
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
                  <p className="mb-2 text-sm text-slate-500">
                    Signature preview:
                  </p>
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
                I, <strong>{tenantName}</strong>, agree that by signing this
                document electronically, I am bound by the terms of this lease
                agreement. I understand that my electronic signature has the
                same legal effect as a handwritten signature.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!signatureData || !agreedToTerms || isPending}
            className="h-12 w-full"
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
      </Card>
    </div>
  );
}
