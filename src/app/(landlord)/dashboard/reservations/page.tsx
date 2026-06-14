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
  Calendar,
  Clock,
  Users,
  XCircle,
  TrendingUp,
  Filter,
  LayoutGrid,
  List,
  Download,
  Edit,
  MessageSquare,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Mock data for reservations
const MOCK_RESERVATIONS = [
  {
    id: "RES-2024-0012",
    renter: {
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "(704) 555-0189",
      occupation: "Flight Attendant",
      employer: "American Airlines",
      monthlyIncome: "$4,200",
    },
    bed: { room: "Room A", bed: "Bed 4", bunkType: "Bottom Bunk" },
    property: "Charlotte Flight Crew Crash Pad",
    moveInDate: "Jul 15, 2024",
    status: "active" as const,
    amount: { value: 150, type: "Deposit Paid" as const },
    createdOn: { date: "May 23, 2024", time: "9:41 AM" },
    leaseTerm: "12 Months",
    monthlyRent: "$650",
    deposit: "$150",
    amountPaid: "$150",
    reservedOn: "May 23, 2024 at 9:41 AM",
    notes: "Renter requested early move-in if possible. Very clean background and great references.",
  },
  {
    id: "RES-2024-0011",
    renter: {
      name: "Emily Johnson",
      email: "emily.j@email.com",
      phone: "(980) 555-0274",
      occupation: "Travel Nurse",
      employer: "Atrium Health",
      monthlyIncome: "$5,100",
    },
    bed: { room: "Room B", bed: "Bed 2", bunkType: "Top Bunk" },
    property: "Concord Travel Nurse House",
    moveInDate: "Jul 20, 2024",
    status: "upcoming" as const,
    amount: { value: 150, type: "Deposit Paid" as const },
    createdOn: { date: "May 22, 2024", time: "4:22 PM" },
    leaseTerm: "6 Months",
    monthlyRent: "$650",
    deposit: "$150",
    amountPaid: "$150",
    reservedOn: "May 22, 2024 at 4:22 PM",
    notes: "",
  },
  {
    id: "RES-2024-0010",
    renter: {
      name: "Michael Brown",
      email: "michael.b@email.com",
      phone: "(704) 555-0132",
      occupation: "Pilot",
      employer: "Delta Airlines",
      monthlyIncome: "$6,500",
    },
    bed: { room: "Room D", bed: "Bed 1", bunkType: "Bottom Bunk" },
    property: "Charlotte Flight Crew Crash Pad",
    moveInDate: "Jul 22, 2024",
    status: "upcoming" as const,
    amount: { value: 150, type: "Deposit Paid" as const },
    createdOn: { date: "May 21, 2024", time: "2:15 PM" },
    leaseTerm: "12 Months",
    monthlyRent: "$650",
    deposit: "$150",
    amountPaid: "$150",
    reservedOn: "May 21, 2024 at 2:15 PM",
    notes: "",
  },
  {
    id: "RES-2024-0009",
    renter: {
      name: "Sarah Davis",
      email: "sarah.d@email.com",
      phone: "(803) 555-0147",
      occupation: "Flight Attendant",
      employer: "Southwest Airlines",
      monthlyIncome: "$3,800",
    },
    bed: { room: "Room C", bed: "Bed 4", bunkType: "Top Bunk" },
    property: "Gastonia Crew Housing",
    moveInDate: "Jun 1, 2024",
    status: "active" as const,
    amount: { value: 150, type: "Deposit Paid" as const },
    createdOn: { date: "May 18, 2024", time: "11:03 AM" },
    leaseTerm: "6 Months",
    monthlyRent: "$650",
    deposit: "$150",
    amountPaid: "$150",
    reservedOn: "May 18, 2024 at 11:03 AM",
    notes: "",
  },
  {
    id: "RES-2024-0008",
    renter: {
      name: "David Wilson",
      email: "david.w@email.com",
      phone: "(704) 555-0199",
      occupation: "Flight Attendant",
      employer: "American Airlines",
      monthlyIncome: "$4,000",
    },
    bed: { room: "Room A", bed: "Bed 2", bunkType: "Top Bunk" },
    property: "Charlotte Flight Crew Crash Pad",
    moveInDate: "Jun 28, 2024",
    status: "expired" as const,
    amount: { value: 0, type: "No Deposit" as const },
    createdOn: { date: "Apr 28, 2024", time: "9:30 AM" },
    leaseTerm: "12 Months",
    monthlyRent: "$650",
    deposit: "$150",
    amountPaid: "$0",
    reservedOn: "Apr 28, 2024 at 9:30 AM",
    notes: "",
  },
  {
    id: "RES-2024-0007",
    renter: {
      name: "Jessica Taylor",
      email: "jess.t@email.com",
      phone: "(980) 555-0168",
      occupation: "Student",
      employer: "N/A",
      monthlyIncome: "$1,200",
    },
    bed: { room: "Room B", bed: "Bed 3", bunkType: "Bottom Bunk" },
    property: "Concord Travel Nurse House",
    moveInDate: "Jul 10, 2024",
    status: "cancelled" as const,
    amount: { value: 0, type: "Refunded" as const },
    createdOn: { date: "May 10, 2024", time: "5:45 PM" },
    leaseTerm: "3 Months",
    monthlyRent: "$650",
    deposit: "$150",
    amountPaid: "$0",
    reservedOn: "May 10, 2024 at 5:45 PM",
    notes: "",
  },
  {
    id: "RES-2024-0006",
    renter: {
      name: "Chris Anderson",
      email: "chris.a@email.com",
      phone: "(704) 555-0123",
      occupation: "Flight Attendant",
      employer: "United Airlines",
      monthlyIncome: "$4,100",
    },
    bed: { room: "Room C", bed: "Bed 1", bunkType: "Bottom Bunk" },
    property: "Gastonia Crew Housing",
    moveInDate: "Jul 5, 2024",
    status: "active" as const,
    amount: { value: 150, type: "Deposit Paid" as const },
    createdOn: { date: "May 8, 2024", time: "10:22 AM" },
    leaseTerm: "6 Months",
    monthlyRent: "$650",
    deposit: "$150",
    amountPaid: "$150",
    reservedOn: "May 8, 2024 at 10:22 AM",
    notes: "",
  },
  {
    id: "RES-2024-0005",
    renter: {
      name: "Amanda Martinez",
      email: "amanda.m@email.com",
      phone: "(704) 555-0177",
      occupation: "Travel Nurse",
      employer: "Novant Health",
      monthlyIncome: "$5,300",
    },
    bed: { room: "Room D", bed: "Bed 4", bunkType: "Top Bunk" },
    property: "Monroe Flight Crew House",
    moveInDate: "Jun 25, 2024",
    status: "expired" as const,
    amount: { value: 0, type: "No Deposit" as const },
    createdOn: { date: "Apr 25, 2024", time: "8:11 PM" },
    leaseTerm: "12 Months",
    monthlyRent: "$650",
    deposit: "$150",
    amountPaid: "$0",
    reservedOn: "Apr 25, 2024 at 8:11 PM",
    notes: "",
  },
  {
    id: "RES-2024-0004",
    renter: {
      name: "Robert Lee",
      email: "robert.l@email.com",
      phone: "(704) 555-0145",
      occupation: "Pilot",
      employer: "Delta Airlines",
      monthlyIncome: "$7,200",
    },
    bed: { room: "Room A", bed: "Bed 1", bunkType: "Bottom Bunk" },
    property: "Charlotte Flight Crew Crash Pad",
    moveInDate: "May 1, 2024",
    status: "active" as const,
    amount: { value: 150, type: "Deposit Paid" as const },
    createdOn: { date: "Apr 15, 2024", time: "3:30 PM" },
    leaseTerm: "12 Months",
    monthlyRent: "$650",
    deposit: "$150",
    amountPaid: "$150",
    reservedOn: "Apr 15, 2024 at 3:30 PM",
    notes: "",
  },
  {
    id: "RES-2024-0003",
    renter: {
      name: "Lisa Chen",
      email: "lisa.c@email.com",
      phone: "(980) 555-0198",
      occupation: "Flight Attendant",
      employer: "American Airlines",
      monthlyIncome: "$4,500",
    },
    bed: { room: "Room B", bed: "Bed 1", bunkType: "Bottom Bunk" },
    property: "Concord Travel Nurse House",
    moveInDate: "May 15, 2024",
    status: "active" as const,
    amount: { value: 150, type: "Deposit Paid" as const },
    createdOn: { date: "Apr 10, 2024", time: "11:00 AM" },
    leaseTerm: "6 Months",
    monthlyRent: "$650",
    deposit: "$150",
    amountPaid: "$150",
    reservedOn: "Apr 10, 2024 at 11:00 AM",
    notes: "",
  },
  {
    id: "RES-2024-0002",
    renter: {
      name: "James Wilson",
      email: "james.w@email.com",
      phone: "(704) 555-0167",
      occupation: "Travel Nurse",
      employer: "Atrium Health",
      monthlyIncome: "$5,000",
    },
    bed: { room: "Room C", bed: "Bed 2", bunkType: "Top Bunk" },
    property: "Gastonia Crew Housing",
    moveInDate: "Apr 20, 2024",
    status: "active" as const,
    amount: { value: 150, type: "Deposit Paid" as const },
    createdOn: { date: "Apr 5, 2024", time: "2:15 PM" },
    leaseTerm: "12 Months",
    monthlyRent: "$650",
    deposit: "$150",
    amountPaid: "$150",
    reservedOn: "Apr 5, 2024 at 2:15 PM",
    notes: "",
  },
  {
    id: "RES-2024-0001",
    renter: {
      name: "Maria Garcia",
      email: "maria.g@email.com",
      phone: "(803) 555-0134",
      occupation: "Flight Attendant",
      employer: "Southwest Airlines",
      monthlyIncome: "$3,900",
    },
    bed: { room: "Room D", bed: "Bed 2", bunkType: "Top Bunk" },
    property: "Monroe Flight Crew House",
    moveInDate: "Apr 1, 2024",
    status: "active" as const,
    amount: { value: 150, type: "Deposit Paid" as const },
    createdOn: { date: "Mar 20, 2024", time: "9:00 AM" },
    leaseTerm: "6 Months",
    monthlyRent: "$650",
    deposit: "$150",
    amountPaid: "$150",
    reservedOn: "Mar 20, 2024 at 9:00 AM",
    notes: "",
  },
];

