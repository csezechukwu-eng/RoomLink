import { cn } from "@/lib/utils";
import type { Message, MessageSenderRole } from "@/lib/types";

function time(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Chat bubbles for a thread; messages from `meRole` align right. */
export function MessageBubbles({
  messages,
  meRole,
}: {
  messages: Message[];
  meRole: MessageSenderRole;
}) {
  if (messages.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-slate-400">No messages yet.</p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {messages.map((m) => {
        const mine = m.sender_role === meRole;
        return (
          <div
            key={m.id}
            className={cn("flex flex-col", mine ? "items-end" : "items-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                mine
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-800"
              )}
            >
              {m.body}
            </div>
            <span className="mt-0.5 px-1 text-[11px] text-slate-400">
              {mine ? "You" : m.sender_role === "tenant" ? "Tenant" : "Host"} ·{" "}
              {time(m.created_at)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
