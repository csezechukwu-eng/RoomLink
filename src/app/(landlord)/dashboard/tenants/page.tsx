"use client";

import { useState } from "react";
import {
  Users,
  UserPlus,
  UserMinus,
  Clock,
  Download,
  Plus,
  Search,
  ChevronDown,
  Filter,
  LayoutGrid,
  MoreVertical,
  X,
  MapPin,
  Calendar,
  DollarSign,
  MessageSquare,
  Pencil,
  Phone,
  Mail,
  Cake,
  Briefcase,
  Building2,
  Banknote,
  Car,
  UserCircle,
  FileText,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Wrench,
  Home,
} from "lucide-react";
import { Card } from "@/components/ui/card";

// Types
type TenantStatus = "active" | "notice" | "moving_out" | "pending" | "inactive";
type TabFilter = "all" | "active" | "pending" | "moving_out" | "inactive";

interface Tenant {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  room: string;
  bed: string;
  bunkType: string;
  property: string;
  leaseEndDate: string;
  status: TenantStatus;
  rent: number;
  moveInDate: string;
  deposit: number;
  dateOfBirth: string;
  occupation: string;
  employer: string;
  monthlyIncome: number;
  vehicle: string;
  emergencyContact: { name: string; relation: string; phone: string };
  leaseTerm: string;
  leaseStartDate: string;
  leaseStatus: string;
  lastRentPaid: string;
  nextDueDate: string;
  paidToDate: number;
  paymentsCount: number;
  outstanding: number;
  outstandingPayments: number;
  lateFees: number;
  totalDue: number;
  notes: string;
  recentActivity: { type: string; description: string; date: string; details?: string }[];
}

