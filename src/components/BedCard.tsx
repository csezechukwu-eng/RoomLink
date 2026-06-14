import { StatusBadge } from "@/components/StatusBadge";
import { BedFormModal } from "@/components/forms/BedFormModal";
import { BedStatusSelect } from "@/components/forms/BedStatusSelect";
import { ConfirmDeleteButton } from "@/components/forms/ConfirmDeleteButton";
import { labelForBunkType } from "@/lib/constants";
import { deleteBed } from "@/lib/actions/beds";
import type { Bed, Room } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface BedCardProps {
  bed: Bed;
  rooms: Pick<Room, "id" | "name">[];
}

export function BedCard({ bed, rooms }: BedCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{bed.label}</p>
          <p className="text-xs text-slate-500">
            {labelForBunkType(bed.bunk_type)}
          </p>
        </div>
        <StatusBadge status={bed.status} />
      </div>

      <div className="flex items-center justify-between text-sm">
        <div>
          <p className="font-semibold text-slate-900">
            {formatCurrency(bed.monthly_rent)}
            <span className="text-xs font-normal text-slate-500">/mo</span>
          </p>
          <p className="text-xs text-slate-500">
            {formatCurrency(bed.deposit_amount)} deposit
          </p>
        </div>
      </div>

      {bed.description ? (
        <p className="text-xs text-slate-500">{bed.description}</p>
      ) : null}

      <div className="mt-1 border-t border-slate-100 pt-3">
        <BedStatusSelect
          bedId={bed.id}
          propertyId={bed.property_id}
          status={bed.status}
        />
        <div className="mt-2 flex items-center justify-end gap-1">
          <BedFormModal
            mode="edit"
            propertyId={bed.property_id}
            rooms={rooms}
            bed={bed}
            triggerLabel="Edit"
            triggerSize="sm"
            triggerVariant="ghost"
          />
          <ConfirmDeleteButton
            action={deleteBed}
            fields={{ id: bed.id, property_id: bed.property_id }}
            title="Delete bed"
            description={`Delete "${bed.label}"? This can't be undone.`}
            triggerLabel="Delete"
            triggerSize="sm"
          />
        </div>
      </div>
    </div>
  );
}
