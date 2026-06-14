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
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Gift,
  Filter,
  Settings,
  Download,
  Send,
  CreditCard,
  FileText,
  ArrowRight,
  Edit,
  MapPin,
  Check,
  LayoutList,
  LayoutGrid,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Mock data for payments
const MOCK_PAYMENTS = [
  {
    id: "1",
    tenant: { name: "John Smith", email: "john.smith@email.com" },
    roomBed: { room: "Room A", bed: "Bed 4", bunkType: "Bottom Bunk" },
    property: "Charlotte Flight Crew Crash Pad",
    dueDate: "Jul 1, 2024",
    dueDateStatus: "Overdue 7 days",
    amountDue: 650,
    amountType: "Monthly Rent",
    status: "late" as const,
    moveInDate: "May 15, 2024",
    leaseTerm: "12 Months",
    monthlyRent: "$650",
    deposit: "$150",
    paymentMethod: "VISA •••• 4242",
    leaseStatus: "Active",
    paymentHistory: [
      { type: "deposit", label: "Deposit Paid", amount: 150, date: "May 15, 2024", status: "paid" },
      { type: "rent", label: "Rent Paid", amount: 650, date: "Jun 1, 2024", status: "paid" },
      { type: "rent", label: "Rent Due", amount: 650, date: "Jul 1, 2024", status: "overdue" },
      { type: "rent", label: "Future Charge", amount: 650, date: "Aug 1, 2024", status: "upcoming" },
    ],
  },
  {
    id: "2",
    tenant: { name: "Emily Johnson", email: "emily.j@email.com" },
    roomBed: { room: "Room B", bed: "Bed 2", bunkType: "Top Bunk" },
    property: "Concord Travel Nurse House",
    dueDate: "Jul 1, 2024",
    dueDateStatus: "Due today",
    amountDue: 650,
    amountType: "Monthly Rent",
    status: "due_soon" as const,
    moveInDate: "Jun 1, 2024",
    leaseTerm: "6 Months",
    monthlyRent: "$650",
    deposit: "$150",
    paymentMethod: "VISA •••• 8821",
    leaseStatus: "Active",
    paymentHistory: [],
  },
  {
    id: "3",
    tenant: { name: "Michael Brown", email: "michael.b@email.com" },
    roomBed: { room: "Room C", bed: "Bed 1", bunkType: "Bottom Bunk" },
    property: "Gastonia Crew Housing",
    dueDate: "Jul 5, 2024",
    dueDateStatus: "In 4 days",
    amountDue: 700,
    amountType: "Monthly Rent",
    status: "due_soon" as const,
    moveInDate: "Apr 1, 2024",
    leaseTerm: "12 Months",
    monthlyRent: "$700",
    deposit: "$175",
    paymentMethod: "Mastercard •••• 5544",
    leaseStatus: "Active",
    paymentHistory: [],
  },
  {
    id: "4",
    tenant: { name: "Sarah Davis", email: "sarah.d@email.com" },
    roomBed: { room: "Room D", bed: "Bed 3", bunkType: "Top Bunk" },
    property: "Rock Hill Travel Pad",
    dueDate: "Jul 1, 2024",
    dueDateStatus: "",
    amountDue: 650,
    amountType: "Monthly Rent",
    status: "paid" as const,
    moveInDate: "Mar 15, 2024",
    leaseTerm: "6 Months",
    monthlyRent: "$650",
    deposit: "$150",
    paymentMethod: "VISA •••• 9912",
    leaseStatus: "Active",
    paymentHistory: [],
  },
  {
    id: "5",
    tenant: { name: "David Wilson", email: "david.w@email.com" },
    roomBed: { room: "Room A", bed: "Bed 2", bunkType: "Top Bunk" },
    property: "Charlotte Flight Crew Crash Pad",
    dueDate: "Jun 28, 2024",
    dueDateStatus: "",
    amountDue: 325,
    amountType: "Partial Payment",
    status: "partial" as const,
    moveInDate: "Feb 1, 2024",
    leaseTerm: "12 Months",
    monthlyRent: "$650",
    deposit: "$150",
    paymentMethod: "VISA •••• 7734",
    leaseStatus: "Active",
    paymentHistory: [],
  },
  {
    id: "6",
    tenant: { name: "Amanda Martinez", email: "amanda.m@email.com" },
    roomBed: { room: "Room B", bed: "Bed 1", bunkType: "Bottom Bunk" },
    property: "Concord Travel Nurse House",
    dueDate: "Jun 20, 2024",
    dueDateStatus: "Overdue 11 days",
    amountDue: 650,
    amountType: "Monthly Rent",
    status: "late" as const,
    moveInDate: "Jan 15, 2024",
    leaseTerm: "12 Months",
    monthlyRent: "$650",
    deposit: "$150",
    paymentMethod: "Mastercard •••• 2211",
    leaseStatus: "Active",
    paymentHistory: [],
  },
  {
    id: "7",
    tenant: { name: "Chris Anderson", email: "chris.a@email.com" },
    roomBed: { room: "Room C", bed: "Bed 4", bunkType: "Top Bunk" },
    property: "Gastonia Crew Housing",
    dueDate: "Jul 10, 2024",
    dueDateStatus: "In 9 days",
    amountDue: 700,
    amountType: "Monthly Rent",
    status: "upcoming" as const,
    moveInDate: "May 1, 2024",
    leaseTerm: "6 Months",
    monthlyRent: "$700",
    deposit: "$175",
    paymentMethod: "VISA •••• 3344",
    leaseStatus: "Active",
    paymentHistory: [],
  },
];

