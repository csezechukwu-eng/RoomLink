import { CalendarClock } from "lucide-react";
import { AVAILABILITY_TONE_CLASSES, type BedAvailability } from "@/lib/bedAvailability";
import { cn } from "@/lib/utils";

/** Compact pill describing when a bed is/becomes available. */
export function AvailabilityBadge({
  availability,
  className,
  showIcon = true,
}: {
  availability: BedAvailability;
  className?: string;
  showIcon?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        AVAILABILITY_TONE_CLASSES[availability.tone],
        className
      )}
    >
      {showIcon && <CalendarClock className="h-3 w-3" />}
      {availability.label}
    </span>
  );
}
