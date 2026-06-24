"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
  Tag,
  Clock,
  FileType,
  StickyNote,
  Settings,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LeaseTemplateWithProperty, LeaseTemplateStatus } from "@/lib/types";
import {
  getLeaseCategoryLabel,
  getStayTypeLabel,
} from "@/lib/leaseTemplateOptions";

const STATUS_STYLES: Record<
  LeaseTemplateStatus,
  { label: string; badge: string }
> = {
  needs_setup: {
    label: "Needs setup",
    badge: "bg-amber-50 text-amber-700",
  },
  ready: {
    label: "Ready",
    badge: "bg-emerald-50 text-emerald-700",
  },
  archived: {
    label: "Archived",
    badge: "bg-slate-100 text-slate-500",
  },
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface LeaseTemplateCardProps {
  template: LeaseTemplateWithProperty;
  fieldCount?: number;
  hasSignature?: boolean;
}

export function LeaseTemplateCard({
  template,
  fieldCount = 0,
  hasSignature = false,
}: LeaseTemplateCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const style = STATUS_STYLES[template.status] ?? STATUS_STYLES.needs_setup;

  return (
    <Card className="overflow-hidden">
      {/* Collapsed view - always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start justify-between gap-4 p-5 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{template.title}</p>
            <p className="mt-0.5 text-sm text-slate-500">
              {getLeaseCategoryLabel(template.lease_category)}
              {" · "}
              {getStayTypeLabel(template.stay_type)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              {template.property_name && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {template.property_name}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(template.created_at)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Settings className="h-3 w-3" />
                {fieldCount} saved field{fieldCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}
          >
            {style.label}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded view */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <DetailRow
                icon={<FileType className="h-4 w-4" />}
                label="File name"
                value={template.file_name}
              />
              <DetailRow
                icon={<Tag className="h-4 w-4" />}
                label="File type"
                value={template.file_type === "application/pdf" ? "PDF" : template.file_type}
              />
              <DetailRow
                icon={<Tag className="h-4 w-4" />}
                label="Category"
                value={getLeaseCategoryLabel(template.lease_category)}
              />
              <DetailRow
                icon={<Clock className="h-4 w-4" />}
                label="Stay type"
                value={getStayTypeLabel(template.stay_type)}
              />
            </div>
            <div className="space-y-3">
              <DetailRow
                icon={<Building2 className="h-4 w-4" />}
                label="Linked property"
                value={template.property_name ?? "All properties"}
              />
              {template.notes && (
                <DetailRow
                  icon={<StickyNote className="h-4 w-4" />}
                  label="Notes"
                  value={template.notes}
                />
              )}
              <DetailRow
                icon={<Tag className="h-4 w-4" />}
                label="Status"
                value={style.label}
              />
            </div>
          </div>

          {/* Field Setup Section */}
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Signing Fields
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  {hasSignature ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Tenant signature configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <AlertCircle className="h-3 w-3" />
                      Needs tenant signature
                    </span>
                  )}
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">
                    {fieldCount} field{fieldCount !== 1 ? "s" : ""} configured
                  </span>
                </div>
              </div>
              <Link href={`/dashboard/leases/templates/${template.id}/designer`}>
                <Button variant="outline" size="sm">
                  <Settings className="mr-1.5 h-4 w-4" />
                  Open Field Designer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="flex-shrink-0 text-slate-400">{icon}</span>
      <div>
        <span className="text-slate-500">{label}:</span>{" "}
        <span className="text-slate-700">{value}</span>
      </div>
    </div>
  );
}
