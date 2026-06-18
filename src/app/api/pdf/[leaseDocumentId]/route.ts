import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedClient, getServiceClient } from "@/lib/supabase/server";

const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  rtf: "application/rtf",
  odt: "application/vnd.oasis.opendocument.text",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leaseDocumentId: string }> }
) {
  const { leaseDocumentId } = await params;
  const token = request.nextUrl.searchParams.get("token");

  try {
    // Authorize: either an authenticated owner (RLS scopes them to their own
    // documents), or a request carrying the document's unguessable signing
    // token. Without one of these we refuse — previously ANY lease PDF
    // (including signed copies) was served by id alone.
    let authorized = false;
    try {
      const authClient = await createAuthenticatedClient();
      const {
        data: { user },
      } = await authClient.auth.getUser();
      if (user) {
        const { data: owned } = await authClient
          .from("lease_documents")
          .select("id")
          .eq("id", leaseDocumentId)
          .maybeSingle();
        if (owned) authorized = true;
      }
    } catch {
      // Supabase not configured or no session — fall through to the token check.
    }

    const supabase = getServiceClient();

    if (!authorized) {
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const { data: match } = await supabase
        .from("lease_documents")
        .select("id")
        .eq("id", leaseDocumentId)
        .eq("signing_token", token)
        .maybeSingle();
      if (!match) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Get the lease document to find the file path
    const { data: doc, error: docError } = await supabase
      .from("lease_documents")
      .select("original_file_path, signed_file_path")
      .eq("id", leaseDocumentId)
      .maybeSingle();

    if (docError || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Prefer signed PDF, fall back to original
    const filePath = doc.signed_file_path ?? doc.original_file_path;
    if (!filePath) {
      return NextResponse.json({ error: "No file available" }, { status: 404 });
    }

    // Get file extension
    const ext = filePath.split(".").pop()?.toLowerCase() ?? "pdf";

    // Check if it's a PDF
    if (ext !== "pdf") {
      return NextResponse.json({
        error: "NOT_PDF",
        message: "This document is not a PDF. Please upload a PDF version for the Review & Sign flow.",
        fileType: ext
      }, { status: 400 });
    }

    // Download the file from storage
    const { data: fileData, error: dlError } = await supabase.storage
      .from("lease-documents")
      .download(filePath);

    if (dlError || !fileData) {
      console.error("PDF download error:", dlError);
      return NextResponse.json({ error: "Failed to load PDF" }, { status: 500 });
    }

    // Convert to array buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const contentType = MIME_TYPES[ext] ?? "application/pdf";

    // Return PDF with inline content disposition
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("PDF proxy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