type Reservation = (typeof MOCK_RESERVATIONS)[0];
type StatusFilter = "all" | "active" | "upcoming" | "expired_cancelled";

// Calculate stats
const totalReservations = MOCK_RESERVATIONS.length;
const activeCount = MOCK_RESERVATIONS.filter((r) => r.status === "active").length;
const upcomingCount = MOCK_RESERVATIONS.filter((r) => r.status === "upcoming").length;
const expiredCancelledCount = MOCK_RESERVATIONS.filter(
  (r) => r.status === "expired" || r.status === "cancelled"
).length;

export default function ReservationsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [selectedReservation, setSelectedReservation] = React.useState<Reservation | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("list");
  const itemsPerPage = 8;

  const filteredReservations = MOCK_RESERVATIONS.filter((res) => {
    const matchesSearch =
      res.renter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.renter.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && res.status === "active") ||
      (statusFilter === "upcoming" && res.status === "upcoming") ||
      (statusFilter === "expired_cancelled" &&
        (res.status === "expired" || res.status === "cancelled"));
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const paginatedReservations = filteredReservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openDetail = (res: Reservation) => {
    setSelectedReservation(res);
  };

  const closeDetail = () => {
    setSelectedReservation(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reservations</h1>
          <p className="text-slate-500">View and manage all bed reservations across your properties.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Reservation
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          label="Total Reservations"
          value={12}
          subtitle="All Time"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Active"
          value={8}
          subtitle="Currently"
          color="emerald"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Upcoming"
          value={4}
          subtitle="Next 30 Days"
          color="blue"
        />
        <StatCard
          icon={<XCircle className="h-5 w-5" />}
          label="Expired / Cancelled"
          value={2}
          subtitle="This Month"
          color="red"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Conversion Rate"
          value="66.7%"
          subtitle="Applications → Reservations"
          color="indigo"
          isPercentage
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search reservations..."
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
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "rounded-md p-2 transition-colors",
              viewMode === "grid"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "rounded-md p-2 transition-colors",
              viewMode === "list"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          <TabButton
            label="All Reservations"
            count={totalReservations}
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          />
          <TabButton
            label="Active"
            count={activeCount}
            active={statusFilter === "active"}
            onClick={() => setStatusFilter("active")}
          />
          <TabButton
            label="Upcoming"
            count={upcomingCount}
            active={statusFilter === "upcoming"}
            onClick={() => setStatusFilter("upcoming")}
          />
          <TabButton
            label="Expired / Cancelled"
            count={expiredCancelledCount}
            active={statusFilter === "expired_cancelled"}
            onClick={() => setStatusFilter("expired_cancelled")}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-sm text-slate-500">
                <th className="px-4 py-3 font-medium">Renter</th>
                <th className="px-4 py-3 font-medium">Bed / Room</th>
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-1">
                    Move-In Date
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Created On</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedReservations.map((res) => (
                <tr
                  key={res.id}
                  className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => openDetail(res)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                        {res.renter.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{res.renter.name}</p>
                        <p className="text-xs text-slate-500">{res.renter.email}</p>
                        <p className="text-xs text-slate-500">{res.renter.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {res.bed.room} / {res.bed.bed}
                    </p>
                    <p className="text-xs text-slate-500">{res.bed.bunkType}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-700">{res.property}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{res.moveInDate}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={res.status} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      ${res.amount.value}
                    </p>
                    <p className="text-xs text-slate-500">{res.amount.type}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{res.createdOn.date}</p>
                    <p className="text-xs text-slate-500">{res.createdOn.time}</p>
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
            {Math.min(currentPage * itemsPerPage, filteredReservations.length)} of{" "}
            {filteredReservations.length} reservations
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

      {/* Reservation Detail Panel */}
      {selectedReservation && (
        <ReservationDetailPanel
          reservation={selectedReservation}
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
  isPercentage,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subtitle: string;
  color?: "emerald" | "blue" | "red" | "indigo";
  isPercentage?: boolean;
}) {
  const colorClasses = {
    emerald: "text-emerald-600 bg-emerald-50",
    blue: "text-blue-600 bg-blue-50",
    red: "text-red-600 bg-red-50",
    indigo: "text-indigo-600 bg-indigo-50",
  };

  const valueColors = {
    emerald: "text-emerald-600",
    blue: "text-blue-600",
    red: "text-red-600",
    indigo: "text-indigo-600",
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

function StatusBadge({ status }: { status: Reservation["status"] }) {
  const styles = {
    active: "bg-emerald-50 text-emerald-700",
    upcoming: "bg-blue-50 text-blue-700",
    expired: "bg-slate-100 text-slate-600",
    cancelled: "bg-red-50 text-red-700",
  };

  const labels = {
    active: "Active",
    upcoming: "Upcoming",
    expired: "Expired",
    cancelled: "Cancelled",
  };

  const dots = {
    active: "bg-emerald-500",
    upcoming: "bg-blue-500",
    expired: "bg-slate-400",
    cancelled: "bg-red-500",
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

function ReservationDetailPanel({
  reservation,
  onClose,
}: {
  reservation: Reservation;
  onClose: () => void;
}) {
  const statusColors = {
    active: "bg-emerald-100 text-emerald-700",
    upcoming: "bg-blue-100 text-blue-700",
    expired: "bg-slate-100 text-slate-600",
    cancelled: "bg-red-100 text-red-700",
  };

  const statusLabels = {
    active: "Active",
    upcoming: "Upcoming",
    expired: "Expired",
    cancelled: "Cancelled",
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
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    statusColors[reservation.status]
                  )}
                >
                  {statusLabels[reservation.status]}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{reservation.renter.name}</h2>
              <p className="text-sm text-slate-500">
                Reserved {reservation.bed.room} / {reservation.bed.bed}
              </p>
              <p className="text-xs text-slate-400">Reservation ID: {reservation.id}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Room Image */}
        <div className="h-48 bg-slate-200">
          <div className="h-full w-full bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400" />
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Button className="gap-2">
              <Edit className="h-4 w-4" />
              Edit Reservation
            </Button>
            <Button variant="outline" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Message Renter
            </Button>
            <Button variant="outline" className="gap-2 ml-auto">
              More Actions
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Reservation Details */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Reservation Details</h3>
            <div className="space-y-3">
              <DetailRow label="Property" value={reservation.property} />
              <DetailRow
                label="Room / Bed"
                value={`${reservation.bed.room} / ${reservation.bed.bed} (${reservation.bed.bunkType})`}
              />
              <DetailRow label="Move-In Date" value={reservation.moveInDate} />
              <DetailRow label="Lease Term" value={reservation.leaseTerm} />
              <DetailRow label="Monthly Rent" value={reservation.monthlyRent} />
              <DetailRow label="Deposit" value={reservation.deposit} />
              <DetailRow label="Amount Paid" value={reservation.amountPaid} />
              <DetailRow label="Reserved On" value={reservation.reservedOn} />
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Status</span>
                <StatusBadge status={reservation.status} />
              </div>
            </div>
          </div>

          {/* Renter Information */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Renter Information</h3>
              <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                <Edit className="h-3.5 w-3.5" />
                Edit
              </button>
            </div>
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                {reservation.renter.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{reservation.renter.name}</p>
                    <p className="text-sm text-slate-500">{reservation.renter.email}</p>
                    <p className="text-sm text-slate-500">{reservation.renter.phone}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-slate-500">Occupation</p>
                    <p className="font-medium text-slate-900">{reservation.renter.occupation}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Employer</p>
                    <p className="font-medium text-slate-900">{reservation.renter.employer}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Monthly Income</p>
                    <p className="font-medium text-slate-900">{reservation.renter.monthlyIncome}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Timeline */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Payment Timeline</h3>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-0 right-0 top-3 h-0.5 bg-slate-200">
                <div className="h-full w-1/2 bg-emerald-500" />
              </div>

              {/* Timeline points */}
              <div className="relative flex justify-between">
                <div className="flex flex-col items-center">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Deposit Paid</p>
                  <p className="text-xs font-medium text-slate-700">May 23, 2024</p>
                  <p className="text-xs font-semibold text-emerald-600">$150</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-slate-400">
                    <span className="text-xs">1</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Move-In Date</p>
                  <p className="text-xs font-medium text-slate-700">{reservation.moveInDate}</p>
                  <p className="text-xs font-semibold text-slate-600">$650 (Rent Due)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900">Notes</h3>
              <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                <Edit className="h-3.5 w-3.5" />
                Edit
              </button>
            </div>
            <p className="text-sm text-slate-600">
              {reservation.notes || "No notes added yet."}
            </p>
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
