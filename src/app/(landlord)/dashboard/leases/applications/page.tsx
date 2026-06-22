import Link from "next/link";
import { ArrowLeft, FileText, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ErrorState } from "@/components/ErrorState";
import { UploadLeaseTemplateModal } from "@/components/host/UploadLeaseTemplateModal";
import { LeaseTemplateCard } from "@/components/host/LeaseTemplateCard";
import { ApplicantLeaseCard } from "@/components/host/ApplicantLeaseCard";
import { SentLeasesSection } from "@/components/host/SentLeasesSection";
import { listLeaseTemplates } from "@/lib/services/leaseTemplates";
import { checkTemplateReadiness, getTemplateFieldCount } from "@/lib/services/leaseTemplateFields";
import { getProperties, getApplications } from "@/lib/queries";
import { matchAllApplicationsToTemplates } from "@/lib/services/applicantTemplateMatching";
import { listPreparedLeases, getPreparedLeaseFieldCount } from "@/lib/services/preparedLeases";
import type { ApplicationStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

// Application statuses considered "ready for lease"
// - approved: landlord has approved the application
// - under_review: landlord is actively reviewing (may want to prepare lease)
const LEASE_READY_STATUSES: ApplicationStatus[] = ["approved", "under_review"];

export default async function LeaseApplicationsPage() {
  const [templatesResult, propertiesResult, applicationsResult, sentLeasesResult] = await Promise.all([
    listLeaseTemplates(),
    getProperties(),
    getApplications(), // Fetches all applications for landlord
    listPreparedLeases(), // Fetches sent leases
  ]);

  // Handle error state
  if (templatesResult.error !== null) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Lease Applications"
          actions={
            <Link href="/dashboard/leases">
              <Button variant="outline">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back to Leases
              </Button>
            </Link>
          }
        />
        <ErrorState
          title="Couldn't load lease templates"
          message={templatesResult.error}
        />
      </div>
    );
  }

  const templates = templatesResult.data;
  const properties = (propertiesResult.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
  }));
  const allApplications = applicationsResult.data ?? [];

  // Filter to applications ready for lease preparation
  const leaseReadyApplications = allApplications.filter((app) =>
    LEASE_READY_STATUSES.includes(app.status)
  );

  // Fetch field readiness for each template in parallel
  const [readinessResults, fieldCountResults] = await Promise.all([
    Promise.all(templates.map((t) => checkTemplateReadiness(t.id))),
    Promise.all(templates.map((t) => getTemplateFieldCount(t.id))),
  ]);

  const readinessMap = new Map(
    templates.map((t, i) => [
      t.id,
      readinessResults[i].data ?? { ready: false, hasSignature: false, fieldCount: 0 },
    ])
  );

  const fieldCountMap = new Map(
    templates.map((t, i) => [
      t.id,
      fieldCountResults[i].data ?? 0,
    ])
  );

  // Match applications to templates
  const matchResults = matchAllApplicationsToTemplates(leaseReadyApplications, templates);

  // Get sent leases
  const sentLeases = sentLeasesResult.data ?? [];
  const activeSentLeases = sentLeases.filter((l) => l.status !== "cancelled");

  // Get field counts for sent leases
  const sentLeaseFieldCounts = await Promise.all(
    activeSentLeases.map((l) => getPreparedLeaseFieldCount(l.id))
  );
  const sentLeaseFieldCountMap = new Map(
    activeSentLeases.map((l, i) => [l.id, sentLeaseFieldCounts[i].data ?? 0])
  );

  // Counts for display
  const readyTemplateCount = templates.filter((t) => t.status === "ready").length;
  const matchedCount = matchResults.filter((r) => r.status === "matched").length;
  const multipleMatchCount = matchResults.filter((r) => r.status === "multiple_matches").length;
  const needsSetupCount = matchResults.filter((r) => r.status === "needs_setup").length;
  const noMatchCount = matchResults.filter((r) => r.status === "no_match").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Lease Applications"
        description="Manage lease templates and match them to applicants ready for lease preparation."
        actions={
          <Link href="/dashboard/leases">
            <Button variant="outline">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Leases
            </Button>
          </Link>
        }
      />

      {/* Lease Templates Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle>Lease Templates</CardTitle>
                <CardDescription>
                  Upload reusable lease documents to use with future applicants.
                  {readyTemplateCount > 0 && (
                    <span className="ml-1 text-green-600">
                      {readyTemplateCount} ready template{readyTemplateCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <UploadLeaseTemplateModal properties={properties} />
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <FileText className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                No lease uploaded yet.
              </p>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                Upload a reusable lease so it can be matched to future applicants.
              </p>
              <div className="mt-4">
                <UploadLeaseTemplateModal properties={properties} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => {
                const readiness = readinessMap.get(template.id);
                return (
                  <LeaseTemplateCard
                    key={template.id}
                    template={template}
                    fieldCount={readiness?.fieldCount ?? 0}
                    hasSignature={readiness?.hasSignature ?? false}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sent Leases Section with Search */}
      <SentLeasesSection
        leases={activeSentLeases}
        fieldCountMap={sentLeaseFieldCountMap}
      />

      {/* Applicants Ready for Lease Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle>Applicants Ready for Lease</CardTitle>
              <CardDescription>
                {leaseReadyApplications.length === 0 ? (
                  "Approved or under-review applicants will appear here for lease preparation."
                ) : (
                  <>
                    {leaseReadyApplications.length} applicant{leaseReadyApplications.length !== 1 ? "s" : ""} ready
                    {matchedCount > 0 && (
                      <span className="text-green-600"> • {matchedCount} matched</span>
                    )}
                    {multipleMatchCount > 0 && (
                      <span className="text-amber-600"> • {multipleMatchCount} multiple matches</span>
                    )}
                    {needsSetupCount > 0 && (
                      <span className="text-orange-600"> • {needsSetupCount} need setup</span>
                    )}
                    {noMatchCount > 0 && (
                      <span className="text-slate-500"> • {noMatchCount} no match</span>
                    )}
                  </>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {leaseReadyApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Users className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                No applicants ready for lease yet.
              </p>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                Approved applicants will appear here when they are ready for lease preparation.
              </p>
              <div className="mt-4">
                <Link href="/dashboard/applications">
                  <Button variant="outline" size="sm">
                    View All Applications
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {matchResults.map((result) => (
                <ApplicantLeaseCard
                  key={result.application.id}
                  result={result}
                  fieldCounts={fieldCountMap}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
