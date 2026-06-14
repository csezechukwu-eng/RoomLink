"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Select } from "@/components/ui/select";
import { BED_STATUSES } from "@/lib/constants";
import { initialActionState } from "@/lib/actions/types";
import { changeBedStatus } from "@/lib/actions/beds";
import type { BedStatus } from "@/lib/types";

/** Inline dropdown that updates a bed's status on change. */
export function BedStatusSelect({
  bedId,
  propertyId,
  status,
}: {
  bedId: string;
  propertyId: string;
  status: BedStatus;
}) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    changeBedStatus,
    initialActionState
  );

  React.useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} ref={formRef} className="relative">
      <input type="hidden" name="id" value={bedId} />
      <input type="hidden" name="property_id" value={propertyId} />
      <Select
        name="status"
        defaultValue={status}
        disabled={isPending}
        aria-label="Change bed status"
        className="h-9 text-xs"
        onChange={() => formRef.current?.requestSubmit()}
      >
        {BED_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>
      {isPending ? (
        <Loader2 className="pointer-events-none absolute right-8 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-slate-400" />
      ) : null}
    </form>
  );
}
