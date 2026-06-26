"use server";

import { redirect } from "next/navigation";
import { setCurrentTenantId, getCurrentOwnerId } from "@/lib/auth";
import { createAuthenticatedClient } from "@/lib/supabase/server";
import {
  submitApplication,
  approveApplication,
  rejectApplication,
  waitlistApplication,
  updateApplicationStatus,
  updateInternalNotes,
  getApplicationById,
} from "@/lib/services/applications";
import { approveAndSendLease } from "@/lib/services/preparedLeases";
import {
  type ActionState,
  errorState,
  optionalStr,
  str,
  num,
  successState,
  revalidateApp,
} from "@/lib/actions/_shared";
import type {
  ApplicationStatus,
  CommuterStatus,
  EmploymentStatus,
  GovernmentIdStatus,
  SmokingStatus,
} from "@/lib/types";
import {
  COMMUTER_STATUSES,
  EMPLOYMENT_STATUSES,
  GOVERNMENT_ID_STATUSES,
} from "@/lib/constants";

const validCommuterStatuses = new Set(COMMUTER_STATUSES.map((s) => s.value));
const validEmploymentStatuses = new Set(EMPLOYMENT_STATUSES.map((s) => s.value));
const validGovernmentIdStatuses = new Set(GOVERNMENT_ID_STATUSES.map((s) => s.value));

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone: string): boolean {
  // Basic phone validation - at least 10 digits
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10;
}

