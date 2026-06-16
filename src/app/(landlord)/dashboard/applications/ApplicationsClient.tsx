"use client";

import * as React from "react";
import Link from "next/link";
import { Search, ChevronRight, Building, User, Calendar, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { APPLICATION_STATUS_STYLES, labelForCommuterStatus } from "@/lib/constants";
import type { ApplicationWithRefs } from "@/lib/services/applications";
import type { ApplicationStatus } from "@/lib/types";

interface ApplicationsClientProps {
  applications: ApplicationWithRefs[];
}

const STATUS_FILTERS: { value: ApplicationStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "withdrawn", label: "Withdrawn" },
];

export function ApplicationsClient({ applications }: ApplicationsClientProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ApplicationStatus | "">("");

  const filteredApplications = React.useMemo(() => {
    return applications.filter((app) => {
      // Status filter
      if (statusFilter && app.status !== statusFilter) return false;

      // Search filter - search by name, email, property, or room
      if (search) {
        const searchLower = search.toLowerCase();
        const fullName = `${app.first_name} ${app.last_name || ""}`.toLowerCase();
        const email = (app.email || "").toLowerCase();
        const propertyName = (app.property_name || "").toLowerCase();
        const roomName = (app.room_name || "").toLowerCase();

        return (
          fullName.includes(searchLower) ||
          email.includes(searchLower) ||
          propertyName.includes(searchLower) ||
          roomName.includes(searchLower)
        );
      }

      return true;
    });
  }, [applications, search, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, email, property..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | "")}
            className="w-full sm:w-48"
          >
            {STATUS_FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Results count */}
      <p className="text-sm text-slate-500">
        Showing {filteredApplications.length} of {applications.length} applications
      </p>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-500">No applications match your filters.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredApplications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationCard({ application }: { application: ApplicationWithRefs }) {
  const statusStyle = APPLICATION_STATUS_STYLES[application.status] || APPLICATION_STATUS_STYLES.submitted;
  const fullName = `${application.first_name} ${application.last_name || ""}`.trim();
  const submittedDate = new Date(application.created_at).toLocaleDateString();

  return (
    <Link href={`/dashboard/applications/${application.id}`}>
      <Card className="p-4 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-slate-900 truncate">{fullName}</h3>
              <Badge className={statusStyle.badge}>{application.status.replace("_", " ")}</Badge>
            </div>

            <p className="mt-1 text-sm text-slate-500 truncate">{application.email}</p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {application.property_name && (
                <span className="flex items-center gap-1">
                  <Building className="h-3.5 w-3.5" />
                  {application.property_name}
                </span>
              )}
              {application.bed_label && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {application.bed_label}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Applied {submittedDate}
              </span>
              {application.commuter_status && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  {labelForCommuterStatus(application.commuter_status)}
                </span>
              )}
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
        </div>
      </Card>
    </Link>
  );
}
