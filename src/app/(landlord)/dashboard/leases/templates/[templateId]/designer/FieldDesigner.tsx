"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, PenTool, Type, Calendar, User, Mail, Phone, AlignLeft, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LeaseTemplateWithProperty, LeaseTemplateField, LeaseTemplateFieldType } from "@/lib/types";
import { FieldPalette, type DragFieldData } from "./FieldPalette";
import { DocumentCanvas, type OverlayInfo } from "./DocumentCanvas";
import { DesignerSidebar } from "./DesignerSidebar";
import { FieldEditorPanel } from "./FieldEditorPanel";
import { addTemplateField, editTemplateField } from "@/lib/actions/leaseTemplateFields";
import { getFieldTypeOption, generateFieldKey } from "@/lib/leaseTemplateFieldOptions";

const FIELD_ICONS: Record<LeaseTemplateFieldType, React.ReactNode> = {
  tenant_signature: <PenTool className="h-4 w-4" />,
  tenant_initials: <Type className="h-4 w-4" />,
  date_signed: <Calendar className="h-4 w-4" />,
  tenant_full_name: <User className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  text: <AlignLeft className="h-4 w-4" />,
  checkbox: <CheckSquare className="h-4 w-4" />,
};

interface FieldDesignerProps {
  template: LeaseTemplateWithProperty;
  initialFields: LeaseTemplateField[];
  readiness: {
    ready: boolean;
    hasSignature: boolean;
    fieldCount: number;
  };
}

