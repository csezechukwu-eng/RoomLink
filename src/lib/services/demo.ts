import "server-only";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { getServiceClient } from "@/lib/supabase/server";
import { getCurrentOwnerId } from "@/lib/auth";
import { ok, fail, type Result } from "@/lib/result";
import type {
  LeaseStayType,
  LeaseTemplate,
  Property,
  Room,
  Bed,
  Application,
  PreparedLease,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DemoReadinessCheck {
  id: string;
  category: "dashboard" | "property" | "application" | "lease" | "tenant";
  label: string;
  status: "complete" | "missing" | "needs_setup";
  detail?: string;
  action?: string;
  actionHref?: string;
}

export interface FullDemoReadinessResult {
  checks: DemoReadinessCheck[];
  canRunFullSetup: boolean;
  summary: {
    totalChecks: number;
    completeChecks: number;
    missingChecks: number;
    needsSetupChecks: number;
  };
  // Data snapshots
  demoProperty: Property | null;
  demoRooms: Room[];
  demoBeds: Bed[];
  demoApplications: DemoApplicationInfo[];
  demoPreparedLeases: DemoPreparedLeaseInfo[];
  demoLeaseTemplate: LeaseTemplate | null;
  readyTemplates: LeaseTemplate[];
  allProperties: Property[];
  allBeds: Bed[];
  // Counts
  totalProperties: number;
  totalRooms: number;
  totalBeds: number;
  vacantBeds: number;
  pendingApplications: number;
  demoApplicationCount: number;
  demoPreparedLeaseCount: number;
}

export interface DemoApplicationInfo {
  id: string;
  name: string;
  email: string;
  stayType: string | null;
  status: string;
  bedLabel: string | null;
  roomName: string | null;
  propertyName: string | null;
  hasPreparedLease: boolean;
}

export interface DemoPreparedLeaseInfo {
  id: string;
  leaseReferenceNumber: string;
  applicantName: string | null;
  propertyName: string | null;
  bedLabel: string | null;
  status: string;
  sentAt: string | null;
  signatureCount: number;
}

export interface DemoSeedResult {
  success: boolean;
  steps: DemoSeedStep[];
  summary: {
    propertyId: string | null;
    propertyName: string | null;
    roomsCreated: number;
    bedsCreated: number;
    leaseTemplateId: string | null;
    leaseTemplateName: string | null;
    fieldsCreated: number;
    applicationsCreated: number;
    templateLinked: boolean;
  };
}

export interface DemoSeedStep {
  step: string;
  status: "success" | "skipped" | "error";
  detail: string;
  id?: string;
}

// ---------------------------------------------------------------------------
// Demo Configuration
// ---------------------------------------------------------------------------

const DEMO_PROPERTY_CONFIG = {
  name: "Room Link Demo House",
  address: "123 Demo House Lane",
  city: "Charlotte",
  state: "NC",
  zip: "28202",
  property_type: "room_rental" as const,
  description:
    "Demo shared housing property used to test Room Link's dashboard, property, room, bed, application, and lease workflows.",
  house_rules: "Demo house rules for testing. No smoking. Quiet hours 10pm-8am.",
};

const DEMO_ROOMS_CONFIG = [
  {
    name: "Room A",
    description: "Private room with single bed",
    max_occupancy: 1,
    beds: [
      {
        label: "Bed A1",
        bunk_type: "single" as const,
        monthly_rent: 850,
        deposit_amount: 400,
        status: "vacant" as const,
        description: "Single bed in private room",
      },
    ],
  },
  {
    name: "Room B",
    description: "Shared room with two beds",
    max_occupancy: 2,
    beds: [
      {
        label: "Bed B1",
        bunk_type: "single" as const,
        monthly_rent: 650,
        deposit_amount: 300,
        status: "vacant" as const,
        description: "Single bed in shared room",
      },
      {
        label: "Bed B2",
        bunk_type: "single" as const,
        monthly_rent: 650,
        deposit_amount: 300,
        status: "reserved" as const,
        description: "Single bed in shared room - for testing reserved status",
      },
    ],
  },
];

export interface DemoApplication {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  stayType: LeaseStayType;
  moveInOffset: number; // days from now
  monthlyIncome: number;
  employmentStatus: string;
  commuterStatus: string;
}

const DEMO_APPLICANTS: DemoApplication[] = [
  {
    name: "Jane Demo Tenant",
    firstName: "Jane",
    lastName: "Demo Tenant",
    email: "jane.demo@example.com",
    phone: "555-0101",
    stayType: "month_to_month",
    moveInOffset: 30,
    monthlyIncome: 4200,
    employmentStatus: "employed_full_time",
    commuterStatus: "local_resident",
  },
  {
    name: "Marcus Demo Tenant",
    firstName: "Marcus",
    lastName: "Demo Tenant",
    email: "marcus.demo@example.com",
    phone: "555-0102",
    stayType: "crash_pad",
    moveInOffset: 7,
    monthlyIncome: 3800,
    employmentStatus: "employed_full_time",
    commuterStatus: "airline_crew",
  },
  {
    name: "Ava Demo Tenant",
    firstName: "Ava",
    lastName: "Demo Tenant",
    email: "ava.demo@example.com",
    phone: "555-0103",
    stayType: "midterm",
    moveInOffset: 14,
    monthlyIncome: 5200,
    employmentStatus: "employed_full_time",
    commuterStatus: "travel_nurse",
  },
];

// Demo lease template fields with positions (percentages of page)
const DEMO_TEMPLATE_FIELDS = [
  {
    field_key: "NAME-001",
    field_type: "tenant_full_name" as const,
    label: "Tenant Full Name",
    required: true,
    assigned_to: "tenant" as const,
    page_number: 1,
    x: 18,
    y: 68,
    width: 28,
    height: 4,
  },
  {
    field_key: "SIG-001",
    field_type: "tenant_signature" as const,
    label: "Tenant Signature",
    required: true,
    assigned_to: "tenant" as const,
    page_number: 1,
    x: 18,
    y: 78,
    width: 30,
    height: 5,
  },
  {
    field_key: "INIT-001",
    field_type: "tenant_initials" as const,
    label: "Tenant Initials",
    required: false,
    assigned_to: "tenant" as const,
    page_number: 1,
    x: 60,
    y: 78,
    width: 14,
    height: 4,
  },
  {
    field_key: "DATE-001",
    field_type: "date_signed" as const,
    label: "Date Signed",
    required: true,
    assigned_to: "tenant" as const,
    page_number: 1,
    x: 18,
    y: 86,
    width: 20,
    height: 4,
  },
];

const BUCKET = "lease-documents";

// ---------------------------------------------------------------------------
// Generate Demo PDF
// ---------------------------------------------------------------------------

async function generateDemoLeasePdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Title
  page.drawText("ROOM LINK DEMO LEASE", {
    x: 50,
    y: height - 60,
    size: 24,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.6),
  });

  // Subtitle
  page.drawText("TEST DOCUMENT ONLY — NOT A LEGAL LEASE", {
    x: 50,
    y: height - 85,
    size: 12,
    font: helveticaBold,
    color: rgb(0.8, 0.2, 0.2),
  });

  // Demo notice box
  page.drawRectangle({
    x: 40,
    y: height - 150,
    width: width - 80,
    height: 50,
    borderColor: rgb(0.9, 0.6, 0.2),
    borderWidth: 2,
    color: rgb(1, 0.97, 0.9),
  });

  page.drawText("This is a demo lease for testing Room Link features.", {
    x: 50,
    y: height - 120,
    size: 11,
    font: helvetica,
    color: rgb(0.4, 0.3, 0.1),
  });

  page.drawText("Do not use this document for real tenancy agreements.", {
    x: 50,
    y: height - 135,
    size: 11,
    font: helvetica,
    color: rgb(0.4, 0.3, 0.1),
  });

  // Lease content
  const content = [
    "MONTH-TO-MONTH ROOM RENTAL AGREEMENT",
    "",
    "This Agreement is entered into between:",
    "",
    "LANDLORD: Room Link Demo Landlord",
    "PROPERTY: Room Link Demo House",
    "ADDRESS: 123 Demo House Lane, Charlotte, NC 28202",
    "",
    "And the following TENANT:",
    "",
    "1. TERM: This lease is month-to-month, beginning on the move-in date.",
    "",
    "2. RENT: Monthly rent as specified in the application approval.",
    "",
    "3. DEPOSIT: Security deposit as specified in the bed listing.",
    "",
    "4. HOUSE RULES: Tenant agrees to follow all posted house rules.",
    "",
    "5. TERMINATION: Either party may terminate with 30 days written notice.",
    "",
    "",
    "SIGNATURE SECTION",
    "══════════════════════════════════════════════════════════════",
    "",
    "Tenant Full Name: ___________________________________________",
    "",
    "",
    "Tenant Signature: ________________________    Initials: ______",
    "",
    "",
    "Date Signed: ____________________",
  ];

  let yPos = height - 180;
  for (const line of content) {
    if (line.startsWith("MONTH-TO-MONTH") || line.startsWith("SIGNATURE SECTION")) {
      page.drawText(line, {
        x: 50,
        y: yPos,
        size: 14,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1),
      });
    } else if (line.startsWith("══")) {
      page.drawText(line, {
        x: 50,
        y: yPos,
        size: 10,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
      });
    } else {
      page.drawText(line, {
        x: 50,
        y: yPos,
        size: 11,
        font: helvetica,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
    yPos -= 18;
  }

  // Footer
  page.drawText("Generated by Room Link Demo System", {
    x: 50,
    y: 40,
    size: 9,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText(`Demo Version - ${new Date().toISOString().slice(0, 10)}`, {
    x: width - 180,
    y: 40,
    size: 9,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  return pdfDoc.save();
}

// ---------------------------------------------------------------------------
// Full Demo Readiness Check
// ---------------------------------------------------------------------------

export async function checkFullDemoReadiness(): Promise<Result<FullDemoReadinessResult>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    const checks: DemoReadinessCheck[] = [];

    // -------------------------------------------------------------------------
    // Dashboard Checks
    // -------------------------------------------------------------------------

    checks.push({
      id: "landlord_logged_in",
      category: "dashboard",
      label: "Landlord is logged in",
      status: "complete",
      detail: "Authenticated as landlord",
    });

    // -------------------------------------------------------------------------
    // Property Checks
    // -------------------------------------------------------------------------

    const { data: allProperties, error: pErr } = await supabase
      .from("properties")
      .select("*")
      .eq("owner_id", ownerId);
    if (pErr) throw pErr;
    const properties = (allProperties ?? []) as Property[];

    const demoProperty = properties.find((p) => p.is_demo === true) || null;

    checks.push({
      id: "demo_property_exists",
      category: "property",
      label: "Demo property exists",
      status: demoProperty ? "complete" : "missing",
      detail: demoProperty
        ? `"${demoProperty.name}"`
        : "No demo property found",
      action: demoProperty ? undefined : "Load Full Demo Data",
    });

    const propertyIds = properties.map((p) => p.id);

    let allRooms: Room[] = [];
    if (propertyIds.length > 0) {
      const { data: roomData } = await supabase
        .from("rooms")
        .select("*")
        .in("property_id", propertyIds);
      allRooms = (roomData ?? []) as Room[];
    }

    const demoRooms = allRooms.filter((r) => r.is_demo === true);
    checks.push({
      id: "demo_rooms_exist",
      category: "property",
      label: "Demo rooms exist",
      status: demoRooms.length > 0 ? "complete" : demoProperty ? "needs_setup" : "missing",
      detail:
        demoRooms.length > 0
          ? `${demoRooms.length} demo room(s)`
          : "No demo rooms found",
    });

    let allBeds: Bed[] = [];
    if (propertyIds.length > 0) {
      const { data: bedData } = await supabase
        .from("beds")
        .select("*")
        .in("property_id", propertyIds);
      allBeds = (bedData ?? []) as Bed[];
    }

    const demoBeds = allBeds.filter((b) => b.is_demo === true);
    const demoVacantBeds = demoBeds.filter((b) => b.status === "vacant");

    checks.push({
      id: "demo_beds_exist",
      category: "property",
      label: "Demo beds exist",
      status: demoBeds.length > 0 ? "complete" : demoRooms.length > 0 ? "needs_setup" : "missing",
      detail:
        demoBeds.length > 0
          ? `${demoBeds.length} demo bed(s), ${demoVacantBeds.length} vacant`
          : "No demo beds found",
    });

    // -------------------------------------------------------------------------
    // Application Checks
    // -------------------------------------------------------------------------

    let demoApplications: Application[] = [];
    if (propertyIds.length > 0) {
      const { data: appData } = await supabase
        .from("applications")
        .select("*")
        .in("property_id", propertyIds)
        .eq("is_demo", true)
        .order("created_at", { ascending: false });
      demoApplications = (appData ?? []) as Application[];
    }

    const appBedIds = demoApplications
      .map((a) => a.bed_id)
      .filter(Boolean) as string[];
    const appRoomIds = demoApplications
      .map((a) => a.desired_room_id)
      .filter(Boolean) as string[];

    let bedLabelMap = new Map<string, string>();
    let roomNameMap = new Map<string, string>();
    if (appBedIds.length > 0) {
      const { data: beds } = await supabase
        .from("beds")
        .select("id, label")
        .in("id", appBedIds);
      bedLabelMap = new Map((beds ?? []).map((b) => [b.id, b.label]));
    }
    if (appRoomIds.length > 0) {
      const { data: rooms } = await supabase
        .from("rooms")
        .select("id, name")
        .in("id", appRoomIds);
      roomNameMap = new Map((rooms ?? []).map((r) => [r.id, r.name]));
    }
    const propertyNameMap = new Map(properties.map((p) => [p.id, p.name]));

    const demoAppIds = demoApplications.map((a) => a.id);
    let preparedLeasesForApps = new Set<string>();
    if (demoAppIds.length > 0) {
      const { data: plData } = await supabase
        .from("prepared_leases")
        .select("application_id")
        .in("application_id", demoAppIds);
      preparedLeasesForApps = new Set(
        (plData ?? []).map((pl) => pl.application_id)
      );
    }

    const demoApplicationInfos: DemoApplicationInfo[] = demoApplications.map(
      (a) => ({
        id: a.id,
        name: `${a.first_name} ${a.last_name || ""}`.trim(),
        email: a.email,
        stayType: a.stay_type,
        status: a.status,
        bedLabel: a.bed_id ? bedLabelMap.get(a.bed_id) || null : null,
        roomName: a.desired_room_id
          ? roomNameMap.get(a.desired_room_id) || null
          : null,
        propertyName: propertyNameMap.get(a.property_id) || null,
        hasPreparedLease: preparedLeasesForApps.has(a.id),
      })
    );

    checks.push({
      id: "demo_application_exists",
      category: "application",
      label: "Demo application exists",
      status: demoApplications.length > 0 ? "complete" : "missing",
      detail:
        demoApplications.length > 0
          ? `${demoApplications.length} demo application(s)`
          : "No demo applications found",
    });

    const appWithBed = demoApplications.find((a) => a.bed_id);
    checks.push({
      id: "demo_app_has_bed",
      category: "application",
      label: "Demo application tied to bed",
      status: appWithBed
        ? "complete"
        : demoApplications.length > 0
        ? "needs_setup"
        : "missing",
      detail: appWithBed
        ? `Linked to ${bedLabelMap.get(appWithBed.bed_id!) || "bed"}`
        : "No demo application linked to bed",
    });

    // -------------------------------------------------------------------------
    // Lease Checks
    // -------------------------------------------------------------------------

    const { data: templates } = await supabase
      .from("lease_templates")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
    const allTemplates = (templates ?? []) as LeaseTemplate[];

    // Find demo lease template
    const demoLeaseTemplate = allTemplates.find(
      (t) => t.title === "Room Link Demo Month-to-Month Lease"
    ) || null;

    checks.push({
      id: "demo_lease_template_exists",
      category: "lease",
      label: "Demo lease template exists",
      status: demoLeaseTemplate ? "complete" : "missing",
      detail: demoLeaseTemplate
        ? `"${demoLeaseTemplate.title}"`
        : "No demo lease template found",
    });

    const readyTemplates = allTemplates.filter((t) => t.status === "ready");
    checks.push({
      id: "lease_template_ready",
      category: "lease",
      label: "Lease template is Ready",
      status: readyTemplates.length > 0 ? "complete" : allTemplates.length > 0 ? "needs_setup" : "missing",
      detail:
        readyTemplates.length > 0
          ? `${readyTemplates.length} ready template(s)`
          : "No ready templates",
    });

    // Check signature fields
    let hasSignatureField = false;
    if (demoLeaseTemplate) {
      const { count } = await supabase
        .from("lease_template_fields")
        .select("id", { count: "exact", head: true })
        .eq("lease_template_id", demoLeaseTemplate.id)
        .eq("field_type", "tenant_signature")
        .eq("required", true);
      hasSignatureField = (count ?? 0) > 0;
    }
    checks.push({
      id: "signature_field_exists",
      category: "lease",
      label: "Required tenant signature field exists",
      status: hasSignatureField ? "complete" : demoLeaseTemplate ? "needs_setup" : "missing",
      detail: hasSignatureField
        ? "Signature field configured"
        : "No required tenant signature field",
    });

    // Template linked to stay type
    const linkedTemplate = readyTemplates.find((t) => t.stay_type === "month_to_month");
    checks.push({
      id: "template_linked_stay_type",
      category: "lease",
      label: "Template linked to month_to_month",
      status: linkedTemplate ? "complete" : readyTemplates.length > 0 ? "needs_setup" : "missing",
      detail: linkedTemplate
        ? `"${linkedTemplate.title}" linked`
        : "No template linked to month_to_month",
    });

    // -------------------------------------------------------------------------
    // Prepared Leases / Sent Leases
    // -------------------------------------------------------------------------

    const { data: preparedLeases } = await supabase
      .from("prepared_leases")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("is_demo", true)
      .order("created_at", { ascending: false });
    const demoPreparedLeases = (preparedLeases ?? []) as PreparedLease[];

    const plIds = demoPreparedLeases.map((pl) => pl.id);
    let signatureCountMap = new Map<string, number>();
    if (plIds.length > 0) {
      const { data: sigFields } = await supabase
        .from("prepared_lease_fields")
        .select("prepared_lease_id")
        .in("prepared_lease_id", plIds)
        .not("signature_reference_number", "is", null);
      const counts = new Map<string, number>();
      (sigFields ?? []).forEach((f) => {
        counts.set(f.prepared_lease_id, (counts.get(f.prepared_lease_id) || 0) + 1);
      });
      signatureCountMap = counts;
    }

    const demoPreparedLeaseInfos: DemoPreparedLeaseInfo[] = demoPreparedLeases.map(
      (pl) => ({
        id: pl.id,
        leaseReferenceNumber: pl.lease_reference_number,
        applicantName: pl.applicant_snapshot?.name || null,
        propertyName: pl.property_snapshot?.name || null,
        bedLabel: pl.bed_snapshot?.label || null,
        status: pl.status,
        sentAt: pl.sent_at,
        signatureCount: signatureCountMap.get(pl.id) || 0,
      })
    );

    checks.push({
      id: "demo_lease_sent",
      category: "lease",
      label: "Demo lease sent",
      status: demoPreparedLeases.length > 0 ? "complete" : "missing",
      detail:
        demoPreparedLeases.length > 0
          ? `${demoPreparedLeases.length} demo lease(s) sent`
          : "Approve demo application to send lease",
    });

    // -------------------------------------------------------------------------
    // Tenant Checks
    // -------------------------------------------------------------------------

    checks.push({
      id: "tenant_can_see_status",
      category: "tenant",
      label: "Tenant preview available",
      status: demoPreparedLeases.length > 0 ? "complete" : "missing",
      detail: demoPreparedLeases.length > 0
        ? "Tenant preview ready"
        : "Send a demo lease first",
    });

    // -------------------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------------------

    const completeChecks = checks.filter((c) => c.status === "complete").length;
    const missingChecks = checks.filter((c) => c.status === "missing").length;
    const needsSetupChecks = checks.filter((c) => c.status === "needs_setup").length;

    // Can always run full setup - it creates everything from scratch
    const canRunFullSetup = true;

    const vacantBeds = allBeds.filter((b) => b.status === "vacant").length;
    const pendingApplications = demoApplications.filter(
      (a) => a.status === "submitted" || a.status === "under_review"
    ).length;

    return ok({
      checks,
      canRunFullSetup,
      summary: {
        totalChecks: checks.length,
        completeChecks,
        missingChecks,
        needsSetupChecks,
      },
      demoProperty,
      demoRooms,
      demoBeds,
      demoApplications: demoApplicationInfos,
      demoPreparedLeases: demoPreparedLeaseInfos,
      demoLeaseTemplate,
      readyTemplates,
      allProperties: properties,
      allBeds,
      totalProperties: properties.length,
      totalRooms: allRooms.length,
      totalBeds: allBeds.length,
      vacantBeds,
      pendingApplications,
      demoApplicationCount: demoApplications.length,
      demoPreparedLeaseCount: demoPreparedLeases.length,
    });
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// Seed Full Demo Data (One-Click)
// ---------------------------------------------------------------------------

export async function seedFullDemoData(): Promise<Result<DemoSeedResult>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();
    const steps: DemoSeedStep[] = [];

    const summary = {
      propertyId: null as string | null,
      propertyName: null as string | null,
      roomsCreated: 0,
      bedsCreated: 0,
      leaseTemplateId: null as string | null,
      leaseTemplateName: null as string | null,
      fieldsCreated: 0,
      applicationsCreated: 0,
      templateLinked: false,
    };

    // -------------------------------------------------------------------------
    // Step 1: Create or reuse demo property
    // -------------------------------------------------------------------------

    const { data: existingDemoProp } = await supabase
      .from("properties")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("is_demo", true)
      .maybeSingle();

    let propertyId: string;
    let property: Property;

    if (existingDemoProp) {
      propertyId = existingDemoProp.id;
      property = existingDemoProp as Property;
      steps.push({
        step: "Demo Property",
        status: "skipped",
        detail: `Reusing "${existingDemoProp.name}"`,
        id: propertyId,
      });
      summary.propertyId = propertyId;
      summary.propertyName = existingDemoProp.name;
    } else {
      const { data: newProp, error: pErr } = await supabase
        .from("properties")
        .insert({
          owner_id: ownerId,
          ...DEMO_PROPERTY_CONFIG,
          is_hidden: false,
          is_demo: true,
        })
        .select()
        .single();

      if (pErr) {
        steps.push({
          step: "Demo Property",
          status: "error",
          detail: pErr.message,
        });
        return ok({ success: false, steps, summary });
      }

      propertyId = newProp.id;
      property = newProp as Property;
      steps.push({
        step: "Demo Property",
        status: "success",
        detail: `Created "${newProp.name}"`,
        id: propertyId,
      });
      summary.propertyId = propertyId;
      summary.propertyName = newProp.name;
    }

    // -------------------------------------------------------------------------
    // Step 2: Create or reuse demo rooms and beds
    // -------------------------------------------------------------------------

    const { data: existingRooms } = await supabase
      .from("rooms")
      .select("*")
      .eq("property_id", propertyId)
      .eq("is_demo", true);

    const roomMap = new Map<string, Room>();
    const existingRoomNames = new Set((existingRooms ?? []).map((r) => r.name));

    for (const roomConfig of DEMO_ROOMS_CONFIG) {
      if (existingRoomNames.has(roomConfig.name)) {
        const existing = (existingRooms ?? []).find((r) => r.name === roomConfig.name);
        if (existing) {
          roomMap.set(roomConfig.name, existing as Room);
        }
        continue;
      }

      const { data: room, error: rErr } = await supabase
        .from("rooms")
        .insert({
          property_id: propertyId,
          name: roomConfig.name,
          description: roomConfig.description,
          max_occupancy: roomConfig.max_occupancy,
          is_demo: true,
        })
        .select()
        .single();

      if (rErr) {
        steps.push({
          step: `Room ${roomConfig.name}`,
          status: "error",
          detail: rErr.message,
        });
        continue;
      }

      roomMap.set(roomConfig.name, room as Room);
      summary.roomsCreated++;
    }

    if (summary.roomsCreated > 0 || (existingRooms?.length ?? 0) > 0) {
      const totalRooms = roomMap.size;
      steps.push({
        step: "Demo Rooms",
        status: summary.roomsCreated > 0 ? "success" : "skipped",
        detail: summary.roomsCreated > 0
          ? `Created ${summary.roomsCreated} room(s)`
          : `Reusing ${totalRooms} existing room(s)`,
      });
    }

    // Create beds
    const { data: existingBeds } = await supabase
      .from("beds")
      .select("*")
      .eq("property_id", propertyId)
      .eq("is_demo", true);

    const existingBedLabels = new Set((existingBeds ?? []).map((b) => b.label));
    const bedMap = new Map<string, Bed>();

    for (const roomConfig of DEMO_ROOMS_CONFIG) {
      const room = roomMap.get(roomConfig.name);
      if (!room) continue;

      for (const bedConfig of roomConfig.beds) {
        if (existingBedLabels.has(bedConfig.label)) {
          const existing = (existingBeds ?? []).find((b) => b.label === bedConfig.label);
          if (existing) {
            bedMap.set(bedConfig.label, existing as Bed);
          }
          continue;
        }

        const { data: bed, error: bErr } = await supabase
          .from("beds")
          .insert({
            property_id: propertyId,
            room_id: room.id,
            label: bedConfig.label,
            bunk_type: bedConfig.bunk_type,
            monthly_rent: bedConfig.monthly_rent,
            deposit_amount: bedConfig.deposit_amount,
            status: bedConfig.status,
            description: bedConfig.description,
            is_demo: true,
          })
          .select()
          .single();

        if (bErr) {
          steps.push({
            step: `Bed ${bedConfig.label}`,
            status: "error",
            detail: bErr.message,
          });
          continue;
        }

        bedMap.set(bedConfig.label, bed as Bed);
        summary.bedsCreated++;
      }
    }

    if (summary.bedsCreated > 0 || (existingBeds?.length ?? 0) > 0) {
      const totalBeds = bedMap.size + (existingBeds?.length ?? 0) - summary.bedsCreated;
      steps.push({
        step: "Demo Beds",
        status: summary.bedsCreated > 0 ? "success" : "skipped",
        detail: summary.bedsCreated > 0
          ? `Created ${summary.bedsCreated} bed(s)`
          : `Reusing ${totalBeds} existing bed(s)`,
      });
    }

    // -------------------------------------------------------------------------
    // Step 3: Create or reuse demo lease template with PDF
    // -------------------------------------------------------------------------

    const { data: existingTemplate } = await supabase
      .from("lease_templates")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("title", "Room Link Demo Month-to-Month Lease")
      .maybeSingle();

    let templateId: string;

    if (existingTemplate) {
      templateId = existingTemplate.id;
      steps.push({
        step: "Demo Lease Template",
        status: "skipped",
        detail: `Reusing "${existingTemplate.title}"`,
        id: templateId,
      });
      summary.leaseTemplateId = templateId;
      summary.leaseTemplateName = existingTemplate.title;
    } else {
      // Generate demo PDF
      const pdfBytes = await generateDemoLeasePdf();

      // Upload to Supabase storage
      const stamp = Date.now();
      const rand = Math.random().toString(36).slice(2, 8);
      const fileName = "room-link-demo-lease.pdf";
      const path = `${ownerId}/templates/${stamp}-${rand}-${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, pdfBytes, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadErr) {
        steps.push({
          step: "Demo Lease Template",
          status: "error",
          detail: `Failed to upload PDF: ${uploadErr.message}`,
        });
        return ok({ success: false, steps, summary });
      }

      // Create template record
      const { data: template, error: tErr } = await supabase
        .from("lease_templates")
        .insert({
          owner_id: ownerId,
          title: "Room Link Demo Month-to-Month Lease",
          lease_category: "month_to_month_room_lease",
          stay_type: "month_to_month",
          property_id: null,
          file_path: path,
          file_name: fileName,
          file_type: "application/pdf",
          status: "needs_setup",
          notes: "Demo lease template for testing Room Link features.",
        })
        .select()
        .single();

      if (tErr) {
        // Clean up uploaded file
        await supabase.storage.from(BUCKET).remove([path]);
        steps.push({
          step: "Demo Lease Template",
          status: "error",
          detail: tErr.message,
        });
        return ok({ success: false, steps, summary });
      }

      templateId = template.id;
      steps.push({
        step: "Demo Lease Template",
        status: "success",
        detail: `Created "${template.title}" with PDF`,
        id: templateId,
      });
      summary.leaseTemplateId = templateId;
      summary.leaseTemplateName = template.title;
    }

    // -------------------------------------------------------------------------
    // Step 4: Create or reuse demo lease template fields
    // -------------------------------------------------------------------------

    const { data: existingFields } = await supabase
      .from("lease_template_fields")
      .select("*")
      .eq("lease_template_id", templateId);

    const existingFieldKeys = new Set((existingFields ?? []).map((f) => f.field_key));

    for (let i = 0; i < DEMO_TEMPLATE_FIELDS.length; i++) {
      const fieldConfig = DEMO_TEMPLATE_FIELDS[i];

      if (existingFieldKeys.has(fieldConfig.field_key)) {
        continue;
      }

      const { error: fErr } = await supabase.from("lease_template_fields").insert({
        lease_template_id: templateId,
        owner_id: ownerId,
        field_key: fieldConfig.field_key,
        field_type: fieldConfig.field_type,
        label: fieldConfig.label,
        required: fieldConfig.required,
        assigned_to: fieldConfig.assigned_to,
        page_number: fieldConfig.page_number,
        x: fieldConfig.x,
        y: fieldConfig.y,
        width: fieldConfig.width,
        height: fieldConfig.height,
        sort_order: i,
      });

      if (fErr) {
        steps.push({
          step: `Field ${fieldConfig.label}`,
          status: "error",
          detail: fErr.message,
        });
        continue;
      }

      summary.fieldsCreated++;
    }

    if (summary.fieldsCreated > 0 || (existingFields?.length ?? 0) > 0) {
      const totalFields = summary.fieldsCreated + (existingFields?.length ?? 0);
      steps.push({
        step: "Demo Template Fields",
        status: summary.fieldsCreated > 0 ? "success" : "skipped",
        detail: summary.fieldsCreated > 0
          ? `Created ${summary.fieldsCreated} field(s), ${totalFields} total`
          : `Reusing ${totalFields} existing field(s)`,
      });
    }

    // -------------------------------------------------------------------------
    // Step 5: Update template status to ready
    // -------------------------------------------------------------------------

    // Check if template has required signature field
    const { count: sigCount } = await supabase
      .from("lease_template_fields")
      .select("id", { count: "exact", head: true })
      .eq("lease_template_id", templateId)
      .eq("field_type", "tenant_signature")
      .eq("required", true);

    if ((sigCount ?? 0) > 0) {
      const { error: statusErr } = await supabase
        .from("lease_templates")
        .update({ status: "ready" })
        .eq("id", templateId)
        .eq("owner_id", ownerId);

      if (!statusErr) {
        steps.push({
          step: "Template Status",
          status: "success",
          detail: "Template marked as Ready",
        });
        summary.templateLinked = true;
      }
    }

    // -------------------------------------------------------------------------
    // Step 6: Create demo applications
    // -------------------------------------------------------------------------

    // Get all demo beds
    const { data: allDemoBeds } = await supabase
      .from("beds")
      .select("*, rooms!inner(id, name)")
      .eq("property_id", propertyId)
      .eq("is_demo", true)
      .eq("status", "vacant");

    const vacantDemoBeds = (allDemoBeds ?? []) as Array<Bed & { rooms: { id: string; name: string } }>;

    // Check existing demo applications
    const demoEmails = DEMO_APPLICANTS.map((a) => a.email);
    const { data: existingApps } = await supabase
      .from("applications")
      .select("email")
      .eq("property_id", propertyId)
      .eq("is_demo", true)
      .in("email", demoEmails);
    const existingAppEmails = new Set((existingApps ?? []).map((a) => a.email));

    for (let i = 0; i < DEMO_APPLICANTS.length; i++) {
      const demo = DEMO_APPLICANTS[i];

      if (existingAppEmails.has(demo.email)) {
        continue;
      }

      // Assign bed based on availability
      const bed = vacantDemoBeds[i % vacantDemoBeds.length];
      if (!bed) {
        steps.push({
          step: `Application ${demo.name}`,
          status: "error",
          detail: "No vacant beds available",
        });
        continue;
      }

      const moveInDate = new Date();
      moveInDate.setDate(moveInDate.getDate() + demo.moveInOffset);
      const moveInIso = moveInDate.toISOString().slice(0, 10);

      const { data: app, error: aErr } = await supabase
        .from("applications")
        .insert({
          property_id: propertyId,
          bed_id: bed.id,
          desired_room_id: bed.room_id,
          first_name: demo.firstName,
          last_name: demo.lastName,
          full_name: demo.name,
          email: demo.email,
          phone: demo.phone,
          desired_move_in: moveInIso,
          length_of_stay: "6-12 months",
          reason_for_stay: "Demo application for testing Room Link workflows",
          commuter_status: demo.commuterStatus,
          employment_status: demo.employmentStatus,
          employer_name: "Demo Employer Inc.",
          monthly_income: demo.monthlyIncome,
          emergency_contact_name: "Demo Emergency Contact",
          emergency_contact_phone: "555-9999",
          government_id_status: "uploaded",
          background_check_consent: true,
          stay_type: demo.stayType,
          status: "under_review",
          is_demo: true,
        })
        .select()
        .single();

      if (aErr) {
        steps.push({
          step: `Application ${demo.name}`,
          status: "error",
          detail: aErr.message,
        });
        continue;
      }

      summary.applicationsCreated++;
    }

    if (summary.applicationsCreated > 0 || (existingApps?.length ?? 0) > 0) {
      const total = summary.applicationsCreated + (existingApps?.length ?? 0);
      steps.push({
        step: "Demo Applications",
        status: summary.applicationsCreated > 0 ? "success" : "skipped",
        detail: summary.applicationsCreated > 0
          ? `Created ${summary.applicationsCreated} application(s)`
          : `Reusing ${total} existing application(s)`,
      });
    }

    return ok({
      success: true,
      steps,
      summary,
    });
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// Reset Demo Data (Full Reset)
// ---------------------------------------------------------------------------

export async function resetFullDemoData(): Promise<
  Result<{
    propertiesDeleted: number;
    roomsDeleted: number;
    bedsDeleted: number;
    applicationsDeleted: number;
    leasesDeleted: number;
    templatesDeleted: number;
    fieldsDeleted: number;
  }>
> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    // Get landlord's demo property IDs
    const { data: demoProperties } = await supabase
      .from("properties")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("is_demo", true);
    const demoPropertyIds = (demoProperties ?? []).map((p) => p.id);

    // Delete demo prepared lease fields first (FK constraint)
    const { data: demoLeases } = await supabase
      .from("prepared_leases")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("is_demo", true);
    const demoLeaseIds = (demoLeases ?? []).map((l) => l.id);

    if (demoLeaseIds.length > 0) {
      await supabase
        .from("prepared_lease_fields")
        .delete()
        .in("prepared_lease_id", demoLeaseIds);
    }

    // Delete demo prepared leases
    const { count: leasesDeleted } = await supabase
      .from("prepared_leases")
      .delete({ count: "exact" })
      .eq("owner_id", ownerId)
      .eq("is_demo", true);

    // Delete demo applications
    let applicationsDeleted = 0;
    if (demoPropertyIds.length > 0) {
      const { count } = await supabase
        .from("applications")
        .delete({ count: "exact" })
        .in("property_id", demoPropertyIds)
        .eq("is_demo", true);
      applicationsDeleted = count ?? 0;
    }

    // Delete demo lease template fields
    const { data: demoTemplates } = await supabase
      .from("lease_templates")
      .select("id, file_path")
      .eq("owner_id", ownerId)
      .eq("title", "Room Link Demo Month-to-Month Lease");

    let fieldsDeleted = 0;
    let templatesDeleted = 0;

    if (demoTemplates && demoTemplates.length > 0) {
      for (const template of demoTemplates) {
        // Delete fields
        const { count: fCount } = await supabase
          .from("lease_template_fields")
          .delete({ count: "exact" })
          .eq("lease_template_id", template.id);
        fieldsDeleted += fCount ?? 0;

        // Delete storage file
        if (template.file_path) {
          await supabase.storage.from(BUCKET).remove([template.file_path]);
        }

        // Delete template
        await supabase
          .from("lease_templates")
          .delete()
          .eq("id", template.id);
        templatesDeleted++;
      }
    }

    // Delete demo beds
    let bedsDeleted = 0;
    if (demoPropertyIds.length > 0) {
      const { count } = await supabase
        .from("beds")
        .delete({ count: "exact" })
        .in("property_id", demoPropertyIds)
        .eq("is_demo", true);
      bedsDeleted = count ?? 0;
    }

    // Delete demo rooms
    let roomsDeleted = 0;
    if (demoPropertyIds.length > 0) {
      const { count } = await supabase
        .from("rooms")
        .delete({ count: "exact" })
        .in("property_id", demoPropertyIds)
        .eq("is_demo", true);
      roomsDeleted = count ?? 0;
    }

    // Delete demo properties
    const { count: propertiesDeleted } = await supabase
      .from("properties")
      .delete({ count: "exact" })
      .eq("owner_id", ownerId)
      .eq("is_demo", true);

    return ok({
      propertiesDeleted: propertiesDeleted ?? 0,
      roomsDeleted: roomsDeleted ?? 0,
      bedsDeleted: bedsDeleted ?? 0,
      applicationsDeleted,
      leasesDeleted: leasesDeleted ?? 0,
      templatesDeleted,
      fieldsDeleted,
    });
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// Get Demo Application IDs (for tenant preview)
// ---------------------------------------------------------------------------

export async function getDemoApplicationIds(): Promise<Result<string[]>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    const { data: properties } = await supabase
      .from("properties")
      .select("id")
      .eq("owner_id", ownerId);
    const propertyIds = (properties ?? []).map((p) => p.id);

    if (propertyIds.length === 0) return ok([]);

    const { data: apps } = await supabase
      .from("applications")
      .select("id")
      .in("property_id", propertyIds)
      .eq("is_demo", true)
      .order("created_at", { ascending: false });

    return ok((apps ?? []).map((a) => a.id));
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// Legacy exports for backward compatibility
// ---------------------------------------------------------------------------

export type DemoReadinessResult = FullDemoReadinessResult;

export async function checkDemoReadiness(): Promise<Result<DemoReadinessResult>> {
  return checkFullDemoReadiness();
}

export async function createDemoPropertySetup(): Promise<
  Result<{
    propertyId: string;
    propertyName: string;
    roomsCreated: number;
    bedsCreated: number;
  }>
> {
  const result = await seedFullDemoData();
  if (result.error !== null) {
    return fail(result.error);
  }
  return ok({
    propertyId: result.data.summary.propertyId ?? "",
    propertyName: result.data.summary.propertyName ?? "",
    roomsCreated: result.data.summary.roomsCreated,
    bedsCreated: result.data.summary.bedsCreated,
  });
}

export async function createDemoApplications(): Promise<
  Result<{ created: number; skipped: number }>
> {
  const result = await seedFullDemoData();
  if (result.error !== null) {
    return fail(result.error);
  }
  return ok({
    created: result.data.summary.applicationsCreated,
    skipped: 3 - result.data.summary.applicationsCreated,
  });
}

export async function linkTemplateToStayType(
  templateId: string,
  stayType: LeaseStayType
): Promise<Result<null>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    const { data: template, error: tErr } = await supabase
      .from("lease_templates")
      .select("id, owner_id")
      .eq("id", templateId)
      .maybeSingle();
    if (tErr) throw tErr;
    if (!template) return fail("Template not found");
    if (template.owner_id !== ownerId) return fail("Not authorized");

    const { error: uErr } = await supabase
      .from("lease_templates")
      .update({ stay_type: stayType })
      .eq("id", templateId);
    if (uErr) throw uErr;

    return ok(null);
  } catch (error) {
    return fail(error);
  }
}

export async function getDemoApplications(): Promise<
  Result<DemoApplicationInfo[]>
> {
  const result = await checkFullDemoReadiness();
  if (result.error !== null) {
    return fail(result.error);
  }
  return ok(result.data.demoApplications);
}

export async function runFullDemoSetup(): Promise<
  Result<{
    steps: Array<{ step: string; status: "success" | "skipped" | "error"; detail: string }>;
    propertyCreated: boolean;
    applicationsCreated: number;
    templateLinked: boolean;
  }>
> {
  const result = await seedFullDemoData();
  if (result.error !== null) {
    return fail(result.error);
  }
  return ok({
    steps: result.data.steps,
    propertyCreated: result.data.summary.propertyId !== null,
    applicationsCreated: result.data.summary.applicationsCreated,
    templateLinked: result.data.summary.templateLinked,
  });
}

export async function resetDemoData(): Promise<
  Result<{ applicationsDeleted: number; leasesDeleted: number }>
> {
  const result = await resetFullDemoData();
  if (result.error !== null) {
    return fail(result.error);
  }
  return ok({
    applicationsDeleted: result.data.applicationsDeleted,
    leasesDeleted: result.data.leasesDeleted,
  });
}
