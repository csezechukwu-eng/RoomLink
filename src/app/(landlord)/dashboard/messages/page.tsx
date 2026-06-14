"use client";

import { useState } from "react";
import {
  MessageSquare,
  MessagesSquare,
  MessageCircle,
  Clock,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Megaphone,
  Phone,
  Video,
  Copy,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  User,
  Wrench,
  CreditCard,
  Check,
  Pencil,
  Mail,
  MapPin,
  Calendar,
  Home,
} from "lucide-react";
import { Card } from "@/components/ui/card";

// Types
type ConversationFilter = "all" | "unread" | "priority" | "maintenance";

interface Message {
  id: string;
  sender: "tenant" | "owner";
  content: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: string;
  tenant: {
    id: string;
    name: string;
    phone: string;
    email: string;
    room: string;
    bed: string;
    property: string;
    moveInDate: string;
    leaseEndDate: string;
    tenantSince: string;
    status: "active" | "notice" | "inactive";
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isPriority: boolean;
  isMaintenance: boolean;
  messages: Message[];
}

// Mock data
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    tenant: {
      id: "t1",
      name: "John Smith",
      phone: "(704) 555-0189",
      email: "john.smith@email.com",
      room: "Room A",
      bed: "Bed 4",
      property: "Charlotte Flight Crew Crash Pad",
      moveInDate: "May 15, 2024",
      leaseEndDate: "May 15, 2025",
      tenantSince: "May 15, 2024",
      status: "active",
    },
    lastMessage: "Can I move in earlier on the 13th?",
    lastMessageTime: "10:24 AM",
    unreadCount: 2,
    isPriority: false,
    isMaintenance: false,
    messages: [
      {
        id: "m1",
        sender: "tenant",
        content: "Hey Marcus, is there any way I can move in earlier on July 13th instead of the 15th?",
        timestamp: "10:21 AM",
        read: true,
      },
      {
        id: "m2",
        sender: "owner",
        content: "Hi John! Yes, that's fine with me. The room will be ready on the 13th.",
        timestamp: "10:22 AM",
        read: true,
      },
      {
        id: "m3",
        sender: "tenant",
        content: "Great! Thanks so much.",
        timestamp: "10:23 AM",
        read: true,
      },
      {
        id: "m4",
        sender: "owner",
        content: "No problem at all. See you then!",
        timestamp: "10:24 AM",
        read: true,
      },
    ],
  },
  {
    id: "2",
    tenant: {
      id: "t2",
      name: "Sarah Davis",
      phone: "(803) 555-0147",
      email: "sarah.davis@email.com",
      room: "Room D",
      bed: "Bed 3",
      property: "Rock Hill Travel Pad",
      moveInDate: "Apr 10, 2024",
      leaseEndDate: "Apr 10, 2025",
      tenantSince: "Apr 10, 2024",
      status: "active",
    },
    lastMessage: "Maintenance request submitted",
    lastMessageTime: "9:15 AM",
    unreadCount: 1,
    isPriority: false,
    isMaintenance: true,
    messages: [
      {
        id: "m1",
        sender: "tenant",
        content: "Hi, I submitted a maintenance request for a leaky faucet in the bathroom. Just wanted to follow up.",
        timestamp: "9:15 AM",
        read: false,
      },
    ],
  },
  {
    id: "3",
    tenant: {
      id: "t3",
      name: "Emily Johnson",
      phone: "(980) 555-0274",
      email: "emily.johnson@email.com",
      room: "Room B",
      bed: "Bed 2",
      property: "Concord Travel Nurse House",
      moveInDate: "May 15, 2024",
      leaseEndDate: "May 15, 2025",
      tenantSince: "May 15, 2024",
      status: "active",
    },
    lastMessage: "Thanks for the update!",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    isPriority: false,
    isMaintenance: false,
    messages: [
      {
        id: "m1",
        sender: "owner",
        content: "Hi Emily, just wanted to let you know the laundry room will be closed tomorrow for maintenance.",
        timestamp: "Yesterday",
        read: true,
      },
      {
        id: "m2",
        sender: "tenant",
        content: "Thanks for the update!",
        timestamp: "Yesterday",
        read: true,
      },
    ],
  },
  {
    id: "4",
    tenant: {
      id: "t4",
      name: "Michael Brown",
      phone: "(704) 555-0132",
      email: "michael.brown@email.com",
      room: "Room C",
      bed: "Bed 1",
      property: "Gastonia Crew Housing",
      moveInDate: "Jun 1, 2024",
      leaseEndDate: "Jun 1, 2025",
      tenantSince: "Jun 1, 2024",
      status: "active",
    },
    lastMessage: "When is rent due?",
    lastMessageTime: "Yesterday",
    unreadCount: 1,
    isPriority: true,
    isMaintenance: false,
    messages: [
      {
        id: "m1",
        sender: "tenant",
        content: "Hi Marcus, quick question - when is rent due each month? I want to make sure I set up automatic payments.",
        timestamp: "Yesterday",
        read: false,
      },
    ],
  },
  {
    id: "5",
    tenant: {
      id: "t5",
      name: "David Wilson",
      phone: "(704) 555-0199",
      email: "david.wilson@email.com",
      room: "Room A",
      bed: "Bed 2",
      property: "Charlotte Flight Crew Crash Pad",
      moveInDate: "Apr 28, 2024",
      leaseEndDate: "Apr 28, 2025",
      tenantSince: "Apr 28, 2024",
      status: "active",
    },
    lastMessage: "Okay, sounds good.",
    lastMessageTime: "Jun 2",
    unreadCount: 0,
    isPriority: false,
    isMaintenance: false,
    messages: [
      {
        id: "m1",
        sender: "owner",
        content: "Just a reminder that quiet hours are from 10 PM to 7 AM.",
        timestamp: "Jun 2",
        read: true,
      },
      {
        id: "m2",
        sender: "tenant",
        content: "Okay, sounds good.",
        timestamp: "Jun 2",
        read: true,
      },
    ],
  },
  {
    id: "6",
    tenant: {
      id: "t6",
      name: "Amanda Martinez",
      phone: "(704) 555-0177",
      email: "amanda.martinez@email.com",
      room: "Room B",
      bed: "Bed 1",
      property: "Monroe Flight Crew House",
      moveInDate: "Jun 25, 2024",
      leaseEndDate: "Jun 25, 2025",
      tenantSince: "Jun 25, 2024",
      status: "active",
    },
    lastMessage: "Can I get a package delivered?",
    lastMessageTime: "Jun 1",
    unreadCount: 0,
    isPriority: false,
    isMaintenance: false,
    messages: [
      {
        id: "m1",
        sender: "tenant",
        content: "Hi! Can I get a package delivered to the crash pad? What's the best address to use?",
        timestamp: "Jun 1",
        read: true,
      },
      {
        id: "m2",
        sender: "owner",
        content: "Yes! Just use the main address and put your name and room number. Packages are placed in the common area.",
        timestamp: "Jun 1",
        read: true,
      },
    ],
  },
];

