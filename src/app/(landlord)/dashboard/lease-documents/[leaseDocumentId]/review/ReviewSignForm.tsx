"use client";

import * as React from "react";
import { useActionState } from "react";
import { PenLine, UserCheck, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PdfViewer } from "@/components/pdf/PdfViewer";
import { SignatureBox } from "@/components/pdf/SignatureBox";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormAlert } from "@/components/forms/FormAlert";
import { reviewSignAndSend } from "@/lib/actions/leaseDocuments";
import { initialActionState } from "@/lib/actions/types";
import type { SignatureField } from "@/lib/types";

interface ReviewSignFormProps {
  leaseDocumentId: string;
  pdfUrl: string;
  landlordSignature: string;
  existingFields: SignatureField[];
  tenantName: string;
}

const PDF_WIDTH = 650;
const SIGNATURE_BOX_WIDTH_FRACTION = 0.25;
const SIGNATURE_BOX_HEIGHT_FRACTION = 0.08;

export function ReviewSignForm({
  leaseDocumentId,
  pdfUrl,
  landlordSignature,
  existingFields,
  tenantName,
}: ReviewSignFormProps) {
  const [state, formAction] = useActionState(reviewSignAndSend, initialActionState);
  const [numPages, setNumPages] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageHeight, setPageHeight] = React.useState(800);
  const [signatureFields, setSignatureFields] = React.useState<SignatureField[]>(existingFields);
  const [confirmed, setConfirmed] = React.useState(false);

  const landlordField = signatureFields.find((f) => f.type === "landlord");
  const tenantField = signatureFields.find((f) => f.type === "tenant");

  const handleAddLandlordSignature = () => {
    if (landlordField) return;
    // Default: bottom right of last page
    const targetPage = numPages > 0 ? numPages - 1 : 0;
    setSignatureFields((prev) => [
      ...prev,
      {
        type: "landlord",
        page: targetPage,
        x: 0.6,
        y: 0.85,
        width: SIGNATURE_BOX_WIDTH_FRACTION,
        height: SIGNATURE_BOX_HEIGHT_FRACTION,
      },
    ]);
    setCurrentPage(targetPage + 1);
  };

  const handleAddTenantSignature = () => {
    if (tenantField) return;
    // Default: bottom left of last page
    const targetPage = numPages > 0 ? numPages - 1 : 0;
    setSignatureFields((prev) => [
      ...prev,
      {
        type: "tenant",
        page: targetPage,
        x: 0.1,
        y: 0.85,
        width: SIGNATURE_BOX_WIDTH_FRACTION,
        height: SIGNATURE_BOX_HEIGHT_FRACTION,
      },
    ]);
    setCurrentPage(targetPage + 1);
  };

  const handleMoveField = (type: "landlord" | "tenant", x: number, y: number) => {
    setSignatureFields((prev) =>
      prev.map((f) =>
        f.type === type
          ? { ...f, x: x / PDF_WIDTH, y: y / pageHeight }
          : f
      )
    );
  };

  const handleRemoveField = (type: "landlord" | "tenant") => {
    setSignatureFields((prev) => prev.filter((f) => f.type !== type));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLoadSuccess = (pages: number) => {
    setNumPages(pages);
  };

  // Filter fields for current page
  const currentPageFields = signatureFields.filter(
    (f) => f.page === currentPage - 1
  );

  const renderOverlay = (pageIndex: number, width: number, height: number) => {
    // Update page height for coordinate calculations
    if (height !== pageHeight) {
      setPageHeight(height);
    }

    return (
      <>
        {currentPageFields.map((field) => (
          <SignatureBox
            key={field.type}
            type={field.type}
            signatureImage={field.type === "landlord" ? landlordSignature : null}
            x={field.x * width}
            y={field.y * height}
            width={field.width * width}
            height={field.height * height}
            containerWidth={width}
            containerHeight={height}
            onMove={(x, y) => handleMoveField(field.type, x, y)}
            onRemove={() => handleRemoveField(field.type)}
            editable={true}
          />
        ))}
      </>
    );
  };

  const canSubmit = landlordField && tenantField && confirmed;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* PDF Viewer */}
      <Card className="overflow-hidden p-4">
        <PdfViewer
          url={pdfUrl}
          width={PDF_WIDTH}
          onLoadSuccess={handleLoadSuccess}
          onPageChange={handlePageChange}
          currentPage={currentPage}
          renderOverlay={renderOverlay}
        />
      </Card>

      {/* Controls Panel */}
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="mb-3 font-semibold text-slate-900">Place Signatures</h3>
          <div className="space-y-2">
            <Button
              variant={landlordField ? "outline" : "primary"}
              className="w-full justify-start"
              onClick={handleAddLandlordSignature}
              disabled={!!landlordField}
            >
              <PenLine className="mr-2 h-4 w-4" />
              {landlordField ? "Your signature placed" : "Add your signature"}
            </Button>
            <Button
              variant={tenantField ? "outline" : "secondary"}
              className="w-full justify-start"
              onClick={handleAddTenantSignature}
              disabled={!!tenantField}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              {tenantField ? `${tenantName} signature placed` : `Add ${tenantName}'s signature box`}
            </Button>
          </div>
          {(landlordField || tenantField) && (
            <p className="mt-3 text-xs text-slate-500">
              Drag the signature boxes to position them on the document.
              Navigate pages to place signatures on different pages.
            </p>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 font-semibold text-slate-900">Confirm & Send</h3>
          <FormAlert state={state} />

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700">
              I confirm this is the correct lease document and I want to send it to {tenantName} for signature.
            </span>
          </label>

          <form action={formAction} className="mt-4">
            <input type="hidden" name="id" value={leaseDocumentId} />
            <input
              type="hidden"
              name="signature_fields"
              value={JSON.stringify(signatureFields)}
            />
            <SubmitButton disabled={!canSubmit} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Sign & Send to Tenant
            </SubmitButton>
          </form>

          {!landlordField && (
            <p className="mt-2 text-xs text-amber-600">
              Place your signature on the document first.
            </p>
          )}
          {landlordField && !tenantField && (
            <p className="mt-2 text-xs text-amber-600">
              Place the tenant&apos;s signature box on the document.
            </p>
          )}
        </Card>

        {landlordField && tenantField && (
          <Card className="border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div className="text-sm text-emerald-800">
                <p className="font-medium">Ready to send!</p>
                <p className="mt-1 text-emerald-700">
                  Your signature will be stamped onto the document. The tenant will receive a link to sign.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
