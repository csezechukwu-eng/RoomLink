import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedClient, getServiceClient } from "@/lib/supabase/server";

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

    // Download the file from storage
    const { data: fileData, error: dlError } = await supabase.storage
      .from("lease-documents")
      .download(filePath);

    if (dlError || !fileData) {
      console.error("PDF download error:", dlError);
      return NextResponse.json({ error: "Failed to load PDF" }, { status: 500 });
    }

    const arrayBuffer = await fileData.arrayBuffer();

    // Detect a real PDF by its content (the "%PDF-" magic header), not the
    // filename — avoids false positives (a .docx stored as .pdf) and false
    // negatives (a real PDF stored under another extension).
    const head = new TextDecoder("latin1").decode(
      new Uint8Array(arrayBuffer.slice(0, 1024))
    );
    if (!head.includes("%PDF-")) {
      return NextResponse.json(
        {
          error: "NOT_PDF",
          message:
            "This lease's file isn't a PDF. Replace it with a PDF (in Word or Google Docs: File → Save as / Download as PDF) to use Review & Sign.",
        },
        { status: 400 }
      );
    }

    // Return the PDF inline.
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("PDF proxy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