// Mock data
const MOCK_TENANTS: Tenant[] = [
  {
    id: "1",
    name: "John Smith",
    phone: "(704) 555-0189",
    email: "john.smith@email.com",
    room: "Room A",
    bed: "Bed 4",
    bunkType: "Bottom Bunk",
    property: "Charlotte Flight Crew Crash Pad",
    leaseEndDate: "May 15, 2025",
    status: "active",
    rent: 650,
    moveInDate: "May 15, 2024",
    deposit: 150,
    dateOfBirth: "Apr 12, 1992",
    occupation: "Flight Attendant",
    employer: "American Airlines",
    monthlyIncome: 4200,
    vehicle: "Toyota Camry (ABC-1234)",
    emergencyContact: { name: "Mary Smith", relation: "Mother", phone: "(704) 555-0111" },
    leaseTerm: "12 Months",
    leaseStartDate: "May 15, 2024",
    leaseStatus: "Active",
    lastRentPaid: "Jun 1, 2024",
    nextDueDate: "Jul 1, 2024",
    paidToDate: 1950,
    paymentsCount: 3,
    outstanding: 650,
    outstandingPayments: 1,
    lateFees: 0,
    totalDue: 650,
    notes: "Great tenant. Pays on time and keeps the room clean. No issues to date.",
    recentActivity: [
      { type: "payment", description: "Rent payment of $650 recorded", date: "Jun 1, 2024 at 9:41 AM" },
      { type: "maintenance", description: "Maintenance request submitted", date: "May 28, 2024 at 4:22 PM", details: "Kitchen faucet dripping" },
      { type: "lease", description: "Lease signed", date: "May 15, 2024 at 10:15 AM" },
      { type: "move_in", description: "John completed move-in", date: "May 15, 2024 at 9:30 AM" },
    ],
  },
  {
    id: "2",
    name: "Emily Johnson",
    phone: "(980) 555-0274",
    email: "emily.johnson@email.com",
    room: "Room B",
    bed: "Bed 2",
    bunkType: "Top Bunk",
    property: "Concord Travel Nurse House",
    leaseEndDate: "May 15, 2025",
    status: "active",
    rent: 650,
    moveInDate: "May 15, 2024",
    deposit: 150,
    dateOfBirth: "Jul 23, 1990",
    occupation: "Travel Nurse",
    employer: "Novant Health",
    monthlyIncome: 5800,
    vehicle: "Honda Civic (XYZ-5678)",
    emergencyContact: { name: "Robert Johnson", relation: "Father", phone: "(980) 555-0222" },
    leaseTerm: "12 Months",
    leaseStartDate: "May 15, 2024",
    leaseStatus: "Active",
    lastRentPaid: "Jun 1, 2024",
    nextDueDate: "Jul 1, 2024",
    paidToDate: 1300,
    paymentsCount: 2,
    outstanding: 0,
    outstandingPayments: 0,
    lateFees: 0,
    totalDue: 0,
    notes: "Quiet and respectful. Always pays early.",
    recentActivity: [
      { type: "payment", description: "Rent payment of $650 recorded", date: "Jun 1, 2024 at 8:15 AM" },
      { type: "lease", description: "Lease signed", date: "May 15, 2024 at 2:30 PM" },
    ],
  },
  {
    id: "3",
    name: "Michael Brown",
    phone: "(704) 555-0132",
    email: "michael.brown@email.com",
    room: "Room C",
    bed: "Bed 1",
    bunkType: "Bottom Bunk",
    property: "Gastonia Crew Housing",
    leaseEndDate: "Jun 1, 2025",
    status: "active",
    rent: 700,
    moveInDate: "Jun 1, 2024",
    deposit: 175,
    dateOfBirth: "Mar 5, 1988",
    occupation: "Pilot",
    employer: "Delta Airlines",
    monthlyIncome: 8500,
    vehicle: "Ford F-150 (DEF-9012)",
    emergencyContact: { name: "Sarah Brown", relation: "Wife", phone: "(704) 555-0333" },
    leaseTerm: "12 Months",
    leaseStartDate: "Jun 1, 2024",
    leaseStatus: "Active",
    lastRentPaid: "Jun 1, 2024",
    nextDueDate: "Jul 1, 2024",
    paidToDate: 700,
    paymentsCount: 1,
    outstanding: 0,
    outstandingPayments: 0,
    lateFees: 0,
    totalDue: 0,
    notes: "New tenant. Moved in last month.",
    recentActivity: [
      { type: "payment", description: "Rent payment of $700 recorded", date: "Jun 1, 2024 at 10:00 AM" },
      { type: "move_in", description: "Michael completed move-in", date: "Jun 1, 2024 at 9:00 AM" },
    ],
  },
  {
    id: "4",
    name: "Sarah Davis",
    phone: "(803) 555-0147",
    email: "sarah.davis@email.com",
    room: "Room D",
    bed: "Bed 3",
    bunkType: "Top Bunk",
    property: "Rock Hill Travel Pad",
    leaseEndDate: "Apr 10, 2025",
    status: "notice",
    rent: 650,
    moveInDate: "Apr 10, 2024",
    deposit: 150,
    dateOfBirth: "Nov 18, 1995",
    occupation: "Flight Attendant",
    employer: "Southwest Airlines",
    monthlyIncome: 3800,
    vehicle: "Nissan Altima (GHI-3456)",
    emergencyContact: { name: "Tom Davis", relation: "Brother", phone: "(803) 555-0444" },
    leaseTerm: "12 Months",
    leaseStartDate: "Apr 10, 2024",
    leaseStatus: "Notice Given",
    lastRentPaid: "Jun 1, 2024",
    nextDueDate: "Jul 1, 2024",
    paidToDate: 1950,
    paymentsCount: 3,
    outstanding: 650,
    outstandingPayments: 1,
    lateFees: 0,
    totalDue: 650,
    notes: "Has given 30-day notice. Moving to a different city.",
    recentActivity: [
      { type: "notice", description: "Move-out notice submitted", date: "Jun 5, 2024 at 3:00 PM" },
      { type: "payment", description: "Rent payment of $650 recorded", date: "Jun 1, 2024 at 9:00 AM" },
    ],
  },
  {
    id: "5",
    name: "David Wilson",
    phone: "(704) 555-0199",
    email: "david.wilson@email.com",
    room: "Room A",
    bed: "Bed 2",
    bunkType: "Top Bunk",
    property: "Charlotte Flight Crew Crash Pad",
    leaseEndDate: "Apr 28, 2025",
    status: "moving_out",
    rent: 325,
    moveInDate: "Apr 28, 2024",
    deposit: 150,
    dateOfBirth: "Feb 28, 1991",
    occupation: "Pilot",
    employer: "United Airlines",
    monthlyIncome: 9200,
    vehicle: "BMW 3 Series (JKL-7890)",
    emergencyContact: { name: "Linda Wilson", relation: "Mother", phone: "(704) 555-0555" },
    leaseTerm: "6 Months",
    leaseStartDate: "Apr 28, 2024",
    leaseStatus: "Moving Out",
    lastRentPaid: "Jun 1, 2024",
    nextDueDate: "N/A",
    paidToDate: 975,
    paymentsCount: 3,
    outstanding: 0,
    outstandingPayments: 0,
    lateFees: 0,
    totalDue: 0,
    notes: "Final month. Move-out scheduled for end of month.",
    recentActivity: [
      { type: "move_out", description: "Move-out inspection scheduled", date: "Jun 10, 2024 at 2:00 PM" },
      { type: "payment", description: "Final rent payment of $325 recorded", date: "Jun 1, 2024 at 11:30 AM" },
    ],
  },
  {
    id: "6",
    name: "Jessica Taylor",
    phone: "(980) 555-0168",
    email: "jessica.taylor@email.com",
    room: "Room B",
    bed: "Bed 1",
    bunkType: "Bottom Bunk",
    property: "Concord Travel Nurse House",
    leaseEndDate: "May 15, 2025",
    status: "active",
    rent: 650,
    moveInDate: "May 15, 2024",
    deposit: 150,
    dateOfBirth: "Aug 9, 1993",
    occupation: "Travel Nurse",
    employer: "Atrium Health",
    monthlyIncome: 5500,
    vehicle: "Chevrolet Malibu (MNO-1234)",
    emergencyContact: { name: "Mike Taylor", relation: "Husband", phone: "(980) 555-0666" },
    leaseTerm: "12 Months",
    leaseStartDate: "May 15, 2024",
    leaseStatus: "Active",
    lastRentPaid: "Jun 1, 2024",
    nextDueDate: "Jul 1, 2024",
    paidToDate: 1300,
    paymentsCount: 2,
    outstanding: 0,
    outstandingPayments: 0,
    lateFees: 0,
    totalDue: 0,
    notes: "",
    recentActivity: [
      { type: "payment", description: "Rent payment of $650 recorded", date: "Jun 1, 2024 at 7:45 AM" },
    ],
  },
  {
    id: "7",
    name: "Chris Anderson",
    phone: "(704) 555-0123",
    email: "chris.anderson@email.com",
    room: "Room C",
    bed: "Bed 4",
    bunkType: "Top Bunk",
    property: "Gastonia Crew Housing",
    leaseEndDate: "Jul 5, 2025",
    status: "active",
    rent: 700,
    moveInDate: "Jul 5, 2024",
    deposit: 175,
    dateOfBirth: "Dec 15, 1989",
    occupation: "Flight Engineer",
    employer: "FedEx",
    monthlyIncome: 7800,
    vehicle: "Jeep Wrangler (PQR-5678)",
    emergencyContact: { name: "Amy Anderson", relation: "Sister", phone: "(704) 555-0777" },
    leaseTerm: "12 Months",
    leaseStartDate: "Jul 5, 2024",
    leaseStatus: "Active",
    lastRentPaid: "Jul 5, 2024",
    nextDueDate: "Aug 5, 2024",
    paidToDate: 700,
    paymentsCount: 1,
    outstanding: 0,
    outstandingPayments: 0,
    lateFees: 0,
    totalDue: 0,
    notes: "New tenant. Just moved in.",
    recentActivity: [
      { type: "move_in", description: "Chris completed move-in", date: "Jul 5, 2024 at 10:00 AM" },
      { type: "payment", description: "First month rent of $700 recorded", date: "Jul 5, 2024 at 9:30 AM" },
    ],
  },
  {
    id: "8",
    name: "Amanda Martinez",
    phone: "(704) 555-0177",
    email: "amanda.martinez@email.com",
    room: "Room D",
    bed: "Bed 4",
    bunkType: "Top Bunk",
    property: "Monroe Flight Crew House",
    leaseEndDate: "Jun 25, 2025",
    status: "active",
    rent: 650,
    moveInDate: "Jun 25, 2024",
    deposit: 150,
    dateOfBirth: "May 30, 1994",
    occupation: "Flight Attendant",
    employer: "JetBlue",
    monthlyIncome: 4000,
    vehicle: "Hyundai Sonata (STU-9012)",
    emergencyContact: { name: "Carlos Martinez", relation: "Father", phone: "(704) 555-0888" },
    leaseTerm: "12 Months",
    leaseStartDate: "Jun 25, 2024",
    leaseStatus: "Active",
    lastRentPaid: "Jun 25, 2024",
    nextDueDate: "Jul 25, 2024",
    paidToDate: 650,
    paymentsCount: 1,
    outstanding: 0,
    outstandingPayments: 0,
    lateFees: 0,
    totalDue: 0,
    notes: "",
    recentActivity: [
      { type: "move_in", description: "Amanda completed move-in", date: "Jun 25, 2024 at 2:00 PM" },
    ],
  },
];

