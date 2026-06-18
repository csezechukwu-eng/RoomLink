import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

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

  try {
    const supabase = getServiceClient();

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
