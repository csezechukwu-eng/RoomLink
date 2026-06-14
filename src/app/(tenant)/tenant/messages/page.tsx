import { MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Card } from "@/components/ui/card";
import { MessageBubbles } from "@/components/messages/MessageBubbles";
import { MessageComposer } from "@/components/forms/MessageComposer";
import { getCurrentTenantId } from "@/lib/auth";
import { getTenantThread } from "@/lib/services/messages";
import { sendTenantMessageAction } from "@/lib/actions/messages";

export const dynamic = "force-dynamic";

export default async function TenantMessagesPage() {
  const tenantId = await getCurrentTenantId();
  const result = await getTenantThread(tenantId);

  if (result.error !== null) {
    return (
      <div className="space-y-6">
        <PageHeader title="Messages" />
        <ErrorState title="Couldn't load messages" message={result.error} />
      </div>
    );
  }

  const thread = result.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description={
          thread?.propertyName
            ? `Chat with your host at ${thread.propertyName}`
            : "Chat with your host"
        }
      />

      {!thread ? (
        <EmptyState
          icon={<MessageSquare className="h-5 w-5" />}
          title="No conversation yet"
          description="Apply for a bed first — once you're connected to a property you can message the host here."
        />
      ) : (
        <Card className="p-5">
          <MessageBubbles messages={thread.messages} meRole="tenant" />
          <div className="mt-4 border-t border-slate-100 pt-4">
            <MessageComposer
              action={sendTenantMessageAction}
              fields={{ property_id: thread.propertyId }}
              placeholder="Message your host…"
            />
          </div>
        </Card>
      )}
    </div>
  );
}