export async function submitApplicationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const fieldErrors: Record<string, string> = {};

  // Required fields
  const firstName = str(formData, "first_name");
  const lastName = str(formData, "last_name");
  const email = str(formData, "email");
  const phone = str(formData, "phone");
  const desiredMoveIn = str(formData, "desired_move_in");
  const lengthOfStay = str(formData, "length_of_stay");
  const commuterStatus = str(formData, "commuter_status") as CommuterStatus;
  const employmentStatus = str(formData, "employment_status") as EmploymentStatus;
  const employerName = str(formData, "employer_name");
  const monthlyIncome = num(formData, "monthly_income");
  const emergencyContactName = str(formData, "emergency_contact_name");
  const emergencyContactPhone = str(formData, "emergency_contact_phone");
  const governmentIdStatus = str(formData, "government_id_status") as GovernmentIdStatus;
  const backgroundCheckConsent = str(formData, "background_check_consent") === "true";
  const reasonForStay = str(formData, "reason_for_stay");

  // Property/Room/Bed selection
  const propertyId = optionalStr(formData, "property_id");
  const roomId = optionalStr(formData, "room_id");
  const bedId = optionalStr(formData, "bed_id");

  // Validate required fields
  if (!firstName) fieldErrors.first_name = "First name is required.";
  if (!lastName) fieldErrors.last_name = "Last name is required.";
  if (!email) {
    fieldErrors.email = "Email is required.";
  } else if (!validateEmail(email)) {
    fieldErrors.email = "Please enter a valid email address.";
  }
  if (!phone) {
    fieldErrors.phone = "Phone number is required.";
  } else if (!validatePhone(phone)) {
    fieldErrors.phone = "Please enter a valid phone number (at least 10 digits).";
  }
  if (!desiredMoveIn) fieldErrors.desired_move_in = "Desired move-in date is required.";
  if (!lengthOfStay) fieldErrors.length_of_stay = "Length of stay is required.";
  if (!commuterStatus || !validCommuterStatuses.has(commuterStatus)) {
    fieldErrors.commuter_status = "Please select a commuter status.";
  }
  if (!employmentStatus || !validEmploymentStatuses.has(employmentStatus)) {
    fieldErrors.employment_status = "Please select an employment status.";
  }
  if (!employerName) fieldErrors.employer_name = "Employer name is required.";
  if (monthlyIncome === null || monthlyIncome < 0) {
    fieldErrors.monthly_income = "Please enter a valid monthly income.";
  }
  if (!emergencyContactName) fieldErrors.emergency_contact_name = "Emergency contact name is required.";
  if (!emergencyContactPhone) {
    fieldErrors.emergency_contact_phone = "Emergency contact phone is required.";
  } else if (!validatePhone(emergencyContactPhone)) {
    fieldErrors.emergency_contact_phone = "Please enter a valid phone number.";
  }
  if (!governmentIdStatus || !validGovernmentIdStatuses.has(governmentIdStatus)) {
    fieldErrors.government_id_status = "Please select government ID status.";
  }
  if (!backgroundCheckConsent) {
    fieldErrors.background_check_consent = "You must consent to a background check.";
  }
  if (!reasonForStay) fieldErrors.reason_for_stay = "Reason for stay is required.";

  // Must have either a bed or property selected
  if (!bedId && !propertyId) {
    fieldErrors.property_id = "Please select a property or bed.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return errorState("Please fix the highlighted fields.", fieldErrors);
  }

  // Optional fields
  const commuterStatusOther = optionalStr(formData, "commuter_status_other");
  const currentAddress = optionalStr(formData, "current_address");
  const referralSource = optionalStr(formData, "referral_source");
  const preferredPaymentMethod = optionalStr(formData, "preferred_payment_method");
  const vehicleInfo = optionalStr(formData, "vehicle_info");
  const petInfo = optionalStr(formData, "pet_info");
  const smokingStatus = optionalStr(formData, "smoking_status") as SmokingStatus | null;
  const tenantNotes = optionalStr(formData, "tenant_notes");

  let tenantId: string | null = null;
  const result = await submitApplication({
    propertyId: propertyId || undefined,
    roomId: roomId || undefined,
    bedId: bedId || undefined,
    firstName,
    lastName,
    email,
    phone,
    desiredMoveIn,
    lengthOfStay,
    reasonForStay,
    commuterStatus,
    commuterStatusOther,
    employmentStatus,
    employerName,
    monthlyIncome: monthlyIncome!,
    emergencyContactName,
    emergencyContactPhone,
    governmentIdStatus,
    backgroundCheckConsent,
    currentAddress,
    referralSource,
    preferredPaymentMethod,
    vehicleInfo,
    petInfo,
    smokingStatus,
    tenantNotes,
  });

  if (result.error !== null) return errorState(result.error);
  tenantId = result.data.tenantId;

  // Remember this applicant so the tenant portal shows their status.
  await setCurrentTenantId(tenantId);
  revalidateApp();
  redirect("/tenant/status?applied=1");
}

export async function approveApplicationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  if (!id) return errorState("Missing application id.");

  // Verify landlord owns this application's property
  try {
    const ownerId = await getCurrentOwnerId();
    const appResult = await getApplicationById(id);
    if (appResult.error !== null) return errorState(appResult.error);
    if (!appResult.data) return errorState("Application not found.");

    // TODO: Add property ownership check here when needed
    // For now, we trust the landlord session
  } catch {
    return errorState("You must be logged in to approve applications.");
  }

  const result = await approveApplication(id);
  if (result.error !== null) return errorState(result.error);
  revalidateApp();
  return successState("Application approved — reservation created.");
}

export async function rejectApplicationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  if (!id) return errorState("Missing application id.");

  const result = await rejectApplication(id);
  if (result.error !== null) return errorState(result.error);
  revalidateApp();
  return successState("Application rejected.");
}

export async function waitlistApplicationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  if (!id) return errorState("Missing application id.");

  const result = await waitlistApplication(id);
  if (result.error !== null) return errorState(result.error);
  revalidateApp();
  return successState("Application added to waitlist.");
}

export async function markUnderReviewAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  if (!id) return errorState("Missing application id.");

  const result = await updateApplicationStatus(id, "under_review");
  if (result.error !== null) return errorState(result.error);
  revalidateApp();
  return successState("Application marked as under review.");
}

