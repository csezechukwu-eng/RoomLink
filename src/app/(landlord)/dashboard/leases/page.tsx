import Link from "next/link";
import { FileSignature, ClipboardList, FileText, Users, Upload, Beaker, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { listLeaseDocuments } from "@/lib/services/leaseDocuments";
import { listLeaseTemplates } from "@/lib/services/leaseTemplates";
import { checkTemplateReadiness } from "@/lib/services/leaseTemplateFields";
import { getProperties } from "@/lib/queries";
import { UploadLeaseTemplateModal } from "@/components/host/UploadLeaseTemplateModal";
import { LeaseTemplateCard } from "@/components/host/LeaseTemplateCard";
import { LeaseCard } from "./LeaseCard";

export const dynamic = "force-dynamic";

export default async function LeasesPage() {
  const [leaseDocsResult, templatesResult, propertiesResult] = await Promise.all([
    listLeaseDocuments(),
    listLeaseTemplates(),
    getProperties(),
  ]);

  if (leaseDocsResult.error !== null) {
    return (
      <div className="space-y-6">
        <PageHeader title="Leases" />
        <ErrorState title="Couldn't load leases" message={leaseDocsResult.error} />
      </div>
    );
  }

  const leases = leaseDocsResult.data;
  const templates = templatesResult.data ?? [];
  const properties = (propertiesResult.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
  }));

  // Fetch readiness info for each template
  const readinessResults = await Promise.all(
    templates.map((t) => checkTemplateReadiness(t.id))
  );
  const readinessMap = new Map(
    templates.map((t, i) => [
      t.id,
      readinessResults[i].data ?? { ready: false, hasSignature: false, fieldCount: 0 },
    ])
  );

  const readyTemplateCount = templates.filter((t) => t.status === "ready").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leases"
        description="Upload lease templates, prepare and send lease agreements for your approved applicants."
        actions={
          <>
            <UploadLeaseTemplateModal properties={properties} />
            <Link href="/dashboard/leases/applications">
              <Button variant="outline">
                <FileText className="mr-1.5 h-4 w-4" />
                My Lease Applications
              </Button>
            </Link>
            <Link href="/dashboard/applications">
              <Button variant="outline">
                <ClipboardList className="mr-1.5 h-4 w-4" />
                Go to Applications
              </Button>
            </Link>
          </>
        }
      />

      {/* My Lease Templates Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle>My Lease Templates</CardTitle>
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
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                <Upload className="h-5 w-5 text-indigo-500" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                No lease templates uploaded yet
              </p>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                Upload a lease template to get started. Templates can be reused for multiple applicants with the same rental type.
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
                Approved applicants will appear here when they are ready for
                lease preparation.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Users className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">
              No applicants ready for lease yet.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Approved applicants with complete information will appear here.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Existing Leases Section */}
      {leases.length === 0 ? (
        <EmptyState
          icon={<FileSignature className="h-5 w-5" />}
          title="No leases yet"
          description="Approve an applicant, then use 'Prepare Lease' on their application to upload and send a lease."
          action={
            <Link href="/dashboard/applications">
              <Button>Go to Applications</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {leases.map((lease) => (
            <LeaseCard key={lease.id} lease={lease} />
          ))}
        </div>
      )}

      {/* Demo Test Center Link */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Beaker className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Demo Test Center</p>
              <p className="text-sm text-slate-500">
                Create test data to explore the full lease workflow
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/demo"
            className="inline-flex items-center gap-1 self-start text-sm font-medium text-amber-700 hover:text-amber-800 sm:self-auto"
          >
            Open Test Center
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
