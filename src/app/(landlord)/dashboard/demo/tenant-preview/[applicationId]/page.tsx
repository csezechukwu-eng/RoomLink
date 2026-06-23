import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Eye,
  User,
  Building,
  Home,
  FileSignature,
  Clock,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { getServiceClient } from "@/lib/supabase/server";
import { getCurrentOwnerId } from "@/lib/auth";
import type { Application, PreparedLease, Property, Room, Bed } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ applicationId: string }>;
}

export default async function TenantPreviewPage({ params }: PageProps) {
  const { applicationId } = await params;
  const ownerId = await getCurrentOwnerId();
  const supabase = getServiceClient();

  // Get the application
  const { data: application, error: appErr } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();

  if (appErr || !application) {
    notFound();
  }

  // Verify ownership
  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", application.property_id)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (!property) {
    notFound();
  }

  // Verify it's a demo application
  if (!application.is_demo) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tenant Preview" description="Demo only" />
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6 text-center">
            <p className="text-red-700">
              This preview is only available for demo applications.
            </p>
            <Link href="/dashboard/demo" className="mt-4 inline-block">
              <Button variant="outline">Back to Demo Test Center</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get room and bed info
  let room: Room | null = null;
  let bed: Bed | null = null;

  if (application.desired_room_id) {
    const { data: roomData } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", application.desired_room_id)
      .maybeSingle();
    room = roomData as Room | null;
  }

  if (application.bed_id) {
    const { data: bedData } = await supabase
      .from("beds")
      .select("*")
      .eq("id", application.bed_id)
      .maybeSingle();
    bed = bedData as Bed | null;
  }

  // Get prepared lease if exists
  const { data: preparedLease } = await supabase
    .from("prepared_leases")
    .select("*")
    .eq("application_id", applicationId)
    .neq("status", "cancelled")
    .maybeSingle();

  // Get signature fields if lease exists
  let signatureFields: Array<{
    label: string;
    field_type: string;
    signed_at: string | null;
    signature_reference_number: string | null;
  }> = [];

  if (preparedLease) {
    const { data: fields } = await supabase
      .from("prepared_lease_fields")
      .select("label, field_type, signed_at, signature_reference_number")
      .eq("prepared_lease_id", preparedLease.id)
      .not("signature_reference_number", "is", null)
      .order("sort_order", { ascending: true });
    signatureFields = fields ?? [];
  }

  const app = application as Application;
  const lease = preparedLease as PreparedLease | null;
  const prop = property as Property;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Tenant Preview"
          description="Preview what the tenant sees (Demo Only)"
        />
        <Link href="/dashboard/demo">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Demo
          </Button>
        </Link>
      </div>

      {/* Demo Notice */}
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <strong>Tenant Preview Mode</strong>
        </div>
        <p className="mt-1">
          This shows what {app.first_name} would see in their tenant portal. No landlord
          controls are visible.
        </p>
      </div>

      {/* Applicant Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <CardTitle>
                {app.first_name} {app.last_name}
              </CardTitle>
              <CardDescription>{app.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge
              className={
                app.status === "approved"
                  ? "bg-green-100 text-green-700"
                  : app.status === "under_review"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-700"
              }
            >
              Application: {app.status.replace(/_/g, " ")}
            </Badge>
            <Badge className="bg-amber-100 text-amber-700">Demo</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Property Applied For */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Property Applied For
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">{prop.name}</p>
            <p className="text-sm text-slate-500">
              {prop.address}, {prop.city}, {prop.state} {prop.zip}
            </p>
          </div>

          {room && (
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-slate-400" />
              <span className="text-sm">Room: {room.name}</span>
            </div>
          )}

          {bed && (
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-slate-400" />
              <span className="text-sm">
                Bed: {bed.label} | ${bed.monthly_rent}/mo | ${bed.deposit_amount} deposit
              </span>
            </div>
          )}

          {app.stay_type && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-sm">
                Stay type: {app.stay_type.replace(/_/g, " ")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lease Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Lease Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lease ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Lease Agreement</p>
                  <p className="text-sm text-slate-500">
                    Reference: {lease.lease_reference_number}
                  </p>
                </div>
                <Badge
                  className={
                    lease.status === "signed" || lease.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : lease.status === "sent" || lease.status === "viewed"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-700"
                  }
                >
                  {lease.status}
                </Badge>
              </div>

              {lease.sent_at && (
                <p className="text-sm text-slate-500">
                  Sent: {new Date(lease.sent_at).toLocaleDateString()}
                </p>
              )}

              {/* Signature Fields */}
              {signatureFields.length > 0 && (
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-semibold text-slate-700">
                    Signature Fields
                  </h4>
                  <div className="space-y-2 rounded-lg border bg-slate-50 p-3">
                    {signatureFields.map((field, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {field.signed_at ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-amber-500" />
                          )}
                          <span>{field.label}</span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {field.signature_reference_number}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tenant Action */}
              {lease.status === "sent" && (
                <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                  <p className="text-sm text-indigo-700">
                    <strong>Action Required:</strong> Your lease is ready to sign.
                  </p>
                  <p className="mt-2 text-xs text-indigo-600">
                    Tenant signing screen coming next.
                  </p>
                </div>
              )}

              {(lease.status === "signed" || lease.status === "completed") && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="text-sm text-green-700">
                    <strong>Completed:</strong> Your lease has been signed.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <FileSignature className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-sm text-slate-600">No lease sent yet</p>
              <p className="mt-1 text-xs text-slate-500">
                The landlord will send your lease once your application is approved.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer Note */}
      <div className="text-center text-xs text-slate-400">
        This is a demo preview. Real tenant portal features are being developed.
      </div>
    </div>
  );
}
