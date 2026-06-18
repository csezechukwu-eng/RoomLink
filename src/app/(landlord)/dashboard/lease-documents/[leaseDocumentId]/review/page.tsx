import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  getLeaseDocument,
  getLandlordSignature,
} from "@/lib/services/leaseDocuments";
import { ReviewSignForm } from "./ReviewSignForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ leaseDocumentId: string }>;
}

export default async function ReviewSignPage({ params }: PageProps) {
  const { leaseDocumentId } = await params;

  const [docResult, sigResult] = await Promise.all([
    getLeaseDocument(leaseDocumentId),
    getLandlordSignature(),
  ]);

  if (docResult.error !== null || !docResult.data) {
    notFound();
  }

  const doc = docResult.data;
  const landlordSignature = sigResult.data;
  // Use our API route for the PDF - it serves with inline Content-Disposition
  const pdfUrl = `/api/pdf/${leaseDocumentId}`;

  // Can only review documents in preparing status
  if (doc.status !== "preparing") {
    redirect(`/dashboard/lease-documents/${leaseDocumentId}`);
  }

  if (!landlordSignature) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/lease-documents/${leaseDocumentId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Review & Sign</h1>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-amber-800">
            You need to set up your signature before you can sign documents.
          </p>
          <Link href="/dashboard/settings" className="mt-4 inline-block">
            <Button>Go to Settings</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/lease-documents/${leaseDocumentId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Review & Sign</h1>
          <p className="text-sm text-slate-500">{doc.title}</p>
        </div>
      </div>

      <ReviewSignForm
        leaseDocumentId={leaseDocumentId}
        pdfUrl={pdfUrl}
        landlordSignature={landlordSignature}
        existingFields={doc.signature_fields ?? []}
        tenantName={doc.tenant_snapshot?.name ?? "Tenant"}
      />
    </div>
  );
}
