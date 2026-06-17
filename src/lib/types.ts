// RoomLink domain types — Phase 1A

export type PropertyType = "crash_pad" | "co_living" | "midterm" | "room_rental";
export type BunkType = "top_bunk" | "bottom_bunk" | "single" | "other";
export type BedStatus = "vacant" | "reserved" | "occupied" | "unavailable";
export type MemberRole = "owner" | "manager" | "tenant";

export interface Property {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  property_type: PropertyType;
  description: string | null;
  house_rules: string | null;
  is_hidden: boolean;
  created_at: string;
}

export interface Room {
  id: string;
  property_id: string;
  name: string;
  description: string | null;
  max_occupancy: number;
  created_at: string;
}

export interface Bed {
  id: string;
  property_id: string;
  room_id: string;
  label: string;
  bunk_type: BunkType;
  monthly_rent: number;
  deposit_amount: number;
  status: BedStatus;
  description: string | null;
  /** Date a vacant bed becomes available. null/past = available now. */
  available_from: string | null;
  /** Optional stay-length guardrails (short/mid/long filtering). */
  min_stay_days: number | null;
  max_stay_days: number | null;
  created_at: string;
}

export interface PropertyMember {
  id: string;
  property_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
}

/** Counts of beds per status, used by dashboard + occupancy summaries. */
export interface BedStatusCounts {
  total: number;
  vacant: number;
  reserved: number;
  occupied: number;
  unavailable: number;
}

/** A room together with its beds (property detail view). */
export interface RoomWithBeds extends Room {
  beds: Bed[];
}

/** Aggregated dashboard metrics. */
export interface DashboardMetrics {
  totalProperties: number;
  totalRooms: number;
  totalBeds: number;
  beds: BedStatusCounts;
  pendingApplications: number;
  activeReservations: number;
  rentDue: number;
  overdueRent: number;
  openMaintenance: number;
  /** Vacant beds available today (available_from null or past). */
  availableNow: number;
  /** Beds whose active reservation ends within the "soon" window (30d). */
  freeingSoon: number;
}

// ---------------------------------------------------------------------------
// Phase 1 (web) shared entities — used by web now, mobile later.
// ---------------------------------------------------------------------------

export type UserRole = "owner" | "manager" | "tenant";
export type VerificationStatus = "unverified" | "pending" | "verified";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  verification_status: VerificationStatus;
  /** Base64-encoded PNG signature for landlords */
  signature_data: string | null;
  signature_updated_at: string | null;
  created_at: string;
}

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "waitlisted"
  | "withdrawn";

export type AgreementStatus = "not_started" | "sent" | "signed";

export type CommuterStatus =
  | "local_resident"
  | "travel_nurse"
  | "airline_crew"
  | "student"
  | "contract_worker"
  | "out_of_state_commuter"
  | "weekly_commuter"
  | "temporary_relocation"
  | "other";

export type EmploymentStatus =
  | "employed_full_time"
  | "employed_part_time"
  | "self_employed"
  | "unemployed"
  | "student"
  | "retired"
  | "other";

export type GovernmentIdStatus = "uploaded" | "not_uploaded" | "pending";

export type SmokingStatus = "non_smoker" | "smoker" | "former_smoker" | "vaper";

export interface Application {
  id: string;
  property_id: string;
  bed_id: string | null;
  desired_room_id: string | null;
  applicant_id: string | null;

  // Personal Information
  first_name: string;
  last_name: string | null;
  full_name: string; // Legacy field, kept for backwards compatibility
  email: string;
  phone: string | null;

  // Stay Details
  desired_move_in: string | null;
  length_of_stay: string | null;
  reason_for_stay: string | null;

  // Commuter Status
  commuter_status: CommuterStatus | null;
  commuter_status_other: string | null;

  // Employment & Income
  employment_status: EmploymentStatus | null;
  employer_name: string | null;
  monthly_income: number | null;

  // Emergency Contact
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;

  // Additional Details (optional)
  current_address: string | null;
  referral_source: string | null;
  preferred_payment_method: string | null;
  vehicle_info: string | null;
  pet_info: string | null;
  smoking_status: SmokingStatus | null;

  // ID & Background
  government_id_status: GovernmentIdStatus | null;
  background_check_consent: boolean;

  // Notes
  message: string | null; // Legacy field
  tenant_notes: string | null;
  internal_notes: string | null; // Landlord-only notes

  // Status & Timestamps
  status: ApplicationStatus;
  agreement_status: AgreementStatus;
  created_at: string;
  updated_at: string;
  decided_at: string | null;
}

/** Application with joined property/room/bed details for display */
export interface ApplicationWithDetails extends Application {
  property?: Property;
  room?: Room;
  bed?: Bed;
}

export type ReservationStatus = "active" | "cancelled" | "completed";
export type DepositStatus = "unpaid" | "paid" | "waived" | "refunded";
export type AccessCodeDelivery = "pending" | "sent" | "delivered";

