"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  BedDouble,
  Users,
  DoorOpen,
  DollarSign,
  Plus,
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  MapPin,
  MoreVertical,
  X,
  Wrench,
  Megaphone,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

// Mock data for properties
const mockProperties = [
  {
    id: "1",
    name: "Charlotte Flight Crew Crash Pad",
    address: "123 Aviation Way, Charlotte, NC 28202",
    image: "/images/hero-crashpad.png",
    status: "active",
    beds: 16,
    occupied: 14,
    reserved: 1,
    available: 1,
    revenue: 9450,
  },
  {
    id: "2",
    name: "Concord Travel Nurse House",
    address: "456 Medical Dr, Concord, NC 28025",
    image: null,
    status: "active",
    beds: 12,
    occupied: 10,
    reserved: 0,
    available: 2,
    revenue: 7800,
  },
  {
    id: "3",
    name: "Gastonia Crew Housing",
    address: "789 Crew Ln, Gastonia, NC 28052",
    image: null,
    status: "active",
    beds: 14,
    occupied: 13,
    reserved: 1,
    available: 0,
    revenue: 8900,
  },
  {
    id: "4",
    name: "Rock Hill Travel Pad",
    address: "321 Comfort St, Rock Hill, SC 29730",
    image: null,
    status: "active",
    beds: 10,
    occupied: 10,
    reserved: 0,
    available: 0,
    revenue: 5200,
  },
  {
    id: "5",
    name: "Monroe Flight Crew House",
    address: "654 Aviation Blvd, Monroe, NC 28110",
    image: null,
    status: "active",
    beds: 12,
    occupied: 11,
    reserved: 1,
    available: 0,
    revenue: 7100,
  },
];

// Calculate totals
const totals = {
  properties: mockProperties.length,
  totalBeds: mockProperties.reduce((sum, p) => sum + p.beds, 0),
  occupied: mockProperties.reduce((sum, p) => sum + p.occupied, 0),
  vacant: mockProperties.reduce((sum, p) => sum + p.available, 0),
  revenue: mockProperties.reduce((sum, p) => sum + p.revenue, 0),
};

export default function PropertiesPage() {
  const [selectedProperty, setSelectedProperty] = React.useState<typeof mockProperties[0] | null>(null);
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
          <p className="text-slate-500">Manage all of your crash pads and room-rental properties.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Property
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          label="Properties"
          value={totals.properties}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatCard
          icon={<BedDouble className="h-5 w-5" />}
          label="Total Beds"
          value={totals.totalBeds}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Occupied"
          value={totals.occupied}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          icon={<DoorOpen className="h-5 w-5" />}
          label="Vacant"
          value={totals.vacant}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Monthly Revenue"
          value={formatCurrency(totals.revenue)}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Status</span>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
            All
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Sort By</span>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
            Newest
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* View Toggle */}
        <div className="ml-auto flex items-center rounded-lg border border-slate-200 bg-white p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-md p-1.5 ${viewMode === "grid" ? "bg-slate-100 text-slate-900" : "text-slate-400"}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-md p-1.5 ${viewMode === "list" ? "bg-slate-100 text-slate-900" : "text-slate-400"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Property Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mockProperties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onSelect={() => setSelectedProperty(property)}
          />
        ))}
      </div>

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </Card>
  );
}

function PropertyCard({
  property,
  onSelect,
}: {
  property: typeof mockProperties[0];
  onSelect: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-slate-200 to-slate-300">
        {property.image && (
          <img
            src={property.image}
            alt={property.name}
            className="h-full w-full object-cover"
          />
        )}
        <span className="absolute left-3 top-3 rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white">
          Active
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900">{property.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          {property.address}
        </p>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div>
            <span className="font-bold text-slate-900">{property.beds}</span>
            <span className="ml-1 text-slate-500">Beds</span>
          </div>
          <div>
            <span className="font-bold text-amber-600">{property.occupied}</span>
            <span className="ml-1 text-slate-500">Occupied</span>
          </div>
          <div>
            <span className="font-bold text-indigo-600">{property.reserved}</span>
            <span className="ml-1 text-slate-500">Reserved</span>
          </div>
          <div>
            <span className="font-bold text-emerald-600">{property.available}</span>
            <span className="ml-1 text-slate-500">Available</span>
          </div>
        </div>

        {/* Revenue */}
        <p className="mt-3 text-sm text-slate-600">
          Revenue: <span className="font-semibold text-slate-900">{formatCurrency(property.revenue)}</span> / month
        </p>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onSelect}>
            View Property
          </Button>
          <button className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}

