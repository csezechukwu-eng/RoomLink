"use client";

import * as React from "react";
import { useActionState } from "react";
import { X, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type {
  LeaseTemplateField,
  LeaseTemplateFieldType,
  LeaseTemplateFieldAssignedTo,
} from "@/lib/types";
import {
  FIELD_TYPE_OPTIONS,
  ASSIGNED_TO_OPTIONS,
} from "@/lib/leaseTemplateFieldOptions";
import { editTemplateField, removeTemplateField } from "@/lib/actions/leaseTemplateFields";
import { initialActionState } from "@/lib/actions/types";

interface FieldEditorPanelProps {
  field: LeaseTemplateField;
  onUpdate: (field: LeaseTemplateField) => void;
  onDelete: (fieldId: string) => void;
  onClose: () => void;
}

export function FieldEditorPanel({
  field,
  onUpdate,
  onDelete,
  onClose,
}: FieldEditorPanelProps) {
  const [updateState, updateAction, isUpdating] = useActionState(
    editTemplateField,
    initialActionState
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    removeTemplateField,
    initialActionState
  );

  const [fieldType, setFieldType] = React.useState<LeaseTemplateFieldType>(field.field_type);
  const [label, setLabel] = React.useState(field.label);
  const [required, setRequired] = React.useState(field.required);
  const [assignedTo, setAssignedTo] = React.useState<LeaseTemplateFieldAssignedTo>(field.assigned_to);
  const [pageNumber, setPageNumber] = React.useState(field.page_number?.toString() ?? "");
  const [xPos, setXPos] = React.useState(field.x?.toFixed(1) ?? "5");
  const [yPos, setYPos] = React.useState(field.y?.toFixed(1) ?? "5");
  const [placementNote, setPlacementNote] = React.useState(field.placement_note ?? "");
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  // Track if changes were made
  const hasChanges =
    fieldType !== field.field_type ||
    label !== field.label ||
    required !== field.required ||
    assignedTo !== field.assigned_to ||
    (pageNumber !== (field.page_number?.toString() ?? "")) ||
    (xPos !== (field.x?.toFixed(1) ?? "5")) ||
    (yPos !== (field.y?.toFixed(1) ?? "5")) ||
    placementNote !== (field.placement_note ?? "");

  // Reset form when field changes
  React.useEffect(() => {
    setFieldType(field.field_type);
    setLabel(field.label);
    setRequired(field.required);
    setAssignedTo(field.assigned_to);
    setPageNumber(field.page_number?.toString() ?? "");
    setXPos(field.x?.toFixed(1) ?? "5");
    setYPos(field.y?.toFixed(1) ?? "5");
    setPlacementNote(field.placement_note ?? "");
    setConfirmDelete(false);
  }, [field]);

  // Handle successful update
  const updateStatusRef = React.useRef(updateState.status);
  React.useEffect(() => {
    // Only trigger on status change to "success"
    if (updateState.status === "success" && updateStatusRef.current !== "success") {
      onUpdate({
        ...field,
        field_type: fieldType,
        label,
        required,
        assigned_to: assignedTo,
        page_number: pageNumber ? parseInt(pageNumber, 10) : null,
        x: xPos ? parseFloat(xPos) : null,
        y: yPos ? parseFloat(yPos) : null,
        placement_note: placementNote || null,
      });
    }
    updateStatusRef.current = updateState.status;
  }, [updateState.status, field, fieldType, label, required, assignedTo, pageNumber, xPos, yPos, placementNote, onUpdate]);

  // Handle successful delete
  React.useEffect(() => {
    if (deleteState.status === "success") {
      onDelete(field.id);
    }
  }, [deleteState.status, field.id, onDelete]);

  const handleSave = () => {
    const formData = new FormData();
    formData.append("id", field.id);
    formData.append("field_type", fieldType);
    formData.append("label", label);
    formData.append("required", required ? "true" : "false");
    formData.append("assigned_to", assignedTo);
    if (pageNumber) formData.append("page_number", pageNumber);
    if (xPos) formData.append("x", xPos);
    if (yPos) formData.append("y", yPos);
    if (field.width) formData.append("width", field.width.toString());
    if (field.height) formData.append("height", field.height.toString());
    if (placementNote) formData.append("placement_note", placementNote);

    updateAction(formData);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    const formData = new FormData();
    formData.append("id", field.id);
    deleteAction(formData);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <div>
          <h3 className="font-medium text-slate-900">Edit Field</h3>
          <p className="mt-0.5 text-xs text-slate-500 font-mono">
            {field.field_key ?? "No key"}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Field Type */}
        <div className="space-y-2">
          <Label htmlFor="edit_field_type">Field Type</Label>
          <Select
            id="edit_field_type"
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value as LeaseTemplateFieldType)}
          >
            {FIELD_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Label */}
        <div className="space-y-2">
          <Label htmlFor="edit_label">Label</Label>
          <Input
            id="edit_label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Tenant Signature"
          />
        </div>

        {/* Assigned To */}
        <div className="space-y-2">
          <Label htmlFor="edit_assigned_to">Assigned To</Label>
          <Select
            id="edit_assigned_to"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value as LeaseTemplateFieldAssignedTo)}
          >
            {ASSIGNED_TO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Required */}
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <input
            type="checkbox"
            id="edit_required"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <div>
            <Label htmlFor="edit_required" className="font-medium">
              Required Field
            </Label>
            <p className="text-xs text-slate-500">
              Signer must complete this field.
            </p>
          </div>
        </div>

        {/* Page Number */}
        <div className="space-y-2">
          <Label htmlFor="edit_page_number">Page Number</Label>
          <Input
            id="edit_page_number"
            type="number"
            min={1}
            value={pageNumber}
            onChange={(e) => setPageNumber(e.target.value)}
            placeholder="e.g., 1"
          />
        </div>

        {/* Position (X/Y) */}
        <div className="space-y-2">
          <Label>Position (% from top-left)</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="edit_x" className="text-xs text-slate-500">X</label>
              <Input
                id="edit_x"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={xPos}
                onChange={(e) => setXPos(e.target.value)}
                placeholder="0-100"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="edit_y" className="text-xs text-slate-500">Y</label>
              <Input
                id="edit_y"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={yPos}
                onChange={(e) => setYPos(e.target.value)}
                placeholder="0-100"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400">
            Or drag the field on the document to reposition.
          </p>
        </div>

        {/* Placement Note */}
        <div className="space-y-2">
          <Label htmlFor="edit_placement_note">Placement Note</Label>
          <Textarea
            id="edit_placement_note"
            rows={2}
            value={placementNote}
            onChange={(e) => setPlacementNote(e.target.value)}
            placeholder="e.g., Bottom right of signature block"
          />
        </div>

        {/* Error Messages */}
        {updateState.status === "error" && (
          <p className="text-sm text-red-600">{updateState.message}</p>
        )}
        {deleteState.status === "error" && (
          <p className="text-sm text-red-600">{deleteState.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 border-t border-slate-200 p-4 space-y-2">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isUpdating || !label.trim()}
          className="w-full"
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={handleDelete}
          disabled={isDeleting}
          className={`w-full ${confirmDelete ? "text-red-600 hover:bg-red-50" : ""}`}
        >
          {isDeleting ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="mr-1.5 h-4 w-4" />
              {confirmDelete ? "Click again to confirm" : "Delete Field"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
