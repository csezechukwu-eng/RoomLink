import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import { ErrorState } from "@/components/ErrorState";
import { PrepareLeaseCard } from "@/components/host/PrepareLeaseCard";
import { LeaseAutomationSection } from "@/components/host/LeaseAutomationSection";
import { getApplicationDetail } from "@/lib/queries";
import { getApplicationLeaseContext } from "@/lib/services/leaseDocuments";
import { getLeaseAutomationContext } from "@/lib/services/preparedLeases";
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
  const [leaseCtx, automationCtx] = await Promise.all([
    getApplicationLeaseContext(applicationId),
    getLeaseAutomationContext(applicationId),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/applications"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Requests
      </Link>

      {/* Monthly Stay Notice */}
      <div className="flex items-start gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
        <Calendar className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-indigo-900">Monthly Stay Request</p>
          <p className="text-sm text-indigo-700">
            This request is for a 30-day minimum monthly stay. Rent is collected monthly.
          </p>
        </div>
      </div>

      <ApplicationDetailClient application={application} />

      {/* Monthly Agreement Automation: approve & send agreement based on rental type */}
      <div id="lease-automation">
        <LeaseAutomationSection context={automationCtx.data ?? null} />
      </div>

      {/* Legacy workflow: manual upload for approved applicant */}
      <div id="lease">
        <PrepareLeaseCard context={leaseCtx.data ?? null} />
      </div>
    </div>
  );
}
