import { MessageSquare, Building, Users, Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getProperties } from "@/lib/queries";
import { getCurrentOwnerId } from "@/lib/auth";
import { listThreadsForOwner } from "@/lib/services/messages";
import Link from "next/link";
import { MessagesClient } from "./MessagesClient";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const ownerId = await getCurrentOwnerId();
  const propertiesResult = await getProperties();
  const properties = propertiesResult.data ?? [];

  // Show empty state if no properties
  if (properties.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-500">Communicate with your tenants and applicants.</p>
        </div>

        <Card className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Building className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">
            Create a property first
          </h2>
          <p className="mt-2 max-w-md text-slate-500">
            You need to create properties before you can message tenants or applicants.
            Go to Properties to get started.
          </p>
          <Link
            href="/dashboard/properties"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Go to Properties
          </Link>
        </Card>
      </div>
    );
  }

  // Fetch threads
  const threadsResult = await listThreadsForOwner(ownerId);
  const threads = threadsResult.data ?? [];

  // Separate inquiries from tenant messages
  const inquiries = threads.filter((t) => !t.is_current_tenant);
  const tenantMessages = threads.filter((t) => t.is_current_tenant);

  // Show empty messages state if no threads
  if (threads.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-500">Communicate with your tenants and applicants.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Total Conversations" value={0} icon={<MessageSquare className="h-4 w-4" />} />
          <StatCard label="Inquiries" value={0} icon={<Inbox className="h-4 w-4" />} />
          <StatCard label="Tenant Messages" value={0} icon={<Users className="h-4 w-4" />} />
        </div>

        <Card className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <MessageSquare className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">
            No messages yet
          </h2>
          <p className="mt-2 max-w-md text-slate-500">
            When tenants or applicants message you, conversations will appear here.
            You can also start conversations with your current tenants.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="text-slate-500">Communicate with your tenants and applicants.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total Conversations" value={threads.length} icon={<MessageSquare className="h-4 w-4" />} />
        <StatCard label="Inquiries" value={inquiries.length} icon={<Inbox className="h-4 w-4" />} />
        <StatCard label="Tenant Messages" value={tenantMessages.length} icon={<Users className="h-4 w-4" />} />
      </div>

      {/* Messages Client Component with Tabs */}
      <MessagesClient inquiries={inquiries} tenantMessages={tenantMessages} />
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <p className="text-xs">{label}</p>
      </div>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </Card>
  );
}
