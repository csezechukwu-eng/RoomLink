"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
  Move,
  PenTool,
  Type,
  Calendar,
  User,
  Mail,
  Phone,
  AlignLeft,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfViewer } from "@/components/pdf/PdfViewer";
import { fetchTemplatePdfUrl } from "@/lib/actions/leaseTemplates";
import type { LeaseTemplateWithProperty, LeaseTemplateField, LeaseTemplateFieldType } from "@/lib/types";
import { getFieldTypeOption } from "@/lib/leaseTemplateFieldOptions";

const FIELD_ICONS: Record<LeaseTemplateFieldType, React.ReactNode> = {
  tenant_signature: <PenTool className="h-3 w-3" />,
  tenant_initials: <Type className="h-3 w-3" />,
  date_signed: <Calendar className="h-3 w-3" />,
  tenant_full_name: <User className="h-3 w-3" />,
  email: <Mail className="h-3 w-3" />,
  phone: <Phone className="h-3 w-3" />,
  text: <AlignLeft className="h-3 w-3" />,
  checkbox: <CheckSquare className="h-3 w-3" />,
};

const FIELD_COLORS: Record<LeaseTemplateFieldType, string> = {
  tenant_signature: "border-indigo-400 bg-indigo-50/90 text-indigo-700",
  tenant_initials: "border-violet-400 bg-violet-50/90 text-violet-700",
  date_signed: "border-blue-400 bg-blue-50/90 text-blue-700",
  tenant_full_name: "border-emerald-400 bg-emerald-50/90 text-emerald-700",
  email: "border-cyan-400 bg-cyan-50/90 text-cyan-700",
  phone: "border-teal-400 bg-teal-50/90 text-teal-700",
  text: "border-slate-400 bg-slate-50/90 text-slate-700",
  checkbox: "border-amber-400 bg-amber-50/90 text-amber-700",
};

export interface OverlayInfo {
  element: HTMLDivElement;
  pageNumber: number;
}

interface DocumentCanvasProps {
  template: LeaseTemplateWithProperty;
  fields: LeaseTemplateField[];
  selectedFieldId: string | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  onFieldSelect: (field: LeaseTemplateField | null) => void;
  onFieldPositionUpdate?: (fieldId: string, x: number, y: number, pageNumber: number) => void;
  onDropField?: (fieldType: LeaseTemplateFieldType, x: number, y: number, pageNumber: number, width: number, height: number) => void;
  isDraggingFromPalette?: boolean;
  onOverlayRef?: (info: OverlayInfo | null) => void;
}

