// RoomLink domain types — Phase 1A

export type PropertyType = "crash_pad" | "co_living" | "midterm" | "room_rental";
export type BunkType = "top_bunk" | "bottom_bunk" | "single" | "other";
export type BedStatus = "vacant" | "reserved" | "occupied" | "unavailable";
export type MemberRole = "owner" | "manager" | "tenant";

// Listing occupancy types - hosts must comply with fair housing laws
export type PropertyOccupancyType = "coed" | "women_only_house" | "women_only_rooms_available";
export type RoomOccupancyType = "coed" | "women_only";

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
  /** True if this is a demo/test property */
  is_demo: boolean;
  /** Whether an application fee is required */
  application_fee_required: boolean;
  /** Amount of the application fee */
  application_fee_amount: number | null;
  /** Instructions for paying the application fee */
  application_fee_instructions: string | null;
  // Listing settings for monthly-stay marketplace
  /** Occupancy type: coed, women_only_house, or women_only_rooms_available */
  occupancy_type: PropertyOccupancyType | null;
  /** Whether checkout photos are required from tenants */
  checkout_photo_required: boolean;
  /** Default minimum stay in days for new beds (30 = monthly) */
  default_min_stay_days: number;
  created_at: string;
}

export interface Room {
  id: string;
  property_id: string;
  name: string;
  description: string | null;
  max_occupancy: number;
  /** Room-level occupancy override: coed or women_only */
  occupancy_type: RoomOccupancyType | null;
  /** True if this is a demo/test room */
  is_demo: boolean;
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
  /** True if this is a demo/test bed */
  is_demo: boolean;
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

// ---------------------------------------------------------------------------
// DEPRECATED: Subscription Billing Types
// ---------------------------------------------------------------------------
// These types are from the deprecated landlord subscription billing model.
// Room Link now uses a transaction-fee model where landlords pay a 5% host fee
// only when tenants pay rent through the platform.
// These types are kept for database compatibility but should not be used in new code.
// See: supabase/migrations/0025_deprecate_subscription_billing.sql

/** @deprecated Subscription billing is no longer used */
export type StripeSubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

/** @deprecated Subscription billing is no longer used */
export type SubscriptionPlan = "free" | "monthly" | "yearly" | "starter" | "pro" | "enterprise";

/** @deprecated Subscription billing is no longer used */
export type SubscriptionInterval = "month" | "year";

// ---------------------------------------------------------------------------
// Stripe Connect Types (Marketplace Payouts)
// ---------------------------------------------------------------------------

export type StripeConnectAccountType = "express" | "standard" | "custom";

export type StripeConnectOnboardingStatus =
  | "not_connected"
  | "onboarding_incomplete"
  | "pending_verification"
  | "payouts_ready";

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

  // ---------------------------------------------------------------------------
  // DEPRECATED: Subscription Billing Fields
  // ---------------------------------------------------------------------------
  // These fields are from the deprecated landlord subscription billing model.
  // Room Link now uses transaction-based fees (5% host fee on rent payments).
  // These fields are kept for database compatibility but not actively used.
  // See: supabase/migrations/0025_deprecate_subscription_billing.sql

  /** @deprecated Subscription billing is no longer used */
  stripe_customer_id: string | null;
  /** @deprecated Subscription billing is no longer used */
  stripe_subscription_id: string | null;
  /** @deprecated Subscription billing is no longer used */
  stripe_subscription_status: StripeSubscriptionStatus | null;
  /** @deprecated Subscription billing is no longer used */
  stripe_price_id: string | null;
  /** @deprecated Subscription billing is no longer used */
  stripe_current_period_start: string | null;
  /** @deprecated Subscription billing is no longer used */
  stripe_current_period_end: string | null;
  /** @deprecated Subscription billing is no longer used */
  stripe_cancel_at_period_end: boolean;
  /** @deprecated Subscription billing is no longer used */
  billing_email: string | null;
  /** @deprecated Subscription billing is no longer used */
  subscription_plan: SubscriptionPlan;
  /** @deprecated Subscription billing is no longer used */
  subscription_interval: SubscriptionInterval | null;
  /** @deprecated Subscription billing is no longer used */
  subscription_amount: number | null;
  /** @deprecated Subscription billing is no longer used */
  subscription_started_at: string | null;
  /** @deprecated Subscription billing is no longer used */
  subscription_canceled_at: string | null;
  /** @deprecated Subscription billing is no longer used */
  subscription_ended_at: string | null;
  /** @deprecated Subscription billing is no longer used */
  trial_started_at: string | null;
  /** @deprecated Subscription billing is no longer used */
  trial_ends_at: string | null;
  /** @deprecated Subscription billing is no longer used */
  trial_used: boolean;
  /** @deprecated Subscription billing is no longer used */
  billing_payment_method_summary: string | null;
  /** @deprecated Subscription billing is no longer used */
  billing_updated_at: string | null;

