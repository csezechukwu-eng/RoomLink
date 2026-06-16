// Pure, client-safe helpers for tenant occupancy: move-in readiness and
// move-in / current / move-out classification. No server imports.
import type { RosterEntry } from "@/lib/services/tenants";
import { todayISO, daysBetween, SOON_WINDOW_DAYS } from "@/lib/bedAvailability";

export interface ReadinessItem {
  key: "deposit" | "lease" | "rent" | "access";
  label: string;
  done: boolean;
}

/** Move-in readiness derived entirely from data already stored. */
export function moveInReadiness(entry: RosterEntry): ReadinessItem[] {
  return [
    {
      key: "deposit",
      label: "Deposit collected",
      done: entry.depositStatus === "paid" || entry.depositStatus === "waived",
    },
    {
      key: "lease",
      label: "Lease signed",
      done: entry.agreementStatus === "signed",
    },
    {
      key: "rent",
      label: "Rent scheduled",
      done: entry.charges.length > 0,
    },
    {
      key: "access",
      label: "Access code delivered",
      done: entry.accessCodeDelivery === "delivered",
    },
  ];
}

export function readinessProgress(entry: RosterEntry): {
  done: number;
  total: number;
} {
  const items = moveInReadiness(entry);
  return { done: items.filter((i) => i.done).length, total: items.length };
}

export type OccupancyPhase = "moving_in" | "current" | "moving_out";

/**
 * Classify a roster entry by its lease timeline:
 *  - moving_in: lease starts in the future
 *  - moving_out: lease ends within the soon window
 *  - current: everything else (actively housed)
 */
export function occupancyPhase(
  entry: RosterEntry,
  opts: { today?: string; soonWindowDays?: number } = {}
): OccupancyPhase {
  const today = opts.today ?? todayISO();
  const window = opts.soonWindowDays ?? SOON_WINDOW_DAYS;

  if (entry.startDate && entry.startDate > today) return "moving_in";
  if (entry.endDate && entry.endDate >= today && daysBetween(today, entry.endDate) <= window) {
    return "moving_out";
  }
  return "current";
}

export function splitRoster(
  entries: RosterEntry[],
  opts: { today?: string; soonWindowDays?: number } = {}
) {
  const movingIn: RosterEntry[] = [];
  const current: RosterEntry[] = [];
  const movingOut: RosterEntry[] = [];
  for (const e of entries) {
    const phase = occupancyPhase(e, opts);
    if (phase === "moving_in") movingIn.push(e);
    else if (phase === "moving_out") movingOut.push(e);
    else current.push(e);
  }
  return { movingIn, current, movingOut };
}
