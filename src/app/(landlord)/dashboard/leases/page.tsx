import Link from "next/link";
import { FileSignature, ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import { listLeaseDocuments } from "@/lib/services/leaseDocuments";
import { LeaseCard } from "./LeaseCard";

export const dynamic = "force-dynamic";

export default async function LeasesPage() {
  const result = await listLeaseDocuments();

  if (result.error !== null) {
    return (
      <div className="space-y-6">
        <PageHeader title="Leases" />
        <ErrorState title="Couldn't load leases" message={result.error} />
      </div>
    );
  }

  const leases = result.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leases"
        description="Prepare, send, and track lease agreements for your approved applicants."
        actions={
          <Link href="/dashboard/applications">
            <Button variant="outline">
              <ClipboardList className="mr-1.5 h-4 w-4" />
              Go to Applications
            </Button>
          </Link>
        }
      />

      {leases.length === 0 ? (
        <EmptyState
          icon={<FileSignature className="h-5 w-5" />}
          title="No leases yet"
          description="Approve an applicant, then use “Prepare Lease” on their application to upload and send a lease."
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
    </div>
  );
}
