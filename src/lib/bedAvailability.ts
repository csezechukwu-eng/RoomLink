// Pure, client-safe availability helpers. No server imports so both server
// components and client components can derive a bed's availability the same way.
import type { Bed } from "@/lib/types";

export type BedAvailabilityState =
  | "open_now"
  | "opens_soon"
  | "frees_soon"
  | "occupied"
  | "reserved"
  | "unavailable";

export type AvailabilityTone = "emerald" | "amber" | "blue" | "slate";

export interface BedAvailability {
  state: BedAvailabilityState;
  label: string;
  tone: AvailabilityTone;
  /** Relevant ISO date (open-from or freeing date), when known. */
  date: string | null;
  /** Days from today until the bed opens / frees up, when known. */
  days: number | null;
}

/** Default window (in days) for "available soon" / "frees up soon". */
export const SOON_WINDOW_DAYS = 30;

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** ISO date N days from today (UTC), e.g. for "within 30 days" queries. */
export function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole-day difference between two ISO (YYYY-MM-DD) dates: b - a. */
export function daysBetween(aISO: string, bISO: string): number {
  const a = Date.parse(`${aISO}T00:00:00Z`);
  const b = Date.parse(`${bISO}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

export function formatShortDate(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function inDaysLabel(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

/**
 * Derive a bed's availability from its status + available_from, optionally using
 * the end date of its active reservation to surface "frees up soon".
 */
export function computeBedAvailability(
  bed: Pick<Bed, "status" | "available_from">,
  opts: { reservationEndDate?: string | null; soonWindowDays?: number; today?: string } = {}
): BedAvailability {
  const today = opts.today ?? todayISO();
  const window = opts.soonWindowDays ?? SOON_WINDOW_DAYS;

  if (bed.status === "unavailable") {
    return { state: "unavailable", label: "Unavailable", tone: "slate", date: null, days: null };
  }

  if (bed.status === "vacant") {
    if (bed.available_from && bed.available_from > today) {
      const days = daysBetween(today, bed.available_from);
      return {
        state: "opens_soon",
        label: `Opens ${formatShortDate(bed.available_from)}`,
        tone: "amber",
        date: bed.available_from,
        days,
      };
    }
    return { state: "open_now", label: "Open now", tone: "emerald", date: null, days: null };
  }

  if (bed.status === "reserved") {
    return { state: "reserved", label: "Reserved", tone: "blue", date: null, days: null };
  }

  // occupied
  const end = opts.reservationEndDate ?? null;
  if (end && end >= today) {
    const days = daysBetween(today, end);
    if (days <= window) {
      return {
        state: "frees_soon",
        label: `Frees up ${inDaysLabel(days)}`,
        tone: "amber",
        date: end,
        days,
      };
    }
    return {
      state: "occupied",
      label: `Occupied until ${formatShortDate(end)}`,
      tone: "slate",
      date: end,
      days,
    };
  }
  return { state: "occupied", label: "Occupied", tone: "slate", date: null, days: null };
}

export const AVAILABILITY_TONE_CLASSES: Record<AvailabilityTone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  blue: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
  slate: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-300",
};
