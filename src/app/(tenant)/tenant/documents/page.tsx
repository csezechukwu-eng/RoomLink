import Link from "next/link";
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  FileSignature,
  ScrollText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentTenantId } from "@/lib/auth";
import { getTenantLeaseDocuments } from "@/lib/services/leaseDocuments";
import { getTenantPreparedLeases } from "@/lib/services/preparedLeases";

export const dynamic = "force-dynamic";

export default async function TenantDocumentsPage() {
  const tenantId = await getCurrentTenantId();
  const [leaseDocsRes, preparedLeasesRes] = await Promise.all([
    getTenantLeaseDocuments(tenantId),
    getTenantPreparedLeases(tenantId),
  ]);

  const leaseDocs = leaseDocsRes.data ?? [];
  const preparedLeases = preparedLeasesRes.data ?? [];

  // Separate completed and pending documents
  const signedDocs = leaseDocs.filter((doc) => doc.status === "completed");
  const pendingDocs = leaseDocs.filter((doc) => doc.status === "out_for_signature");

  // Filter prepared leases that need signing
  const leasesToSign = preparedLeases.filter(
    (lease) => lease.status === "sent" && !lease.tenant_signed_at
  );

  const hasAnyDocuments = leaseDocs.length > 0 || preparedLeases.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        <p className="text-slate-500">View and manage your lease agreements and documents</p>
      </div>

      {/* Action Required Section */}
      {leasesToSign.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <FileSignature className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-amber-900">Action Required</h2>
              <p className="mt-1 text-sm text-amber-700">
                You have {leasesToSign.length} lease agreement{leasesToSign.length > 1 ? "s" : ""} waiting for your signature.
              </p>
              <div className="mt-4 space-y-2">
                {leasesToSign.map((lease) => (
                  <Link
                    key={lease.id}
                    href={`/sign/${lease.id}?token=${lease.signing_token}`}
                    className="flex items-center justify-between rounded-lg bg-white p-3 transition-colors hover:bg-amber-100"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{lease.property_name || "Lease Agreement"}</p>
                      <p className="text-sm text-slate-500">
                        {lease.sent_at ? `Sent ${new Date(lease.sent_at).toLocaleDateString()}` : "Pending"}
                      </p>
                    </div>
                    <Button size="sm">Sign Now</Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* No Documents State */}
      {!hasAnyDocuments && (
        <Card className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <FileText className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">
            No Documents Yet
          </h2>
          <p className="mt-2 max-w-md text-slate-500">
            Your lease agreements and other documents will appear here once they are ready.
          </p>
        </Card>
      )}

      {/* Signed Documents */}
      {signedDocs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Signed Documents</h2>
          <div className="space-y-3">
            {signedDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                title={doc.property_name || "Lease Agreement"}
                type="Lease Agreement"
                status="completed"
                date={doc.tenant_signed_at || doc.created_at}
                href={`/api/pdf/${doc.id}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pending Documents */}
      {pendingDocs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pending Documents</h2>
          <div className="space-y-3">
            {pendingDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                title={doc.property_name || "Lease Agreement"}
                type="Lease Agreement"
                status="out_for_signature"
                date={doc.created_at}
              />
            ))}
          </div>
        </div>
      )}

      {/* House Rules Section */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">House Rules & Policies</h2>
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
              <ScrollText className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">Community Guidelines</h3>
              <p className="mt-1 text-sm text-slate-500">
                Review the house rules and community guidelines for your property.
              </p>
              <div className="mt-4 space-y-3">
                <RuleItem title="Quiet Hours" description="10 PM - 8 AM daily" />
                <RuleItem title="Guest Policy" description="Notify management of overnight guests" />
                <RuleItem title="Common Areas" description="Clean up after yourself in shared spaces" />
                <RuleItem title="Parking" description="Use designated parking spots only" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Important Information */}
      <Card className="p-6 bg-slate-50">
        <h3 className="font-semibold text-slate-900 mb-3">Need Help?</h3>
        <p className="text-sm text-slate-600 mb-4">
          If you have questions about your documents or need a copy of any agreement,
          please contact your property manager.
        </p>
        <Link href="/tenant/messages">
          <Button variant="outline" size="sm">
            Contact Manager
          </Button>
        </Link>
      </Card>
    </div>
  );
}

function DocumentCard({
  title,
  type,
  status,
  date,
  href,
}: {
  title: string;
  type: string;
  status: "completed" | "out_for_signature" | "cancelled";
  date: string;
  href?: string;
}) {
  const statusConfig = {
    completed: {
      icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
      label: "Signed",
      color: "bg-emerald-50 text-emerald-700",
    },
    out_for_signature: {
      icon: <Clock className="h-5 w-5 text-amber-600" />,
      label: "Awaiting Signature",
      color: "bg-amber-50 text-amber-700",
    },
    cancelled: {
      icon: <AlertCircle className="h-5 w-5 text-red-600" />,
      label: "Cancelled",
      color: "bg-red-50 text-red-700",
    },
  };

  const config = statusConfig[status];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
            <FileText className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">{title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-slate-500">{type}</span>
              <span className="text-slate-300">•</span>
              <span className="text-sm text-slate-500">
                {new Date(date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.color}`}>
            {config.icon}
            {config.label}
          </span>

          {href && status === "completed" && (
            <div className="flex items-center gap-2">
              <Link href={href} target="_blank">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Eye className="h-4 w-4" />
                  View
                </Button>
              </Link>
              <Link href={href} download target="_blank">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function RuleItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
      <span className="font-medium text-slate-900">{title}:</span>
      <span className="text-slate-600">{description}</span>
    </div>
  );
}
