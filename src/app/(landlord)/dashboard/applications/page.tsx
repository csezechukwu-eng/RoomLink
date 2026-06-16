import { FileText, Building, Plus, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getProperties, getApplications, getApplicationCounts } from "@/lib/queries";
import { ApplicationsClient } from "./ApplicationsClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const [propertiesResult, applicationsResult, countsResult] = await Promise.all([
    getProperties(),
    getApplications(),
    getApplicationCounts(),
  ]);

  const properties = propertiesResult.data ?? [];
  const applications = applicationsResult.data ?? [];
  const counts = countsResult.data ?? {
    draft: 0,
    submitted: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    waitlisted: 0,
    withdrawn: 0,
    total: 0,
  };

  // Show empty state if no properties
  if (properties.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
          <p className="text-slate-500">Review and manage all applications across your properties.</p>
        </div>

        <Card className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Building className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">
            Create a property first
          </h2>
          <p className="mt-2 max-w-md text-slate-500">
            You need to create properties with beds before you can receive applications.
            Go to Properties to get started.
          </p>
          <Link
            href="/dashboard/properties"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Go to Properties
          </Link>
        </Card>
      </div>
    );
  }

  // Show empty applications state if no applications
  if (applications.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
            <p className="text-slate-500">Review and manage all applications across your properties.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/applications/preview">
              <Button variant="outline" size="sm">
                <Eye className="mr-1.5 h-4 w-4" />
                View Application Form
              </Button>
            </Link>
            <Link href="/dashboard/applications/new">
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                Add Application
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Row - All zeros */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Applications" value={0} />
          <StatCard label="Pending Review" value={0} />
          <StatCard label="Under Review" value={0} />
          <StatCard label="Approved" value={0} />
        </div>

        <Card className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <FileText className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">
            No applications yet
          </h2>
          <p className="mt-2 max-w-md text-slate-500">
            When prospective tenants apply for your beds, their applications will appear here.
            Share your property availability pages to start receiving applications.
          </p>
        </Card>
      </div>
    );
  }

  // Show applications list
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
          <p className="text-slate-500">Review and manage all applications across your properties.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/applications/preview">
            <Button variant="outline" size="sm">
              <Eye className="mr-1.5 h-4 w-4" />
              View Application Form
            </Button>
          </Link>
          <Link href="/dashboard/applications/new">
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Application
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Applications" value={counts.total} />
        <StatCard label="Pending Review" value={counts.submitted} />
        <StatCard label="Under Review" value={counts.under_review} />
        <StatCard label="Approved" value={counts.approved} />
      </div>

      <ApplicationsClient applications={applications} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </Card>
  );
}
