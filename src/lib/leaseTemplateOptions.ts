// Lease template options - shared between client and server
//
// PRODUCT NOTE: renta bed is a MONTHLY-stay marketplace.
// All stay types here represent minimum one-month stays.
// "Short-term" in this context means monthly bed rentals (not nightly Airbnb-style).
// See: src/lib/productConfig.ts for full product direction.
//
import type { LeaseCategory, LeaseStayType } from "@/lib/types";

export const LEASE_CATEGORY_OPTIONS: { value: LeaseCategory; label: string }[] = [
  { value: "month_to_month_room_lease", label: "Month-to-Month Room Lease" },
  { value: "fixed_term_lease", label: "Fixed-Term Lease" },
  { value: "midterm_lease", label: "Midterm Lease (3-11 months)" },
  // NOTE: "short_term_bed_rental" means monthly bed rental, NOT nightly
  { value: "short_term_bed_rental", label: "Monthly Bed Rental" },
  { value: "crash_pad_agreement", label: "Crash Pad Agreement" },
  { value: "student_housing_agreement", label: "Student Housing Agreement" },
  { value: "travel_nurse_housing_agreement", label: "Travel Nurse Housing Agreement" },
  { value: "other", label: "Other" },
];

export const STAY_TYPE_OPTIONS: { value: LeaseStayType; label: string }[] = [
  { value: "month_to_month", label: "Month-to-month" },
  { value: "yearly", label: "Yearly" },
  { value: "midterm", label: "Midterm (3-11 months)" },
  // NOTE: "short_term" means minimum one-month stay, NOT nightly
  { value: "short_term", label: "Monthly (1-2 months)" },
  { value: "bed_rental", label: "Bed rental" },
  { value: "room_rental", label: "Room rental" },
  { value: "crash_pad", label: "Crash pad" },
  { value: "student_housing", label: "Student housing" },
  { value: "travel_nurse_housing", label: "Travel nurse housing" },
];

export function getLeaseCategoryLabel(value: LeaseCategory): string {
  return LEASE_CATEGORY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function getStayTypeLabel(value: LeaseStayType): string {
  return STAY_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