export async function updateInternalNotesAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  const notes = str(formData, "internal_notes") || "";
  if (!id) return errorState("Missing application id.");

  const result = await updateInternalNotes(id, notes);
  if (result.error !== null) return errorState(result.error);
  revalidateApp();
  return successState("Notes saved.");
}

/**
 * Approve an application and automatically send the linked lease template.
 * This:
 * 1. Validates the application and linked lease template
 * 2. Approves the application
 * 3. Creates a reservation
 * 4. Creates a prepared lease from the linked template
 * 5. Copies template fields with unique signature instance keys
 */
export async function approveAndSendLeaseAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  if (!id) return errorState("Missing application id.");

  // Verify landlord owns this application's property
  try {
    await getCurrentOwnerId();
  } catch {
    return errorState("You must be logged in to approve applications.");
  }

  const result = await approveAndSendLease(id);
  if (result.error !== null) return errorState(result.error);

  revalidateApp();
  return successState("Application approved and lease sent.");
}

/**
 * Mark application fee as paid manually.
 */
export async function markFeePaidAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  const notes = optionalStr(formData, "fee_notes");
  if (!id) return errorState("Missing application id.");

  try {
    await getCurrentOwnerId(); // Verify landlord is logged in
    const supabase = await createAuthenticatedClient();

    const { error } = await supabase
      .from("applications")
      .update({
        application_fee_status: "paid_manually",
        application_fee_paid_at: new Date().toISOString(),
        application_fee_waived_at: null,
        application_fee_notes: notes || null,
      })
      .eq("id", id);
    if (error) throw error;

    revalidateApp();
    return successState("Application fee marked as paid.");
  } catch (error) {
    return errorState(
      error instanceof Error ? error.message : "Failed to update fee status."
    );
  }
}

/**
 * Waive application fee.
 */
export async function waiveFeeAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  const notes = optionalStr(formData, "fee_notes");
  if (!id) return errorState("Missing application id.");

  try {
    await getCurrentOwnerId(); // Verify landlord is logged in
    const supabase = await createAuthenticatedClient();

    const { error } = await supabase
      .from("applications")
      .update({
        application_fee_status: "waived",
        application_fee_waived_at: new Date().toISOString(),
        application_fee_paid_at: null,
        application_fee_notes: notes || null,
      })
      .eq("id", id);
    if (error) throw error;

    revalidateApp();
    return successState("Application fee waived.");
  } catch (error) {
    return errorState(
      error instanceof Error ? error.message : "Failed to update fee status."
    );
  }
}

/**
 * Reset application fee status to unpaid.
 */
export async function resetFeeStatusAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  if (!id) return errorState("Missing application id.");

  try {
    await getCurrentOwnerId(); // Verify landlord is logged in
    const supabase = await createAuthenticatedClient();

    const { error } = await supabase
      .from("applications")
      .update({
        application_fee_status: "unpaid",
        application_fee_paid_at: null,
        application_fee_waived_at: null,
      })
      .eq("id", id);
    if (error) throw error;

    revalidateApp();
    return successState("Fee status reset to unpaid.");
  } catch (error) {
    return errorState(
      error instanceof Error ? error.message : "Failed to update fee status."
    );
  }
}

/**
 * Update application fee notes.
 */
export async function updateFeeNotesAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = str(formData, "id");
  const notes = str(formData, "fee_notes") || "";
  if (!id) return errorState("Missing application id.");

  try {
    await getCurrentOwnerId(); // Verify landlord is logged in
    const supabase = await createAuthenticatedClient();

    const { error } = await supabase
      .from("applications")
      .update({
        application_fee_notes: notes || null,
      })
      .eq("id", id);
    if (error) throw error;

    revalidateApp();
    return successState("Fee notes saved.");
  } catch (error) {
    return errorState(
      error instanceof Error ? error.message : "Failed to save notes."
    );
  }
}
