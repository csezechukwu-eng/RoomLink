"use client";

import * as React from "react";
import Image from "next/image";
import {
  X,
  Search,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  MoreVertical,
  Upload,
  Plus,
  BedDouble,
  DoorOpen,
  Users,
  Wifi,
  Tv,
  Lock,
  Snowflake,
  WashingMachine,
  Edit,
  Wrench,
  Megaphone,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Mock data for properties and rooms
const MOCK_PROPERTIES = [
  {
    id: "1",
    name: "Charlotte Flight Crew Crash Pad",
    address: "123 Aviation Way, Charlotte, NC 28202",
    image: "/images/property-1.jpg",
    rooms: [
      {
        id: "1a",
        name: "Room A",
        beds: 4,
        type: "Shared Room",
        floor: "2nd Floor",
        size: "250 sq ft",
        occupied: 3,
        reserved: 0,
        available: 1,
        amenities: ["wifi", "tv", "locker", "ac", "laundry"],
        monthlyRevenue: { expected: 2600, collected: 2050 },
        notes: "Room A is one of the largest rooms in the property with great natural light and ample storage.",
        image: "/images/room-1.jpg",
      },
      {
        id: "1b",
        name: "Room B",
        beds: 4,
        type: "Shared Room",
        floor: "2nd Floor",
        size: "240 sq ft",
        occupied: 4,
        reserved: 0,
        available: 0,
        amenities: ["wifi", "tv", "locker", "ac"],
        monthlyRevenue: { expected: 2600, collected: 2600 },
        notes: "Fully occupied room with all beds taken.",
        image: "/images/room-2.jpg",
      },
      {
        id: "1c",
        name: "Room C",
        beds: 4,
        type: "Shared Room",
        floor: "1st Floor",
        size: "230 sq ft",
        occupied: 3,
        reserved: 1,
        available: 0,
        amenities: ["wifi", "tv", "ac", "laundry"],
        monthlyRevenue: { expected: 2600, collected: 1950 },
        notes: "Ground floor room with easy access.",
        image: "/images/room-3.jpg",
      },
      {
        id: "1d",
        name: "Room D",
        beds: 4,
        type: "Shared Room",
        floor: "1st Floor",
        size: "220 sq ft",
        occupied: 4,
        reserved: 0,
        available: 0,
        amenities: ["wifi", "locker", "ac"],
        monthlyRevenue: { expected: 2600, collected: 2600 },
        notes: "Compact room, fully occupied.",
        image: "/images/room-4.jpg",
      },
    ],
  },
  {
    id: "2",
    name: "Concord Travel Nurse House",
    address: "456 Medical Dr, Concord, NC 28025",
    image: "/images/property-2.jpg",
    rooms: [
      {
        id: "2a",
        name: "Room A",
        beds: 4,
        type: "Shared Room",
        floor: "1st Floor",
        size: "260 sq ft",
        occupied: 4,
        reserved: 0,
        available: 0,
        amenities: ["wifi", "tv", "ac", "laundry"],
        monthlyRevenue: { expected: 2800, collected: 2800 },
        notes: "",
        image: "/images/room-1.jpg",
      },
      {
        id: "2b",
        name: "Room B",
        beds: 4,
        type: "Shared Room",
        floor: "1st Floor",
        size: "250 sq ft",
        occupied: 3,
        reserved: 0,
        available: 1,
        amenities: ["wifi", "tv", "ac"],
        monthlyRevenue: { expected: 2800, collected: 2100 },
        notes: "",
        image: "/images/room-2.jpg",
      },
      {
        id: "2c",
        name: "Room C",
        beds: 4,
        type: "Shared Room",
        floor: "2nd Floor",
        size: "240 sq ft",
        occupied: 3,
        reserved: 0,
        available: 1,
        amenities: ["wifi", "ac", "laundry"],
        monthlyRevenue: { expected: 2800, collected: 2100 },
        notes: "",
        image: "/images/room-3.jpg",
      },
    ],
  },
  {
    id: "3",
    name: "Gastonia Crew Housing",
    address: "789 Crew Ln, Gastonia, NC 28052",
    image: "/images/property-3.jpg",
    rooms: [
      {
        id: "3a",
        name: "Room A",
        beds: 5,
        type: "Shared Room",
        floor: "1st Floor",
        size: "300 sq ft",
        occupied: 4,
        reserved: 0,
        available: 1,
        amenities: ["wifi", "tv", "locker", "ac", "laundry"],
        monthlyRevenue: { expected: 3250, collected: 2600 },
        notes: "",
        image: "/images/room-1.jpg",
      },
      {
        id: "3b",
        name: "Room B",
        beds: 5,
        type: "Shared Room",
        floor: "1st Floor",
        size: "290 sq ft",
        occupied: 5,
        reserved: 0,
        available: 0,
        amenities: ["wifi", "tv", "ac"],
        monthlyRevenue: { expected: 3250, collected: 3250 },
        notes: "",
        image: "/images/room-2.jpg",
      },
      {
        id: "3c",
        name: "Room C",
        beds: 4,
        type: "Shared Room",
        floor: "2nd Floor",
        size: "250 sq ft",
        occupied: 4,
        reserved: 0,
        available: 0,
        amenities: ["wifi", "ac"],
        monthlyRevenue: { expected: 2600, collected: 2600 },
        notes: "",
        image: "/images/room-3.jpg",
      },
    ],
  },
  {
    id: "4",
    name: "Rock Hill Travel Pad",
    address: "321 Comfort St, Rock Hill, SC 29730",
    image: "/images/property-4.jpg",
    rooms: [
      {
        id: "4a",
        name: "Room A",
        beds: 5,
        type: "Shared Room",
        floor: "1st Floor",
        size: "280 sq ft",
        occupied: 5,
        reserved: 0,
        available: 0,
        amenities: ["wifi", "tv", "locker", "ac"],
        monthlyRevenue: { expected: 3000, collected: 3000 },
        notes: "",
        image: "/images/room-1.jpg",
      },
      {
        id: "4b",
        name: "Room B",
        beds: 5,
        type: "Shared Room",
        floor: "2nd Floor",
        size: "270 sq ft",
        occupied: 5,
        reserved: 0,
        available: 0,
        amenities: ["wifi", "tv", "ac", "laundry"],
        monthlyRevenue: { expected: 3000, collected: 3000 },
        notes: "",
        image: "/images/room-2.jpg",
      },
    ],
  },
  {
    id: "5",
    name: "Monroe Flight Crew House",
    address: "654 Aviation Blvd, Monroe, NC 28110",
    image: "/images/property-5.jpg",
    rooms: [
      {
        id: "5a",
        name: "Room A",
        beds: 6,
        type: "Shared Room",
        floor: "1st Floor",
        size: "320 sq ft",
        occupied: 5,
        reserved: 0,
        available: 1,
        amenities: ["wifi", "tv", "locker", "ac", "laundry"],
        monthlyRevenue: { expected: 3600, collected: 3000 },
        notes: "",
        image: "/images/room-1.jpg",
      },
      {
        id: "5b",
        name: "Room B",
        beds: 6,
        type: "Shared Room",
        floor: "2nd Floor",
        size: "310 sq ft",
        occupied: 6,
        reserved: 0,
        available: 0,
        amenities: ["wifi", "tv", "ac"],
        monthlyRevenue: { expected: 3600, collected: 3600 },
        notes: "",
        image: "/images/room-2.jpg",
      },
    ],
  },
];

// Calculate totals
const totalRooms = MOCK_PROPERTIES.reduce((acc, p) => acc + p.rooms.length, 0);
const totalBeds = MOCK_PROPERTIES.reduce((acc, p) => acc + p.rooms.reduce((a, r) => a + r.beds, 0), 0);
const totalOccupied = MOCK_PROPERTIES.reduce((acc, p) => acc + p.rooms.reduce((a, r) => a + r.occupied, 0), 0);
const totalReserved = MOCK_PROPERTIES.reduce((acc, p) => acc + p.rooms.reduce((a, r) => a + r.reserved, 0), 0);
const totalAvailable = MOCK_PROPERTIES.reduce((acc, p) => acc + p.rooms.reduce((a, r) => a + r.available, 0), 0);

type Room = (typeof MOCK_PROPERTIES)[0]["rooms"][0];
type Property = (typeof MOCK_PROPERTIES)[0];

export default function RoomsAndBedsPage() {
  const [activeTab, setActiveTab] = React.useState<"rooms" | "beds">("rooms");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("list");
  const [expandedProperties, setExpandedProperties] = React.useState<string[]>(["1"]);
  const [selectedRoom, setSelectedRoom] = React.useState<{ room: Room; property: Property } | null>(null);
  const [detailTab, setDetailTab] = React.useState<"overview" | "beds" | "tenants" | "settings">("overview");

  const toggleProperty = (propertyId: string) => {
    setExpandedProperties((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const openRoomDetail = (room: Room, property: Property) => {
    setSelectedRoom({ room, property });
    setDetailTab("overview");
  };

  const closeRoomDetail = () => {
    setSelectedRoom(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rooms & Beds</h1>
          <p className="text-slate-500">Manage all rooms and beds across your properties.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import Beds
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Room
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={<DoorOpen className="h-5 w-5" />}
          label="Total Rooms"
          value={totalRooms}
        />
        <StatCard
          icon={<BedDouble className="h-5 w-5" />}
          label="Total Beds"
          value={totalBeds}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Occupied"
          value={totalOccupied}
          subtitle={`${((totalOccupied / totalBeds) * 100).toFixed(1)}%`}
          color="emerald"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Reserved"
          value={totalReserved}
          subtitle={`${((totalReserved / totalBeds) * 100).toFixed(1)}%`}
          color="blue"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Available"
          value={totalAvailable}
          subtitle={`${((totalAvailable / totalBeds) * 100).toFixed(1)}%`}
          color="slate"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("rooms")}
            className={cn(
              "border-b-2 pb-3 text-sm font-medium transition-colors",
              activeTab === "rooms"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            All Rooms
          </button>
          <button
            onClick={() => setActiveTab("beds")}
            className={cn(
              "border-b-2 pb-3 text-sm font-medium transition-colors",
              activeTab === "beds"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            All Beds
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search rooms or beds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-3">
          <FilterSelect label="Property" options={["All Properties"]} />
          <FilterSelect label="Status" options={["All Statuses"]} />
          <FilterSelect label="Room Type" options={["All Types"]} />
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-slate-200 p-1">
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

      {/* Property Accordion List */}
      <div className="space-y-4">
        {MOCK_PROPERTIES.map((property) => {
          const isExpanded = expandedProperties.includes(property.id);
          const propertyTotalRooms = property.rooms.length;
          const propertyTotalBeds = property.rooms.reduce((a, r) => a + r.beds, 0);
          const propertyOccupied = property.rooms.reduce((a, r) => a + r.occupied, 0);
          const propertyAvailable = property.rooms.reduce((a, r) => a + r.available, 0);

          return (
            <Card key={property.id} className="overflow-hidden">
              {/* Property Header */}
              <button
                onClick={() => toggleProperty(property.id)}
                className="flex w-full items-center gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                  <div className="h-full w-full bg-gradient-to-br from-slate-300 to-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900">{property.name}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {property.address}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-8 text-center">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{propertyTotalRooms}</p>
                    <p className="text-xs text-slate-500">Rooms</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{propertyTotalBeds}</p>
                    <p className="text-xs text-slate-500">Beds</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{propertyOccupied}</p>
                    <p className="text-xs text-slate-500">Occupied</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{propertyAvailable}</p>
                    <p className="text-xs text-slate-500">Available</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>

              {/* Rooms List */}
              {isExpanded && (
                <div className="border-t border-slate-100">
                  {property.rooms.map((room) => {
                    const occupancyPercent = Math.round(
                      (room.occupied / room.beds) * 100
                    );
                    return (
                      <div
                        key={room.id}
                        className="flex items-center gap-4 border-b border-slate-50 px-4 py-3 last:border-b-0 hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => openRoomDetail(room, property)}
                      >
                        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-200 ml-8">
                          <div className="h-full w-full bg-gradient-to-br from-amber-200 to-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900">{room.name}</h4>
                          <p className="text-sm text-slate-500">
                            {room.beds} Beds • {room.type}
                          </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-lg font-semibold text-emerald-600">{room.occupied}</p>
                            <p className="text-xs text-slate-500">Occupied</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-blue-600">{room.reserved}</p>
                            <p className="text-xs text-slate-500">Reserved</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-slate-400">{room.available}</p>
                            <p className="text-xs text-slate-500">Available</p>
                          </div>
                          <OccupancyCircle percent={occupancyPercent} />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="p-2 text-slate-400 hover:text-slate-600"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Room Detail Panel */}
      {selectedRoom && (
        <RoomDetailPanel
          room={selectedRoom.room}
          property={selectedRoom.property}
          activeTab={detailTab}
          onTabChange={setDetailTab}
          onClose={closeRoomDetail}
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
  subtitle?: string;
  color?: "emerald" | "blue" | "slate";
}) {
  const colorClasses = {
    emerald: "text-emerald-600",
    blue: "text-blue-600",
    slate: "text-slate-600",
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          {icon}
        </div>
        <div>
          <p className={cn("text-2xl font-bold", color ? colorClasses[color] : "text-slate-900")}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          {!subtitle && <p className="text-xs text-slate-500">{label}</p>}
        </div>
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{label}</p>}
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

function OccupancyCircle({ percent }: { percent: number }) {
  const circumference = 2 * Math.PI * 16;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative h-12 w-12">
      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="3"
        />
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-slate-700">{percent}%</span>
      </div>
    </div>
  );
}

function RoomDetailPanel({
  room,
  property,
  activeTab,
  onTabChange,
  onClose,
}: {
  room: Room;
  property: Property;
  activeTab: "overview" | "beds" | "tenants" | "settings";
  onTabChange: (tab: "overview" | "beds" | "tenants" | "settings") => void;
  onClose: () => void;
}) {
  const occupiedCount = room.occupied;
  const reservedCount = room.reserved;
  const availableCount = room.available;
  const occupancyPercent = Math.round((room.occupied / room.beds) * 100);
  const outstanding = room.monthlyRevenue.expected - room.monthlyRevenue.collected;

  const amenityIcons: Record<string, React.ReactNode> = {
    wifi: <Wifi className="h-4 w-4" />,
    tv: <Tv className="h-4 w-4" />,
    locker: <Lock className="h-4 w-4" />,
    ac: <Snowflake className="h-4 w-4" />,
    laundry: <WashingMachine className="h-4 w-4" />,
  };

  const amenityLabels: Record<string, string> = {
    wifi: "WiFi",
    tv: "TV",
    locker: "Locker",
    ac: "AC",
    laundry: "Laundry",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{room.name}</h2>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Active
                </span>
              </div>
              <p className="text-sm text-slate-500">{property.name}</p>
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
        <div className="relative h-48 bg-slate-200">
          <div className="h-full w-full bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400" />
          <div className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium text-white">
            {room.beds} Beds
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 px-6">
          <div className="flex gap-6">
            {[
              { id: "overview", label: "Overview" },
              { id: "beds", label: `Beds (${room.beds})` },
              { id: "tenants", label: `Tenants (${room.occupied})` },
              { id: "settings", label: "Settings" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as typeof activeTab)}
                className={cn(
                  "border-b-2 py-3 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
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
              {/* Room Details */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Room Details</h3>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                </div>
                <div className="space-y-3">
                  <DetailRow label="Room Type" value={room.type} />
                  <DetailRow label="Capacity" value={`${room.beds} Beds`} />
                  <DetailRow label="Floor" value={room.floor} />
                  <DetailRow label="Size" value={room.size} />
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Amenities</span>
                    <div className="flex items-center gap-2">
                      {room.amenities.map((amenity) => (
                        <div
                          key={amenity}
                          className="flex items-center gap-1 text-slate-600"
                          title={amenityLabels[amenity]}
                        >
                          {amenityIcons[amenity]}
                          <span className="text-xs">{amenityLabels[amenity]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Occupancy Overview */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Occupancy Overview</h3>
                <div className="flex items-center gap-6">
                  <div className="relative h-28 w-28">
                    <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - occupancyPercent / 100)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-slate-900">{occupancyPercent}%</span>
                      <span className="text-xs text-slate-500">Occupied</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="text-sm text-slate-600">{occupiedCount} Occupied</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                      <span className="text-sm text-slate-600">{reservedCount} Reserved</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                      <span className="text-sm text-slate-600">{availableCount} Available</span>
                    </div>
                  </div>
                </div>
                <button className="mt-4 flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  View Bed Layout
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Monthly Revenue */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Monthly Revenue</h3>
                  <select className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
                    <option>This Room</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Expected</span>
                    <span className="font-semibold text-slate-900">
                      ${room.monthlyRevenue.expected.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Collected</span>
                    <span className="font-semibold text-slate-900">
                      ${room.monthlyRevenue.collected.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-red-500">Outstanding</span>
                    <span className="font-semibold text-red-600">
                      ${outstanding.toLocaleString()}
                    </span>
                  </div>
                </div>
                <button className="mt-4 flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  View Rent Details
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <QuickActionButton icon={<Plus className="h-4 w-4" />} label="Add Bed" />
                  <QuickActionButton icon={<Edit className="h-4 w-4" />} label="Edit Room" />
                  <QuickActionButton icon={<Users className="h-4 w-4" />} label="Manage Tenants" />
                  <QuickActionButton icon={<Wrench className="h-4 w-4" />} label="Create Maintenance" />
                  <QuickActionButton icon={<Megaphone className="h-4 w-4" />} label="Send Announcement" />
                </div>
              </div>

              {/* Notes */}
              {room.notes && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">Notes</h3>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-slate-600">{room.notes}</p>
                </div>
              )}
            </>
          )}

          {activeTab === "beds" && (
            <div className="text-center py-12 text-slate-500">
              Beds tab content coming soon
            </div>
          )}

          {activeTab === "tenants" && (
            <div className="text-center py-12 text-slate-500">
              Tenants tab content coming soon
            </div>
          )}

          {activeTab === "settings" && (
            <div className="text-center py-12 text-slate-500">
              Settings tab content coming soon
            </div>
          )}
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

function QuickActionButton({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
      <span className="text-indigo-600">{icon}</span>
      {label}
    </button>
  );
}