const MOCK_DEPOSITS = [
  { tenant: "John Smith", property: "Charlotte Flight Crew Crash Pad", bed: "Room A / Bed 4", deposit: 150, status: "paid" as const, moveInDate: "Jul 15, 2024" },
  { tenant: "Emily Johnson", property: "Concord Travel Nurse House", bed: "Room B / Bed 2", deposit: 150, status: "pending" as const, moveInDate: "Jul 20, 2024" },
  { tenant: "David Wilson", property: "Charlotte Flight Crew Crash Pad", bed: "Room A / Bed 2", deposit: 150, status: "refunded" as const, moveInDate: "Jun 28, 2024" },
  { tenant: "Chris Anderson", property: "Gastonia Crew Housing", bed: "Room C / Bed 1", deposit: 150, status: "paid" as const, moveInDate: "Jul 5, 2024" },
];

const LATE_ALERTS = [
  { name: "Sarah Davis", daysOverdue: 7, roomBed: "Room D / Bed 3", amount: 650 },
  { name: "Amanda Martinez", daysOverdue: 11, roomBed: "Room B / Bed 1", amount: 650 },
  { name: "John Smith", daysOverdue: 7, roomBed: "Room A / Bed 4", amount: 650 },
];

type Payment = (typeof MOCK_PAYMENTS)[0];
type StatusFilter = "all" | "paid" | "due_soon" | "late" | "deposits" | "refunds";

