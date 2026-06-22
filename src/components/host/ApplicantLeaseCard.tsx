"use client";

import Link from "next/link";
import {
  User,
  MapPin,
  Home,
  Bed,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Settings2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { ApplicantMatchResult, TemplateMatch } from "@/lib/services/applicantTemplateMatching";
import { getStayTypeLabel } from "@/lib/leaseTemplateOptions";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Status badge styling
// ---------------------------------------------------------------------------

function ApplicationStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { className: string; label: string }> = {
    draft: { className: "border border-slate-300 bg-white text-slate-600", label: "Draft" },
    submitted: { className: "bg-slate-100 text-slate-700", label: "Submitted" },
    under_review: { className: "bg-indigo-100 text-indigo-700", label: "Under Review" },
    approved: { className: "bg-green-100 text-green-700", label: "Approved" },
    rejected: { className: "bg-red-100 text-red-700", label: "Rejected" },
    waitlisted: { className: "border border-amber-300 bg-amber-50 text-amber-700", label: "Waitlisted" },
    withdrawn: { className: "border border-slate-300 bg-white text-slate-500", label: "Withdrawn" },
  };

  const config = styles[status] ?? { className: "bg-slate-100 text-slate-600", label: status };

  return (
    <Badge className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
}

function MatchStatusBadge({ result }: { result: ApplicantMatchResult }) {
  switch (result.status) {
    case "matched":
      return (
        <Badge className="bg-green-100 text-green-700 text-xs">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Template Matched
        </Badge>
      );
    case "multiple_matches":
      return (
        <Badge className="bg-amber-100 text-amber-800 text-xs">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Multiple Matches
        </Badge>
      );
    case "needs_setup":
      return (
        <Badge className="bg-orange-100 text-orange-800 text-xs">
          <Settings2 className="mr-1 h-3 w-3" />
          Template Needs Setup
        </Badge>
      );
    case "no_match":
      return (
        <Badge className="border border-slate-300 bg-white text-slate-600 text-xs">
          <AlertCircle className="mr-1 h-3 w-3" />
          No Matching Template
        </Badge>
      );
  }
}

// ---------------------------------------------------------------------------
// Commuter status display
// ---------------------------------------------------------------------------

const COMMUTER_LABELS: Record<string, string> = {
  local_resident: "Local Resident",
  travel_nurse: "Travel Nurse",
  airline_crew: "Airline Crew",
  student: "Student",
  contract_worker: "Contract Worker",
  out_of_state_commuter: "Out-of-State Commuter",
  weekly_commuter: "Weekly Commuter",
  temporary_relocation: "Temporary Relocation",
  other: "Other",
};

function formatCommuterStatus(status: string | null): string {
  if (!status) return "Not specified";
  return COMMUTER_LABELS[status] ?? status;
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Not specified";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Template selector
// ---------------------------------------------------------------------------

interface TemplateSelectorProps {
  matches: TemplateMatch[];
  selectedTemplateId: string | null;
  onSelect: (templateId: string) => void;
}

function TemplateSelector({ matches, selectedTemplateId, onSelect }: TemplateSelectorProps) {
  if (matches.length <= 1) return null;

  return (
    <Select
      value={selectedTemplateId ?? ""}
      onChange={(e) => onSelect(e.target.value)}
      className="h-8 w-48 text-xs"
    >
      {matches.map((match) => (
        <option key={match.template.id} value={match.template.id}>
          {match.template.title}
        </option>
      ))}
    </Select>
  );
}

// ---------------------------------------------------------------------------
// Main card component
// ---------------------------------------------------------------------------

interface ApplicantLeaseCardProps {
  result: ApplicantMatchResult;
  fieldCounts?: Map<string, number>;
}

export function ApplicantLeaseCard({ result, fieldCounts }: ApplicantLeaseCardProps) {
  const { application } = result;
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    result.bestMatch?.template.id ?? null
  );

  // Find selected match from matches array
  const selectedMatch = result.matches.find((m) => m.template.id === selectedTemplateId) ?? result.bestMatch;

  const applicantName = application.first_name && application.last_name
    ? `${application.first_name} ${application.last_name}`
    : application.full_name || application.email;

  const displayTemplate = selectedMatch?.template;
  const templateFieldCount = displayTemplate && fieldCounts
    ? fieldCounts.get(displayTemplate.id) ?? 0
    : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          {/* Applicant info */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <User className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{applicantName}</h3>
              <p className="text-sm text-slate-500">{application.email}</p>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap items-center gap-2">
            <ApplicationStatusBadge status={application.status} />
            <MatchStatusBadge result={result} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Property/Room/Bed info */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {application.property_name && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600">{application.property_name}</span>
            </div>
          )}
          {application.room_name && (
            <div className="flex items-center gap-2 text-sm">
              <Home className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600">{application.room_name}</span>
            </div>
          )}
          {application.bed_label && (
            <div className="flex items-center gap-2 text-sm">
              <Bed className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600">{application.bed_label}</span>
            </div>
          )}
          {application.desired_move_in && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600">Move-in: {formatDate(application.desired_move_in)}</span>
            </div>
          )}
        </div>

        {/* Financial info */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {application.monthly_rent !== null && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600">Rent: {formatCurrency(application.monthly_rent)}/mo</span>
            </div>
          )}
          {application.monthly_income !== null && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600">Income: {formatCurrency(application.monthly_income)}/mo</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">{formatCommuterStatus(application.commuter_status)}</span>
          </div>
          {application.length_of_stay && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600">Stay: {application.length_of_stay}</span>
            </div>
          )}
        </div>

        {/* Template match section */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Matched Lease Template
              </p>
              {displayTemplate ? (
                <div className="mt-1">
                  <p className="font-medium text-slate-900">{displayTemplate.title}</p>
                  <p className="text-sm text-slate-600">
                    {getStayTypeLabel(displayTemplate.stay_type)}
                    {displayTemplate.property_name && ` • ${displayTemplate.property_name}`}
                    {displayTemplate.property_id === null && " • All Properties"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {templateFieldCount} field{templateFieldCount !== 1 ? "s" : ""} configured
                    {selectedMatch && selectedMatch.matchReasons.length > 0 && (
                      <> • {selectedMatch.matchReasons[0]}</>
                    )}
                  </p>
                </div>
              ) : result.status === "needs_setup" && result.needsSetupTemplates.length > 0 ? (
                <div className="mt-1">
                  <p className="text-sm text-orange-700">
                    Template &quot;{result.needsSetupTemplates[0].title}&quot; matches but needs field setup
                  </p>
                </div>
              ) : (
                <p className="mt-1 text-sm text-slate-500">
                  No matching template found. Upload or tag a ready lease template for this stay type.
                </p>
              )}
            </div>

            {/* Template selector for multiple matches */}
            {result.status === "multiple_matches" && result.matches.length > 1 && (
              <TemplateSelector
                matches={result.matches}
                selectedTemplateId={selectedTemplateId}
                onSelect={setSelectedTemplateId}
              />
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Link href={`/dashboard/applications/${application.id}`}>
            <Button variant="outline" size="sm">
              View Application
            </Button>
          </Link>

          {result.status === "needs_setup" && result.needsSetupTemplates.length > 0 && (
            <Link href={`/dashboard/leases/templates/${result.needsSetupTemplates[0].id}/designer`}>
              <Button variant="outline" size="sm">
                <Settings2 className="mr-1.5 h-4 w-4" />
                Edit Field Setup
              </Button>
            </Link>
          )}

          {(result.status === "matched" || result.status === "multiple_matches") && displayTemplate && (
            <Button variant="primary" size="sm" disabled title="Lease preparation coming in next update">
              <FileText className="mr-1.5 h-4 w-4" />
              Prepare Lease
            </Button>
          )}

          {result.status === "no_match" && (
            <Button variant="outline" size="sm" disabled title="Upload a template first">
              <FileText className="mr-1.5 h-4 w-4" />
              Select Template
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