export function DocumentCanvas({
  template,
  fields,
  selectedFieldId,
  currentPage,
  onPageChange,
  onFieldSelect,
  onFieldPositionUpdate,
  isDraggingFromPalette = false,
  onOverlayRef,
}: DocumentCanvasProps) {
  const [zoom, setZoom] = React.useState(100);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [pdfError, setPdfError] = React.useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = React.useState(true);
  const [numPages, setNumPages] = React.useState(1);
  const [draggingField, setDraggingField] = React.useState<string | null>(null);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });

  // Store page dimensions from the last render
  const pageDimensionsRef = React.useRef({ width: 612, height: 792 });
  const overlayRef = React.useRef<HTMLDivElement | null>(null);

  // Calculate scaled width based on zoom
  const scaledWidth = Math.round((612 * zoom) / 100);

  // Fetch PDF URL on mount
  React.useEffect(() => {
    let active = true;
    setLoadingPdf(true);
    setPdfError(null);

    fetchTemplatePdfUrl(template.id).then((result) => {
      if (!active) return;
      if (result.error) {
        setPdfError(result.error);
        setLoadingPdf(false);
      } else if (result.url) {
        setPdfUrl(result.url);
      } else {
        setPdfError("Could not load document");
        setLoadingPdf(false);
      }
    });

    return () => {
      active = false;
    };
  }, [template.id]);

  // Filter fields for current page
  const pageFields = fields.filter(
    (f) => f.page_number === null || f.page_number === currentPage
  );

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));

  // Handle field drag start (for repositioning existing fields)
  const handleFieldMouseDown = (
    e: React.MouseEvent,
    field: LeaseTemplateField
  ) => {
    e.stopPropagation();
    e.preventDefault();
    onFieldSelect(field);

    // Start dragging - record offset from field's top-left corner
    const fieldRect = e.currentTarget.getBoundingClientRect();
    setDraggingField(field.id);
    setDragOffset({
      x: e.clientX - fieldRect.left,
      y: e.clientY - fieldRect.top,
    });
  };

  // Handle field drag move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingField || !onFieldPositionUpdate) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;

    // Calculate new position relative to container
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    // Convert to percentage coordinates (0-100)
    const xPercent = Math.max(0, Math.min(100, (newX / containerWidth) * 100));
    const yPercent = Math.max(0, Math.min(100, (newY / containerHeight) * 100));

    onFieldPositionUpdate(draggingField, xPercent, yPercent, currentPage);
  };

  // Handle field drag end
  const handleMouseUp = () => {
    setDraggingField(null);
  };

  // Render field overlays on the PDF
  const renderOverlay = (
    _pageIndex: number,
    pWidth: number,
    pHeight: number
  ) => {
    // Store dimensions for coordinate calculations (don't set state in render)
    pageDimensionsRef.current = { width: pWidth, height: pHeight };

    return (
      <div
        ref={(el) => {
          overlayRef.current = el;
          // Notify parent of the overlay element
          if (el) {
            console.log("[DocumentCanvas] Setting overlay ref for page:", currentPage, "element:", el.tagName);
            onOverlayRef?.({ element: el, pageNumber: currentPage });
          } else {
            console.log("[DocumentCanvas] Clearing overlay ref");
            onOverlayRef?.(null);
          }
        }}
        data-pdf-overlay="true"
        data-page-number={currentPage}
        className={`absolute inset-0 transition-colors ${
          isDraggingFromPalette
            ? "bg-indigo-50/30 ring-2 ring-inset ring-dashed ring-indigo-400 cursor-copy"
            : "cursor-crosshair"
        }`}
        style={{ pointerEvents: "auto" }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {pageFields.map((field) => {
          const isSelected = field.id === selectedFieldId;
          const isDragging = field.id === draggingField;
          const colorClass = FIELD_COLORS[field.field_type];
          const option = getFieldTypeOption(field.field_type);

          // Get stored position (percentage 0-100) or place in sequence
          const storedX = field.x ?? 5;
          const storedY = field.y ?? (5 + pageFields.indexOf(field) * 8);
          const storedWidth = field.width ?? option?.defaultWidth ?? 20;
          const storedHeight = field.height ?? option?.defaultHeight ?? 4;

          // Convert percentages to pixels for rendering
          const x = (storedX / 100) * pWidth;
          const y = (storedY / 100) * pHeight;
          const width = (storedWidth / 100) * pWidth;
          const height = (storedHeight / 100) * pHeight;

          return (
            <div
              key={field.id}
              className={`absolute flex cursor-move items-center gap-1 rounded border-2 px-1.5 py-0.5 text-left transition-shadow ${colorClass} ${
                isSelected
                  ? "ring-2 ring-indigo-500 ring-offset-1 shadow-lg z-10"
                  : "hover:ring-2 hover:ring-indigo-300 hover:shadow-md"
              } ${isDragging ? "opacity-75 z-20" : ""}`}
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${width}px`,
                minHeight: `${height}px`,
              }}
              onMouseDown={(e) => handleFieldMouseDown(e, field)}
              onClick={(e) => {
                e.stopPropagation();
                onFieldSelect(field);
              }}
            >
              <span className="flex-shrink-0">{FIELD_ICONS[field.field_type]}</span>
              <div className="min-w-0 flex-1 overflow-hidden">
                <span className="block truncate text-[10px] font-medium leading-tight">
                  {field.label}
                </span>
                <span className="block truncate text-[8px] opacity-70 font-mono">
                  {field.field_key ?? "—"}
                </span>
              </div>
              {field.required && (
                <span className="flex-shrink-0 text-[10px] font-bold text-red-500">*</span>
              )}
              {isSelected && (
                <Move className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-white text-slate-500" />
              )}
            </div>
          );
        })}

        {/* Drag hint when dragging from palette */}
        {isDraggingFromPalette && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-lg bg-indigo-600 px-6 py-3 text-center shadow-xl">
              <p className="text-sm font-semibold text-white">
                Release to place field here
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {pageFields.length === 0 && !isDraggingFromPalette && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-lg bg-white/80 px-6 py-4 text-center shadow-sm backdrop-blur-sm">
              <p className="text-sm font-medium text-slate-600">
                No fields on this page
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Click and drag fields from the left panel
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Cleanup overlay ref on unmount
  React.useEffect(() => {
    return () => {
      onOverlayRef?.(null);
    };
  }, [onOverlayRef]);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-slate-600">
            Page {currentPage} of {numPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(Math.min(numPages, currentPage + 1))}
            disabled={currentPage >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-sm text-slate-600">{zoom}%</span>
          <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto bg-slate-100 p-8">
        <div className="flex justify-center">
          {loadingPdf && !pdfUrl && (
            <div className="flex h-96 w-full max-w-2xl items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
                <p className="mt-2 text-sm text-slate-500">Loading document...</p>
              </div>
            </div>
          )}

          {pdfError && (
            <div className="flex h-96 w-full max-w-2xl items-center justify-center rounded-lg border border-red-200 bg-red-50 shadow-sm">
              <div className="text-center px-8">
                <p className="text-base font-medium text-red-700">Could not load lease preview</p>
                <p className="mt-2 text-sm text-red-600">{pdfError}</p>
                <p className="mt-3 text-xs text-red-500">
                  Check that the uploaded PDF still exists and that your storage permissions are configured correctly.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setPdfError(null);
                    setLoadingPdf(true);
                    fetchTemplatePdfUrl(template.id).then((result) => {
                      if (result.error) {
                        setPdfError(result.error);
                        setLoadingPdf(false);
                      } else if (result.url) {
                        setPdfUrl(result.url);
                      } else {
                        setPdfError("Could not load document");
                        setLoadingPdf(false);
                      }
                    });
                  }}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {pdfUrl && (
            <PdfViewer
              url={pdfUrl}
              width={scaledWidth}
              currentPage={currentPage}
              onPageChange={onPageChange}
              onLoadSuccess={(pages) => {
                setNumPages(pages);
                setLoadingPdf(false);
              }}
              renderOverlay={renderOverlay}
            />
          )}
        </div>
      </div>

      {/* Footer Status */}
      <div className="flex flex-shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4 py-2">
        <p className="text-xs text-slate-500">
          {pageFields.length} field{pageFields.length !== 1 ? "s" : ""} on this page
          {fields.length !== pageFields.length && <> · {fields.length} total</>}
        </p>
        {isDraggingFromPalette && (
          <p className="text-xs font-medium text-indigo-600">
            Release over the document to place the field
          </p>
        )}
      </div>
    </div>
  );
}