export default function RentPaymentsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [viewMode, setViewMode] = React.useState<"table" | "card">("table");
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  const itemsPerPage = 7;

  const filteredPayments = MOCK_PAYMENTS.filter((payment) => {
    const matchesSearch =
      payment.tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.property.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "paid" && payment.status === "paid") ||
      (statusFilter === "due_soon" && payment.status === "due_soon") ||
      (statusFilter === "late" && payment.status === "late");
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleRowSelection = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const openDetail = (payment: Payment) => {
    setSelectedPayment(payment);
  };

  const closeDetail = () => {
    setSelectedPayment(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rent & Payments</h1>
          <p className="text-slate-500">Track rent, deposits, and payments across all of your properties.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Charge
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Expected Revenue"
          value="$38,450"
          subtitle="This Month"
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5" />}
          label="Collected"
          value="$34,150"
          subtitle="↑ 89% of expected"
          color="emerald"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Outstanding"
          value="$4,300"
          subtitle="Needs attention"
          color="amber"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Late Payments"
          value="6"
          subtitle="Across properties"
          color="red"
        />
        <StatCard
          icon={<Gift className="h-5 w-5" />}
          label="Deposits Held"
          value="$2,250"
          subtitle="15 Reservations"
          color="indigo"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search tenant, room, or property..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-3">
          <FilterSelect options={["All Properties"]} />
          <FilterSelect options={["All Statuses"]} />
          <FilterSelect options={["This Month"]} />
          <FilterSelect options={["All Types"]} />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
        <button className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:text-slate-600">
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-6">
          <TabButton label="All Payments" count={48} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
          <TabButton label="Paid" count={32} active={statusFilter === "paid"} onClick={() => setStatusFilter("paid")} />
          <TabButton label="Due Soon" count={6} active={statusFilter === "due_soon"} onClick={() => setStatusFilter("due_soon")} color="amber" />
          <TabButton label="Late" count={6} active={statusFilter === "late"} onClick={() => setStatusFilter("late")} color="red" />
          <TabButton label="Deposits" count={15} active={statusFilter === "deposits"} onClick={() => setStatusFilter("deposits")} />
          <TabButton label="Refunds" count={3} active={statusFilter === "refunds"} onClick={() => setStatusFilter("refunds")} />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1 mb-[-1px]">
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              viewMode === "table" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <LayoutList className="h-4 w-4" />
            Table View
          </button>
          <button
            onClick={() => setViewMode("card")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              viewMode === "card" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            Card View
          </button>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-sm text-slate-500">
                <th className="px-4 py-3 font-medium w-10">
                  <input type="checkbox" className="rounded border-slate-300" />
                </th>
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">Room / Bed</th>
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-1">
                    Due Date
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">Amount Due</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => openDetail(payment)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(payment.id)}
                      onChange={() => toggleRowSelection(payment.id)}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                        {payment.tenant.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{payment.tenant.name}</p>
                        <p className="text-xs text-slate-500">{payment.tenant.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{payment.roomBed.room} / {payment.roomBed.bed}</p>
                    <p className="text-xs text-slate-500">{payment.roomBed.bunkType}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-700">{payment.property}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{payment.dueDate}</p>
                    {payment.dueDateStatus && (
                      <p className={cn(
                        "text-xs",
                        payment.status === "late" ? "text-red-600" :
                        payment.status === "due_soon" ? "text-amber-600" :
                        "text-emerald-600"
                      )}>
                        {payment.dueDateStatus}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">${payment.amountDue}</p>
                    <p className="text-xs text-slate-500">{payment.amountType}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); }}
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
            Showing 1 to 7 of 48 payments
          </p>
          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:text-slate-600">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {[1, 2, 3, "...", 7].map((page, i) => (
              <button
                key={i}
                className={cn(
                  "h-9 w-9 rounded-lg text-sm font-medium transition-colors",
                  page === 1 ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                {page}
              </button>
            ))}
            <button className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:text-slate-600">
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

      {/* Bottom Section - Charts and Analytics */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Overview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Revenue Overview</h3>
            <select className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
              <option>This Month</option>
            </select>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative h-32 w-32">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={`${89 * 2.51} ${100 * 2.51}`} />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={`${11 * 2.51} ${100 * 2.51}`} strokeDashoffset={`-${89 * 2.51}`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-900">$38,450</span>
                <span className="text-xs text-slate-500">Total Expected</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-slate-600">Collected</span>
                <span className="ml-auto text-sm font-semibold text-slate-900">$34,150 (89%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-sm text-slate-600">Outstanding</span>
                <span className="ml-auto text-sm font-semibold text-slate-900">$4,300 (11%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-slate-300" />
                <span className="text-sm text-slate-600">Refunds</span>
                <span className="ml-auto text-sm font-semibold text-slate-900">$650 (2%)</span>
              </div>
            </div>
          </div>
          <button className="mt-4 flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View Revenue Report
            <ArrowRight className="h-4 w-4" />
          </button>
        </Card>

        {/* Monthly Revenue Trend */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Monthly Revenue Trend</h3>
            <select className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
              <option>Last 6 Months</option>
            </select>
          </div>
          <div className="flex items-center gap-4 mb-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
              Collected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              Expected
            </span>
          </div>
          {/* Simplified Bar Chart */}
          <div className="flex items-end justify-between gap-2 h-32">
            {[
              { month: "Jan", collected: 28, expected: 32 },
              { month: "Feb", collected: 30, expected: 32 },
              { month: "Mar", collected: 32, expected: 34 },
              { month: "Apr", collected: 31, expected: 34 },
              { month: "May", collected: 32, expected: 34 },
              { month: "Jun", collected: 34, expected: 38 },
            ].map((data) => (
              <div key={data.month} className="flex flex-col items-center flex-1 gap-1">
                <div className="flex items-end gap-0.5 h-24 w-full">
                  <div
                    className="flex-1 bg-indigo-600 rounded-t"
                    style={{ height: `${(data.collected / 40) * 100}%` }}
                  />
                  <div
                    className="flex-1 bg-slate-200 rounded-t"
                    style={{ height: `${(data.expected / 40) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500">{data.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>May: Expected $34,200</span>
            <span>Collected $32,100</span>
          </div>
        </Card>

        {/* Collection Rate */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Collection Rate</h3>
          <div className="flex flex-col items-center py-4">
            <div className="relative h-32 w-32">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={`${89 * 2.51} ${100 * 2.51}`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900">89%</span>
                <span className="text-xs text-slate-500">Collection Rate</span>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-1 text-sm text-emerald-600">
              <TrendingUp className="h-4 w-4" />
              6% from last month
            </p>
          </div>
          <button className="mt-4 flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 mx-auto">
            View Analytics
            <ArrowRight className="h-4 w-4" />
          </button>
        </Card>
      </div>

      {/* Bottom Section - Deposits & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Deposits & Reservations */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Deposits & Reservations</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="pb-2 font-medium">Tenant</th>
                  <th className="pb-2 font-medium">Property</th>
                  <th className="pb-2 font-medium">Bed</th>
                  <th className="pb-2 font-medium">Deposit</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Move-In Date</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_DEPOSITS.map((deposit, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                          {deposit.tenant.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="text-slate-900">{deposit.tenant}</span>
                      </div>
                    </td>
                    <td className="py-2 text-slate-600">{deposit.property}</td>
                    <td className="py-2 text-slate-600">{deposit.bed}</td>
                    <td className="py-2 font-medium text-slate-900">${deposit.deposit}</td>
                    <td className="py-2">
                      <DepositStatusBadge status={deposit.status} />
                    </td>
                    <td className="py-2 text-slate-600">{deposit.moveInDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-4">
            <QuickActionButton icon={<Plus className="h-5 w-5" />} label="Create Rent Charge" />
            <QuickActionButton icon={<CreditCard className="h-5 w-5" />} label="Record Manual Payment" />
            <QuickActionButton icon={<Check className="h-5 w-5" />} label="Mark Paid" />
            <QuickActionButton icon={<RefreshCw className="h-5 w-5" />} label="Issue Refund" />
            <QuickActionButton icon={<Send className="h-5 w-5" />} label="Send Reminder" />
            <QuickActionButton icon={<FileText className="h-5 w-5" />} label="Export Report" />
          </div>
        </Card>
      </div>

      {/* Payment Detail Panel */}
      {selectedPayment && (
        <PaymentDetailPanel payment={selectedPayment} onClose={closeDetail} lateAlerts={LATE_ALERTS} />
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
  value: string;
  subtitle: string;
  color?: "emerald" | "amber" | "red" | "indigo";
}) {
  const colorClasses = {
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    red: "text-red-600 bg-red-50",
    indigo: "text-indigo-600 bg-indigo-50",
  };

  const valueColors = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-600",
    indigo: "text-indigo-600",
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", color ? colorClasses[color] : "bg-slate-100 text-slate-600")}>
          {icon}
        </div>
        <div>
          <p className={cn("text-2xl font-bold", color ? valueColors[color] : "text-slate-900")}>{value}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">{label}</p>
    </Card>
  );
}

function FilterSelect({ options }: { options: string[] }) {
  return (
    <div className="relative">
      <select className="appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2 pr-10 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function TabButton({ label, count, active, onClick, color }: { label: string; count: number; active: boolean; onClick: () => void; color?: "amber" | "red" }) {
  const countColors = {
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <button
      onClick={onClick}
      className={cn("flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors", active ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700")}
    >
      {label}
      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", active ? "bg-indigo-100 text-indigo-700" : color ? countColors[color] : "bg-slate-100 text-slate-600")}>
        {count}
      </span>
    </button>
  );
}

function StatusBadge({ status }: { status: Payment["status"] }) {
  const styles = {
    paid: "bg-emerald-50 text-emerald-700",
    due_soon: "bg-amber-50 text-amber-700",
    late: "bg-red-50 text-red-700",
    partial: "bg-blue-50 text-blue-700",
    upcoming: "bg-slate-100 text-slate-600",
  };

  const labels = {
    paid: "Paid",
    due_soon: "Due Soon",
    late: "Late",
    partial: "Partial",
    upcoming: "Upcoming",
  };

  const dots = {
    paid: "bg-emerald-500",
    due_soon: "bg-amber-500",
    late: "bg-red-500",
    partial: "bg-blue-500",
    upcoming: "bg-slate-400",
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", styles[status])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[status])} />
      {labels[status]}
    </span>
  );
}

function DepositStatusBadge({ status }: { status: "paid" | "pending" | "refunded" }) {
  const styles = {
    paid: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    refunded: "bg-blue-50 text-blue-700",
  };

  const labels = {
    paid: "Paid",
    pending: "Pending",
    refunded: "Refunded",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}

function QuickActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-4 text-slate-600 hover:bg-slate-50 transition-colors">
      <span className="text-indigo-600">{icon}</span>
      <span className="text-xs font-medium text-center">{label}</span>
    </button>
  );
}

function PaymentDetailPanel({ payment, onClose, lateAlerts }: { payment: Payment; onClose: () => void; lateAlerts: typeof LATE_ALERTS }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-600">
                {payment.tenant.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{payment.tenant.name}</h2>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Active</span>
                </div>
                <p className="text-sm text-slate-600">{payment.roomBed.room} / {payment.roomBed.bed} ({payment.roomBed.bunkType})</p>
                <p className="flex items-center gap-1 text-sm text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {payment.property}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-500">Move-In Date</p>
              <p className="text-sm font-semibold text-slate-900">{payment.moveInDate}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Lease Term</p>
              <p className="text-sm font-semibold text-slate-900">{payment.leaseTerm}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Monthly Rent</p>
              <p className="text-sm font-semibold text-slate-900">{payment.monthlyRent}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Deposit</p>
              <p className="text-sm font-semibold text-slate-900">{payment.deposit}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Details */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Payment Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Next Due Date</span>
                <div className="text-right">
                  <span className="text-sm font-medium text-slate-900">{payment.dueDate}</span>
                  {payment.status === "late" && <span className="ml-2 text-xs text-red-600">Overdue 7 days</span>}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Amount Due</span>
                <span className="text-sm font-medium text-slate-900">${payment.amountDue}.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Payment Method</span>
                <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-bold text-indigo-700">VISA</span>
                  {payment.paymentMethod.replace("VISA ", "")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Lease Status</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">{payment.leaseStatus}</span>
              </div>
            </div>
          </div>

          {/* Payment Timeline */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Payment Timeline</h3>
              <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                <Edit className="h-3.5 w-3.5" />
                Edit
              </button>
            </div>
            <div className="space-y-4">
              {payment.paymentHistory.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    item.status === "paid" ? "bg-emerald-100 text-emerald-600" :
                    item.status === "overdue" ? "bg-red-100 text-red-600" :
                    "bg-slate-100 text-slate-400"
                  )}>
                    {item.status === "paid" ? <Check className="h-4 w-4" /> : <span className="text-xs">{i + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    <p className={cn("text-xs", item.status === "overdue" ? "text-red-600" : "text-slate-500")}>{item.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-semibold", item.status === "overdue" ? "text-red-600" : "text-slate-900")}>${item.amount}</p>
                    {item.status === "overdue" && <p className="text-xs text-red-600">Overdue</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button className="gap-2 flex-1">Record Payment</Button>
            <Button variant="outline" className="gap-2">
              <Send className="h-4 w-4" />
              Send Reminder
            </Button>
            <Button variant="outline" className="gap-2">
              More Actions
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Late Rent Alerts */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Late Rent Alerts</h3>
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>
            </div>
            <div className="space-y-3">
              {lateAlerts.map((alert, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                    {alert.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{alert.name}</p>
                    <p className="text-xs text-red-600">{alert.daysOverdue} days overdue</p>
                    <p className="text-xs text-slate-500">{alert.roomBed}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">${alert.amount}</p>
                  </div>
                  <Button variant="outline" size="sm">Send Reminder</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
