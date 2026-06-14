"use client";

import { Check, X } from "lucide-react";
import { InlineActionButton } from "@/components/forms/InlineActionButton";
import {
  approveApplicationAction,
  rejectApplicationAction,
} from "@/lib/actions/applications";

export function ApplicationActions({ applicationId }: { applicationId: string }) {
  return (
    <div className="flex items-center gap-2">
      <InlineActionButton
        action={approveApplicationAction}
        fields={{ id: applicationId }}
        variant="primary"
        pendingLabel="Approving…"
      >
        <Check className="h-4 w-4" />
        Approve
      </InlineActionButton>
      <InlineActionButton
        action={rejectApplicationAction}
        fields={{ id: applicationId }}
        variant="outline"
        pendingLabel="Rejecting…"
      >
        <X className="h-4 w-4" />
        Reject
      </InlineActionButton>
    </div>
  );
}
