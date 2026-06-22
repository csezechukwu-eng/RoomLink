"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  Loader2,
  ExternalLink,
  FileWarning,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { DocumentProps, PageProps } from "react-pdf";

/**
 * react-pdf renders the PDF to a <canvas> of a known size, so a signature
 * overlay placed at (0,0) with the same width/height lines up pixel-for-pixel
 * with the page. (The previous <object> embed let the browser add its own
 * toolbar/margins/zoom, so overlay coordinates did not map to the real page —
 * which is why stamped signatures landed in the wrong place.)
 *
 * pdf.js touches browser-only APIs, so the Document/Page components are loaded
 * client-side only (ssr: false) and the worker is configured in a client effect.
 */
const Document = dynamic<DocumentProps>(
  () => import("react-pdf").then((m) => m.Document),
  { ssr: false }
);
const Page = dynamic<PageProps>(
  () => import("react-pdf").then((m) => m.Page),
  { ssr: false }
);

interface PdfViewerProps {
  url: string;
  width?: number;
  onLoadSuccess?: (numPages: number) => void;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  /** Rendered with the REAL page pixel size so callers can place overlays. */
  renderOverlay?: (
    pageIndex: number,
    pageWidth: number,
    pageHeight: number
  ) => React.ReactNode;
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
  const [workerReady, setWorkerReady] = React.useState(false);
  const [fileData, setFileData] = React.useState<Uint8Array | null>(null);
  const [numPages, setNumPages] = React.useState(0);
  const [pageHeight, setPageHeight] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notPdf, setNotPdf] = React.useState(false);

  // Hold callbacks in a ref so the fetch effect doesn't re-run when a parent
  // passes new inline callback identities each render.
  const cb = React.useRef({ onLoadSuccess, onNotPdf, onPageChange });
  React.useEffect(() => {
    cb.current = { onLoadSuccess, onNotPdf, onPageChange };
  });

  // Configure the pdf.js worker once, on the client only.
  React.useEffect(() => {
    let active = true;
    import("react-pdf").then(({ pdfjs }) => {
      if (!active) return;
      // Self-hosted worker (public/pdf.worker.min.mjs), kept in sync with the
      // installed pdfjs-dist version — no external CDN dependency at runtime.
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      setWorkerReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Fetch the document bytes (and detect the API's NOT_PDF JSON response).
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setNotPdf(false);
    setFileData(null);
    setNumPages(0);
    setPageHeight(0);

    (async () => {
      try {
        const res = await fetch(url);
        const contentType = res.headers.get("content-type") ?? "";

        if (contentType.includes("application/json")) {
          const data = await res.json().catch(() => null);
          if (data?.error === "NOT_PDF") {
            if (active) {
              setNotPdf(true);
              setLoading(false);
              cb.current.onNotPdf?.();
            }
            return;
          }
          if (active) {
            setError("Failed to load document");
            setLoading(false);
          }
          return;
        }

        if (!res.ok) {
          if (active) {
            setError("Failed to load document");
            setLoading(false);
          }
          return;
        }

        const buffer = await res.arrayBuffer();
        if (active) setFileData(new Uint8Array(buffer));
      } catch {
        if (active) {
          setError("Failed to load document");
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [url]);

  // Stable object identity so react-pdf doesn't reload on every render.
  const file = React.useMemo(
    () => (fileData ? { data: fileData } : null),
    [fileData]
  );

  const goToPage = (page: number) => {
    if (page < 1 || page > numPages) return;
    cb.current.onPageChange?.(page);
  };

  if (notPdf) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-8 text-center"
        style={{ width, minHeight: 300 }}
      >
        <FileWarning className="mb-4 h-12 w-12 text-amber-500" />
        <h3 className="text-lg font-semibold text-amber-800">PDF Required for Signing</h3>
        <p className="mt-2 max-w-md text-sm text-amber-700">
          The uploaded document is not a PDF. To use the Review &amp; Sign feature with
          signature placement, please replace the document with a PDF version.
        </p>
        <p className="mt-4 text-xs text-amber-600">
          You can convert your document to PDF using Microsoft Word, Google Docs, or any
          PDF converter.
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

  const showLoader = loading || !workerReady || !file;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm"
        style={{
          width,
          minHeight: showLoader ? Math.round(width * (11 / 8.5)) : undefined,
        }}
      >
        {showLoader && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-100">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
              <p className="mt-2 text-sm text-slate-500">Loading PDF…</p>
            </div>
          </div>
        )}

        {file && workerReady && (
          <Document
            file={file}
            loading={null}
            onLoadSuccess={({ numPages: n }) => {
              setNumPages(n);
              setLoading(false);
              cb.current.onLoadSuccess?.(n);
            }}
            onLoadError={() => {
              setError("Failed to render PDF");
              setLoading(false);
            }}
          >
            {/* Page + overlay share one coordinate box of exactly width × pageHeight. */}
            <div className="relative" style={{ width, height: pageHeight || undefined }}>
              <Page
                pageNumber={currentPage}
                width={width}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={null}
                onLoadSuccess={(page) => {
                  const viewport = page.getViewport({ scale: 1 });
                  setPageHeight((viewport.height / viewport.width) * width);
                }}
              />
              {renderOverlay && pageHeight > 0 && (
                <div
                  className="pointer-events-auto absolute left-0 top-0"
                  style={{ width, height: pageHeight }}
                >
                  {renderOverlay(currentPage - 1, width, pageHeight)}
                </div>
              )}
            </div>
          </Document>
        )}
      </div>

      {numPages > 1 && (
        <div className="mt-3 flex items-center gap-4">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span className="text-sm text-slate-500">
            Page {currentPage} of {numPages}
          </span>
          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

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
