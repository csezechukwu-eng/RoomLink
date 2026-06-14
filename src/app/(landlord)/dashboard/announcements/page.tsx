"use client";

import { useState } from "react";
import {
  Megaphone,
  Send,
  Mail,
  Clock,
  TrendingUp,
  Search,
  ChevronDown,
  Filter,
  MoreVertical,
  Home,
  Wrench,
  DollarSign,
  AlertTriangle,
  PartyPopper,
  UserPlus,
  Info,
  Calendar,
  FileText,
  Download,
  ThumbsUp,
  Heart,
  PartyPopperIcon,
  ThumbsDown,
  Plus,
  MessageSquare,
  Bell,
  FileBarChart,
  ArrowRight,
  MapPin,
  Users,
  Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";

// Types
type AnnouncementType = "house_notice" | "maintenance" | "rent_reminder" | "emergency" | "community_event" | "move_in_update";
type TabFilter = "all" | "published" | "scheduled" | "drafts" | "emergency";

interface Announcement {
  id: string;
  type: AnnouncementType;
  title: string;
  description: string;
  fullContent: string;
  property: string;
  sentTo: string;
  timestamp: string;
  date: string;
  readPercentage: number;
  readCount: number;
  totalRecipients: number;
  totalViews: number;
  reactions: { thumbsUp: number; heart: number; party: number; thumbsDown: number };
  attachment?: { name: string; type: string; size: string };
  readBy: { name: string; initials: string }[];
}

// Mock data
const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "1",
    type: "house_notice",
    title: "Quiet Hours Reminder",
    description: "Please remember quiet hours begin at 10 PM and end at 7 AM. Let's be respectful of all...",
    fullContent: "Please remember quiet hours begin at 10 PM and end at 7 AM. Let's be respectful of all housemates and get the rest we need for work. Thank you for helping keep our home a great place to stay!",
    property: "Charlotte Flight Crew Crash Pad",
    sentTo: "Entire House",
    timestamp: "2 hours ago",
    date: "May 23, 2024 at 8:30 AM",
    readPercentage: 96,
    readCount: 14,
    totalRecipients: 15,
    totalViews: 142,
    reactions: { thumbsUp: 18, heart: 12, party: 6, thumbsDown: 2 },
    attachment: { name: "Quiet_Hours_Policy.pdf", type: "PDF", size: "124 KB" },
    readBy: [
      { name: "John Smith", initials: "JS" },
      { name: "Emily Johnson", initials: "EJ" },
      { name: "Sarah Davis", initials: "SD" },
      { name: "David Wilson", initials: "DW" },
      { name: "Michael Brown", initials: "MB" },
    ],
  },
  {
    id: "2",
    type: "maintenance",
    title: "Water Shutoff Tomorrow",
    description: "Water service will be unavailable on Wednesday, May 22nd from 10 AM to 2 PM...",
    fullContent: "Water service will be unavailable on Wednesday, May 22nd from 10 AM to 2 PM due to scheduled maintenance. Please plan accordingly.",
    property: "Charlotte Flight Crew Crash Pad",
    sentTo: "Room A + Room B",
    timestamp: "Yesterday",
    date: "May 22, 2024 at 9:00 AM",
    readPercentage: 84,
    readCount: 6,
    totalRecipients: 8,
    totalViews: 89,
    reactions: { thumbsUp: 5, heart: 2, party: 0, thumbsDown: 1 },
    readBy: [
      { name: "John Smith", initials: "JS" },
      { name: "Emily Johnson", initials: "EJ" },
    ],
  },
  {
    id: "3",
    type: "rent_reminder",
    title: "Rent Due – July 1, 2024",
    description: "This is a friendly reminder that rent is due on July 1st. Thank you!",
    fullContent: "This is a friendly reminder that rent is due on July 1st. Please ensure your payment is submitted on time to avoid any late fees. Thank you!",
    property: "All Properties",
    sentTo: "Entire House",
    timestamp: "2 days ago",
    date: "May 21, 2024 at 8:00 AM",
    readPercentage: 78,
    readCount: 35,
    totalRecipients: 45,
    totalViews: 210,
    reactions: { thumbsUp: 22, heart: 5, party: 0, thumbsDown: 3 },
    readBy: [
      { name: "Sarah Davis", initials: "SD" },
      { name: "David Wilson", initials: "DW" },
    ],
  },
  {
    id: "4",
    type: "emergency",
    title: "Power Outage",
    description: "We are currently experiencing a power outage in the building. Crews are on-site...",
    fullContent: "We are currently experiencing a power outage in the building. Crews are on-site working to restore power as quickly as possible. We apologize for the inconvenience.",
    property: "Gastonia Crew Housing",
    sentTo: "Entire House",
    timestamp: "3 days ago",
    date: "May 20, 2024 at 2:15 PM",
    readPercentage: 100,
    readCount: 12,
    totalRecipients: 12,
    totalViews: 156,
    reactions: { thumbsUp: 8, heart: 3, party: 0, thumbsDown: 0 },
    readBy: [
      { name: "Michael Brown", initials: "MB" },
    ],
  },
  {
    id: "5",
    type: "community_event",
    title: "House BBQ This Saturday!",
    description: "Join us for a BBQ this Saturday at 4 PM in the backyard. Food, drinks, and good vibes!",
    fullContent: "Join us for a BBQ this Saturday at 4 PM in the backyard. Food, drinks, and good vibes! RSVP by Friday so we know how much to prepare.",
    property: "Charlotte Flight Crew Crash Pad",
    sentTo: "Entire House",
    timestamp: "5 days ago",
    date: "May 18, 2024 at 10:00 AM",
    readPercentage: 91,
    readCount: 10,
    totalRecipients: 11,
    totalViews: 98,
    reactions: { thumbsUp: 15, heart: 8, party: 12, thumbsDown: 0 },
    readBy: [
      { name: "John Smith", initials: "JS" },
      { name: "Emily Johnson", initials: "EJ" },
    ],
  },
  {
    id: "6",
    type: "move_in_update",
    title: "Welcome New Tenant",
    description: "Please welcome John Smith to Room B! Let's make him feel at home.",
    fullContent: "Please welcome John Smith to Room B! He's a pilot with American Airlines and will be staying with us starting this week. Let's make him feel at home.",
    property: "Charlotte Flight Crew Crash Pad",
    sentTo: "Room B",
    timestamp: "May 18, 2024",
    date: "May 18, 2024 at 2:00 PM",
    readPercentage: 100,
    readCount: 4,
    totalRecipients: 4,
    totalViews: 42,
    reactions: { thumbsUp: 6, heart: 4, party: 3, thumbsDown: 0 },
    readBy: [
      { name: "Sarah Davis", initials: "SD" },
    ],
  },
  {
    id: "7",
    type: "house_notice",
    title: "Laundry Room Upgrades Complete",
    description: "Great news! The laundry room upgrades are complete and ready to use.",
    fullContent: "Great news! The laundry room upgrades are complete and ready to use. We've added two new washers and dryers for your convenience.",
    property: "Concord Travel Nurse House",
    sentTo: "Entire House",
    timestamp: "May 15, 2024",
    date: "May 15, 2024 at 11:00 AM",
    readPercentage: 89,
    readCount: 8,
    totalRecipients: 9,
    totalViews: 67,
    reactions: { thumbsUp: 12, heart: 6, party: 4, thumbsDown: 0 },
    readBy: [
      { name: "David Wilson", initials: "DW" },
    ],
  },
];