// Helper functions
function getStatusConfig(status: TenantStatus) {
  const configs = {
    active: { label: "Active", color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" },
    notice: { label: "Notice", color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" },
    moving_out: { label: "Moving Out", color: "text-red-600", bg: "bg-red-50", dot: "bg-red-500" },
    pending: { label: "Pending", color: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-500" },
    inactive: { label: "Inactive", color: "text-slate-600", bg: "bg-slate-50", dot: "bg-slate-400" },
  };
  return configs[status];
}

function getActivityIcon(type: string) {
  switch (type) {
    case "payment":
      return <DollarSign className="h-4 w-4 text-emerald-500" />;
    case "maintenance":
      return <Wrench className="h-4 w-4 text-amber-500" />;
    case "lease":
      return <FileText className="h-4 w-4 text-blue-500" />;
    case "move_in":
      return <Home className="h-4 w-4 text-indigo-500" />;
    case "move_out":
      return <UserMinus className="h-4 w-4 text-red-500" />;
    case "notice":
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    default:
      return <CheckCircle className="h-4 w-4 text-slate-400" />;
  }
}

export default function TenantsPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(MOCK_TENANTS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenants, setSelectedTenants] = useState<string[]>(["1"]);

  const counts = {
    all: MOCK_TENANTS.length,
    active: MOCK_TENANTS.filter((t) => t.status === "active").length,
    pending: MOCK_TENANTS.filter((t) => t.status === "pending").length,
    moving_out: MOCK_TENANTS.filter((t) => t.status === "moving_out").length,
    inactive: MOCK_TENANTS.filter((t) => t.status === "inactive").length,
  };

  const toggleTenantSelection = (id: string) => {
    setSelectedTenants((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
            <p className="text-slate-500">Manage your tenants, lease information, and tenant activity across all properties.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
              <Plus className="h-4 w-4" />
              Add Tenant
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-4">
          <StatCard
            icon={<Users className="h-5 w-5 text-indigo-600" />}
            value="32"
            label="Total Tenants"
            sublabel="Across 5 Properties"
          />
          <StatCard
            icon={<Users className="h-5 w-5 text-emerald-600" />}
            value="28"
            label="Active Tenants"
            sublabel="Currently Active"
          />
          <StatCard
            icon={<UserPlus className="h-5 w-5 text-blue-600" />}
            value="4"
            label="Move-Ins This Month"
            sublabel="New Tenants"
          />
          <StatCard
            icon={<UserMinus className="h-5 w-5 text-amber-600" />}
            value="1"
            label="Move-Outs This Month"
            sublabel="Tenants"
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-purple-600" />}
            value="7.2"
            label="Average Tenure"
            sublabel="Months"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <FilterDropdown label="All Properties" />
          <FilterDropdown label="All Statuses" />
          <FilterDropdown label="All Lease Statuses" />
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <button className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50">
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex gap-6">
            {[
              { id: "all" as const, label: "All Tenants", count: counts.all },
              { id: "active" as const, label: "Active", count: counts.active },
              { id: "pending" as const, label: "Pending", count: 2 },
              { id: "moving_out" as const, label: "Moving Out", count: 1 },
              { id: "inactive" as const, label: "Inactive", count: 4 },
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
                  Tenant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Room / Bed
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Property
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Lease End Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Rent
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {MOCK_TENANTS.map((tenant) => {
                const statusConfig = getStatusConfig(tenant.status);
                const isSelected = selectedTenant?.id === tenant.id;

                return (
                  <tr
                    key={tenant.id}
                    onClick={() => setSelectedTenant(tenant)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-indigo-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedTenants.includes(tenant.id)}
                        onChange={() => toggleTenantSelection(tenant.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600">
                          {tenant.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{tenant.name}</p>
                          <p className="text-sm text-slate-500">{tenant.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{tenant.room} / {tenant.bed}</p>
                      <p className="text-sm text-slate-500">{tenant.bunkType}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{tenant.property}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{tenant.leaseEndDate}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      ${tenant.rent} / mo
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

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
            <p className="text-sm text-slate-500">Showing 1 to 8 of 32 tenants</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-500 hover:bg-slate-50">
                  &lt;
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-medium text-white">
                  1
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50">
                  2
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50">
                  3
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50">
                  4
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-500 hover:bg-slate-50">
                  &gt;
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>Show</span>
                <select className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm">
                  <option>10</option>
                  <option>25</option>
                  <option>50</option>
                </select>
                <span>per page</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tenant Detail Panel */}
      {selectedTenant && (
        <div className="w-96 shrink-0">
          <TenantDetailPanel tenant={selectedTenant} onClose={() => setSelectedTenant(null)} />
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
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sublabel: string;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400">{sublabel}</p>
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

function TenantDetailPanel({ tenant, onClose }: { tenant: Tenant; onClose: () => void }) {
  const statusConfig = getStatusConfig(tenant.status);

  return (
    <Card className="sticky top-6 overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-600">
              {tenant.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{tenant.name}</h2>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-sm text-slate-700">
                {tenant.room} / {tenant.bed} ({tenant.bunkType})
              </p>
              <p className="flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-3 w-3" />
                {tenant.property}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Info */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="flex justify-center">
              <Calendar className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-1 text-xs text-slate-500">Move-In Date</p>
            <p className="text-sm font-medium text-slate-900">{tenant.moveInDate}</p>
          </div>
          <div className="text-center">
            <div className="flex justify-center">
              <Calendar className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-1 text-xs text-slate-500">Lease End Date</p>
            <p className="text-sm font-medium text-slate-900">{tenant.leaseEndDate}</p>
          </div>
          <div className="text-center">
            <div className="flex justify-center">
              <DollarSign className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-1 text-xs text-slate-500">Monthly Rent</p>
            <p className="text-sm font-medium text-slate-900">${tenant.rent}</p>
          </div>
          <div className="text-center">
            <div className="flex justify-center">
              <CreditCard className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-1 text-xs text-slate-500">Deposit</p>
            <p className="text-sm font-medium text-slate-900">${tenant.deposit}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center gap-2">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <MessageSquare className="h-4 w-4" />
            Message Tenant
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Pencil className="h-4 w-4" />
            Edit Tenant
          </button>
          <button className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            More Actions
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[calc(100vh-320px)] overflow-y-auto p-4">
        {/* Tenant & Lease Information */}
        <div className="grid grid-cols-2 gap-6">
          {/* Tenant Information */}
          <div>
            <h3 className="mb-3 font-semibold text-slate-900">Tenant Information</h3>
            <div className="space-y-2 text-sm">
              <InfoRow label="Phone" value={tenant.phone} />
              <InfoRow label="Email" value={tenant.email} />
              <InfoRow label="Date of Birth" value={tenant.dateOfBirth} />
              <InfoRow label="Occupation" value={tenant.occupation} />
              <InfoRow label="Employer" value={tenant.employer} />
              <InfoRow label="Monthly Income" value={`$${tenant.monthlyIncome.toLocaleString()}`} />
              <InfoRow label="Vehicle" value={tenant.vehicle} />
              <InfoRow
                label="Emergency Contact"
                value={`${tenant.emergencyContact.name} (${tenant.emergencyContact.relation})`}
                subValue={tenant.emergencyContact.phone}
              />
            </div>
          </div>

          {/* Lease Information */}
          <div>
            <h3 className="mb-3 font-semibold text-slate-900">Lease Information</h3>
            <div className="space-y-2 text-sm">
              <InfoRow label="Lease Term" value={tenant.leaseTerm} />
              <InfoRow label="Start Date" value={tenant.leaseStartDate} />
              <InfoRow label="End Date" value={tenant.leaseEndDate} />
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Lease Status</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                  {tenant.leaseStatus}
                </span>
              </div>
              <InfoRow label="Rent Amount" value={`$${tenant.rent} / month`} />
              <InfoRow label="Deposit Paid" value={`$${tenant.deposit}`} />
              <InfoRow label="Last Rent Paid" value={tenant.lastRentPaid} />
              <InfoRow label="Next Due Date" value={tenant.nextDueDate} />
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="mt-6">
          <h3 className="mb-3 font-semibold text-slate-900">Payment Summary</h3>
          <div className="grid grid-cols-4 gap-3">
            <PaymentStat
              icon={<CheckCircle className="h-4 w-4 text-emerald-500" />}
              label="Paid to Date"
              value={`$${tenant.paidToDate.toLocaleString()}`}
              sublabel={`${tenant.paymentsCount} Payments`}
              color="emerald"
            />
            <PaymentStat
              icon={<Clock className="h-4 w-4 text-amber-500" />}
              label="Outstanding"
              value={`$${tenant.outstanding}`}
              sublabel={tenant.outstandingPayments > 0 ? `${tenant.outstandingPayments} Payment` : "No payments"}
              color="amber"
            />
            <PaymentStat
              icon={<AlertCircle className="h-4 w-4 text-red-500" />}
              label="Late Fees"
              value={`$${tenant.lateFees}`}
              sublabel={tenant.lateFees > 0 ? "Has late fees" : "No late fees"}
              color="red"
            />
            <PaymentStat
              icon={<DollarSign className="h-4 w-4 text-indigo-500" />}
              label="Total Due"
              value={`$${tenant.totalDue}`}
              sublabel={tenant.totalDue > 0 ? `Due ${tenant.nextDueDate}` : "No balance"}
              color="indigo"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Recent Activity</h3>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          <div className="space-y-3">
            {tenant.recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-900">{activity.description}</p>
                  {activity.details && (
                    <p className="text-xs text-slate-500">{activity.details}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-slate-400">{activity.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Notes</h3>
            <button className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          </div>
          <p className="text-sm text-slate-600">
            {tenant.notes || "No notes added yet."}
          </p>
        </div>
      </div>
    </Card>
  );
}

function InfoRow({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div className="flex items-start justify-between py-1">
      <span className="text-slate-500">{label}</span>
      <div className="text-right">
        <span className="font-medium text-slate-900">{value}</span>
        {subValue && <p className="text-xs text-slate-500">{subValue}</p>}
      </div>
    </div>
  );
}

function PaymentStat({
  icon,
  label,
  value,
  sublabel,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  color: "emerald" | "amber" | "red" | "indigo";
}) {
  const colors = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-600",
    indigo: "text-indigo-600",
  };

  return (
    <div className="rounded-lg border border-slate-200 p-3 text-center">
      <div className="flex justify-center">{icon}</div>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${colors[color]}`}>{value}</p>
      <p className="text-xs text-slate-400">{sublabel}</p>
    </div>
  );
}
