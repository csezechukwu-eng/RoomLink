import type {
  ApplicationStatus,
  BedStatus,
  BunkType,
  CommuterStatus,
  DepositStatus,
  EmploymentStatus,
  GovernmentIdStatus,
  MaintenancePriority,
  MaintenanceStatus,
  PropertyType,
  PropertyOccupancyType,
  RoomOccupancyType,
  RentStatus,
  ReservationStatus,
  SmokingStatus,
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
  draft: { label: "Draft", badge: TONE.gray },
  submitted: { label: "Submitted", badge: TONE.amber },
  under_review: { label: "Under Review", badge: TONE.blue },
  approved: { label: "Approved", badge: TONE.green },
  rejected: { label: "Rejected", badge: TONE.red },
  waitlisted: { label: "Waitlisted", badge: TONE.indigo },
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

// ---------------------------------------------------------------------------
// Application Form Constants — Step 4: Tenant Applications
// ---------------------------------------------------------------------------

export const APPLICATION_STATUSES: Option<ApplicationStatus>[] = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "withdrawn", label: "Withdrawn" },
];

export const COMMUTER_STATUSES: Option<CommuterStatus>[] = [
  { value: "local_resident", label: "Local Resident" },
  { value: "travel_nurse", label: "Travel Nurse / Healthcare Traveler" },
  { value: "airline_crew", label: "Airline Crew" },
  { value: "student", label: "Student" },
  { value: "contract_worker", label: "Contract Worker" },
  { value: "out_of_state_commuter", label: "Out-of-State Commuter" },
  { value: "weekly_commuter", label: "Weekly Commuter" },
  { value: "temporary_relocation", label: "Temporary Relocation" },
  { value: "other", label: "Other" },
];

export const EMPLOYMENT_STATUSES: Option<EmploymentStatus>[] = [
  { value: "employed_full_time", label: "Employed Full-Time" },
  { value: "employed_part_time", label: "Employed Part-Time" },
  { value: "self_employed", label: "Self-Employed" },
  { value: "unemployed", label: "Unemployed" },
  { value: "student", label: "Student" },
  { value: "retired", label: "Retired" },
  { value: "other", label: "Other" },
];

export const GOVERNMENT_ID_STATUSES: Option<GovernmentIdStatus>[] = [
  { value: "not_uploaded", label: "Not Uploaded" },
  { value: "pending", label: "Pending Review" },
  { value: "uploaded", label: "Uploaded" },
];

export const SMOKING_STATUSES: Option<SmokingStatus>[] = [
  { value: "non_smoker", label: "Non-Smoker" },
  { value: "smoker", label: "Smoker" },
  { value: "former_smoker", label: "Former Smoker" },
  { value: "vaper", label: "Vaper" },
];

export const LENGTH_OF_STAY_OPTIONS: Option<string>[] = [
  { value: "1_week", label: "1 Week" },
  { value: "2_weeks", label: "2 Weeks" },
  { value: "1_month", label: "1 Month" },
  { value: "2_months", label: "2 Months" },
  { value: "3_months", label: "3 Months" },
  { value: "6_months", label: "6 Months" },
  { value: "1_year", label: "1 Year" },
  { value: "indefinite", label: "Indefinite / Long-Term" },
];

export const REFERRAL_SOURCES: Option<string>[] = [
  { value: "google", label: "Google Search" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "friend", label: "Friend / Word of Mouth" },
  { value: "coworker", label: "Coworker" },
  { value: "employer", label: "Employer" },
  { value: "craigslist", label: "Craigslist" },
  { value: "other", label: "Other" },
];

export const PAYMENT_METHODS: Option<string>[] = [
  { value: "bank_transfer", label: "Bank Transfer / ACH" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "check", label: "Check" },
  { value: "cash", label: "Cash" },
  { value: "venmo", label: "Venmo" },
  { value: "zelle", label: "Zelle" },
  { value: "paypal", label: "PayPal" },
];

// Helper functions for labels
export function labelForCommuterStatus(value: CommuterStatus): string {
  return COMMUTER_STATUSES.find((t) => t.value === value)?.label ?? value;
}

export function labelForEmploymentStatus(value: EmploymentStatus): string {
  return EMPLOYMENT_STATUSES.find((t) => t.value === value)?.label ?? value;
}

export function labelForApplicationStatus(value: ApplicationStatus): string {
  return APPLICATION_STATUSES.find((t) => t.value === value)?.label ?? value;
}

export function labelForGovernmentIdStatus(value: GovernmentIdStatus): string {
  return GOVERNMENT_ID_STATUSES.find((t) => t.value === value)?.label ?? value;
}

export function labelForSmokingStatus(value: SmokingStatus): string {
  return SMOKING_STATUSES.find((t) => t.value === value)?.label ?? value;
}

// ---------------------------------------------------------------------------
// Listing Occupancy Types — Monthly Stay Marketplace
// ---------------------------------------------------------------------------

export const PROPERTY_OCCUPANCY_TYPES: Option<PropertyOccupancyType>[] = [
  { value: "coed", label: "Co-ed" },
  { value: "women_only_house", label: "Women-only house" },
  { value: "women_only_rooms_available", label: "Women-only rooms available" },
];

export const ROOM_OCCUPANCY_TYPES: Option<RoomOccupancyType>[] = [
  { value: "coed", label: "Co-ed" },
  { value: "women_only", label: "Women-only" },
];

export function labelForOccupancyType(value: PropertyOccupancyType | RoomOccupancyType | null | undefined): string {
  if (!value) return "";
  const prop = PROPERTY_OCCUPANCY_TYPES.find((t) => t.value === value);
  if (prop) return prop.label;
  const room = ROOM_OCCUPANCY_TYPES.find((t) => t.value === value);
  if (room) return room.label;
  return value;
}
