"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  FileText,
  ArrowLeft,
  Eye,
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
import type { LeaseTemplateWithProperty, LeaseTemplateField, LeaseTemplateFieldType } from "@/lib/types";
import { getFieldTypeLabel, getAssignedToLabel } from "@/lib/leaseTemplateFieldOptions";

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

interface DesignerSidebarProps {
  template: LeaseTemplateWithProperty;
  fields: LeaseTemplateField[];
  readiness: {
    ready: boolean;
    hasSignature: boolean;
    fieldCount: number;
  };
  onFieldSelect: (field: LeaseTemplateField) => void;
}

export function DesignerSidebar({
  template,
  fields,
  readiness,
  onFieldSelect,
}: DesignerSidebarProps) {
  const statusLabel =
    template.status === "ready"
      ? "Ready"
      : template.status === "archived"
        ? "Archived"
        : "Needs setup";

  const statusStyle =
    template.status === "ready"
      ? "bg-emerald-50 text-emerald-700"
      : template.status === "archived"
        ? "bg-slate-100 text-slate-500"
        : "bg-amber-50 text-amber-700";

  return (
    <div className="flex h-full flex-col">
      {/* Template Info */}
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium text-slate-900">
              {template.title}
            </h3>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {template.file_name}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">Template Status</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Readiness Checklist */}
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-sm font-medium text-slate-900">Template Readiness</h3>
        <ul className="mt-3 space-y-2">
          <ChecklistItem
            checked={Boolean(template.file_path)}
            label="PDF uploaded"
          />
          <ChecklistItem
            checked={readiness.hasSignature}
            label="Tenant signature field"
            warning={!readiness.hasSignature}
          />
          <ChecklistItem
            checked={readiness.fieldCount > 0}
            label="Required fields saved"
          />
          <ChecklistItem
            checked={readiness.ready}
            label="Template ready to use"
          />
        </ul>

        {/* Status Message */}
        <div className="mt-4 rounded-lg border p-3">
          {readiness.ready ? (
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
              <p className="text-sm text-emerald-700">
                Ready to use for applicants.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              <p className="text-sm text-amber-700">
                Add a required tenant signature field to finish setup.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Field List */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-medium text-slate-900">
          Saved Fields ({fields.length})
        </h3>
        {fields.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No fields added yet. Use the palette on the left to add fields.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {fields.map((field) => (
              <li key={field.id}>
                <button
                  type="button"
                  onClick={() => onFieldSelect(field)}
                  className="flex w-full items-start gap-2 rounded-lg border border-slate-200 p-2 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600">
                    {FIELD_ICONS[field.field_type]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-slate-900">
                        {field.label}
                      </span>
                      {field.required && (
                        <span className="flex-shrink-0 text-xs text-red-500">*</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px]">
                        {field.field_key ?? "—"}
                      </span>
                      <span>·</span>
                      <span>{getFieldTypeLabel(field.field_type)}</span>
                      <span>·</span>
                      <span>{getAssignedToLabel(field.assigned_to)}</span>
                      {field.page_number !== null && (
                        <>
                          <span>·</span>
                          <span>Page {field.page_number}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 border-t border-slate-200 p-4 space-y-2">
        <Button variant="outline" size="sm" className="w-full" disabled>
          <Eye className="mr-1.5 h-4 w-4" />
          Preview Template
        </Button>
        <Link href="/dashboard/leases/applications" className="block">
          <Button variant="ghost" size="sm" className="w-full">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to My Lease Applications
          </Button>
        </Link>
      </div>
    </div>
  );
}

function ChecklistItem({
  checked,
  label,
  warning = false,
}: {
  checked: boolean;
  label: string;
  warning?: boolean;
}) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {checked ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      ) : warning ? (
        <AlertCircle className="h-4 w-4 text-amber-500" />
      ) : (
        <Circle className="h-4 w-4 text-slate-300" />
      )}
      <span className={checked ? "text-slate-700" : "text-slate-500"}>
        {label}
      </span>
    </li>
  );
}
