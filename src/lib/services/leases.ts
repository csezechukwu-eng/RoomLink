import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { ok, fail, type Result } from "@/lib/result";
import {
  isDocuSignConfigured,
  sendEnvelopeFromTemplate,
  createRecipientView,
  type LeaseTabs,
} from "@/lib/services/docusign";
import type { Application, Bed, Lease, LeaseStatus, Property } from "@/lib/types";

export { isDocuSignConfigured };

/** clientUserId used for embedded signing — stable per (lease, role). */
export function signerClientId(leaseId: string, role: "tenant" | "landlord") {
  return `${leaseId}:${role}`;
}

function fmtNum(n: number | null | undefined): string {
  if (n == null) return "";
  return Number(n).toFixed(2);
}

function fmtMoney(n: number | null | undefined): string {
  if (n == null) return "";
  return `$${Number(n).toFixed(2)}`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[2]}/${m[3]}/${m[1]}` : iso;
}

/** Existing lease for an application (most recent), or null. */
export async function getLeaseForApplication(
  applicationId: string
): Promise<Result<Lease | null>> {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("leases")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    return ok(((data ?? [])[0] as Lease) ?? null);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Create a lease from the reusable DocuSign template for an application,
 * prefilling property/room/bed/rent, and send it to tenant + landlord.
 */
export async function createLeaseForApplication(input: {
  applicationId: string;
  landlord: { name: string; email: string };
}): Promise<Result<Lease>> {
  try {
    if (!isDocuSignConfigured())
      return fail("DocuSign isn't connected yet. Add the DocuSign env vars first.");
    const templateId = process.env.DOCUSIGN_TEMPLATE_ID;
    if (!templateId)
      return fail("Set DOCUSIGN_TEMPLATE_ID to the lease template you created.");

    const supabase = getServiceClient();

    const { data: appRow, error: aErr } = await supabase
      .from("applications")
      .select("*")
      .eq("id", input.applicationId)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!appRow) return fail("Application not found.");
    const application = appRow as Application;
    if (!application.email) return fail("Application has no tenant email.");

    const { data: property } = await supabase
      .from("properties")
      .select("*")
      .eq("id", application.property_id)
      .maybeSingle();
    const prop = (property as Property) ?? null;

    let bed: Bed | null = null;
    let roomName: string | null = null;
    if (application.bed_id) {
      const { data: bedRow } = await supabase
        .from("beds")
        .select("*")
        .eq("id", application.bed_id)
        .maybeSingle();
      bed = (bedRow as Bed) ?? null;
    }
    const roomId = bed?.room_id ?? application.desired_room_id ?? null;
    if (roomId) {
      const { data: room } = await supabase
        .from("rooms")
        .select("name")
        .eq("id", roomId)
        .maybeSingle();
      roomName = room?.name ?? null;
    }

    const tenantName =
      application.full_name ||
      `${application.first_name ?? ""} ${application.last_name ?? ""}`.trim() ||
      "Tenant";
    const address = prop
      ? [prop.address, prop.city, prop.state, prop.zip].filter(Boolean).join(", ")
      : "";

    // Create the lease record first so we have an id for clientUserId.
    const { data: leaseRow, error: lErr } = await supabase
      .from("leases")
      .insert({
        property_id: application.property_id,
        room_id: roomId,
        bed_id: application.bed_id,
        tenant_id: application.applicant_id,
        application_id: application.id,
        source: "template",
        status: "draft",
        tenant_name: tenantName,
        tenant_email: application.email,
        monthly_rent: bed?.monthly_rent ?? null,
        deposit_amount: bed?.deposit_amount ?? null,
        lease_start: application.desired_move_in,
      })
      .select("*")
      .single();
    if (lErr) throw lErr;
    const lease = leaseRow as Lease;

    // Keys MUST match the template field Data Labels exactly. These match the
    // labels in the user's Short-Term Bed Rental Agreement template. The "$" is
    // already literal in the template, so rent/deposit are sent as plain numbers.
    const tabs: LeaseTabs = {
      "Property Name": prop?.name ?? "",
      "Property Address": address,
      Room: roomName ?? "",
      Bed: bed?.label ?? "",
      "Effective Date": fmtDate(application.desired_move_in),
      "Monthly / 30-Day Rent": fmtNum(bed?.monthly_rent),
      "Security Deposit": fmtNum(bed?.deposit_amount),
      LandlordLegalName: input.landlord.name,
      TenantLegalName: tenantName,
      "Tenant Email": application.email,
      "Governing Law": prop?.state ?? "",
    };

    const sent = await sendEnvelopeFromTemplate({
      templateId,
      tenant: {
        name: tenantName,
        email: application.email,
        clientUserId: signerClientId(lease.id, "tenant"),
      },
      landlord: {
        name: input.landlord.name,
        email: input.landlord.email,
        clientUserId: signerClientId(lease.id, "landlord"),
      },
      tabs,
    });
    if (sent.error !== null) {
      // Roll back the draft so the landlord can retry cleanly.
      await supabase.from("leases").delete().eq("id", lease.id);
      return fail(sent.error);
    }

    const { data: updated, error: uErr } = await supabase
      .from("leases")
      .update({
        envelope_id: sent.data.envelopeId,
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", lease.id)
      .select("*")
      .single();
    if (uErr) throw uErr;

    // Reflect on the application's agreement status.
    await supabase
      .from("applications")
      .update({ agreement_status: "sent" })
      .eq("id", application.id);

    return ok(updated as Lease);
  } catch (error) {
    return fail(error);
  }
}

export interface CustomLeaseFields {
  propertyName?: string | null;
  propertyAddress?: string | null;
  roomName?: string | null;
  bedLabel?: string | null;
  monthlyRent?: number | null;
  depositAmount?: number | null;
  leaseStart?: string | null;
  leaseEnd?: string | null;
  tenantName?: string | null;
}

/**
 * Create a lease with custom editable fields from landlord.
 * Uses the application for tenant info but allows override of lease details.
 */
export async function createLeaseWithCustomFields(input: {
  applicationId: string;
  landlord: { name: string; email: string };
  fields: CustomLeaseFields;
}): Promise<Result<Lease>> {
  try {
    if (!isDocuSignConfigured())
      return fail("DocuSign isn't connected yet. Add the DocuSign env vars first.");
    const templateId = process.env.DOCUSIGN_TEMPLATE_ID;
    if (!templateId)
      return fail("Set DOCUSIGN_TEMPLATE_ID to the lease template you created.");

    const supabase = getServiceClient();

    const { data: appRow, error: aErr } = await supabase
      .from("applications")
      .select("*")
      .eq("id", input.applicationId)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!appRow) return fail("Application not found.");
    const application = appRow as Application;
    if (!application.email) return fail("Application has no tenant email.");

    // Get default values from application/property if not overridden
    const { data: property } = await supabase
      .from("properties")
      .select("*")
      .eq("id", application.property_id)
      .maybeSingle();
    const prop = (property as Property) ?? null;

    let bed: Bed | null = null;
    let defaultRoomName: string | null = null;
    if (application.bed_id) {
      const { data: bedRow } = await supabase
        .from("beds")
        .select("*")
        .eq("id", application.bed_id)
        .maybeSingle();
      bed = (bedRow as Bed) ?? null;
    }
    const roomId = bed?.room_id ?? application.desired_room_id ?? null;
    if (roomId) {
      const { data: room } = await supabase
        .from("rooms")
        .select("name")
        .eq("id", roomId)
        .maybeSingle();
      defaultRoomName = room?.name ?? null;
    }

    const defaultTenantName =
      application.full_name ||
      `${application.first_name ?? ""} ${application.last_name ?? ""}`.trim() ||
      "Tenant";
    const defaultAddress = prop
      ? [prop.address, prop.city, prop.state, prop.zip].filter(Boolean).join(", ")
      : "";

    // Use custom fields or fall back to defaults
    const tenantName = input.fields.tenantName || defaultTenantName;
    const propertyName = input.fields.propertyName || prop?.name || "";
    const propertyAddress = input.fields.propertyAddress || defaultAddress;
    const roomName = input.fields.roomName || defaultRoomName || "";
    const bedLabel = input.fields.bedLabel || bed?.label || "";
    const monthlyRent = input.fields.monthlyRent ?? bed?.monthly_rent ?? null;
    const depositAmount = input.fields.depositAmount ?? bed?.deposit_amount ?? null;
    const leaseStart = input.fields.leaseStart || application.desired_move_in || "";
    const leaseEnd = input.fields.leaseEnd || null;

    // Create the lease record
    const { data: leaseRow, error: lErr } = await supabase
      .from("leases")
      .insert({
        property_id: application.property_id,
        room_id: roomId,
        bed_id: application.bed_id,
        tenant_id: application.applicant_id,
        application_id: application.id,
        source: "template",
        status: "draft",
        tenant_name: tenantName,
        tenant_email: application.email,
        monthly_rent: monthlyRent,
        deposit_amount: depositAmount,
        lease_start: leaseStart || null,
        lease_end: leaseEnd,
      })
      .select("*")
      .single();
    if (lErr) throw lErr;
    const lease = leaseRow as Lease;

    const tabs: LeaseTabs = {
      PropertyName: propertyName,
      PropertyAddress: propertyAddress,
      RoomName: roomName,
      BedLabel: bedLabel,
      MonthlyRent: fmtMoney(monthlyRent),
      DepositAmount: fmtMoney(depositAmount),
      LeaseStart: leaseStart,
      LeaseEnd: leaseEnd ?? "",
      TenantName: tenantName,
    };

    const sent = await sendEnvelopeFromTemplate({
      templateId,
      tenant: {
        name: tenantName,
        email: application.email,
        clientUserId: signerClientId(lease.id, "tenant"),
      },
      landlord: {
        name: input.landlord.name,
        email: input.landlord.email,
        clientUserId: signerClientId(lease.id, "landlord"),
      },
      tabs,
    });
    if (sent.error !== null) {
      await supabase.from("leases").delete().eq("id", lease.id);
      return fail(sent.error);
    }

    const { data: updated, error: uErr } = await supabase
      .from("leases")
      .update({
        envelope_id: sent.data.envelopeId,
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", lease.id)
      .select("*")
      .single();
    if (uErr) throw uErr;

    await supabase
      .from("applications")
      .update({ agreement_status: "sent" })
      .eq("id", application.id);

    return ok(updated as Lease);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Create a lease directly without an application.
 * For landlords who want to send a lease to a tenant without the application flow.
 * Uses in-app signing instead of DocuSign.
 */
export async function createDirectLease(input: {
  propertyId: string;
  landlordId: string;
  landlord: { name: string; email: string };
  tenant: { name: string; email: string };
  fields: CustomLeaseFields;
}): Promise<Result<Lease>> {
  try {
    const supabase = getServiceClient();

    // Get landlord's stored signature
    const { data: userData } = await supabase
      .from("users")
      .select("signature_data")
      .eq("id", input.landlordId)
      .maybeSingle();

    if (!userData?.signature_data) {
      return fail("Please set up your signature in Settings first.");
    }

    // Get property info
    const { data: property } = await supabase
      .from("properties")
      .select("*")
      .eq("id", input.propertyId)
      .maybeSingle();
    const prop = (property as Property) ?? null;

    const defaultAddress = prop
      ? [prop.address, prop.city, prop.state, prop.zip].filter(Boolean).join(", ")
      : "";

    // Use custom fields or fall back to defaults
    const tenantName = input.fields.tenantName || input.tenant.name;
    const monthlyRent = input.fields.monthlyRent ?? null;
    const depositAmount = input.fields.depositAmount ?? null;
    const leaseStart = input.fields.leaseStart || "";
    const leaseEnd = input.fields.leaseEnd || null;

    const now = new Date().toISOString();

    // Create the lease record with landlord signature already applied
    const { data: leaseRow, error: lErr } = await supabase
      .from("leases")
      .insert({
        property_id: input.propertyId,
        room_id: null,
        bed_id: null,
        tenant_id: null,
        application_id: null,
        source: "template",
        provider: "inapp",
        status: "sent",
        tenant_name: tenantName,
        tenant_email: input.tenant.email,
        monthly_rent: monthlyRent,
        deposit_amount: depositAmount,
        lease_start: leaseStart || null,
        lease_end: leaseEnd,
        landlord_signature_data: userData.signature_data,
        landlord_signed_at: now,
        sent_at: now,
      })
      .select("*")
      .single();
    if (lErr) throw lErr;

    return ok(leaseRow as Lease);
  } catch (error) {
    return fail(error);
  }
}

/** Embedded signing URL for a lease recipient. */
export async function getLeaseSigningUrl(input: {
  leaseId: string;
  role: "tenant" | "landlord";
  returnUrl: string;
  signer: { name: string; email: string };
}): Promise<Result<{ url: string }>> {
  try {
    const supabase = getServiceClient();
    const { data: lease, error } = await supabase
      .from("leases")
      .select("*")
      .eq("id", input.leaseId)
      .maybeSingle();
    if (error) throw error;
    if (!lease || !(lease as Lease).envelope_id)
      return fail("This lease has no envelope to sign yet.");

    return createRecipientView({
      envelopeId: (lease as Lease).envelope_id!,
      returnUrl: input.returnUrl,
      signer: {
        name: input.signer.name,
        email: input.signer.email,
        clientUserId: signerClientId(input.leaseId, input.role),
      },
    });
  } catch (error) {
    return fail(error);
  }
}

const ENVELOPE_TO_LEASE: Record<string, LeaseStatus> = {
  created: "draft",
  sent: "sent",
  delivered: "delivered",
  completed: "completed",
  declined: "declined",
  voided: "voided",
};

/** Apply a DocuSign envelope status (e.g. from a Connect webhook). */
export async function applyEnvelopeStatus(
  envelopeId: string,
  envelopeStatus: string
): Promise<Result<null>> {
  try {
    const supabase = getServiceClient();
    const status = ENVELOPE_TO_LEASE[envelopeStatus.toLowerCase()] ?? "sent";

    const { data: lease, error } = await supabase
      .from("leases")
      .select("id, application_id")
      .eq("envelope_id", envelopeId)
      .maybeSingle();
    if (error) throw error;
    if (!lease) return ok(null); // not ours; ignore

    await supabase
      .from("leases")
      .update({
        status,
        completed_at: status === "completed" ? new Date().toISOString() : null,
      })
      .eq("envelope_id", envelopeId);

    if (lease.application_id) {
      await supabase
        .from("applications")
        .update({
          agreement_status: status === "completed" ? "signed" : "sent",
        })
        .eq("id", lease.application_id);
    }
    return ok(null);
  } catch (error) {
    return fail(error);
  }
}

export interface LeaseWithRefs extends Lease {
  property_name: string | null;
  room_name: string | null;
  bed_label: string | null;
}

/** Get all leases for a tenant. */
export async function getTenantLeases(
  tenantId: string
): Promise<Result<LeaseWithRefs[]>> {
  try {
    const supabase = getServiceClient();
    const { data: leases, error } = await supabase
      .from("leases")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (!leases || leases.length === 0) return ok([]);

    // Enrich with property/room/bed names
    const propertyIds = [...new Set(leases.map((l) => l.property_id))];
    const roomIds = [...new Set(leases.map((l) => l.room_id).filter(Boolean))] as string[];
    const bedIds = [...new Set(leases.map((l) => l.bed_id).filter(Boolean))] as string[];

    const [{ data: props }, { data: rooms }, { data: beds }] = await Promise.all([
      supabase.from("properties").select("id, name").in("id", propertyIds),
      roomIds.length
        ? supabase.from("rooms").select("id, name").in("id", roomIds)
        : Promise.resolve({ data: [] }),
      bedIds.length
        ? supabase.from("beds").select("id, label").in("id", bedIds)
        : Promise.resolve({ data: [] }),
    ]);

    const propName = new Map((props ?? []).map((p) => [p.id, p.name]));
    const roomName = new Map((rooms ?? []).map((r) => [r.id, r.name]));
    const bedLabel = new Map((beds ?? []).map((b) => [b.id, b.label]));

    return ok(
      (leases as Lease[]).map((l) => ({
        ...l,
        property_name: propName.get(l.property_id) ?? null,
        room_name: l.room_id ? roomName.get(l.room_id) ?? null : null,
        bed_label: l.bed_id ? bedLabel.get(l.bed_id) ?? null : null,
      }))
    );
  } catch (error) {
    return fail(error);
  }
}