  // ---------------------------------------------------------------------------
  // Stripe Connect (Marketplace Payouts)
  // ---------------------------------------------------------------------------

  /** Whether Stripe Connect is enabled for receiving rent payouts */
  stripe_connect_enabled: boolean;

  /** Stripe Connect account ID (acct_xxx) */
  stripe_account_id: string | null;

  /** Stripe Connect account type: express, standard, or custom */
  stripe_connect_account_type: StripeConnectAccountType | null;

  /** Whether the landlord can receive charges (from Stripe account.charges_enabled) */
  stripe_connect_charges_enabled: boolean;

  /** Whether the landlord can receive payouts (from Stripe account.payouts_enabled) */
  stripe_connect_payouts_enabled: boolean;

  /** Whether the landlord has submitted onboarding details */
  stripe_connect_details_submitted: boolean;

  /** Room Link flag: true when landlord is fully ready for payments */
  stripe_connect_onboarding_complete: boolean;

  /** Array of pending Stripe requirements */
  stripe_connect_requirements_due: string[];

  /** Last time we synced status from Stripe */
  stripe_connect_last_synced_at: string | null;
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

export type ApplicationFeeStatus = "not_required" | "unpaid" | "paid_manually" | "waived";

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
  /** The rental/stay type for this application. Links to lease_templates.stay_type */
  stay_type: LeaseStayType | null;

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

  // Application Fee (snapshot at time of application)
  /** Whether fee was required at time of application */
  application_fee_required: boolean;
  /** Fee amount snapshot */
  application_fee_amount: number | null;
  /** Current fee status */
  application_fee_status: ApplicationFeeStatus;
  /** When fee was marked paid */
  application_fee_paid_at: string | null;
  /** When fee was waived */
  application_fee_waived_at: string | null;
  /** Landlord notes about fee */
  application_fee_notes: string | null;

  /** True if this is a demo/test application */
  is_demo: boolean;
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

