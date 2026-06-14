"use client";

import * as React from "react";
import {
  X,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Plus,
  Users,
  Bell,
  CheckCircle,
  XCircle,
  Filter,
  LayoutGrid,
  Check,
  ArrowRight,
  Edit,
  DollarSign,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Mock data for applications
const MOCK_APPLICATIONS = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "(704) 555-0189",
    requestedBed: { room: "Room A", bed: "Bed 4", bunkType: "Bottom Bunk" },
    moveInDate: "Jul 15, 2024",
    status: "new" as const,
    appliedOn: { date: "Today", time: "9:41 AM", fullDate: "May 23, 2024" },
    isNew: true,
    details: {
      leaseTerm: "12 Months",
      monthlyRent: "$650",
      deposit: "$150",
      howHeard: "Google Search",
      currentLocation: "Atlanta, GA",
      occupation: "Flight Attendant",
      employer: "American Airlines",
      monthlyIncome: "$4,200",
    },
    questions: [
      { question: "Why are you looking to move?", answer: "Relocating for work and need a furnished place close to the airport." },
      { question: "Do you have any pets?", answer: "No" },
      { question: "Do you smoke?", answer: "No" },
    ],
    activity: [
      { type: "note", user: "Marcus D.", text: "Great application. Verified employment and references.", date: "May 23, 2024 at 10:15 AM" },
      { type: "submitted", text: "Application submitted", date: "May 23, 2024 at 9:41 AM" },
    ],
  },
  {
    id: "2",
    name: "Emily Johnson",
    email: "emily.j@email.com",
    phone: "(980) 555-0274",
    requestedBed: { room: "Room B", bed: "Bed 2", bunkType: "Top Bunk" },
    moveInDate: "Jul 20, 2024",
    status: "under_review" as const,
    appliedOn: { date: "Yesterday", time: "4:22 PM", fullDate: "May 22, 2024" },
    isNew: false,
    details: {
      leaseTerm: "6 Months",
      monthlyRent: "$650",
      deposit: "$150",
      howHeard: "Facebook",
      currentLocation: "Charlotte, NC",
      occupation: "Travel Nurse",
      employer: "Atrium Health",
      monthlyIncome: "$5,100",
    },
    questions: [
      { question: "Why are you looking to move?", answer: "Travel nursing assignment at nearby hospital." },
      { question: "Do you have any pets?", answer: "No" },
      { question: "Do you smoke?", answer: "No" },
    ],
    activity: [
      { type: "submitted", text: "Application submitted", date: "May 22, 2024 at 4:22 PM" },
    ],
  },
  {
    id: "3",
    name: "Michael Brown",
    email: "michael.b@email.com",
    phone: "(704) 555-0132",
    requestedBed: { room: "Room D", bed: "Bed 1", bunkType: "Bottom Bunk" },
    moveInDate: "Jul 22, 2024",
    status: "under_review" as const,
    appliedOn: { date: "May 22, 2024", time: "2:15 PM", fullDate: "May 22, 2024" },
    isNew: false,
    details: {
      leaseTerm: "12 Months",
      monthlyRent: "$650",
      deposit: "$150",
      howHeard: "Coworker",
      currentLocation: "Raleigh, NC",
      occupation: "Pilot",
      employer: "Delta Airlines",
      monthlyIncome: "$6,500",
    },
    questions: [],
    activity: [],
  },
  {
    id: "4",
    name: "Sarah Davis",
    email: "sarah.d@email.com",
    phone: "(803) 555-0147",
    requestedBed: { room: "Room C", bed: "Bed 4", bunkType: "Top Bunk" },
    moveInDate: "Jul 1, 2024",
    status: "approved" as const,
    appliedOn: { date: "May 20, 2024", time: "11:03 AM", fullDate: "May 20, 2024" },
    isNew: false,
    details: {
      leaseTerm: "6 Months",
      monthlyRent: "$650",
      deposit: "$150",
      howHeard: "Craigslist",
      currentLocation: "Columbia, SC",
      occupation: "Flight Attendant",
      employer: "Southwest Airlines",
      monthlyIncome: "$3,800",
    },
    questions: [],
    activity: [],
  },
  {
    id: "5",
    name: "David Wilson",
    email: "david.w@email.com",
    phone: "(704) 555-0199",
    requestedBed: { room: "Room A", bed: "Bed 2", bunkType: "Top Bunk" },
    moveInDate: "Jun 28, 2024",
    status: "approved" as const,
    appliedOn: { date: "May 18, 2024", time: "9:30 AM", fullDate: "May 18, 2024" },
    isNew: false,
    details: {
      leaseTerm: "12 Months",
      monthlyRent: "$650",
      deposit: "$150",
      howHeard: "Google Search",
      currentLocation: "Greensboro, NC",
      occupation: "Flight Attendant",
      employer: "American Airlines",
      monthlyIncome: "$4,000",
    },
    questions: [],
    activity: [],
  },
  {
    id: "6",
    name: "Jessica Taylor",
    email: "jess.t@email.com",
    phone: "(980) 555-0168",
    requestedBed: { room: "Room B", bed: "Bed 3", bunkType: "Bottom Bunk" },
    moveInDate: "Jul 10, 2024",
    status: "rejected" as const,
    appliedOn: { date: "May 15, 2024", time: "5:45 PM", fullDate: "May 15, 2024" },
    isNew: false,
    details: {
      leaseTerm: "3 Months",
      monthlyRent: "$650",
      deposit: "$150",
      howHeard: "Facebook",
      currentLocation: "Charlotte, NC",
      occupation: "Student",
      employer: "N/A",
      monthlyIncome: "$1,200",
    },
    questions: [],
    activity: [],
  },
  {
    id: "7",
    name: "Chris Anderson",
    email: "chris.a@email.com",
    phone: "(704) 555-0123",
    requestedBed: { room: "Room C", bed: "Bed 1", bunkType: "Bottom Bunk" },
    moveInDate: "Jul 5, 2024",
    status: "new" as const,
    appliedOn: { date: "May 15, 2024", time: "10:22 AM", fullDate: "May 15, 2024" },
    isNew: true,
    details: {
      leaseTerm: "6 Months",
      monthlyRent: "$650",
      deposit: "$150",
      howHeard: "Coworker",
      currentLocation: "Charlotte, NC",
      occupation: "Flight Attendant",
      employer: "United Airlines",
      monthlyIncome: "$4,100",
    },
    questions: [],
    activity: [],
  },
  {
    id: "8",
    name: "Amanda Martinez",
    email: "amanda.m@email.com",
    phone: "(704) 555-0177",
    requestedBed: { room: "Room D", bed: "Bed 4", bunkType: "Top Bunk" },
    moveInDate: "Jun 25, 2024",
    status: "under_review" as const,
    appliedOn: { date: "May 14, 2024", time: "8:11 PM", fullDate: "May 14, 2024" },
    isNew: false,
    details: {
      leaseTerm: "12 Months",
      monthlyRent: "$650",
      deposit: "$150",
      howHeard: "Google Search",
      currentLocation: "Rock Hill, SC",
      occupation: "Travel Nurse",
      employer: "Novant Health",
      monthlyIncome: "$5,300",
    },
    questions: [],
    activity: [],
  },
];