export function FieldDesigner({
  template,
  initialFields,
  readiness: initialReadiness,
}: FieldDesignerProps) {
  const [fields, setFields] = React.useState<LeaseTemplateField[]>(initialFields);
  const [readiness, setReadiness] = React.useState(initialReadiness);
  const [selectedFieldId, setSelectedFieldId] = React.useState<string | null>(null);
  const [editingField, setEditingField] = React.useState<LeaseTemplateField | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isPlacing, setIsPlacing] = React.useState(false);

  // Pointer-based drag state
  const [activeDrag, setActiveDrag] = React.useState<DragFieldData | null>(null);
  const [dragPosition, setDragPosition] = React.useState({ x: 0, y: 0 });
  const overlayInfoRef = React.useRef<OverlayInfo | null>(null);

  // Use refs to avoid stale closures in event handlers
  const isPlacingRef = React.useRef(false);
  const fieldsRef = React.useRef(fields);

  // Keep refs in sync with state
  React.useEffect(() => {
    fieldsRef.current = fields;
  }, [fields]);

  // Update fields list when a field is added/edited/deleted
  const handleFieldsChange = React.useCallback((newFields: LeaseTemplateField[]) => {
    setFields(newFields);
    // Recalculate readiness
    const hasSignature = newFields.some(
      (f) =>
        f.field_type === "tenant_signature" &&
        f.required &&
        f.assigned_to === "tenant"
    );
    setReadiness({
      ready: hasSignature,
      hasSignature,
      fieldCount: newFields.length,
    });
  }, []);

  const handleFieldSelect = (field: LeaseTemplateField | null) => {
    setSelectedFieldId(field?.id ?? null);
    setEditingField(field);
  };

  const handleFieldAdd = React.useCallback((field: LeaseTemplateField) => {
    setFields(prev => {
      const newFields = [...prev, field];
      // Recalculate readiness
      const hasSignature = newFields.some(
        (f) =>
          f.field_type === "tenant_signature" &&
          f.required &&
          f.assigned_to === "tenant"
      );
      setReadiness({
        ready: hasSignature,
        hasSignature,
        fieldCount: newFields.length,
      });
      return newFields;
    });
    setSelectedFieldId(field.id);
    setEditingField(field);
  }, []);

  const handleFieldUpdate = (updatedField: LeaseTemplateField) => {
    const newFields = fields.map((f) =>
      f.id === updatedField.id ? updatedField : f
    );
    handleFieldsChange(newFields);
    setEditingField(updatedField);
  };

  const handleFieldDelete = (fieldId: string) => {
    const newFields = fields.filter((f) => f.id !== fieldId);
    handleFieldsChange(newFields);
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
      setEditingField(null);
    }
  };

  // Handle placing a new field at a specific position on the PDF
  // Uses optimistic UI: show field immediately, then persist to server
  const handlePlaceField = React.useCallback(async (
    fieldType: LeaseTemplateFieldType,
    x: number,
    y: number,
    pageNumber: number,
    width: number,
    height: number
  ) => {
    // Use ref to prevent double-placement (avoids stale closure issues)
    if (isPlacingRef.current) {
      console.log("[FieldDesigner] Skipping - already placing");
      return;
    }

    const option = getFieldTypeOption(fieldType);
    if (!option) {
      console.error("[FieldDesigner] No option found for field type:", fieldType);
      return;
    }

    console.log("[FieldDesigner] Placing field:", { fieldType, x, y, pageNumber, width, height });

    // Mark as placing
    isPlacingRef.current = true;
    setIsPlacing(true);

    // Generate temporary ID and field key for optimistic UI
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const existingKeys = fieldsRef.current.map(f => f.field_key).filter(Boolean) as string[];
    const tempFieldKey = generateFieldKey(fieldType, existingKeys);

    // Create optimistic field (show immediately)
    const optimisticField: LeaseTemplateField = {
      id: tempId,
      lease_template_id: template.id,
      owner_id: "",
      field_key: tempFieldKey,
      field_type: fieldType,
      label: option.defaultLabel,
      required: option.defaultRequired,
      assigned_to: "tenant",
      page_number: pageNumber,
      x: x,
      y: y,
      width: width,
      height: height,
      placement_note: null,
      sort_order: fieldsRef.current.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add field to state immediately (optimistic)
    console.log("[FieldDesigner] Adding optimistic field:", optimisticField.id);
    handleFieldAdd(optimisticField);

    try {
      // Create form data for the server action
      const formData = new FormData();
      formData.append("lease_template_id", template.id);
      formData.append("field_type", fieldType);
      formData.append("label", option.defaultLabel);
      formData.append("required", option.defaultRequired ? "true" : "false");
      formData.append("assigned_to", "tenant");
      formData.append("page_number", pageNumber.toString());
      formData.append("x", x.toString());
      formData.append("y", y.toString());
      formData.append("width", width.toString());
      formData.append("height", height.toString());

      // Call the server action directly
      console.log("[FieldDesigner] Calling addTemplateField...");
      const result = await addTemplateField({ status: "idle", message: "" }, formData);
      console.log("[FieldDesigner] Server response:", result);

      if (result.status === "success" && result.data) {
        // Update the optimistic field with the real ID and field_key from server
        const realId = result.data.id as string;
        const realFieldKey = result.data.field_key as string;

        console.log("[FieldDesigner] Success! Updating temp ID", tempId, "to real ID", realId);

        setFields(prev => prev.map(f =>
          f.id === tempId
            ? { ...f, id: realId, field_key: realFieldKey }
            : f
        ));

        // Update selection to the real ID
        setSelectedFieldId(realId);
        setEditingField(prev =>
          prev?.id === tempId
            ? { ...prev, id: realId, field_key: realFieldKey }
            : prev
        );
      } else {
        // Server error - remove the optimistic field
        const errorMsg = result.message || "Unknown error";
        console.error("[FieldDesigner] Server error:", errorMsg);

        setFields(prev => prev.filter(f => f.id !== tempId));
        setSelectedFieldId(null);
        setEditingField(null);

        // Could show a toast notification here
        alert(`Failed to save field: ${errorMsg}`);
      }
    } catch (error) {
      // Network error - remove the optimistic field
      console.error("[FieldDesigner] Error placing field:", error);

      setFields(prev => prev.filter(f => f.id !== tempId));
      setSelectedFieldId(null);
      setEditingField(null);

      alert("Network error: Failed to save field. Please try again.");
    } finally {
      isPlacingRef.current = false;
      setIsPlacing(false);
    }
  }, [template.id, handleFieldAdd]);

  // Handle dragging a field to update its position
  const handleFieldPositionUpdate = React.useCallback(
    (fieldId: string, x: number, y: number, pageNumber: number) => {
      // Update local state immediately for smooth dragging
      setFields(prev => prev.map((f) =>
        f.id === fieldId
          ? { ...f, x, y, page_number: pageNumber }
          : f
      ));

      // Also update the editing field if it's the one being dragged
      setEditingField(prev =>
        prev?.id === fieldId
          ? { ...prev, x, y, page_number: pageNumber }
          : prev
      );
    },
    []
  );

  // Save position to server when drag ends (debounced)
  const savePositionTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const handleFieldPositionSave = React.useCallback(
    (fieldId: string, x: number, y: number, pageNumber: number) => {
      // Clear any pending save
      if (savePositionTimeoutRef.current) {
        clearTimeout(savePositionTimeoutRef.current);
      }

      // Debounce the save
      savePositionTimeoutRef.current = setTimeout(async () => {
        const field = fields.find((f) => f.id === fieldId);
        if (!field) return;

        const formData = new FormData();
        formData.append("id", fieldId);
        formData.append("field_type", field.field_type);
        formData.append("label", field.label);
        formData.append("required", field.required ? "true" : "false");
        formData.append("assigned_to", field.assigned_to);
        formData.append("page_number", pageNumber.toString());
        formData.append("x", x.toString());
        formData.append("y", y.toString());
        if (field.width) formData.append("width", field.width.toString());
        if (field.height) formData.append("height", field.height.toString());
        if (field.placement_note) formData.append("placement_note", field.placement_note);

        try {
          await editTemplateField({ status: "idle", message: "" }, formData);
        } catch {
          // Position update failed silently - field is still shown at correct position locally
        }
      }, 500);
    },
    [fields]
  );

  // Combined handler that updates locally and saves
  const handleFieldDrag = React.useCallback(
    (fieldId: string, x: number, y: number, pageNumber: number) => {
      handleFieldPositionUpdate(fieldId, x, y, pageNumber);
      handleFieldPositionSave(fieldId, x, y, pageNumber);
    },
    [handleFieldPositionUpdate, handleFieldPositionSave]
  );

  // Start dragging from palette
  const handleStartDrag = React.useCallback((data: DragFieldData, startX: number, startY: number) => {
    setActiveDrag(data);
    setDragPosition({ x: startX, y: startY });
    // Clear selection when starting to drag
    setSelectedFieldId(null);
    setEditingField(null);
  }, []);

  // Handle overlay ref from DocumentCanvas
  const handleOverlayRef = React.useCallback((info: OverlayInfo | null) => {
    overlayInfoRef.current = info;
  }, []);

  // Store handlePlaceField in a ref to avoid stale closures
  const handlePlaceFieldRef = React.useRef(handlePlaceField);
  React.useEffect(() => {
    handlePlaceFieldRef.current = handlePlaceField;
  }, [handlePlaceField]);

  // Global pointer event handlers for drag
  React.useEffect(() => {
    if (!activeDrag) return;

    console.log("[FieldDesigner] Setting up drag handlers for:", activeDrag.fieldType);

    const handlePointerMove = (e: PointerEvent) => {
      setDragPosition({ x: e.clientX, y: e.clientY });
    };

    const handlePointerUp = (e: PointerEvent) => {
      console.log("[FieldDesigner] Pointer up at:", e.clientX, e.clientY);

      const overlay = overlayInfoRef.current;
      console.log("[FieldDesigner] Overlay ref:", overlay ? "exists" : "null");

      if (overlay && overlay.element) {
        const rect = overlay.element.getBoundingClientRect();
        console.log("[FieldDesigner] Overlay rect:", { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height });

        const isOverOverlay =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;

        console.log("[FieldDesigner] Is over overlay:", isOverOverlay);

        if (isOverOverlay) {
          // Calculate position relative to overlay
          const dropX = e.clientX - rect.left;
          const dropY = e.clientY - rect.top;
          const containerWidth = rect.width;
          const containerHeight = rect.height;

          // Convert to percentage coordinates (0-100)
          // Center the field on the drop point
          const halfWidthPx = (activeDrag.width / 100) * containerWidth / 2;
          const halfHeightPx = (activeDrag.height / 100) * containerHeight / 2;

          const adjustedX = dropX - halfWidthPx;
          const adjustedY = dropY - halfHeightPx;

          const xPercent = Math.max(0, Math.min(100 - activeDrag.width, (adjustedX / containerWidth) * 100));
          const yPercent = Math.max(0, Math.min(100 - activeDrag.height, (adjustedY / containerHeight) * 100));

          console.log("[FieldDesigner] Calculated position:", { xPercent, yPercent, pageNumber: overlay.pageNumber });

          // Place the field using the ref to avoid stale closure
          handlePlaceFieldRef.current(
            activeDrag.fieldType,
            xPercent,
            yPercent,
            overlay.pageNumber,
            activeDrag.width,
            activeDrag.height
          );
        } else {
          console.log("[FieldDesigner] Drop was outside overlay");
        }
      } else {
        console.warn("[FieldDesigner] No overlay element available for drop");
      }

      // End drag
      setActiveDrag(null);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);

    return () => {
      console.log("[FieldDesigner] Cleaning up drag handlers");
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [activeDrag]); // Note: removed handlePlaceField from deps, using ref instead

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/leases/applications">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Field Designer
            </h1>
            <p className="text-sm text-slate-500">{template.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              readiness.ready
                ? "bg-emerald-50 text-emerald-700"
                : template.status === "archived"
                  ? "bg-slate-100 text-slate-500"
                  : "bg-amber-50 text-amber-700"
            }`}
          >
            {readiness.ready
              ? "Ready"
              : template.status === "archived"
                ? "Archived"
                : "Needs setup"}
          </span>
          {isPlacing && (
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Placing...
            </div>
          )}
          <Button size="sm" variant="outline" disabled>
            <Save className="mr-1.5 h-4 w-4" />
            Auto-saved
          </Button>
        </div>
      </header>

      {/* Main Content - Three Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Field Palette */}
        <aside className="w-64 flex-shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
          <FieldPalette
            templateId={template.id}
            isPlacing={isPlacing}
            activeDragType={activeDrag?.fieldType ?? null}
            onStartDrag={handleStartDrag}
          />
        </aside>

        {/* Center - Document Canvas */}
        <main className="flex-1 overflow-auto bg-slate-100">
          <DocumentCanvas
            template={template}
            fields={fields}
            selectedFieldId={selectedFieldId}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onFieldSelect={handleFieldSelect}
            onFieldPositionUpdate={handleFieldDrag}
            isDraggingFromPalette={!!activeDrag}
            onOverlayRef={handleOverlayRef}
          />
        </main>

        {/* Right Sidebar - Field Editor & Status */}
        <aside className="w-80 flex-shrink-0 overflow-y-auto border-l border-slate-200 bg-white">
          {editingField ? (
            <FieldEditorPanel
              field={editingField}
              onUpdate={handleFieldUpdate}
              onDelete={handleFieldDelete}
              onClose={() => {
                setEditingField(null);
                setSelectedFieldId(null);
              }}
            />
          ) : (
            <DesignerSidebar
              template={template}
              fields={fields}
              readiness={readiness}
              onFieldSelect={handleFieldSelect}
            />
          )}
        </aside>
      </div>

      {/* Floating Drag Preview */}
      {activeDrag && (
        <div
          className="pointer-events-none fixed z-50 flex items-center gap-2 rounded-lg border-2 border-indigo-400 bg-indigo-50 px-3 py-2 shadow-xl"
          style={{
            left: dragPosition.x + 12,
            top: dragPosition.y + 12,
          }}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500 text-white">
            {FIELD_ICONS[activeDrag.fieldType]}
          </span>
          <span className="text-sm font-medium text-indigo-700">
            {activeDrag.label}
          </span>
        </div>
      )}
    </div>
  );
}
