import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { ok, fail, type Result } from "@/lib/result";
import { upsertApplicantByEmail } from "@/lib/services/users";
import { setBedStatus } from "@/lib/services/beds";
import type {
  Application,
  ApplicationStatus,
  Bed,
  CommuterStatus,
  EmploymentStatus,
  GovernmentIdStatus,
  SmokingStatus,
} from "@/lib/types";

export interface ApplicationWithRefs extends Application {
  property_name: string | null;
  room_name: string | null;
  bed_label: string | null;
  monthly_rent: number | null;
}

export interface SubmitApplicationInput {
  // Required for bed-specific application
  bedId?: string | null;
  // Or property/room selection
  propertyId?: string;
  roomId?: string | null;

  // Personal Information (required)
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Stay Details (required)
  desiredMoveIn: string;
  lengthOfStay: string;
  reasonForStay: string;

  // Commuter Status (required)
  commuterStatus: CommuterStatus;
  commuterStatusOther?: string | null;

  // Employment (required)
  employmentStatus: EmploymentStatus;
  employerName: string;
  monthlyIncome: number;

  // Emergency Contact (required)
  emergencyContactName: string;
  emergencyContactPhone: string;

  // ID & Background (required)
  governmentIdStatus: GovernmentIdStatus;
  backgroundCheckConsent: boolean;

  // Additional Details (optional)
  currentAddress?: string | null;
  referralSource?: string | null;
  preferredPaymentMethod?: string | null;
  vehicleInfo?: string | null;
  petInfo?: string | null;
  smokingStatus?: SmokingStatus | null;
  tenantNotes?: string | null;
}

