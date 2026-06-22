"use client";

import {
  FileSignature,
  User,
  Calendar,
  Hash,
  CheckCircle2,
  Clock,
  FileText,
  PenTool,
  Type,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type { PreparedLeaseField } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function getFieldTypeLabel(fieldType: string): string {
  switch (fieldType) {
    case "tenant_signature":
      return "Tenant Signature";
    case "landlord_signature":
      return "Landlord Signature";
    case "tenant_initials":
      return "Tenant Initials";
    case "landlord_initials":
      return "Landlord Initials";
    case "date_signed":
      return "Date Signed";
    case "tenant_full_name":
      return "Tenant Full Name";
    case "landlord_full_name":
      return "Landlord Full Name";
    default:
      return fieldType;
  }
}

function getFieldTypeIcon(fieldType: string): React.ReactNode {
  switch (fieldType) {
    case "tenant_signature":
    case "landlord_signature":
      return <PenTool className="h-4 w-4" />;
    case "tenant_initials":
    case "landlord_initials":
      return <FileSignature className="h-4 w-4" />;
    case "date_signed":
      return <Calendar className="h-4 w-4" />;
    case "tenant_full_name":
    case "landlord_full_name":
      return <Type className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function getSignatureStatus(field: PreparedLeaseField): {
  label: string;
  className: string;
  icon: React.ReactNode;
} {
  if (field.signed_at || field.completed_at) {
    return {
      label: "Signed",
      className: "bg-green-100 text-green-700",
      icon: <CheckCircle2 className="mr-1 h-3 w-3" />,
    };
  }
  return {
    label: "Pending",
    className: "bg-amber-100 text-amber-700",
    icon: <Clock className="mr-1 h-3 w-3" />,
  };
}

function getAssignedToLabel(assignedTo: string): string {
  switch (assignedTo) {
    case "tenant":
      return "Tenant";
    case "landlord":
      return "Landlord";
    default:
      return assignedTo;
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface SignatureTrackingSectionProps {
  leaseReferenceNumber: string;
  fields: PreparedLeaseField[];
}

export function SignatureTrackingSection({
  leaseReferenceNumber,
  fields,
}: SignatureTrackingSectionProps) {
  // Filter to only signature-related fields
  const signatureFieldTypes = [
    "tenant_signature",
    "landlord_signature",
    "tenant_initials",
    "landlord_initials",
    "date_signed",
    "tenant_full_name",
    "landlord_full_name",
  ];

  const signatureFields = fields.filter((f) =>
    signatureFieldTypes.includes(f.field_type)
  );

  const signedCount = signatureFields.filter(
    (f) => f.signed_at || f.completed_at
  ).length;
  const totalCount = signatureFields.length;

  if (signatureFields.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              <FileSignature className="h-5 w-5 text-slate-500" />
            </div>
            <div>
              <CardTitle>Signature Tracking</CardTitle>
              <CardDescription>
                No signature fields configured for this lease.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
            <FileSignature className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle>Signature Tracking</CardTitle>
            <CardDescription>
              {signedCount} of {totalCount} signature field
              {totalCount !== 1 ? "s" : ""} completed
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Lease Reference */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-slate-500" />
              <span className="font-medium text-slate-700">
                Lease Reference:
              </span>
              <code className="rounded bg-slate-200 px-2 py-0.5 font-mono text-xs text-slate-800">
                {leaseReferenceNumber}
              </code>
            </div>
          </div>

          {/* Signature Fields Table */}
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Field
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Assigned To
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Signed By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Signed At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Page
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {signatureFields.map((field) => {
                  const status = getSignatureStatus(field);
                  return (
                    <tr key={field.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">
                            {getFieldTypeIcon(field.field_type)}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {field.label}
                            </div>
                            <div className="text-xs text-slate-500">
                              {getFieldTypeLabel(field.field_type)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {field.signature_reference_number ? (
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                            {field.signature_reference_number}
                          </code>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {getAssignedToLabel(field.assigned_to)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${status.className}`}>
                          {status.icon}
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {field.signed_by_name || (field.signed_at ? "Signed" : "—")}
                        {field.signed_by_email && (
                          <div className="text-xs text-slate-400">
                            {field.signed_by_email}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDateTime(field.signed_at || field.completed_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {field.page_number !== null ? (
                          <span>Page {field.page_number}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-600">
              {signedCount === totalCount
                ? "All signature fields have been completed."
                : `${totalCount - signedCount} signature field${
                    totalCount - signedCount !== 1 ? "s" : ""
                  } pending.`}
            </span>
            {signatureFields.some((f) => f.required) && signedCount < totalCount && (
              <span className="text-xs text-slate-500">
                Required fields must be signed to complete the lease.
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