type Application = (typeof MOCK_APPLICATIONS)[0];
type StatusFilter = "all" | "new" | "under_review" | "approved" | "rejected";

// Calculate stats
const totalApplications = MOCK_APPLICATIONS.length;
const newCount = MOCK_APPLICATIONS.filter((a) => a.status === "new").length;
const underReviewCount = MOCK_APPLICATIONS.filter((a) => a.status === "under_review").length;
const approvedCount = MOCK_APPLICATIONS.filter((a) => a.status === "approved").length;
const rejectedCount = MOCK_APPLICATIONS.filter((a) => a.status === "rejected").length;

export default function ApplicationsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [selectedApplication, setSelectedApplication] = React.useState<Application | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const filteredApplications = MOCK_APPLICATIONS.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openDetail = (app: Application) => {
    setSelectedApplication(app);
  };

  const closeDetail = () => {
    setSelectedApplication(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
          <p className="text-slate-500">Review and manage all applications across your properties.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Application
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Total Applications"
          value={24}
          subtitle="All Time"
        />
        <StatCard
          icon={<Bell className="h-5 w-5" />}
          label="New"
          value={8}
          subtitle="Needs Review"
          color="amber"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Under Review"
          value={7}
          subtitle="In Progress"
          color="blue"
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5" />}
          label="Approved"
          value={6}
          subtitle="This Month"
          color="emerald"
        />
        <StatCard
          icon={<XCircle className="h-5 w-5" />}
          label="Rejected"
          value={3}
          subtitle="This Month"
          color="red"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-3">
          <FilterSelect label="Property" options={["All Properties"]} />
          <FilterSelect label="Status" options={["All Statuses"]} />
          <FilterSelect label="Move-In Date" options={["All Dates"]} />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
        <button className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:text-slate-600">
          <LayoutGrid className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          <TabButton
            label="All Applications"
            count={totalApplications}
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          />
          <TabButton
            label="New"
            count={newCount}
            active={statusFilter === "new"}
            onClick={() => setStatusFilter("new")}
          />
          <TabButton
            label="Under Review"
            count={underReviewCount}
            active={statusFilter === "under_review"}
            onClick={() => setStatusFilter("under_review")}
          />
          <TabButton
            label="Approved"
            count={approvedCount}
            active={statusFilter === "approved"}
            onClick={() => setStatusFilter("approved")}
          />
          <TabButton
            label="Rejected"
            count={rejectedCount}
            active={statusFilter === "rejected"}
            onClick={() => setStatusFilter("rejected")}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-sm text-slate-500">
                <th className="px-4 py-3 font-medium">Applicant</th>
                <th className="px-4 py-3 font-medium">Requested Bed</th>
                <th className="px-4 py-3 font-medium">Move-In Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-1">
                    Applied On
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedApplications.map((app) => (
                <tr
                  key={app.id}
                  className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => openDetail(app)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {app.isNew && (
                        <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          NEW
                        </span>
                      )}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                        {app.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{app.name}</p>
                        <p className="text-xs text-slate-500">{app.email}</p>
                        <p className="text-xs text-slate-500">{app.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {app.requestedBed.room} / {app.requestedBed.bed}
                    </p>
                    <p className="text-xs text-slate-500">{app.requestedBed.bunkType}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{app.moveInDate}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{app.appliedOn.date}</p>
                    <p className="text-xs text-slate-500">{app.appliedOn.time}</p>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-2 text-slate-400 hover:text-slate-600"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <p className="text-sm text-slate-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredApplications.length)} of{" "}
            {filteredApplications.length} applications
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "h-9 w-9 rounded-lg text-sm font-medium transition-colors",
                  currentPage === page
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="ml-4 text-sm text-slate-500">Show</span>
            <select className="rounded-lg border border-slate-200 px-2 py-1 text-sm">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
            <span className="text-sm text-slate-500">per page</span>
          </div>
        </div>
      </Card>

      {/* Application Detail Panel */}
      {selectedApplication && (
        <ApplicationDetailPanel
          application={selectedApplication}
          onClose={closeDetail}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtitle: string;
  color?: "amber" | "blue" | "emerald" | "red";
}) {
  const colorClasses = {
    amber: "text-amber-600 bg-amber-50",
    blue: "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    red: "text-red-600 bg-red-50",
  };

  const valueColors = {
    amber: "text-amber-600",
    blue: "text-blue-600",
    emerald: "text-emerald-600",
    red: "text-red-600",
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            color ? colorClasses[color] : "bg-slate-100 text-slate-600"
          )}
        >
          {icon}
        </div>
        <div>
          <p className={cn("text-2xl font-bold", color ? valueColors[color] : "text-slate-900")}>
            {value}
          </p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">{label}</p>
    </Card>
  );
}

function FilterSelect({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="relative">
      <select className="appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2 pr-10 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors",
        active
          ? "border-indigo-600 text-indigo-600"
          : "border-transparent text-slate-500 hover:text-slate-700"
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-medium",
          active ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function StatusBadge({ status }: { status: Application["status"] }) {
  const styles = {
    new: "bg-blue-50 text-blue-700",
    under_review: "bg-amber-50 text-amber-700",
    approved: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700",
  };

  const labels = {
    new: "New",
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
  };

  const dots = {
    new: "bg-blue-500",
    under_review: "bg-amber-500",
    approved: "bg-emerald-500",
    rejected: "bg-red-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        styles[status]
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[status])} />
      {labels[status]}
    </span>
  );
}

function ApplicationDetailPanel({
  application,
  onClose,
}: {
  application: Application;
  onClose: () => void;
}) {
  const [noteText, setNoteText] = React.useState("");

  const statusColors = {
    new: "bg-blue-100 text-blue-700",
    under_review: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
  };

  const statusLabels = {
    new: "New",
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{application.name}</h2>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    statusColors[application.status]
                  )}
                >
                  {statusLabels[application.status]}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Applied for {application.requestedBed.room} / {application.requestedBed.bed}
              </p>
              <p className="text-xs text-slate-400">
                Applied on {application.appliedOn.fullDate} at {application.appliedOn.time}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex items-center gap-3">
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Check className="h-4 w-4" />
              Approve
            </Button>
            <Button variant="outline" className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
              <X className="h-4 w-4" />
              Reject
            </Button>
            <Button variant="outline" className="gap-2 ml-auto">
              More Actions
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Application Details */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Application Details</h3>
              <button className="text-slate-400 hover:text-slate-600">
                <Edit className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <DetailRow label="Move-In Date" value={application.moveInDate} />
              <DetailRow label="Lease Term" value={application.details.leaseTerm} />
              <DetailRow label="Monthly Rent" value={application.details.monthlyRent} />
              <DetailRow label="Deposit" value={application.details.deposit} />
              <DetailRow label="How did you hear about us?" value={application.details.howHeard} />
              <DetailRow label="Current Location" value={application.details.currentLocation} />
              <DetailRow label="Occupation" value={application.details.occupation} />
              <DetailRow label="Employer" value={application.details.employer} />
              <DetailRow label="Monthly Income" value={application.details.monthlyIncome} />
            </div>
          </div>

          {/* Requested Bed */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Requested Bed</h3>
            <div className="flex gap-4 rounded-lg border border-slate-200 p-4">
              <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                <div className="h-full w-full bg-gradient-to-br from-amber-200 to-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">
                  {application.requestedBed.room} / {application.requestedBed.bed}
                </p>
                <p className="text-sm text-slate-500">{application.requestedBed.bunkType}</p>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-slate-600">
                    <DollarSign className="h-3.5 w-3.5" />
                    $650 / month
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <DollarSign className="h-3.5 w-3.5" />
                    $150 deposit
                  </span>
                </div>
                <button className="mt-2 flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  View Bed Details
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Questions */}
          {application.questions.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Questions</h3>
              <div className="space-y-4">
                {application.questions.map((q, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-slate-700">{q.question}</p>
                    <p className="text-sm text-slate-600">{q.answer}</p>
                  </div>
                ))}
              </div>
              <button className="mt-4 flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                View All Answers
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Notes & Activity */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Notes & Activity</h3>
            <div className="space-y-4">
              {application.activity.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      item.type === "note"
                        ? "bg-slate-200 text-slate-600"
                        : "bg-emerald-100 text-emerald-600"
                    )}
                  >
                    {item.type === "note" ? item.user?.split(" ").map((n) => n[0]).join("") : <Check className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        {item.type === "note" ? (
                          <>
                            <p className="text-sm font-medium text-slate-900">
                              {item.user} <span className="font-normal text-slate-500">added a note</span>
                            </p>
                            <p className="text-sm text-slate-600">{item.text}</p>
                          </>
                        ) : (
                          <p className="text-sm text-slate-600">{item.text}</p>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 whitespace-nowrap">{item.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Note Input */}
            <div className="mt-4 flex items-center gap-2">
              <Input
                placeholder="Add a note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="flex-1"
              />
              <Button size="sm">Add Note</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}
