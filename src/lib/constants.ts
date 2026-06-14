import type {
  ApplicationStatus,
  BedStatus,
  BunkType,
  DepositStatus,
  MaintenancePriority,
  MaintenanceStatus,
  PropertyType,
  RentStatus,
  ReservationStatus,
} from "@/lib/types";

interface Option<T extends string> {
  value: T;
  label: string;
}

export const PROPERTY_TYPES: Option<PropertyType>[] = [
  { value: "crash_pad", label: "Crash Pad" },
  { value: "co_living", label: "Co-Living" },
  { value: "midterm", label: "Midterm Rental" },
  { value: "room_rental", label: "Room Rental" },
];

export const BUNK_TYPES: Option<BunkType>[] = [
  { value: "single", label: "Single" },
  { value: "top_bunk", label: "Top Bunk" },
  { value: "bottom_bunk", label: "Bottom Bunk" },
  { value: "other", label: "Other" },
];

export const BED_STATUSES: Option<BedStatus>[] = [
  { value: "vacant", label: "Vacant" },
  { value: "reserved", label: "Reserved" },
  { value: "occupied", label: "Occupied" },
  { value: "unavailable", label: "Unavailable" },
];

/** Status color tokens (Tailwind classes) used by StatusBadge + summary cards. */
export const BED_STATUS_STYLES: Record<
  BedStatus,
  { label: string; badge: string; dot: string }
> = {
  vacant: {
    label: "Vacant",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  reserved: {
    label: "Reserved",
    badge: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
    dot: "bg-blue-500",
  },
  occupied: {
    label: "Occupied",
    badge: "bg-slate-200 text-slate-800 ring-1 ring-inset ring-slate-500/30",
    dot: "bg-slate-700",
  },
  unavailable: {
    label: "Unavailable",
    badge: "bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-300",
    dot: "bg-slate-300",
  },
};

export function labelForPropertyType(value: PropertyType): string {
  return PROPERTY_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function labelForBunkType(value: BunkType): string {
  return BUNK_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function labelForBedStatus(value: BedStatus): string {
  return BED_STATUSES.find((t) => t.value === value)?.label ?? value;
}

// ---------------------------------------------------------------------------
// Phase 1 status tones — reusable badge classes keyed by status value.
// ---------------------------------------------------------------------------

type Tone = { label: string; badge: string };

const TONE = {
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  blue: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  red: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  gray: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-300",
  darkGray: "bg-slate-200 text-slate-800 ring-1 ring-inset ring-slate-500/30",
  indigo: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20",
} as const;

export const APPLICATION_STATUS_STYLES: Record<ApplicationStatus, Tone> = {
  pending: { label: "Pending", badge: TONE.amber },
  approved: { label: "Approved", badge: TONE.green },
  rejected: { label: "Rejected", badge: TONE.red },
  withdrawn: { label: "Withdrawn", badge: TONE.gray },
};

export const RESERVATION_STATUS_STYLES: Record<ReservationStatus, Tone> = {
  active: { label: "Active", badge: TONE.green },
  cancelled: { label: "Cancelled", badge: TONE.gray },
  completed: { label: "Completed", badge: TONE.darkGray },
};

export const DEPOSIT_STATUS_STYLES: Record<DepositStatus, Tone> = {
  unpaid: { label: "Unpaid", badge: TONE.amber },
  paid: { label: "Paid", badge: TONE.green },
  waived: { label: "Waived", badge: TONE.gray },
  refunded: { label: "Refunded", badge: TONE.blue },
};

export const RENT_STATUS_STYLES: Record<RentStatus, Tone> = {
  due: { label: "Due", badge: TONE.amber },
  paid: { label: "Paid", badge: TONE.green },
  overdue: { label: "Overdue", badge: TONE.red },
  waived: { label: "Waived", badge: TONE.gray },
};

export const MAINTENANCE_STATUS_STYLES: Record<MaintenanceStatus, Tone> = {
  open: { label: "Open", badge: TONE.amber },
  in_progress: { label: "In progress", badge: TONE.blue },
  resolved: { label: "Resolved", badge: TONE.green },
  closed: { label: "Closed", badge: TONE.gray },
};

export const MAINTENANCE_PRIORITY_STYLES: Record<MaintenancePriority, Tone> = {
  low: { label: "Low", badge: TONE.gray },
  normal: { label: "Normal", badge: TONE.blue },
  high: { label: "High", badge: TONE.amber },
  urgent: { label: "Urgent", badge: TONE.red },
};

// Option lists for landlord/tenant select controls.
export const RENT_STATUSES: Option<RentStatus>[] = [
  { value: "due", label: "Due" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "waived", label: "Waived" },
];

export const MAINTENANCE_STATUSES: Option<MaintenanceStatus>[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const MAINTENANCE_PRIORITIES: Option<MaintenancePriority>[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];