function monthBounds(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

/** Public: submit an application. Creates/links a tenant. */
export async function submitApplication(
  input: SubmitApplicationInput
): Promise<Result<{ applicationId: string; tenantId: string }>> {
  try {
    const supabase = getServiceClient();

    // Determine property_id from bed or direct property selection
    let propertyId = input.propertyId;
    const bedId = input.bedId || null;
    let roomId = input.roomId || null;

    if (bedId) {
      const { data: bed, error: bErr } = await supabase
        .from("beds")
        .select("*, rooms(property_id)")
        .eq("id", bedId)
        .maybeSingle();
      if (bErr) throw bErr;
      if (!bed) return fail("That bed could not be found.");
      if ((bed as Bed).status !== "vacant")
        return fail("This bed is no longer available to apply for.");
      propertyId = (bed as Bed).property_id;
      roomId = (bed as Bed).room_id;
    } else if (!propertyId) {
      return fail("Please select a property or bed to apply for.");
    }

    // Create or find the applicant user
    const applicant = await upsertApplicantByEmail({
      email: input.email,
      fullName: `${input.firstName} ${input.lastName}`.trim(),
      phone: input.phone,
    });
    if (applicant.error !== null) return fail(applicant.error);

    // Create the application with all fields
    const { data: application, error: aErr } = await supabase
      .from("applications")
      .insert({
        property_id: propertyId,
        bed_id: bedId,
        desired_room_id: roomId,
        applicant_id: applicant.data.id,

        // Personal Information
        first_name: input.firstName,
        last_name: input.lastName,
        full_name: `${input.firstName} ${input.lastName}`.trim(),
        email: input.email.toLowerCase(),
        phone: input.phone,

        // Stay Details
        desired_move_in: input.desiredMoveIn,
        length_of_stay: input.lengthOfStay,
        reason_for_stay: input.reasonForStay,

        // Commuter Status
        commuter_status: input.commuterStatus,
        commuter_status_other: input.commuterStatusOther || null,

        // Employment
        employment_status: input.employmentStatus,
        employer_name: input.employerName,
        monthly_income: input.monthlyIncome,

        // Emergency Contact
        emergency_contact_name: input.emergencyContactName,
        emergency_contact_phone: input.emergencyContactPhone,

        // ID & Background
        government_id_status: input.governmentIdStatus,
        background_check_consent: input.backgroundCheckConsent,

        // Additional Details
        current_address: input.currentAddress || null,
        referral_source: input.referralSource || null,
        preferred_payment_method: input.preferredPaymentMethod || null,
        vehicle_info: input.vehicleInfo || null,
        pet_info: input.petInfo || null,
        smoking_status: input.smokingStatus || null,
        tenant_notes: input.tenantNotes || null,

        // Status
        status: "submitted",
      })
      .select("id")
      .single();
    if (aErr) throw aErr;

    return ok({ applicationId: application.id, tenantId: applicant.data.id });
  } catch (error) {
    return fail(error);
  }
}

/** Get a single application by ID with property/room/bed details. */
export async function getApplicationById(
  applicationId: string
): Promise<Result<ApplicationWithRefs | null>> {
  try {
    const supabase = getServiceClient();

    const { data: app, error: aErr } = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!app) return ok(null);

    const application = app as Application;

    // Get property name
    const { data: property } = await supabase
      .from("properties")
      .select("name")
      .eq("id", application.property_id)
      .maybeSingle();

    // Get bed and room details if bed_id exists
    let bedLabel: string | null = null;
    let roomName: string | null = null;
    let monthlyRent: number | null = null;

    if (application.bed_id) {
      const { data: bed } = await supabase
        .from("beds")
        .select("label, monthly_rent, room_id")
        .eq("id", application.bed_id)
        .maybeSingle();

      if (bed) {
        bedLabel = bed.label;
        monthlyRent = bed.monthly_rent;

        if (bed.room_id) {
          const { data: room } = await supabase
            .from("rooms")
            .select("name")
            .eq("id", bed.room_id)
            .maybeSingle();
          roomName = room?.name ?? null;
        }
      }
    } else if (application.desired_room_id) {
      const { data: room } = await supabase
        .from("rooms")
        .select("name")
        .eq("id", application.desired_room_id)
        .maybeSingle();
      roomName = room?.name ?? null;
    }

    return ok({
      ...application,
      property_name: property?.name ?? null,
      bed_label: bedLabel,
      room_name: roomName,
      monthly_rent: monthlyRent,
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * List applications, enriched with property/room/bed refs. Scope by owner
 * (landlord view), a single property, or applicant (tenant view).
 */
export async function listApplications(opts: {
  ownerId?: string;
  propertyId?: string;
  applicantId?: string;
  status?: ApplicationStatus;
  search?: string;
}): Promise<Result<ApplicationWithRefs[]>> {
  try {
    const supabase = getServiceClient();

    let query = supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (opts.applicantId) {
      query = query.eq("applicant_id", opts.applicantId);
    } else {
      // Resolve property scope for the landlord view.
      let propertyIds: string[] = [];
      if (opts.propertyId) {
        propertyIds = [opts.propertyId];
      } else if (opts.ownerId) {
        const { data: props, error: pErr } = await supabase
          .from("properties")
          .select("id")
          .eq("owner_id", opts.ownerId);
        if (pErr) throw pErr;
        propertyIds = (props ?? []).map((p) => p.id);
      }
      if (propertyIds.length === 0) return ok([]);
      query = query.in("property_id", propertyIds);
    }

    if (opts.status) query = query.eq("status", opts.status);

    const { data: apps, error: aErr } = await query;
    if (aErr) throw aErr;
    let applications = (apps ?? []) as Application[];
    if (applications.length === 0) return ok([]);

    // Apply search filter (client-side for flexibility)
    if (opts.search) {
      const searchLower = opts.search.toLowerCase();
      applications = applications.filter(
        (a) =>
          a.first_name?.toLowerCase().includes(searchLower) ||
          a.last_name?.toLowerCase().includes(searchLower) ||
          a.full_name?.toLowerCase().includes(searchLower) ||
          a.email?.toLowerCase().includes(searchLower) ||
          a.phone?.toLowerCase().includes(searchLower) ||
          a.commuter_status?.toLowerCase().includes(searchLower)
      );
    }

    // Enrich with property name + bed/room labels via lookup maps.
    const propertyIdsFromApps = [
      ...new Set(applications.map((a) => a.property_id)),
    ];
    const bedIds = [
      ...new Set(applications.map((a) => a.bed_id).filter(Boolean)),
    ] as string[];
    const roomIds = [
      ...new Set(applications.map((a) => a.desired_room_id).filter(Boolean)),
    ] as string[];

    const [{ data: props }, { data: beds }] = await Promise.all([
      supabase.from("properties").select("id, name").in("id", propertyIdsFromApps),
      bedIds.length
        ? supabase
            .from("beds")
            .select("id, label, monthly_rent, room_id")
            .in("id", bedIds)
        : Promise.resolve({ data: [] as { id: string }[] }),
    ]);

    // Collect all room IDs from beds and direct room selections
    const allRoomIds = [
      ...new Set([
        ...roomIds,
        ...(beds ?? [])
          .map((b) => (b as { room_id?: string }).room_id)
          .filter(Boolean),
      ]),
    ] as string[];

    const { data: rooms } = allRoomIds.length
      ? await supabase.from("rooms").select("id, name").in("id", allRoomIds)
      : { data: [] as { id: string; name: string }[] };

    const propName = new Map((props ?? []).map((p) => [p.id, p.name]));
    const bedMap = new Map(
      (beds ?? []).map((b) => [
        (b as { id: string }).id,
        b as { label: string; monthly_rent: number; room_id: string },
      ])
    );
    const roomName = new Map((rooms ?? []).map((r) => [r.id, r.name]));

    return ok(
      applications.map((a) => {
        const bed = a.bed_id ? bedMap.get(a.bed_id) : undefined;
        return {
          ...a,
          property_name: propName.get(a.property_id) ?? null,
          bed_label: bed?.label ?? null,
          room_name:
            bed?.room_id
              ? roomName.get(bed.room_id) ?? null
              : a.desired_room_id
              ? roomName.get(a.desired_room_id) ?? null
              : null,
          monthly_rent: bed?.monthly_rent ?? null,
        };
      })
    );
  } catch (error) {
    return fail(error);
  }
}

/** Tenant portal: a tenant's own applications. */
export async function getTenantApplications(
  tenantId: string
): Promise<Result<ApplicationWithRefs[]>> {
  return listApplications({ applicantId: tenantId });
}

/** Update application status (landlord action). */
export async function updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus
): Promise<Result<null>> {
  try {
    const supabase = getServiceClient();

    const { data: app, error: aErr } = await supabase
      .from("applications")
      .select("status")
      .eq("id", applicationId)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!app) return fail("Application not found.");

    const currentStatus = app.status as ApplicationStatus;

    // Validate status transitions
    const decidedStatuses: ApplicationStatus[] = ["approved", "rejected", "withdrawn"];
    if (decidedStatuses.includes(currentStatus) && newStatus !== "under_review") {
      // Allow reopening to under_review, but not direct changes between decided states
      if (decidedStatuses.includes(newStatus)) {
        return fail(`Cannot change status from ${currentStatus} to ${newStatus}.`);
      }
    }

    const updateData: Record<string, unknown> = { status: newStatus };
    if (["approved", "rejected", "waitlisted"].includes(newStatus)) {
      updateData.decided_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("applications")
      .update(updateData)
      .eq("id", applicationId);
    if (error) throw error;

    return ok(null);
  } catch (error) {
    return fail(error);
  }
}

/** Add or update internal notes (landlord only). */
export async function updateInternalNotes(
  applicationId: string,
  notes: string
): Promise<Result<null>> {
  try {
    const supabase = getServiceClient();

    const { error } = await supabase
      .from("applications")
      .update({ internal_notes: notes })
      .eq("id", applicationId);
    if (error) throw error;

    return ok(null);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Approve an application: reserves the bed, creates a reservation + the first
 * rent charge, and auto-rejects other pending applications for the same bed.
 */
export async function approveApplication(
  applicationId: string
): Promise<Result<{ reservationId: string }>> {
  try {
    const supabase = getServiceClient();

    const { data: app, error: aErr } = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!app) return fail("Application not found.");
    const application = app as Application;

    // Allow approval from submitted, under_review, or waitlisted
    const approvableStatuses: ApplicationStatus[] = ["submitted", "under_review", "waitlisted"];
    if (!approvableStatuses.includes(application.status))
      return fail("This application cannot be approved from its current status.");
    if (!application.applicant_id)
      return fail("Application has no linked applicant.");
    if (!application.bed_id)
      return fail("Application is not tied to a specific bed.");

    const { data: bed, error: bErr } = await supabase
      .from("beds")
      .select("*")
      .eq("id", application.bed_id)
      .maybeSingle();
    if (bErr) throw bErr;
    if (!bed) return fail("The applied-for bed no longer exists.");
    if ((bed as Bed).status !== "vacant")
      return fail("That bed is no longer vacant.");

    const typedBed = bed as Bed;

    // Reserve the bed.
    const bedRes = await setBedStatus(typedBed.id, "reserved", typedBed.property_id);
    if (bedRes.error !== null) return fail(bedRes.error);

    // Create the reservation.
    const { data: reservation, error: rErr } = await supabase
      .from("reservations")
      .insert({
        property_id: application.property_id,
        bed_id: typedBed.id,
        tenant_id: application.applicant_id,
        application_id: application.id,
        status: "active",
        start_date: application.desired_move_in || new Date().toISOString().slice(0, 10),
        deposit_amount: typedBed.deposit_amount,
        deposit_status: "unpaid",
      })
      .select("id")
      .single();
    if (rErr) throw rErr;

    // Seed the first rent charge for the current month.
    const { start, end } = monthBounds();
    const { error: rentErr } = await supabase.from("rent_charges").insert({
      reservation_id: reservation.id,
      tenant_id: application.applicant_id,
      property_id: application.property_id,
      bed_id: typedBed.id,
      period_start: start,
      period_end: end,
      due_date: start,
      amount: typedBed.monthly_rent,
      status: "due",
    });
    if (rentErr) throw rentErr;

    // Mark this application approved and reject competing ones for the bed.
    const now = new Date().toISOString();
    const { error: updErr } = await supabase
      .from("applications")
      .update({ status: "approved", decided_at: now })
      .eq("id", application.id);
    if (updErr) throw updErr;

    const { error: rejErr } = await supabase
      .from("applications")
      .update({ status: "rejected", decided_at: now })
      .eq("bed_id", typedBed.id)
      .in("status", ["submitted", "under_review", "waitlisted"]);
    if (rejErr) throw rejErr;

    return ok({ reservationId: reservation.id });
  } catch (error) {
    return fail(error);
  }
}

/** Reject an application. */
export async function rejectApplication(
  applicationId: string
): Promise<Result<null>> {
  try {
    const supabase = getServiceClient();
    const { data: app, error: aErr } = await supabase
      .from("applications")
      .select("status")
      .eq("id", applicationId)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!app) return fail("Application not found.");

    const rejectableStatuses: ApplicationStatus[] = ["submitted", "under_review", "waitlisted"];
    if (!rejectableStatuses.includes(app.status as ApplicationStatus))
      return fail("This application cannot be rejected from its current status.");

    const { error } = await supabase
      .from("applications")
      .update({ status: "rejected", decided_at: new Date().toISOString() })
      .eq("id", applicationId);
    if (error) throw error;
    return ok(null);
  } catch (error) {
    return fail(error);
  }
}

/** Waitlist an application. */
export async function waitlistApplication(
  applicationId: string
): Promise<Result<null>> {
  try {
    const supabase = getServiceClient();
    const { data: app, error: aErr } = await supabase
      .from("applications")
      .select("status")
      .eq("id", applicationId)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!app) return fail("Application not found.");

    const waitlistableStatuses: ApplicationStatus[] = ["submitted", "under_review"];
    if (!waitlistableStatuses.includes(app.status as ApplicationStatus))
      return fail("This application cannot be waitlisted from its current status.");

    const { error } = await supabase
      .from("applications")
      .update({ status: "waitlisted", decided_at: new Date().toISOString() })
      .eq("id", applicationId);
    if (error) throw error;
    return ok(null);
  } catch (error) {
    return fail(error);
  }
}
