import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ErrorState } from "@/components/ErrorState";
import { LeasePanel } from "@/components/host/LeasePanel";
import { getApplicationDetail } from "@/lib/queries";
import { getLeaseForApplication, isDocuSignConfigured } from "@/lib/services/leases";
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
  const leaseResult = await getLeaseForApplication(applicationId);

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

      <LeasePanel
        application={application}
        lease={leaseResult.data ?? null}
        docusignConfigured={isDocuSignConfigured()}
        templateConfigured={Boolean(process.env.DOCUSIGN_TEMPLATE_ID)}
      />
    </div>
  );
}