export default function MessagesPage() {
  const [activeFilter, setActiveFilter] = useState<ConversationFilter>("all");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(MOCK_CONVERSATIONS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const unreadCount = MOCK_CONVERSATIONS.filter((c) => c.unreadCount > 0).length;
  const priorityCount = MOCK_CONVERSATIONS.filter((c) => c.isPriority).length;

  const filteredConversations = MOCK_CONVERSATIONS.filter((conv) => {
    if (activeFilter === "unread") return conv.unreadCount > 0;
    if (activeFilter === "priority") return conv.isPriority;
    if (activeFilter === "maintenance") return conv.isMaintenance;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-500">Communicate with your tenants in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            <Megaphone className="h-4 w-4" />
            Send Announcement
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
            <Plus className="h-4 w-4" />
            New Message
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          icon={<MessagesSquare className="h-5 w-5 text-indigo-600" />}
          value="42"
          label="Total Conversations"
          sublabel="All Time"
        />
        <StatCard
          icon={<MessageCircle className="h-5 w-5 text-amber-600" />}
          value="5"
          label="Unread Messages"
          sublabel="New messages"
        />
        <StatCard
          icon={<MessageSquare className="h-5 w-5 text-blue-600" />}
          value="18"
          label="Open Threads"
          sublabel="Awaiting response"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          value="96%"
          label="Response Rate"
          sublabel="This Month"
          trend="up"
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-purple-600" />}
          value="1h 24m"
          label="Avg Response Time"
          sublabel="This Month"
          trend="up"
        />
      </div>

      {/* Three Column Layout */}
      <div className="flex gap-6 h-[calc(100vh-320px)] min-h-[500px]">
        {/* Left Column - Conversation List */}
        <div className="w-80 shrink-0 flex flex-col">
          <Card className="flex flex-col h-full overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <button className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                  <Filter className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-3 py-2 border-b border-slate-200">
              {[
                { id: "all" as const, label: "All" },
                { id: "unread" as const, label: "Unread", count: unreadCount },
                { id: "priority" as const, label: "Priority", count: priorityCount },
                { id: "maintenance" as const, label: "Maintenance" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeFilter === tab.id
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`ml-1.5 ${activeFilter === tab.id ? "text-indigo-600" : "text-slate-400"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedConversation?.id === conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Center Column - Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedConversation ? (
            <Card className="flex flex-col h-full overflow-hidden">
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600">
                    {selectedConversation.tenant.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{selectedConversation.tenant.name}</h3>
                    <p className="text-sm text-slate-500">
                      {selectedConversation.tenant.room} / {selectedConversation.tenant.bed} • {selectedConversation.tenant.property}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    <Video className="h-5 w-5" />
                  </button>
                  <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    <Copy className="h-5 w-5" />
                  </button>
                  <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages.map((message) => (
                  <MessageBubble key={message.id} message={message} tenantName={selectedConversation.tenant.name} />
                ))}
              </div>

              {/* Message Input */}
              <div className="border-t border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-4 pr-24 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button className="text-slate-400 hover:text-slate-600">
                        <Paperclip className="h-5 w-5" />
                      </button>
                      <button className="text-slate-400 hover:text-slate-600">
                        <Smile className="h-5 w-5" />
                      </button>
                      <button className="text-slate-400 hover:text-slate-600">
                        <Video className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700">
                    Send
                  </button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="flex flex-col h-full items-center justify-center">
              <MessageSquare className="h-12 w-12 text-slate-300" />
              <p className="mt-4 text-lg font-medium text-slate-600">Select a conversation</p>
              <p className="text-sm text-slate-400">Choose a conversation from the list to view messages</p>
            </Card>
          )}
        </div>

        {/* Right Column - Tenant Info */}
        {selectedConversation && (
          <div className="w-72 shrink-0">
            <Card className="h-full overflow-y-auto p-4">
              {/* Tenant Header */}
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-xl font-semibold text-slate-600">
                  {selectedConversation.tenant.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">{selectedConversation.tenant.name}</h3>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                    Active
                  </span>
                </div>
                <p className="text-sm text-slate-500">Tenant since {selectedConversation.tenant.tenantSince}</p>
              </div>

              {/* Quick Actions */}
              <div className="mt-6">
                <h4 className="mb-3 font-semibold text-slate-900">Quick Actions</h4>
                <div className="space-y-2">
                  <QuickActionButton icon={<User className="h-4 w-4" />} label="View Tenant Profile" />
                  <QuickActionButton icon={<Megaphone className="h-4 w-4" />} label="Send Announcement" />
                  <QuickActionButton icon={<Wrench className="h-4 w-4" />} label="Create Maintenance Ticket" />
                  <QuickActionButton icon={<CreditCard className="h-4 w-4" />} label="View Payment History" />
                </div>
              </div>

              {/* Tenant Details */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900">Tenant Details</h4>
                  <button className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                </div>
                <div className="mt-3 space-y-3 text-sm">
                  <DetailRow label="Phone" value={selectedConversation.tenant.phone} />
                  <DetailRow label="Email" value={selectedConversation.tenant.email} />
                  <DetailRow label="Room / Bed" value={`${selectedConversation.tenant.room} / ${selectedConversation.tenant.bed}`} />
                  <DetailRow label="Property" value={selectedConversation.tenant.property} />
                  <DetailRow label="Move-In Date" value={selectedConversation.tenant.moveInDate} />
                  <DetailRow label="Lease End Date" value={selectedConversation.tenant.leaseEndDate} />
                </div>
              </div>
            </Card>
          </div>
        )}
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
  sublabel: string;
  trend?: "up" | "down";
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {trend && (
          <span className={`text-sm ${trend === "up" ? "text-emerald-500" : "text-red-500"}`}>
            {trend === "up" ? "↑" : "↓"}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400">{sublabel}</p>
    </Card>
  );
}

function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer items-start gap-3 border-b border-slate-100 p-3 transition-colors ${
        isSelected ? "bg-indigo-50 border-l-2 border-l-indigo-600" : "hover:bg-slate-50"
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600">
        {conversation.tenant.name
          .split(" ")
          .map((n) => n[0])
          .join("")}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="font-medium text-slate-900">{conversation.tenant.name}</p>
          <span className="text-xs text-slate-400">{conversation.lastMessageTime}</span>
        </div>
        <p className="text-xs text-slate-500">{conversation.tenant.room} / {conversation.tenant.bed}</p>
        <p className="mt-1 truncate text-sm text-slate-600">{conversation.lastMessage}</p>
      </div>
      {conversation.unreadCount > 0 && (
        <span
          className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium text-white ${
            conversation.isMaintenance ? "bg-red-500" : "bg-indigo-600"
          }`}
        >
          {conversation.unreadCount}
        </span>
      )}
    </div>
  );
}

function MessageBubble({ message, tenantName }: { message: Message; tenantName: string }) {
  const isOwner = message.sender === "owner";

  return (
    <div className={`flex ${isOwner ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] ${isOwner ? "order-2" : ""}`}>
        {!isOwner && (
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
              {tenantName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <span className="text-xs font-medium text-slate-700">{tenantName}</span>
            <span className="text-xs text-slate-400">{message.timestamp}</span>
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isOwner
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-900"
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>
        {isOwner && (
          <div className="mt-1 flex items-center justify-end gap-1">
            <span className="text-xs text-slate-400">{message.timestamp}</span>
            {message.read && (
              <span className="flex items-center gap-0.5 text-xs text-emerald-500">
                <Check className="h-3 w-3" />
                Read
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
      <span className="text-indigo-600">{icon}</span>
      {label}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right max-w-[150px] break-words">{value}</span>
    </div>
  );
}