export interface Reservation {
  id: string;
  property_id: string;
  bed_id: string | null;
  tenant_id: string;
  application_id: string | null;
  status: ReservationStatus;
  start_date: string | null;
  end_date: string | null;
  deposit_amount: number;
  deposit_status: DepositStatus;
  deposit_paid_at: string | null;
  access_code_delivery: AccessCodeDelivery;
  created_at: string;
}

export type RentStatus = "due" | "paid" | "overdue" | "waived";

export interface RentCharge {
  id: string;
  reservation_id: string | null;
  tenant_id: string;
  property_id: string;
  bed_id: string | null;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
  amount: number;
  status: RentStatus;
  paid_at: string | null;
  created_at: string;
}

export type PaymentKind = "deposit" | "rent" | "other";
export type PaymentStatus = "recorded" | "pending" | "failed" | "refunded";

export interface Payment {
  id: string;
  tenant_id: string;
  reservation_id: string | null;
  rent_charge_id: string | null;
  property_id: string | null;
  kind: PaymentKind;
  amount: number;
  payment_provider: string;
  status: PaymentStatus;
  recorded_at: string;
}

export interface Announcement {
  id: string;
  property_id: string;
  author_id: string | null;
  title: string;
  body: string;
  created_at: string;
}

export type MessageSenderRole = "tenant" | "owner" | "manager";

export interface Message {
  id: string;
  property_id: string;
  tenant_id: string;
  sender_id: string | null;
  sender_role: MessageSenderRole;
  body: string;
  read_at: string | null;
  created_at: string;
}

export type MaintenancePriority = "low" | "normal" | "high" | "urgent";
export type MaintenanceStatus = "open" | "in_progress" | "resolved" | "closed";

export interface MaintenanceRequest {
  id: string;
  property_id: string;
  tenant_id: string | null;
  room_id: string | null;
  bed_id: string | null;
  title: string;
  description: string | null;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  created_at: string;
  resolved_at: string | null;
}

// ---------------------------------------------------------------------------
// Phase 1C: Property Media
// ---------------------------------------------------------------------------

export type MediaType = "property" | "room" | "bed";

export interface PropertyMedia {
  id: string;
  owner_id: string;
  property_id: string;
  room_id: string | null;
  bed_id: string | null;
  media_type: MediaType;
  storage_bucket: string;
  storage_path: string;
  public_url: string | null;
  alt_text: string | null;
  caption: string | null;
  is_cover: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Phase 4: Leases (DocuSign eSignature)
// ---------------------------------------------------------------------------

export type LeaseSource = "template" | "upload";
export type LeaseStatus =
  | "draft"
  | "sent"
  | "delivered"
  | "completed"
  | "declined"
  | "voided";

export interface Lease {
  id: string;
  property_id: string;
  room_id: string | null;
  bed_id: string | null;
  tenant_id: string | null;
  application_id: string | null;
  reservation_id: string | null;
  source: LeaseSource;
  provider: string;
  envelope_id: string | null;
  status: LeaseStatus;
  tenant_name: string | null;
  tenant_email: string | null;
  monthly_rent: number | null;
  deposit_amount: number | null;
  lease_start: string | null;
  lease_end: string | null;
  signed_pdf_url: string | null;
  sent_at: string | null;
  completed_at: string | null;
  /** Base64-encoded PNG of landlord signature */
  landlord_signature_data: string | null;
  landlord_signed_at: string | null;
  /** Base64-encoded PNG of tenant signature */
  tenant_signature_data: string | null;
  tenant_signed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Lease Documents (uploaded PDF lease prep — landlord workflow, Phase 1)
// ---------------------------------------------------------------------------

export type LeaseDocumentStatus =
  | "draft"
  | "preparing"
  | "out_for_signature"
  | "completed"
  | "cancelled";
export type LeaseTermType = "month_to_month" | "fixed_term" | "short_term_bed";

export interface LeasePropertySnapshot {
  name: string | null;
  address: string | null;
}
export interface LeaseRoomSnapshot {
  name: string | null;
}
export interface LeaseBedSnapshot {
  label: string | null;
}
export interface LeaseTenantSnapshot {
  name: string | null;
  email: string | null;
}

export interface LeaseDocument {
  id: string;
  owner_id: string;
  property_id: string;
  room_id: string | null;
  bed_id: string | null;
  tenant_id: string | null;
  application_id: string | null;
  title: string;
  status: LeaseDocumentStatus;
  original_file_path: string | null;
  lease_start_date: string | null;
  lease_end_date: string | null;
  lease_term_type: LeaseTermType | null;
  monthly_rent_snapshot: number | null;
  deposit_amount_snapshot: number | null;
  property_snapshot: LeasePropertySnapshot | null;
  room_snapshot: LeaseRoomSnapshot | null;
  bed_snapshot: LeaseBedSnapshot | null;
  tenant_snapshot: LeaseTenantSnapshot | null;
  // In-app signing
  landlord_signature_data: string | null;
  landlord_signed_at: string | null;
  tenant_signature_data: string | null;
  tenant_signed_at: string | null;
  sent_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
