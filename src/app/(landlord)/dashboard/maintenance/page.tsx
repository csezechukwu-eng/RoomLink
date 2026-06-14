"use client";

import { useState } from "react";
import {
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  ChevronDown,
  Plus,
  FileText,
  MoreVertical,
  ArrowLeft,
  MapPin,
  User,
  Calendar,
  Phone,
  Image,
} from "lucide-react";
import { Card } from "@/components/ui/card";

// Types
type Priority = "low" | "medium" | "high" | "emergency";
type Status = "open" | "in_progress" | "completed" | "cancelled";
type TabFilter = "all" | "open" | "in_progress" | "completed" | "cancelled";

interface TimelineEvent {
  id: string;
  type: "submitted" | "assigned" | "in_progress" | "completed" | "note";
  title: string;
  description: string;
  date: string;
}

interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  issue: string;
  description: string;
  property: string;
  room: string;
  bed: string;
  tenant: {
    name: string;
    phone: string;
  };
  priority: Priority;
  status: Status;
  createdAt: string;
  photos: string[];
  timeline: TimelineEvent[];
  assignedTo?: {
    name: string;
    phone: string;
    company: string;
  };
}

// Mock data
const MOCK_REQUESTS: MaintenanceRequest[] = [
  {
    id: "1",
    requestNumber: "MT-046",
    issue: "Kitchen Faucet Dripping",
    description: "Kitchen faucet has been dripping for the past 2 days. Needs to be checked.",
    property: "Charlotte Flight Crew Pad",
    room: "Room A",
    bed: "Bed 4",
    tenant: { name: "John Smith", phone: "(704) 555-0189" },
    priority: "medium",
    status: "in_progress",
    createdAt: "Jun 2, 2024 at 9:15 AM",
    photos: ["/photo1.jpg", "/photo2.jpg", "/photo3.jpg", "/photo4.jpg", "/photo5.jpg", "/photo6.jpg"],
    timeline: [
      { id: "t1", type: "submitted", title: "Request Submitted", description: "by John Smith", date: "Jun 2, 2024 at 9:15 AM" },
      { id: "t2", type: "assigned", title: "Assigned to Maintenance", description: "by Marcus D.", date: "Jun 3, 2024 at 10:02 AM" },
      { id: "t3", type: "in_progress", title: "In Progress", description: "By Maintenance Team", date: "Jun 2, 2024 at 11:30 AM" },
    ],
    assignedTo: { name: "ABC Plumbing", phone: "(704) 085-0089", company: "ABC Plumbing" },
  },
  {
    id: "2",
    requestNumber: "MT-045",
    issue: "AC Not Cooling",
    description: "The air conditioning unit in Room B is not cooling properly. Temperature stays at 78F even when set to 68F.",
    property: "Concord Travel Nurse House",
    room: "Room B",
    bed: "Bed 2",
    tenant: { name: "Emily Johnson", phone: "(980) 555-0274" },
    priority: "high",
    status: "open",
    createdAt: "Jun 1, 2024 at 2:30 PM",
    photos: [],
    timeline: [
      { id: "t1", type: "submitted", title: "Request Submitted", description: "by Emily Johnson", date: "Jun 1, 2024 at 2:30 PM" },
    ],
  },
  {
    id: "3",
    requestNumber: "MT-044",
    issue: "Bathroom Light Out",
    description: "The main bathroom light fixture stopped working. Tried replacing the bulb but it still doesn't turn on.",
    property: "Gastonia Crew Housing",
    room: "Room C",
    bed: "Bed 1",
    tenant: { name: "Michael Brown", phone: "(704) 555-0132" },
    priority: "low",
    status: "open",
    createdAt: "May 31, 2024 at 8:45 AM",
    photos: ["/photo1.jpg"],
    timeline: [
      { id: "t1", type: "submitted", title: "Request Submitted", description: "by Michael Brown", date: "May 31, 2024 at 8:45 AM" },
    ],
  },
  {
    id: "4",
    requestNumber: "MT-043",
    issue: "Toilet Running",
    description: "The toilet in the shared bathroom keeps running after flushing. Water doesn't stop flowing.",
    property: "Charlotte Flight Crew Pad",
    room: "Room A",
    bed: "Bed 2",
    tenant: { name: "David Wilson", phone: "(704) 555-0199" },
    priority: "medium",
    status: "completed",
    createdAt: "May 28, 2024 at 10:00 AM",
    photos: [],
    timeline: [
      { id: "t1", type: "submitted", title: "Request Submitted", description: "by David Wilson", date: "May 28, 2024 at 10:00 AM" },
      { id: "t2", type: "assigned", title: "Assigned to Maintenance", description: "by Marcus D.", date: "May 28, 2024 at 11:00 AM" },
      { id: "t3", type: "completed", title: "Completed", description: "Flapper valve replaced", date: "May 29, 2024 at 2:00 PM" },
    ],
  },
  {
    id: "5",
    requestNumber: "MT-042",
    issue: "Washer Not Spinning",
    description: "The washing machine in the laundry room is not spinning during the spin cycle. Clothes come out soaking wet.",
    property: "Rock Hill Travel Pad",
    room: "Room D",
    bed: "Bed 3",
    tenant: { name: "Sarah Davis", phone: "(803) 555-0147" },
    priority: "high",
    status: "in_progress",
    createdAt: "May 27, 2024 at 3:15 PM",
    photos: ["/photo1.jpg", "/photo2.jpg"],
    timeline: [
      { id: "t1", type: "submitted", title: "Request Submitted", description: "by Sarah Davis", date: "May 27, 2024 at 3:15 PM" },
      { id: "t2", type: "assigned", title: "Assigned to Appliance Repair", description: "by Marcus D.", date: "May 27, 2024 at 4:00 PM" },
      { id: "t3", type: "in_progress", title: "In Progress", description: "Parts ordered", date: "May 28, 2024 at 9:00 AM" },
    ],
    assignedTo: { name: "QuickFix Appliances", phone: "(704) 555-1234", company: "QuickFix Appliances" },
  },
  {
    id: "6",
    requestNumber: "MT-041",
    issue: "Door Lock Broken",
    description: "The lock on my bedroom door is stuck and won't lock properly. Security concern.",
    property: "Concord Travel Nurse House",
    room: "Room B",
    bed: "Bed 1",
    tenant: { name: "Amanda Martinez", phone: "(704) 555-0177" },
    priority: "low",
    status: "completed",
    createdAt: "May 25, 2024 at 11:30 AM",
    photos: [],
    timeline: [
      { id: "t1", type: "submitted", title: "Request Submitted", description: "by Amanda Martinez", date: "May 25, 2024 at 11:30 AM" },
      { id: "t2", type: "completed", title: "Completed", description: "Lock replaced", date: "May 26, 2024 at 10:00 AM" },
    ],
  },
  {
    id: "7",
    requestNumber: "MT-040",
    issue: "Hot Water Issue",
    description: "No hot water in the shower. Water heater may need to be checked.",
    property: "Gastonia Crew Housing",
    room: "Room C",
    bed: "Bed 4",
    tenant: { name: "Chris Anderson", phone: "(704) 555-0123" },
    priority: "emergency",
    status: "open",
    createdAt: "Jun 3, 2024 at 7:00 AM",
    photos: [],
    timeline: [
      { id: "t1", type: "submitted", title: "Request Submitted", description: "by Chris Anderson", date: "Jun 3, 2024 at 7:00 AM" },
    ],
  },
];

