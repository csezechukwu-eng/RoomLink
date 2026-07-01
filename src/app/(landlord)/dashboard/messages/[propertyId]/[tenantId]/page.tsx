import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ErrorState";
import { MessageBubbles } from "@/components/messages/MessageBubbles";
import { MessageComposer } from "@/components/forms/MessageComposer";
import { getThread } from "@/lib/services/messages";
import { sendOwnerMessageAction } from "@/lib/actions/messages";
import { getServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ propertyId: string; tenantId: string }>;
}

export default async function ConversationPage({ params }: PageProps) {
  const { propertyId, tenantId } = await params;

  // Fetch thread messages
  const threadResult = await getThread(propertyId, tenantId);

  if (threadResult.error !== null) {
    return (
      <div className="space-y-6">
        <BackLink />
        <ErrorState
          title="Couldn't load conversation"
          message={threadResult.error}
        />
      </div>
    );
  }

  const messages = threadResult.data;

  // Fetch property and tenant info
  const supabase = getServiceClient();
  const [{ data: property }, { data: tenant }] = await Promise.all([
    supabase.from("properties").select("name").eq("id", propertyId).maybeSingle(),
    supabase.from("users").select("full_name, email").eq("id", tenantId).maybeSingle(),
  ]);

  const tenantName = tenant?.full_name || tenant?.email || "Unknown";
  const propertyName = property?.name || "Property";

  return (
    <div className="space-y-6">
      <BackLink />

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
          <User className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{tenantName}</h1>
          <p className="text-sm text-slate-500">Re: {propertyName}</p>
        </div>
      </div>

      {/* Messages */}
      <Card className="p-4">
        <MessageBubbles messages={messages} meRole="owner" />
      </Card>

      {/* Composer */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-medium text-slate-700">Reply</h3>
        <MessageComposer
          action={sendOwnerMessageAction}
          fields={{ property_id: propertyId, tenant_id: tenantId }}
          placeholder="Type your message..."
        />
      </Card>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/messages"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Messages
    </Link>
  );
}