const MOCK_SCHEDULED = [
  { id: "s1", date: "JUL 01", title: "Monthly Rent Reminder", scheduledFor: "Jul 1, 2024 at 9:00 AM" },
  { id: "s2", date: "JUL 04", title: "Holiday House Rules", scheduledFor: "Jul 4, 2024 at 10:00 AM" },
  { id: "s3", date: "JUL 15", title: "Move-In Welcome Package", scheduledFor: "Jul 15, 2024 at 11:00 AM" },
];

const MOCK_EMERGENCY_ALERTS = [
  { id: "e1", title: "Power Outage", sentAt: "Sent May 20, 2024 at 2:15 PM", status: "active" as const },
  { id: "e2", title: "Emergency Maintenance", sentAt: "Sent May 18, 2024 at 9:30 PM", status: "resolved" as const },
  { id: "e3", title: "Security Alert", sentAt: "Sent May 10, 2024 at 11:45 PM", status: "resolved" as const },
];

const MOCK_RECENT_ACTIVITY = [
  { id: "r1", title: "Quiet Hours Reminder", viewedBy: "Emily Johnson", time: "2m ago" },
  { id: "r2", title: "Water Shutoff Tomorrow", viewedBy: "Michael Brown", time: "15m ago" },
  { id: "r3", title: "Rent Due – July 1, 2024", viewedBy: "Sarah Davis", time: "1h ago" },
  { id: "r4", title: "Power Outage", viewedBy: "David Wilson", time: "2h ago" },
];