// Helper functions
function getPriorityConfig(priority: Priority) {
  const configs = {
    low: { label: "Low", color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" },
    medium: { label: "Medium", color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" },
    high: { label: "High", color: "text-red-600", bg: "bg-red-50", dot: "bg-red-500" },
    emergency: { label: "Emergency", color: "text-red-600", bg: "bg-red-100", dot: "bg-red-600" },
  };
  return configs[priority];
}

function getStatusConfig(status: Status) {
  const configs = {
    open: { label: "Open", color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" },
    in_progress: { label: "In Progress", color: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-500" },
    completed: { label: "Completed", color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" },
    cancelled: { label: "Cancelled", color: "text-slate-600", bg: "bg-slate-50", dot: "bg-slate-400" },
  };
  return configs[status];
}

function getTimelineIcon(type: string) {
  switch (type) {
    case "submitted":
      return "bg-indigo-500";
    case "assigned":
      return "bg-blue-500";
    case "in_progress":
      return "bg-amber-500";
    case "completed":
      return "bg-emerald-500";
    default:
      return "bg-slate-400";
  }
}

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(MOCK_REQUESTS[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const counts = {
    all: MOCK_REQUESTS.length,
    open: MOCK_REQUESTS.filter((r) => r.status === "open").length,
    in_progress: MOCK_REQUESTS.filter((r) => r.status === "in_progress").length,
    completed: MOCK_REQUESTS.filter((r) => r.status === "completed").length,
    cancelled: MOCK_REQUESTS.filter((r) => r.status === "cancelled").length,
  };

  const filteredRequests = MOCK_REQUESTS.filter((req) => {
    if (activeTab === "all") return true;
    return req.status === activeTab;
  });

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Maintenance</h1>
            <p className="text-slate-500">Track, manage, and resolve maintenance requests.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              <FileText className="h-4 w-4" />
              Create Work Order
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
              <Plus className="h-4 w-4" />
              New Request
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-4">
          <StatCard
            icon={<Wrench className="h-5 w-5 text-red-500" />}
            value="14"
            label="Open Requests"
            sublabel="Needs Attention"
            sublabelColor="text-red-500"
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-blue-500" />}
            value="6"
            label="In Progress"
            sublabel="Currently Active"
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
            value="48"
            label="Completed"
            sublabel="This Month"
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-purple-500" />}
            value="1.8 Days"
            label="Avg Resolution Time"
            sublabel="This Month"
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            value="3"
            label="Emergency Tickets"
            sublabel="High Priority"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search maintenance requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <FilterDropdown label="All Properties" />
          <FilterDropdown label="All Statuses" />
          <FilterDropdown label="All Priorities" />
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex gap-6">
            {[
              { id: "all" as const, label: "All Requests", count: counts.all },
              { id: "open" as const, label: "Open", count: counts.open },
              { id: "in_progress" as const, label: "In Progress", count: counts.in_progress },
              { id: "completed" as const, label: "Completed", count: counts.completed },
              { id: "cancelled" as const, label: "Cancelled", count: counts.cancelled },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-indigo-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      activeTab === tab.id
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Issue
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Property
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Room / Bed
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Tenant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRequests.map((request) => {
                const priorityConfig = getPriorityConfig(request.priority);
                const statusConfig = getStatusConfig(request.status);
                const isSelected = selectedRequest?.id === request.id;

                return (
                  <tr
                    key={request.id}
                    onClick={() => setSelectedRequest(request)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-indigo-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{request.issue}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{request.property}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{request.room}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{request.tenant.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${priorityConfig.bg} ${priorityConfig.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${priorityConfig.dot}`} />
                        {priorityConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedRequest && (
        <div className="w-96 shrink-0">
          <RequestDetailPanel request={selectedRequest} onClose={() => setSelectedRequest(null)} />
        </div>
      )}
    </div>
  );
}

// Components

function StatCard({
  icon,
  value,
  label,
  sublabel,
  sublabelColor,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sublabel: string;
  sublabelColor?: string;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className={`text-xs ${sublabelColor || "text-slate-400"}`}>{sublabel}</p>
    </Card>
  );
}

function FilterDropdown({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
      {label}
      <ChevronDown className="h-4 w-4" />
    </button>
  );
}

function RequestDetailPanel({ request, onClose }: { request: MaintenanceRequest; onClose: () => void }) {
  const priorityConfig = getPriorityConfig(request.priority);
  const statusConfig = getStatusConfig(request.status);

  return (
    <Card className="sticky top-6 overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <button onClick={onClose} className="mt-1 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{request.issue}</h2>
              <p className="text-sm text-slate-500">Request #{request.requestNumber}</p>
            </div>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-4">
        {/* Details */}
        <div>
          <h3 className="mb-3 font-semibold text-slate-900">Details</h3>
          <div className="space-y-2 text-sm">
            <DetailRow label="Property" value={request.property} />
            <DetailRow label="Room / Bed" value={`${request.room} / ${request.bed}`} />
            <DetailRow label="Tenant" value={request.tenant.name} />
            <div className="flex items-start justify-between py-1">
              <span className="text-slate-500">Priority</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityConfig.bg} ${priorityConfig.color}`}>
                {priorityConfig.label}
              </span>
            </div>
            <DetailRow label="Created" value={request.createdAt} />
          </div>
        </div>

        {/* Description */}
        <div className="mt-6">
          <h3 className="mb-3 font-semibold text-slate-900">Description</h3>
          <p className="text-sm text-slate-600">{request.description}</p>
        </div>

        {/* Photos */}
        {request.photos.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 font-semibold text-slate-900">Photos</h3>
            <div className="grid grid-cols-4 gap-2">
              {request.photos.slice(0, 4).map((photo, i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-lg bg-slate-200"
                >
                  <div className="flex h-full w-full items-center justify-center">
                    <Image className="h-6 w-6 text-slate-400" />
                  </div>
                  {i === 3 && request.photos.length > 4 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white font-medium">
                      +{request.photos.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="mt-6">
          <h3 className="mb-3 font-semibold text-slate-900">Timeline</h3>
          <div className="space-y-4">
            {request.timeline.map((event, i) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`h-3 w-3 rounded-full ${getTimelineIcon(event.type)}`} />
                  {i < request.timeline.length - 1 && (
                    <div className="w-0.5 flex-1 bg-slate-200" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{event.title}</p>
                      <p className="text-xs text-slate-500">{event.description}</p>
                    </div>
                    <span className="text-xs text-slate-400">{event.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assigned To */}
        {request.assignedTo && (
          <div className="mt-6">
            <h3 className="mb-3 font-semibold text-slate-900">Assigned To</h3>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600">
                  {request.assignedTo.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{request.assignedTo.name}</p>
                  <p className="text-xs text-slate-500">{request.assignedTo.phone}</p>
                </div>
              </div>
              <button className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-100">
                Contact
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-2">
          <button className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Update Status
          </button>
          <button className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Assign
          </button>
        </div>
      </div>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-1">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right max-w-[180px]">{value}</span>
    </div>
  );
}