  // Stripe Connect marketplace payment fields
  /** Stripe Checkout Session ID for tracking */
  stripe_checkout_session_id: string | null;
  /** Stripe PaymentIntent ID for reconciliation */
  stripe_payment_intent_id: string | null;
  /** Room Link 5% host fee in cents */
  host_fee_cents: number | null;
  /** Amount landlord receives (rent - host fee) in cents */
  landlord_payout_cents: number | null;
  /** Stripe Connect account ID that received payout */
  connected_account_id: string | null;
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

export type SignatureFieldType = "landlord" | "tenant";

export interface SignatureField {
  type: SignatureFieldType;
  page: number; // 0-indexed page number
  x: number; // fraction 0-1 of page width
  y: number; // fraction 0-1 of page height
  width: number; // fraction 0-1 of page width
  height: number; // fraction 0-1 of page height
}

export interface LeaseDocument {
  id: string;
  owner_id: string;
  property_id: string;
  room_id: string | null;
  bed_id: string | null;
  tenant_id: string | null;
  application_id: string | null;
  signing_token: string;
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
  // Signature placement and stamped PDF
  signature_fields: SignatureField[] | null;
  signed_file_path: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Lease Templates (reusable lease PDFs for landlords)
// ---------------------------------------------------------------------------

export type LeaseCategory =
  | "month_to_month_room_lease"
  | "fixed_term_lease"
  | "midterm_lease"
  | "short_term_bed_rental"
  | "crash_pad_agreement"
  | "student_housing_agreement"
  | "travel_nurse_housing_agreement"
  | "other";

export type LeaseStayType =
  | "month_to_month"
  | "yearly"
  | "midterm"
  | "short_term"
  | "bed_rental"
  | "room_rental"
  | "crash_pad"
  | "student_housing"
  | "travel_nurse_housing";

export type LeaseTemplateStatus = "needs_setup" | "ready" | "archived";

export interface LeaseTemplate {
  id: string;
  owner_id: string;
  title: string;
  lease_category: LeaseCategory;
  stay_type: LeaseStayType;
  property_id: string | null;
  file_path: string;
  file_name: string;
  file_type: string;
  status: LeaseTemplateStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaseTemplateWithProperty extends LeaseTemplate {
  property_name: string | null;
}

// ---------------------------------------------------------------------------
// Lease Template Fields (reusable signing fields for lease templates)
// ---------------------------------------------------------------------------

export type LeaseTemplateFieldType =
  | "tenant_signature"
  | "tenant_initials"
  | "date_signed"
  | "tenant_full_name"
  | "email"
  | "phone"
  | "text"
  | "checkbox";

export type LeaseTemplateFieldAssignedTo = "tenant" | "landlord";

export interface LeaseTemplateField {
  id: string;
  lease_template_id: string;
  owner_id: string;
  field_key: string | null;
  field_type: LeaseTemplateFieldType;
  label: string;
  required: boolean;
  assigned_to: LeaseTemplateFieldAssignedTo;
  page_number: number | null;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  placement_note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Prepared Leases (applicant-specific leases created from templates)
// ---------------------------------------------------------------------------

export type PreparedLeaseStatus =
  | "sent"
  | "viewed"
  | "signed"
  | "completed"
  | "cancelled";

export interface PreparedLeaseApplicantSnapshot {
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface PreparedLeasePropertySnapshot {
  name: string | null;
  address: string | null;
}

export interface PreparedLeaseRoomSnapshot {
  name: string | null;
}

export interface PreparedLeaseBedSnapshot {
  label: string | null;
}

export interface PreparedLeaseRentSnapshot {
  monthly_rent: number | null;
}

export interface PreparedLeaseDepositSnapshot {
  deposit_amount: number | null;
}

export interface PreparedLeaseAutofillSnapshot {
  tenantName?: string | null;
  tenantEmail?: string | null;
  tenantPhone?: string | null;
  monthlyIncome?: number | null;
  employer?: string | null;
  propertyName?: string | null;
  propertyAddress?: string | null;
  roomName?: string | null;
  bedLabel?: string | null;
  monthlyRent?: number | null;
  depositAmount?: number | null;
  moveInDate?: string | null;
  leaseStartDate?: string | null;
  rentalType?: string | null;
  stayType?: string | null;
  houseRules?: string | null;
}

export interface PreparedLease {
  id: string;
  owner_id: string;
  application_id: string;
  lease_template_id: string;
  property_id: string | null;
  room_id: string | null;
  bed_id: string | null;
  tenant_id: string | null;
  rental_type: string | null;
  status: PreparedLeaseStatus;
  /** Unique reference number for the lease: RL-LEASE-YYYY-NNNNNN */
  lease_reference_number: string;
  /** Unguessable secret used to authorize the public tenant signing link */
  signing_token: string;
  applicant_snapshot: PreparedLeaseApplicantSnapshot;
  property_snapshot: PreparedLeasePropertySnapshot | null;
  room_snapshot: PreparedLeaseRoomSnapshot | null;
  bed_snapshot: PreparedLeaseBedSnapshot | null;
  rent_snapshot: PreparedLeaseRentSnapshot | null;
  deposit_snapshot: PreparedLeaseDepositSnapshot | null;
  autofill_snapshot: PreparedLeaseAutofillSnapshot;
  sent_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  /** True if this is a demo/test prepared lease */
  is_demo: boolean;
}

export interface PreparedLeaseWithDetails extends PreparedLease {
  template_title: string | null;
  property_name: string | null;
  applicant_name: string | null;
}

export interface PreparedLeaseField {
  id: string;
  prepared_lease_id: string;
  lease_template_field_id: string | null;
  template_field_key: string;
  prepared_field_key: string;
  signature_instance_key: string | null;
  /** Unique reference number for signature fields: RL-{TYPE}-YYYY-NNNNNN-NNN */
  signature_reference_number: string | null;
  field_type: LeaseTemplateFieldType;
  label: string;
  required: boolean;
  assigned_to: LeaseTemplateFieldAssignedTo;
  page_number: number | null;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  placement_note: string | null;
  sort_order: number | null;
  value: string | null;
  /** UUID of user who signed this field */
  signed_by_user_id: string | null;
  /** Name of person who signed this field */
  signed_by_name: string | null;
  /** Email of person who signed this field */
  signed_by_email: string | null;
  /** Timestamp when this field was signed */
  signed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