// Helper functions
function getTypeConfig(type: AnnouncementType) {
  const configs = {
    house_notice: { label: "House Notice", color: "text-blue-600", bg: "bg-blue-50", icon: Home },
    maintenance: { label: "Maintenance", color: "text-purple-600", bg: "bg-purple-50", icon: Wrench },
    rent_reminder: { label: "Rent Reminder", color: "text-amber-600", bg: "bg-amber-50", icon: DollarSign },
    emergency: { label: "Emergency", color: "text-red-600", bg: "bg-red-50", icon: AlertTriangle },
    community_event: { label: "Community Event", color: "text-emerald-600", bg: "bg-emerald-50", icon: PartyPopper },
    move_in_update: { label: "Move-In Update", color: "text-indigo-600", bg: "bg-indigo-50", icon: UserPlus },
  };
  return configs[type];
}

function getReadColor(percentage: number) {
  if (percentage >= 90) return "text-emerald-600";
  if (percentage >= 70) return "text-amber-600";
  return "text-red-600";
}

export default function AnnouncementsPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(MOCK_ANNOUNCEMENTS[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const emergencyCount = MOCK_ANNOUNCEMENTS.filter(a => a.type === "emergency").length;

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
            <p className="text-slate-500">Send updates, notices, reminders, and community messages to your tenants.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              <Calendar className="h-4 w-4" />
              Schedule Announcement
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
              <Plus className="h-4 w-4" />
              New Announcement
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-4">
          <StatCard
            icon={<Megaphone className="h-5 w-5 text-indigo-600" />}
            value="248"
            label="Total Announcements"
            sublabel="All Time"
          />
          <StatCard
            icon={<Send className="h-5 w-5 text-emerald-600" />}
            value="42"
            label="Sent This Month"
            trend={{ value: "12%", direction: "up" }}
          />
          <StatCard
            icon={<Mail className="h-5 w-5 text-amber-600" />}
            value="18"
            label="Unread"
            sublabel="Across Properties"
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-blue-600" />}
            value="7"
            label="Scheduled"
            sublabel="Upcoming"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
            value="92%"
            label="Engagement Rate"
            trend={{ value: "8%", direction: "up" }}
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex gap-6">
            {[
              { id: "all" as const, label: "All Announcements" },
              { id: "published" as const, label: "Published" },
              { id: "scheduled" as const, label: "Scheduled" },
              { id: "drafts" as const, label: "Drafts" },
              { id: "emergency" as const, label: "Emergency", count: emergencyCount },
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
                  {tab.count && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                      {tab.count}
                    </span>
                  )}
                </span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <FilterDropdown label="All Properties" />
          <FilterDropdown label="All Audiences" />
          <FilterDropdown label="All Types" />
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <FilterDropdown label="Newest First" />
        </div>

        {/* Two Column Layout: List + Detail */}
        <div className="flex gap-6">
          {/* Announcement List */}
          <div className="w-[400px] shrink-0 space-y-3">
            {MOCK_ANNOUNCEMENTS.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                isSelected={selectedAnnouncement?.id === announcement.id}
                onClick={() => setSelectedAnnouncement(announcement)}
              />
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-slate-500">Showing 1 to 10 of 248 announcements</p>
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
                <span className="px-2 text-slate-400">...</span>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50">
                  25
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-500 hover:bg-slate-50">
                  &gt;
                </button>
              </div>
            </div>
          </div>

          {/* Detail Panel */}
          {selectedAnnouncement && (
            <div className="min-w-0 flex-1">
              <AnnouncementDetailPanel announcement={selectedAnnouncement} />
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-72 shrink-0 space-y-6">
        {/* Recent Activity */}
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Recent Activity</h3>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          <div className="space-y-4">
            {MOCK_RECENT_ACTIVITY.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <Eye className="h-4 w-4 text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{activity.title}</p>
                  <p className="text-xs text-slate-500">was viewed by {activity.viewedBy}</p>
                </div>
                <span className="text-xs text-slate-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Announcement Performance */}
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Announcement Performance</h3>
            <FilterDropdown label="This Month" small />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Sent</span>
              <span className="text-sm font-semibold text-slate-900">42</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total Views</span>
              <span className="text-sm font-semibold text-slate-900">1,248</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Average Read Rate</span>
              <span className="text-sm font-semibold text-slate-900">92%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Engagement Rate</span>
              <span className="text-sm font-semibold text-slate-900">18%</span>
            </div>
          </div>
          <button className="mt-4 flex w-full items-center justify-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View Full Analytics
            <ArrowRight className="h-4 w-4" />
          </button>
        </Card>

        {/* Most Viewed Announcement */}
        <Card className="p-4">
          <h3 className="mb-4 font-semibold text-slate-900">Most Viewed Announcement</h3>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Home className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Quiet Hours Reminder</p>
              <p className="text-xs text-slate-500">Viewed 142 times</p>
              <p className="text-xs text-emerald-600">96% Read Rate</p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-4">
          <h3 className="mb-4 font-semibold text-slate-900">Quick Actions</h3>
          <div className="space-y-2">
            <QuickActionButton icon={<Plus className="h-4 w-4" />} label="New Announcement" />
            <QuickActionButton icon={<Calendar className="h-4 w-4" />} label="Schedule Message" />
            <QuickActionButton icon={<DollarSign className="h-4 w-4" />} label="Send Rent Reminder" />
            <QuickActionButton icon={<Wrench className="h-4 w-4" />} label="Send Maintenance Notice" />
            <QuickActionButton icon={<FileBarChart className="h-4 w-4" />} label="Export Activity Report" />
          </div>
        </Card>
      </div>
    </div>
  );
}

// Components

function StatCard({
  icon,
  value,
  label,
  sublabel,
  trend,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sublabel?: string;
  trend?: { value: string; direction: "up" | "down" };
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sublabel && <p className="text-xs text-slate-400">{sublabel}</p>}
      {trend && (
        <p className={`text-xs ${trend.direction === "up" ? "text-emerald-600" : "text-red-600"}`}>
          {trend.direction === "up" ? "↑" : "↓"} {trend.value} from last month
        </p>
      )}
    </Card>
  );
}

function FilterDropdown({ label, small }: { label: string; small?: boolean }) {
  return (
    <button
      className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 ${
        small ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
      }`}
    >
      {label}
      <ChevronDown className={small ? "h-3 w-3" : "h-4 w-4"} />
    </button>
  );
}

function AnnouncementCard({
  announcement,
  isSelected,
  onClick,
}: {
  announcement: Announcement;
  isSelected: boolean;
  onClick: () => void;
}) {
  const typeConfig = getTypeConfig(announcement.type);
  const TypeIcon = typeConfig.icon;

  return (
    <Card
      className={`cursor-pointer p-4 transition-colors ${
        isSelected ? "border-indigo-200 bg-indigo-50/50 ring-1 ring-indigo-200" : "hover:bg-slate-50"
      }`}
      onClick={onClick}
    >
      <div className="flex gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeConfig.bg}`}>
          <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <span className={`text-xs font-medium ${typeConfig.color}`}>{typeConfig.label}</span>
          <h4 className="font-semibold text-slate-900">{announcement.title}</h4>
          <p className="mt-1 text-sm text-slate-500 line-clamp-2">{announcement.description}</p>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <div>
              <p className="font-medium text-slate-700">{announcement.property}</p>
              <p className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Sent to: {announcement.sentTo}
              </p>
            </div>
            <div className="text-right">
              <p>{announcement.timestamp}</p>
              <p className={`font-semibold ${getReadColor(announcement.readPercentage)}`}>
                {announcement.readPercentage}% Read
              </p>
            </div>
          </div>

          {/* Read Progress Bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${
                announcement.readPercentage >= 90
                  ? "bg-emerald-500"
                  : announcement.readPercentage >= 70
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${announcement.readPercentage}%` }}
            />
          </div>
        </div>
        <button className="shrink-0 text-slate-400 hover:text-slate-600">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
    </Card>
  );
}

function AnnouncementDetailPanel({ announcement }: { announcement: Announcement }) {
  const typeConfig = getTypeConfig(announcement.type);
  const TypeIcon = typeConfig.icon;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="mb-4">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${typeConfig.bg} ${typeConfig.color}`}>
          <TypeIcon className="h-3 w-3" />
          {typeConfig.label}
        </span>
      </div>

      <h2 className="text-xl font-bold text-slate-900">{announcement.title}</h2>

      <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
        <span className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {announcement.property}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          Sent to: {announcement.sentTo}
        </span>
        <span>{announcement.date}</span>
      </div>

      {/* Content */}
      <div className="mt-6">
        <p className="text-slate-700 leading-relaxed">{announcement.fullContent}</p>
      </div>

      {/* Stats */}
      <div className="mt-6 flex items-center gap-8">
        {/* Read Rate Donut */}
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="4"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                strokeDasharray={`${announcement.readPercentage} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-slate-900">{announcement.readPercentage}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Read Rate</p>
            <p className="text-xs text-slate-500">{announcement.readCount} of {announcement.totalRecipients} tenants</p>
          </div>
        </div>

        {/* Engagement */}
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="4"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="#6366f1"
                strokeWidth="4"
                strokeDasharray="75 100"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-slate-900">{announcement.totalViews}</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Engagement</p>
            <p className="text-xs text-slate-500">Total Views</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
              <Heart className="h-3 w-3 fill-current" />
              {announcement.reactions.heart + announcement.reactions.thumbsUp + announcement.reactions.party} Reactions
            </p>
          </div>
        </div>
      </div>

      {/* Read By */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">
            Read By ({announcement.readCount} of {announcement.totalRecipients} tenants viewed)
          </p>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {announcement.readBy.slice(0, 5).map((reader, i) => (
            <div key={i} className="text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600">
                {reader.initials}
              </div>
              <p className="mt-1 text-xs text-slate-500 truncate w-12">{reader.name.split(" ")[0]}</p>
            </div>
          ))}
          {announcement.readCount > 5 && (
            <div className="text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                +{announcement.readCount - 5}
              </div>
              <p className="mt-1 text-xs text-slate-500">More</p>
            </div>
          )}
        </div>
      </div>

      {/* Attachment */}
      {announcement.attachment && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-slate-700">Attachment</p>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-slate-900">{announcement.attachment.name}</p>
                <p className="text-xs text-slate-500">{announcement.attachment.type} • {announcement.attachment.size}</p>
              </div>
            </div>
            <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Reactions */}
      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-slate-700">Reactions</p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm">
            <ThumbsUp className="h-4 w-4 text-blue-500" />
            {announcement.reactions.thumbsUp}
          </span>
          <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm">
            <Heart className="h-4 w-4 text-red-500" />
            {announcement.reactions.heart}
          </span>
          <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm">
            <PartyPopper className="h-4 w-4 text-amber-500" />
            {announcement.reactions.party}
          </span>
          <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm">
            <ThumbsDown className="h-4 w-4 text-slate-400" />
            {announcement.reactions.thumbsDown}
          </span>
        </div>
      </div>

      {/* Bottom Two Columns */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {/* Scheduled Announcements */}
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-semibold text-slate-900">Scheduled Announcements</h4>
            <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          <div className="space-y-3">
            {MOCK_SCHEDULED.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center rounded bg-indigo-50 px-2 py-1 text-center">
                  <span className="text-[10px] font-medium text-indigo-600">{item.date.split(" ")[0]}</span>
                  <span className="text-sm font-bold text-indigo-700">{item.date.split(" ")[1]}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">Scheduled for {item.scheduledFor}</p>
                  <span className="mt-1 inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                    Scheduled
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Alerts */}
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-semibold text-slate-900">Emergency Alerts</h4>
            <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          <div className="space-y-3">
            {MOCK_EMERGENCY_ALERTS.map((alert) => (
              <div key={alert.id} className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{alert.title}</p>
                  <p className="text-xs text-slate-500">{alert.sentAt}</p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                    alert.status === "active"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {alert.status === "active" ? "Active" : "Resolved"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function QuickActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
      <span className="text-indigo-600">{icon}</span>
      {label}
    </button>
  );
}
