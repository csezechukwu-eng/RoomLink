import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ErrorState } from "@/components/ErrorState";
import { PrepareLeaseCard } from "@/components/host/PrepareLeaseCard";
import { getApplicationDetail } from "@/lib/queries";
import { getApplicationLeaseContext } from "@/lib/services/leaseDocuments";
import { ApplicationDetailClient } from "./ApplicationDetailClient";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const result = await getApplicationDetail(applicationId);

  if (result.error !== null) {
    return <ErrorState title="Couldn't load application" message={result.error} />;
  }
  if (!result.data) notFound();

  const application = result.data;
  const leaseCtx = await getApplicationLeaseContext(applicationId);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/applications"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Applications
      </Link>

      <ApplicationDetailClient application={application} />

      {/* Phase 1 lease workflow: prepare (upload) a lease for an approved applicant.
          A separate in-app signing flow lives under /dashboard/leases. */}
      <div id="lease">
        <PrepareLeaseCard context={leaseCtx.data ?? null} />
      </div>
    </div>
  );
}
