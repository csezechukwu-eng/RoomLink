"use client";

import * as React from "react";
import { Loader2, ExternalLink, FileWarning, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfViewerProps {
  url: string;
  width?: number;
  onLoadSuccess?: (numPages: number) => void;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  renderOverlay?: (pageIndex: number, pageWidth: number, pageHeight: number) => React.ReactNode;
  onNotPdf?: () => void;
}

export function PdfViewer({
  url,
  width = 650,
  onLoadSuccess,
  onPageChange,
  currentPage = 1,
  renderOverlay,
  onNotPdf,
}: PdfViewerProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notPdf, setNotPdf] = React.useState(false);

  // Standard letter size aspect ratio (8.5 x 11)
  const height = Math.round(width * (11 / 8.5));

  React.useEffect(() => {
    // Check if the API returns an error (like NOT_PDF)
    const checkPdf = async () => {
      try {
        const response = await fetch(url, { method: "HEAD" });
        if (!response.ok) {
          // Try to get the error details
          const fullResponse = await fetch(url);
          if (fullResponse.headers.get("content-type")?.includes("application/json")) {
            const data = await fullResponse.json();
            if (data.error === "NOT_PDF") {
              setNotPdf(true);
              setLoading(false);
              onNotPdf?.();
              return;
            }
          }
          setError("Failed to load document");
          setLoading(false);
          return;
        }
        // PDF is valid, let it load
        setTimeout(() => {
          setLoading(false);
          onLoadSuccess?.(1);
        }, 1000);
      } catch (err) {
        setError("Failed to load document");
        setLoading(false);
      }
    };
    checkPdf();
  }, [url, onLoadSuccess, onNotPdf]);

  if (notPdf) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-8 text-center"
        style={{ width, minHeight: 300 }}
      >
        <FileWarning className="mb-4 h-12 w-12 text-amber-500" />
        <h3 className="text-lg font-semibold text-amber-800">PDF Required for Signing</h3>
        <p className="mt-2 max-w-md text-sm text-amber-700">
          The uploaded document is not a PDF. To use the Review & Sign feature with signature placement,
          please replace the document with a PDF version.
        </p>
        <p className="mt-4 text-xs text-amber-600">
          You can convert your document to PDF using Microsoft Word, Google Docs, or any PDF converter.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center"
        style={{ width, minHeight: 300 }}
      >
        <FileWarning className="mb-4 h-10 w-10 text-red-400" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm"
        style={{ width, height }}
      >
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-100">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
              <p className="mt-2 text-sm text-slate-500">Loading PDF...</p>
            </div>
          </div>
        )}

        {/* PDF using object tag - renders inline */}
        <object
          data={url}
          type="application/pdf"
          width={width}
          height={height}
          className="block"
        >
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
            <p className="text-slate-600">Unable to display PDF inline.</p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open PDF in new tab
            </a>
          </div>
        </object>

        {/* Signature overlay - positioned over the PDF */}
        {renderOverlay && !loading && (
          <div
            className="pointer-events-auto absolute left-0 top-0 z-10"
            style={{ width, height }}
          >
            {renderOverlay(currentPage - 1, width, height)}
          </div>
        )}
      </div>

      {/* Fallback link */}
      <div className="mt-3">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open PDF in new tab
        </a>
      </div>
    </div>
  );
}
