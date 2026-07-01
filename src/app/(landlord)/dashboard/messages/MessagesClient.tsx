"use client";

import * as React from "react";
import Link from "next/link";
import { Inbox, Users, MessageSquare, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ThreadSummary } from "@/lib/services/messages";

interface MessagesClientProps {
  inquiries: ThreadSummary[];
  tenantMessages: ThreadSummary[];
}

type TabType = "inquiries" | "tenants";

export function MessagesClient({ inquiries, tenantMessages }: MessagesClientProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>("inquiries");

  const threads = activeTab === "inquiries" ? inquiries : tenantMessages;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        <TabButton
          active={activeTab === "inquiries"}
          onClick={() => setActiveTab("inquiries")}
          icon={<Inbox className="h-4 w-4" />}
          label="Inquiries"
          count={inquiries.length}
        />
        <TabButton
          active={activeTab === "tenants"}
          onClick={() => setActiveTab("tenants")}
          icon={<Users className="h-4 w-4" />}
          label="Tenant Messages"
          count={tenantMessages.length}
        />
      </div>

      {/* Description */}
      <p className="text-sm text-slate-500">
        {activeTab === "inquiries"
          ? "Messages from people interested in your listings"
          : "Messages from your current tenants"}
      </p>

      {/* Thread List */}
      {threads.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <MessageSquare className="h-6 w-6 text-slate-400" />
          </div>
          <p className="mt-4 text-slate-500">
            {activeTab === "inquiries"
              ? "No inquiries yet. When someone messages you about a listing, it will appear here."
              : "No tenant messages yet. Messages from your current tenants will appear here."}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => (
            <ThreadCard key={`${thread.property_id}:${thread.tenant_id}`} thread={thread} />
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {icon}
      <span>{label}</span>
      {count > 0 && (
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            active ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function ThreadCard({ thread }: { thread: ThreadSummary }) {
  const timeAgo = formatTimeAgo(thread.last_at);
  const senderLabel = thread.last_sender_role === "owner" ? "You" : thread.tenant_name || "Guest";

  return (
    <Link
      href={`/dashboard/messages/${thread.property_id}/${thread.tenant_id}`}
      className="block"
    >
      <Card className="p-4 transition-colors hover:bg-slate-50">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Sender Name */}
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-slate-900 truncate">
                {thread.tenant_name || thread.tenant_email || "Unknown"}
              </h3>
              {thread.is_current_tenant && (
                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Tenant
                </span>
              )}
            </div>

            {/* Property Name */}
            <p className="text-sm text-slate-500 truncate">{thread.property_name}</p>

            {/* Last Message Preview */}
            <p className="mt-1 text-sm text-slate-600 truncate">
              <span className="font-medium">{senderLabel}:</span> {thread.last_body}
            </p>
          </div>

          {/* Right Side */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="text-right">
              <p className="text-xs text-slate-400">{timeAgo}</p>
              <p className="text-xs text-slate-400">{thread.count} messages</p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
