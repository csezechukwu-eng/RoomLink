import { NextResponse, type NextRequest } from "next/server";
import { getLeaseDocument } from "@/lib/services/leaseDocuments";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin stream of a lease PDF for in-browser rendering (react-pdf, etc.).
 * Owner-scoped (getLeaseDocument verifies ownership), so no public exposure and
 * no cross-origin/CORS or signed-URL-expiry problems in the viewer.
 *
 * GET /api/lease-documents/[id]/file
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const docResult = await getLeaseDocument(id); // owner-scoped
  if (docResult.error !== null || !docResult.data?.original_file_path) {
    return new NextResponse("Not found", { status: 404 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase.storage
    .from("lease-documents")
    .download(docResult.data.original_file_path);
  if (error || !data) {
    return new NextResponse("Not found", { status: 404 });
  }

  const bytes = Buffer.from(await data.arrayBuffer());
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
    },
  });
}
