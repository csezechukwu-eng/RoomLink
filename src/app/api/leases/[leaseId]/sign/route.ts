import { NextResponse, type NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getLeaseSigningUrl } from "@/lib/services/leases";
import type { Lease } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Redirect a signer into DocuSign embedded signing for a lease.
 * GET /api/leases/[leaseId]/sign?role=tenant|landlord
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leaseId: string }> }
) {
  const { leaseId } = await params;
  const role = request.nextUrl.searchParams.get("role") === "landlord" ? "landlord" : "tenant";
  const origin = request.nextUrl.origin;
  const returnUrl = `${origin}/dashboard/applications?signed=1`;

  const supabase = getServiceClient();
  const { data } = await supabase
    .from("leases")
    .select("*")
    .eq("id", leaseId)
    .maybeSingle();
  const lease = (data as Lease) ?? null;
  if (!lease) {
    return NextResponse.redirect(`${origin}/dashboard/applications?lease_error=notfound`);
  }

  let signer: { name: string; email: string };
  if (role === "landlord") {
    const user = await getCurrentUser();
    if (!user?.email) {
      return NextResponse.redirect(`${origin}/dashboard/applications?lease_error=no_landlord_email`);
    }
    signer = { name: user.user_metadata?.full_name || "Landlord", email: user.email };
  } else {
    if (!lease.tenant_email) {
      return NextResponse.redirect(`${origin}/dashboard/applications?lease_error=no_tenant_email`);
    }
    signer = { name: lease.tenant_name || "Tenant", email: lease.tenant_email };
  }

  const result = await getLeaseSigningUrl({ leaseId, role, returnUrl, signer });
  if (result.error !== null) {
    return NextResponse.redirect(
      `${origin}/dashboard/applications?lease_error=${encodeURIComponent(result.error)}`
    );
  }
  return NextResponse.redirect(result.data.url);
}
