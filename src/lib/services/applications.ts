import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { ok, fail, type Result } from "@/lib/result";
import { upsertApplicantByEmail } from "@/lib/services/users";
import { setBedStatus } from "@/lib/services/beds";
import type { Application, ApplicationStatus, Bed } from "@/lib/types";

export interface ApplicationWithRefs extends Application {
  property_name: string | null;
  room_name: string | null;
  bed_label: string | null;
  monthly_rent: number | null;
}

export interface SubmitApplicationInput {
  bedId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  desiredMoveIn?: string | null;
}

function monthBounds(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

/** Public: submit an application for a vacant bed. Creates/links a tenant. */
export async function submitApplication(
  input: SubmitApplicationInput
): Promise<Result<{ applicationId: string; tenantId: string }>> {
  try {
    const supabase = getServiceClient();

    const { data: bed, error: bErr } = await supabase
      .from("beds")
      .select("*")
      .eq("id", input.bedId)
      .maybeSingle();
    if (bErr) throw bErr;
    if (!bed) return fail("That bed could not be found.");
    if ((bed as Bed).status !== "vacant")
      return fail("This bed is no longer available to apply for.");

    const applicant = await upsertApplicantByEmail({
      email: input.email,
      fullName: input.fullName,
      phone: input.phone ?? null,
    });
    if (applicant.error !== null) return fail(applicant.error);

    const { data: application, error: aErr } = await supabase
      .from("applications")
      .insert({
        property_id: (bed as Bed).property_id,
        bed_id: (bed as Bed).id,
        applicant_id: applicant.data.id,
        full_name: input.fullName,
        email: input.email.toLowerCase(),
        phone: input.phone ?? null,
        message: input.message ?? null,
        desired_move_in: input.desiredMoveIn || null,
        status: "pending",
      })
      .select("id")
      .single();
    if (aErr) throw aErr;

    return ok({ applicationId: application.id, tenantId: applicant.data.id });
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
    const applications = (apps ?? []) as Application[];
    if (applications.length === 0) return ok([]);

    // Enrich with property name + bed/room labels via lookup maps.
    const propertyIdsFromApps = [
      ...new Set(applications.map((a) => a.property_id)),
    ];
    const bedIds = [
      ...new Set(applications.map((a) => a.bed_id).filter(Boolean)),
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

    const roomIds = [
      ...new Set(
        (beds ?? [])
          .map((b) => (b as { room_id?: string }).room_id)
          .filter(Boolean)
      ),
    ] as string[];
    const { data: rooms } = roomIds.length
      ? await supabase.from("rooms").select("id, name").in("id", roomIds)
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
          room_name: bed?.room_id ? roomName.get(bed.room_id) ?? null : null,
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
    if (application.status !== "pending")
      return fail("This application has already been decided.");
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
        start_date: new Date().toISOString().slice(0, 10),
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
      .eq("status", "pending");
    if (rejErr) throw rejErr;

    return ok({ reservationId: reservation.id });
  } catch (error) {
    return fail(error);
  }
}

/** Reject a pending application. */
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
    if (app.status !== "pending")
      return fail("This application has already been decided.");

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
