"use client";

import * as React from "react";
import {
  PenTool,
  Type,
  Calendar,
  User,
  Mail,
  Phone,
  AlignLeft,
  CheckSquare,
  GripVertical,
  Loader2,
} from "lucide-react";
import type { LeaseTemplateFieldType } from "@/lib/types";
import {
  FIELD_PALETTE_GROUPS,
  getFieldTypeOption,
} from "@/lib/leaseTemplateFieldOptions";

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

export interface DragFieldData {
  fieldType: LeaseTemplateFieldType;
  label: string;
  required: boolean;
  assignedTo: string;
  width: number;
  height: number;
}

interface FieldPaletteProps {
  templateId: string;
  isPlacing?: boolean;
  activeDragType?: LeaseTemplateFieldType | null;
  onStartDrag?: (data: DragFieldData, startX: number, startY: number) => void;
}

export function FieldPalette({
  isPlacing = false,
  activeDragType = null,
  onStartDrag,
}: FieldPaletteProps) {
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    fieldType: LeaseTemplateFieldType
  ) => {
    if (isPlacing) return;

    const option = getFieldTypeOption(fieldType);
    if (!option) return;

    // Prevent text selection during drag
    e.preventDefault();

    // Start drag with field data
    onStartDrag?.(
      {
        fieldType,
        label: option.defaultLabel,
        required: option.defaultRequired,
        assignedTo: "tenant",
        width: option.defaultWidth,
        height: option.defaultHeight,
      },
      e.clientX,
      e.clientY
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold text-slate-900">Fields</h2>
      <p className="mt-1 text-xs text-slate-500">
        Click and drag a field onto the document.
      </p>

      {/* Active Drag Indicator */}
      {activeDragType && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-2">
          <GripVertical className="h-4 w-4 text-indigo-600" />
          <span className="text-xs font-medium text-indigo-700">
            Dragging: {getFieldTypeOption(activeDragType)?.label}
          </span>
        </div>
      )}

      {isPlacing && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-2">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          <span className="text-xs font-medium text-indigo-700">
            Placing field...
          </span>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {FIELD_PALETTE_GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {group.title}
            </h3>
            <div className="mt-2 space-y-1">
              {group.fields.map((fieldType) => {
                const option = getFieldTypeOption(fieldType);
                if (!option) return null;
                const isDragging = activeDragType === fieldType;

                return (
                  <div
                    key={fieldType}
                    onPointerDown={(e) => handlePointerDown(e, fieldType)}
                    className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all select-none touch-none ${
                      isDragging
                        ? "border-indigo-400 bg-indigo-50 opacity-50"
                        : isPlacing
                          ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-50"
                          : "cursor-grab border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 active:cursor-grabbing"
                    }`}
                  >
                    <GripVertical className="h-4 w-4 flex-shrink-0 text-slate-400" />
                    <span
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded ${
                        isDragging
                          ? "bg-indigo-500 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {FIELD_ICONS[fieldType]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-900">
                        {option.label}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {option.description}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <h4 className="text-xs font-medium text-slate-700">How to place fields</h4>
        <ol className="mt-2 space-y-1 text-xs text-slate-500">
          <li>1. Click and hold a field above</li>
          <li>2. Drag it over the document</li>
          <li>3. Release to place it</li>
          <li>4. Click a placed field to edit</li>
        </ol>
      </div>

      {/* Field requirements info */}
      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <h4 className="text-xs font-medium text-amber-800">Required for Ready status</h4>
        <p className="mt-1 text-xs text-amber-700">
          Add at least one <strong>Signature</strong> field marked as required and assigned to tenant.
        </p>
      </div>
    </div>
  );
}