function PropertyDetailModal({
  property,
  onClose,
}: {
  property: typeof mockProperties[0];
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = React.useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "rooms", label: "Rooms" },
    { id: "applications", label: "Applications (3)" },
    { id: "tenants", label: "Tenants" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 p-4">
      <div className="h-full w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header Image */}
        <div className="relative h-48 bg-gradient-to-br from-slate-200 to-slate-300">
          {property.image && (
            <img
              src={property.image}
              alt={property.name}
              className="h-full w-full object-cover"
            />
          )}
          <span className="absolute left-4 top-4 rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white">
            Active
          </span>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-slate-600 hover:bg-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Property Info */}
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-900">{property.name}</h2>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            {property.address}
          </p>

          {/* Stats */}
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div>
              <span className="text-xl font-bold text-slate-900">{property.beds}</span>
              <span className="ml-1 text-slate-500">Beds</span>
            </div>
            <div>
              <span className="text-xl font-bold text-amber-600">{property.occupied}</span>
              <span className="ml-1 text-slate-500">Occupied</span>
            </div>
            <div>
              <span className="text-xl font-bold text-indigo-600">{property.reserved}</span>
              <span className="ml-1 text-slate-500">Reserved</span>
            </div>
            <div>
              <span className="text-xl font-bold text-emerald-600">{property.available}</span>
              <span className="ml-1 text-slate-500">Available</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-100">
          <div className="flex gap-1 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6">
          {activeTab === "overview" && (
            <>
              {/* Occupancy Overview */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Occupancy Overview</h3>
                <div className="grid grid-cols-2 gap-3">
                  <RoomCard name="Room A" beds={4} labels={["A1", "A2", "A3", "A4"]} statuses={["occupied", "reserved", "reserved", "available"]} />
                  <RoomCard name="Room B" beds={4} labels={["B1", "B2", "B3", "B4"]} statuses={["occupied", "occupied", "reserved", "occupied"]} />
                  <RoomCard name="Room C" beds={4} labels={["C1", "C2", "C3", "C4"]} statuses={["occupied", "reserved", "occupied", "available"]} />
                  <RoomCard name="Room D" beds={4} labels={["D1", "D2", "D3", "D4"]} statuses={["occupied", "occupied", "occupied", "occupied"]} />
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                    Occupied
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    Reserved
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    Maintenance
                  </span>
                </div>
              </div>

              {/* Revenue & Applications Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Revenue Overview */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900">Revenue Overview</h4>
                    <span className="text-xs text-slate-500">This Month</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Expected</span>
                      <span className="font-semibold text-slate-900">$9,450</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-600">Collected</span>
                      <span className="font-semibold text-emerald-600">$8,150</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-600">Outstanding</span>
                      <span className="font-semibold text-amber-600">$1,300</span>
                    </div>
                  </div>
                  <Link href="/dashboard/rent" className="mt-3 flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    View Rent Overview
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Card>

                {/* Pending Applications */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900">Pending Applications</h4>
                    <Link href="/dashboard/applications" className="text-xs font-medium text-indigo-600">View All</Link>
                  </div>
                  <div className="space-y-3">
                    <ApplicationRow name="John Smith" room="Room A / Bed 4" date="Jul 15, 2024" />
                    <ApplicationRow name="Emily Johnson" room="Room B / Bed 2" date="Jul 20, 2024" />
                    <ApplicationRow name="Michael Brown" room="Room D / Bed 1" date="Jul 22, 2024" />
                  </div>
                </Card>
              </div>

              {/* Maintenance & Quick Actions Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Maintenance Requests */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900">Maintenance Requests</h4>
                    <Link href="/dashboard/maintenance" className="text-xs font-medium text-indigo-600">View All</Link>
                  </div>
                  <div className="space-y-3">
                    <MaintenanceRow title="Bathroom Light" room="Room A" time="2h ago" status="open" />
                    <MaintenanceRow title="Broken Bed Ladder" room="Room B" time="1d ago" status="open" />
                    <MaintenanceRow title="Kitchen Faucet" room="Room C" time="2d ago" status="in_progress" />
                  </div>
                </Card>

                {/* Quick Actions */}
                <Card className="p-4">
                  <h4 className="font-semibold text-slate-900 mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <QuickAction icon={<Plus className="h-4 w-4" />} label="Add Room" />
                    <QuickAction icon={<Plus className="h-4 w-4" />} label="Add Bed" />
                    <QuickAction icon={<Megaphone className="h-4 w-4" />} label="Send Announcement" />
                    <QuickAction icon={<DollarSign className="h-4 w-4" />} label="Create Rent Charge" />
                    <QuickAction icon={<FileText className="h-4 w-4" />} label="Export Report" />
                  </div>
                </Card>
              </div>
            </>
          )}

          {activeTab !== "overview" && (
            <div className="flex h-40 items-center justify-center text-slate-400">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} content coming soon
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RoomCard({
  name,
  beds,
  labels,
  statuses,
}: {
  name: string;
  beds: number;
  labels: string[];
  statuses: ("occupied" | "reserved" | "available" | "maintenance")[];
}) {
  const statusColors = {
    occupied: "bg-indigo-600 text-white",
    reserved: "bg-blue-500 text-white",
    available: "bg-slate-200 text-slate-600",
    maintenance: "bg-red-500 text-white",
  };

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-slate-900">{name}</span>
        <span className="text-xs text-slate-500">{beds} Beds</span>
      </div>
      <div className="flex gap-1.5">
        {labels.map((label, i) => (
          <div
            key={label}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${statusColors[statuses[i]]}`}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplicationRow({
  name,
  room,
  date,
}: {
  name: string;
  room: string;
  date: string;
}) {
  const initials = name.split(" ").map(n => n[0]).join("");

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
        <p className="text-xs text-slate-500">{room}</p>
      </div>
      <span className="shrink-0 text-xs text-slate-400">{date}</span>
    </div>
  );
}

function MaintenanceRow({
  title,
  room,
  time,
  status,
}: {
  title: string;
  room: string;
  time: string;
  status: "open" | "in_progress";
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{room}</p>
      </div>
      <span className="text-xs text-slate-400">{time}</span>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
        status === "open" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
      }`}>
        {status === "open" ? "Open" : "In Progress"}
      </span>
    </div>
  );
}

function QuickAction({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50">
      {icon}
      {label}
    </button>
  );
}
