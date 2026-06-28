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
    preparedLeasesCreated: number;
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
        status: "vacant" as const,
        description: "Single bed in shared room",
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
  targetStatus: "under_review" | "approved" | "rejected";
}

const DEMO_APPLICANTS: DemoApplication[] = [
  {
    name: "Jane Pending",
    firstName: "Jane",
    lastName: "Pending",
    email: "jane.pending@example.com",
    phone: "555-0101",
    stayType: "month_to_month",
    moveInOffset: 30,
    monthlyIncome: 4200,
    employmentStatus: "employed_full_time",
    commuterStatus: "local_resident",
    targetStatus: "under_review",
  },
  {
    name: "Marcus Approved",
    firstName: "Marcus",
    lastName: "Approved",
    email: "marcus.approved@example.com",
    phone: "555-0102",
    stayType: "month_to_month", // Use month_to_month to match demo template for agreement automation
    moveInOffset: 7,
    monthlyIncome: 3800,
    employmentStatus: "employed_full_time",
    commuterStatus: "airline_crew",
    targetStatus: "approved",
  },
  {
    name: "Ava Rejected",
    firstName: "Ava",
    lastName: "Rejected",
    email: "ava.rejected@example.com",
    phone: "555-0103",
    stayType: "midterm",
    moveInOffset: 14,
    monthlyIncome: 2600,
    employmentStatus: "employed_part_time",
    commuterStatus: "travel_nurse",
    targetStatus: "rejected",
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

    if (!supabase) {
      return fail("Database service client unavailable. Please check server configuration.");
    }

    const checks: DemoReadinessCheck[] = [];

    // -------------------------------------------------------------------------
    // Pre-check: Verify is_demo columns exist (migrations 0020/0021)
    // -------------------------------------------------------------------------
    const { error: schemaCheck1 } = await supabase
      .from("properties")
      .select("is_demo")
      .limit(1);

    const { error: schemaCheck2 } = await supabase
      .from("applications")
      .select("is_demo")
      .limit(1);

    const schemaError = schemaCheck1 || schemaCheck2;
    if (schemaError) {
      const msg = schemaError.message || "";
      if (msg.includes("is_demo") || msg.includes("column") || msg.includes("does not exist")) {
        return fail(
          "Database migration required: Run migrations 0020 and 0021 in Supabase SQL Editor to add demo support columns."
        );
      }
    }

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
    if (pErr) {
      console.error("[checkFullDemoReadiness] Properties query failed:", pErr.message);
      throw pErr;
    }
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
      const { data: appData, error: appErr } = await supabase
        .from("applications")
        .select("*")
        .in("property_id", propertyIds)
        .eq("is_demo", true)
        .order("created_at", { ascending: false });
      if (appErr) {
        console.error("[checkFullDemoReadiness] Applications query failed:", appErr.message);
        // Don't throw - just log and continue with empty array
      }
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

    const { data: preparedLeases, error: plErr } = await supabase
      .from("prepared_leases")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("is_demo", true)
      .order("created_at", { ascending: false });
    if (plErr) {
      console.error("[checkFullDemoReadiness] Prepared leases query failed:", plErr.message);
      // Don't throw - just log and continue with empty array
    }
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
    console.log("[seedFullDemoData] Starting demo data seed...");

    const ownerId = await getCurrentOwnerId();
    console.log("[seedFullDemoData] Got owner ID:", ownerId);

    const supabase = getServiceClient();
    if (!supabase) {
      console.error("[seedFullDemoData] Service client is null - check SUPABASE_SERVICE_ROLE_KEY");
      return fail("Database service client unavailable. Please check server configuration.");
    }

    const steps: DemoSeedStep[] = [];

    // Pre-check: Verify is_demo column exists on properties table
    // This helps catch migration issues early
    console.log("[seedFullDemoData] Checking if is_demo column exists...");
    const { error: schemaCheckError } = await supabase
      .from("properties")
      .select("is_demo")
      .limit(1);

    if (schemaCheckError) {
      const errorMsg = schemaCheckError.message || String(schemaCheckError);
      console.error("[seedFullDemoData] Schema check failed:", errorMsg);

      if (errorMsg.includes("is_demo") || errorMsg.includes("column") || errorMsg.includes("does not exist")) {
        return fail(
          "Database migration required: The 'is_demo' column is missing. " +
          "Please run migrations 0020 and 0021 in Supabase SQL Editor."
        );
      }
      // Other errors - continue anyway
      console.warn("[seedFullDemoData] Schema check had non-critical error:", errorMsg);
    }
    console.log("[seedFullDemoData] Schema check passed");

    const summary = {
      propertyId: null as string | null,
      propertyName: null as string | null,
      roomsCreated: 0,
      bedsCreated: 0,
      leaseTemplateId: null as string | null,
      leaseTemplateName: null as string | null,
      fieldsCreated: 0,
      applicationsCreated: 0,
      preparedLeasesCreated: 0,
      templateLinked: false,
    };

    // -------------------------------------------------------------------------
    // Step 1: Create or reuse demo property
    // -------------------------------------------------------------------------
    console.log("[seedFullDemoData] Step 1: Looking for existing demo property for owner:", ownerId);

    const { data: existingDemoProp, error: existingPropError } = await supabase
      .from("properties")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("is_demo", true)
      .maybeSingle();

    if (existingPropError) {
      console.error("[seedFullDemoData] Error checking existing property:", existingPropError.message);
    }

    let propertyId: string;
    let property: Property;

    if (existingDemoProp) {
      console.log("[seedFullDemoData] Found existing demo property:", existingDemoProp.name);
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
      console.log("[seedFullDemoData] No existing demo property, creating new one...");
      console.log("[seedFullDemoData] Insert config:", JSON.stringify({ owner_id: ownerId, ...DEMO_PROPERTY_CONFIG }));

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
        console.error("[seedFullDemoData] Property insert failed:", pErr.message, pErr);
        steps.push({
          step: "Demo Property",
          status: "error",
          detail: `Insert failed: ${pErr.message}`,
        });
        return ok({ success: false, steps, summary });
      }

      console.log("[seedFullDemoData] Property created successfully:", newProp.id);

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
      // Try to generate and upload demo PDF
      const stamp = Date.now();
      const rand = Math.random().toString(36).slice(2, 8);
      const fileName = "room-link-demo-lease.pdf";
      let actualFilePath = `${ownerId}/templates/${stamp}-${rand}-${fileName}`;
      let pdfUploaded = false;
      let storageWarning = "";

      try {
        const pdfBytes = await generateDemoLeasePdf();

        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(actualFilePath, pdfBytes, {
            contentType: "application/pdf",
            upsert: false,
          });

        if (uploadErr) {
          // Storage failed but we'll continue with a placeholder
          storageWarning = `PDF upload skipped: ${uploadErr.message}`;
          console.warn("[Demo] Storage upload failed:", uploadErr.message);
          // Use a demo placeholder path that won't break the template
          actualFilePath = `demo/${ownerId}/demo-lease-placeholder.pdf`;
        } else {
          pdfUploaded = true;
        }
      } catch (pdfErr) {
        // PDF generation failed but we'll continue
        storageWarning = `PDF generation skipped: ${pdfErr instanceof Error ? pdfErr.message : "unknown error"}`;
        console.warn("[Demo] PDF generation failed:", pdfErr);
        actualFilePath = `demo/${ownerId}/demo-lease-placeholder.pdf`;
      }

      // Create template record (always continue even if storage failed)
      const { data: template, error: tErr } = await supabase
        .from("lease_templates")
        .insert({
          owner_id: ownerId,
          title: "Room Link Demo Month-to-Month Lease",
          lease_category: "month_to_month_room_lease",
          stay_type: "month_to_month",
          property_id: null,
          file_path: actualFilePath,
          file_name: fileName,
          file_type: "application/pdf",
          status: "needs_setup",
          notes: storageWarning
            ? `Demo lease template. Note: ${storageWarning}`
            : "Demo lease template for testing Room Link features.",
        })
        .select()
        .single();

      if (tErr) {
        // Clean up uploaded file if it was uploaded
        if (pdfUploaded) {
          await supabase.storage.from(BUCKET).remove([actualFilePath]);
        }
        steps.push({
          step: "Demo Lease Template",
          status: "error",
          detail: `Failed to create template: ${tErr.message}`,
        });
        // Don't return early - try to continue with other steps
        // Set templateId to empty to skip field creation
        templateId = "";
      } else {
        templateId = template.id;
        const detailMsg = pdfUploaded
          ? `Created "${template.title}" with PDF`
          : `Created "${template.title}" (PDF placeholder - storage unavailable)`;
        steps.push({
          step: "Demo Lease Template",
          status: "success",
          detail: detailMsg,
          id: templateId,
        });
        summary.leaseTemplateId = templateId;
        summary.leaseTemplateName = template.title;
      }
    }

    // -------------------------------------------------------------------------
    // Step 4: Create or reuse demo lease template fields
    // -------------------------------------------------------------------------

    // Skip field creation if template creation failed
    if (!templateId) {
      steps.push({
        step: "Demo Template Fields",
        status: "error",
        detail: "Skipped - no template available",
      });
    } else {
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
    } // end of templateId else block

    // -------------------------------------------------------------------------
    // Step 5: Update template status to ready
    // -------------------------------------------------------------------------

    // Skip if no templateId
    if (!templateId) {
      steps.push({
        step: "Template Status",
        status: "error",
        detail: "Skipped - no template available",
      });
    } else {
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
    } // end of templateId else block for step 5

    // -------------------------------------------------------------------------
    // Step 6: Create demo applications
    // -------------------------------------------------------------------------

    // Get all demo beds (simplified query without join to avoid issues)
    console.log("[seedFullDemoData] Step 6: Querying vacant demo beds for property:", propertyId);
    const { data: allDemoBeds, error: bedQueryErr } = await supabase
      .from("beds")
      .select("*")
      .eq("property_id", propertyId)
      .eq("is_demo", true)
      .eq("status", "vacant");

    if (bedQueryErr) {
      console.error("[seedFullDemoData] Error querying demo beds:", bedQueryErr.message);
    }

    const vacantDemoBeds = (allDemoBeds ?? []) as Bed[];
    console.log("[seedFullDemoData] Found", vacantDemoBeds.length, "vacant demo beds");

    // If no vacant beds found, try to get ANY demo beds and reset their status
    if (vacantDemoBeds.length === 0) {
      console.log("[seedFullDemoData] No vacant beds found, checking all demo beds...");
      const { data: anyDemoBeds } = await supabase
        .from("beds")
        .select("*")
        .eq("property_id", propertyId)
        .eq("is_demo", true);

      console.log("[seedFullDemoData] Found", (anyDemoBeds ?? []).length, "total demo beds");

      // Reset demo beds to vacant status for testing
      if (anyDemoBeds && anyDemoBeds.length > 0) {
        const bedIds = anyDemoBeds.map((b) => b.id);
        const { error: resetErr } = await supabase
          .from("beds")
          .update({ status: "vacant" })
          .in("id", bedIds);

        if (!resetErr) {
          console.log("[seedFullDemoData] Reset", bedIds.length, "demo beds to vacant");
          // Use these beds
          vacantDemoBeds.push(...(anyDemoBeds as Bed[]));
        }
      }
    }

    // Final check - if still no beds, skip applications
    if (vacantDemoBeds.length === 0) {
      steps.push({
        step: "Demo Applications",
        status: "error",
        detail: "No demo beds available - create demo property first",
      });
    } else {

    // Check existing demo applications
    const demoEmails = DEMO_APPLICANTS.map((a) => a.email);
    console.log("[seedFullDemoData] Checking for existing apps with emails:", demoEmails);
    console.log("[seedFullDemoData] Using property_id:", propertyId);

    const { data: existingApps, error: existingAppsErr } = await supabase
      .from("applications")
      .select("email, id, is_demo, status")
      .eq("property_id", propertyId)
      .eq("is_demo", true)
      .in("email", demoEmails);

    if (existingAppsErr) {
      console.error("[seedFullDemoData] Error checking existing apps:", existingAppsErr.message);
    }

    const existingAppEmails = new Set((existingApps ?? []).map((a) => a.email));
    console.log("[seedFullDemoData] Existing demo apps found:", existingApps?.length ?? 0);
    console.log("[seedFullDemoData] Existing app emails:", Array.from(existingAppEmails));

    let appsSkipped = 0;
    for (let i = 0; i < DEMO_APPLICANTS.length; i++) {
      const demo = DEMO_APPLICANTS[i];

      if (existingAppEmails.has(demo.email)) {
        console.log("[seedFullDemoData] Skipping existing app for:", demo.email);
        appsSkipped++;
        continue;
      }

      // Assign bed based on availability (safe modulo)
      const bedIndex = vacantDemoBeds.length > 0 ? i % vacantDemoBeds.length : -1;
      const bed = bedIndex >= 0 ? vacantDemoBeds[bedIndex] : undefined;
      if (!bed) {
        console.error("[seedFullDemoData] No bed available for:", demo.name, "- vacantDemoBeds.length:", vacantDemoBeds.length);
        steps.push({
          step: `Application ${demo.name}`,
          status: "error",
          detail: `No vacant beds available (${vacantDemoBeds.length} beds)`,
        });
        continue;
      }
      console.log("[seedFullDemoData] Assigning bed", bed.label, "(id:", bed.id, ") to", demo.name);

      const moveInDate = new Date();
      moveInDate.setDate(moveInDate.getDate() + demo.moveInOffset);
      const moveInIso = moveInDate.toISOString().slice(0, 10);

      const insertPayload = {
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
        status: demo.targetStatus,
        is_demo: true,
      };

      console.log("[seedFullDemoData] Inserting application:", JSON.stringify({
        property_id: insertPayload.property_id,
        bed_id: insertPayload.bed_id,
        email: insertPayload.email,
        status: insertPayload.status,
        is_demo: insertPayload.is_demo,
      }));

      const { data: app, error: aErr } = await supabase
        .from("applications")
        .insert(insertPayload)
        .select()
        .single();

      if (aErr) {
        console.error("[seedFullDemoData] Insert failed for", demo.name, ":", aErr.message, aErr.code, aErr.details);
        steps.push({
          step: `Application ${demo.name}`,
          status: "error",
          detail: `Insert failed: ${aErr.message}`,
        });
        continue;
      }

      console.log("[seedFullDemoData] Successfully created application:", app?.id, "for", demo.name);
      steps.push({
        step: `Application ${demo.name}`,
        status: "success",
        detail: `Created with bed ${bed.label}`,
        id: app?.id,
      });
      summary.applicationsCreated++;
    }

    // Update existing applications to correct statuses if they exist
    let statusesUpdated = 0;
    for (const demo of DEMO_APPLICANTS) {
      const { error: updateErr } = await supabase
        .from("applications")
        .update({ status: demo.targetStatus })
        .eq("property_id", propertyId)
        .eq("email", demo.email)
        .eq("is_demo", true)
        .neq("status", demo.targetStatus);

      if (!updateErr) {
        statusesUpdated++;
      }
    }

    // Always report the applications step result
    const totalExisting = existingApps?.length ?? 0;
    const totalApps = summary.applicationsCreated + totalExisting;
    let appStepDetail = "";
    let appStepStatus: "success" | "skipped" | "error" = "error";

    if (summary.applicationsCreated > 0) {
      appStepDetail = `Created ${summary.applicationsCreated} application(s)`;
      appStepStatus = "success";
      if (appsSkipped > 0) {
        appStepDetail += `, ${appsSkipped} skipped (existing)`;
      }
    } else if (totalExisting > 0) {
      appStepDetail = `Reusing ${totalExisting} existing application(s)`;
      appStepStatus = "skipped";
      if (statusesUpdated > 0) {
        appStepDetail += `, updated ${statusesUpdated} statuses`;
        appStepStatus = "success";
      }
    } else {
      appStepDetail = "No applications created - check server logs";
      appStepStatus = "error";
    }

    console.log("[seedFullDemoData] Applications step result:", {
      created: summary.applicationsCreated,
      existing: totalExisting,
      skipped: appsSkipped,
      statusesUpdated,
    });

    steps.push({
      step: "Demo Applications",
      status: appStepStatus,
      detail: appStepDetail,
    });
    } // end of vacantDemoBeds check else block

    // -------------------------------------------------------------------------
    // Step 7: Create prepared_lease for approved demo applications
    // -------------------------------------------------------------------------

    // Skip prepared leases if no template available
    if (!templateId) {
      steps.push({
        step: "Demo Prepared Leases",
        status: "error",
        detail: "Skipped - no template available for lease generation",
      });
    } else {
    // Get approved demo applications that don't have a prepared_lease yet
    const { data: approvedApps } = await supabase
      .from("applications")
      .select("*")
      .eq("property_id", propertyId)
      .eq("is_demo", true)
      .eq("status", "approved")
      .eq("stay_type", "month_to_month");

    const approvedAppsList = (approvedApps ?? []) as Application[];
    let preparedLeasesCreated = 0;

    for (const app of approvedAppsList) {
      // Check if prepared_lease already exists
      const { data: existingLease } = await supabase
        .from("prepared_leases")
        .select("id")
        .eq("application_id", app.id)
        .neq("status", "cancelled")
        .maybeSingle();

      if (existingLease) continue;

      // Get bed details for snapshots
      let bedData: Bed | null = null;
      let roomName: string | null = null;
      if (app.bed_id) {
        const { data: bedRow } = await supabase
          .from("beds")
          .select("*")
          .eq("id", app.bed_id)
          .maybeSingle();
        bedData = (bedRow as Bed) ?? null;

        if (bedData?.room_id) {
          const { data: roomRow } = await supabase
            .from("rooms")
            .select("name")
            .eq("id", bedData.room_id)
            .maybeSingle();
          roomName = roomRow?.name ?? null;
        }
      }

      // Build snapshots
      const applicantSnapshot = {
        name: app.full_name ?? `${app.first_name} ${app.last_name}`.trim(),
        email: app.email,
        phone: app.phone,
      };

      const propertySnapshot = { name: property.name, address: property.address };
      const roomSnapshot = roomName ? { name: roomName } : null;
      const bedSnapshot = bedData?.label ? { label: bedData.label } : null;
      const rentSnapshot = { monthly_rent: bedData?.monthly_rent ?? null };
      const depositSnapshot = { deposit_amount: bedData?.deposit_amount ?? null };

      const autofillSnapshot = {
        tenantName: applicantSnapshot.name,
        tenantEmail: app.email,
        tenantPhone: app.phone,
        propertyName: property.name,
        roomName,
        bedLabel: bedData?.label,
        monthlyRent: bedData?.monthly_rent,
        depositAmount: bedData?.deposit_amount,
        moveInDate: app.desired_move_in,
        stayType: app.stay_type,
      };

      // Generate lease reference number
      const year = new Date().getFullYear();
      const prefix = `RL-LEASE-${year}-`;
      const { data: lastRef } = await supabase
        .from("prepared_leases")
        .select("lease_reference_number")
        .like("lease_reference_number", `${prefix}%`)
        .order("lease_reference_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      let nextSeq = 1;
      if (lastRef?.lease_reference_number) {
        const lastSeqStr = lastRef.lease_reference_number.substring(prefix.length);
        const lastSeqNum = parseInt(lastSeqStr, 10);
        if (!isNaN(lastSeqNum)) nextSeq = lastSeqNum + 1;
      }
      const leaseReferenceNumber = `${prefix}${nextSeq.toString().padStart(6, "0")}`;

      // Create prepared_lease
      const now = new Date().toISOString();
      const { data: preparedLease, error: plErr } = await supabase
        .from("prepared_leases")
        .insert({
          owner_id: ownerId,
          application_id: app.id,
          lease_template_id: templateId,
          property_id: propertyId,
          room_id: bedData?.room_id ?? null,
          bed_id: app.bed_id,
          tenant_id: app.applicant_id,
          rental_type: app.stay_type,
          status: "sent",
          lease_reference_number: leaseReferenceNumber,
          applicant_snapshot: applicantSnapshot,
          property_snapshot: propertySnapshot,
          room_snapshot: roomSnapshot,
          bed_snapshot: bedSnapshot,
          rent_snapshot: rentSnapshot,
          deposit_snapshot: depositSnapshot,
          autofill_snapshot: autofillSnapshot,
          sent_at: now,
          is_demo: true,
        })
        .select()
        .single();

      if (plErr) {
        steps.push({
          step: `Prepared Lease for ${app.full_name}`,
          status: "error",
          detail: plErr.message,
        });
        continue;
      }

      // Copy template fields to prepared_lease_fields
      const { data: templateFields } = await supabase
        .from("lease_template_fields")
        .select("*")
        .eq("lease_template_id", templateId)
        .order("sort_order", { ascending: true });

      const SIGNATURE_FIELD_TYPES = [
        "tenant_signature", "landlord_signature",
        "tenant_initials", "landlord_initials",
        "date_signed", "tenant_full_name", "landlord_full_name",
      ];

      const getSignatureTypePrefix = (fieldType: string): string | null => {
        switch (fieldType) {
          case "tenant_signature":
          case "landlord_signature":
            return "SIGN";
          case "tenant_initials":
          case "landlord_initials":
            return "INIT";
          case "date_signed":
            return "DATE";
          case "tenant_full_name":
          case "landlord_full_name":
            return "NAME";
          default:
            return null;
        }
      };

      const fields = templateFields ?? [];
      let sigFieldIdx = 0;
      const preparedFields = fields.map((field, idx) => {
        const isSignatureField = SIGNATURE_FIELD_TYPES.includes(field.field_type);
        let signatureReferenceNumber: string | null = null;
        let signatureInstanceKey: string | null = null;

        if (isSignatureField) {
          const typePrefix = getSignatureTypePrefix(field.field_type);
          if (typePrefix) {
            const parts = leaseReferenceNumber.split("-");
            const refYear = parts[2];
            const leaseSeq = parts[3];
            const fieldSeq = (sigFieldIdx + 1).toString().padStart(3, "0");
            signatureReferenceNumber = `RL-${typePrefix}-${refYear}-${leaseSeq}-${fieldSeq}`;
            signatureInstanceKey = signatureReferenceNumber;
            sigFieldIdx++;
          }
        }

        const suffix = (idx + 1).toString().padStart(3, "0");
        const preparedFieldKey = `PF-${field.field_key || `FIELD-${suffix}`}`;

        return {
          prepared_lease_id: preparedLease.id,
          lease_template_field_id: field.id,
          template_field_key: field.field_key || `FIELD-${idx + 1}`,
          prepared_field_key: preparedFieldKey,
          signature_instance_key: signatureInstanceKey,
          signature_reference_number: signatureReferenceNumber,
          field_type: field.field_type,
          label: field.label,
          required: field.required,
          assigned_to: field.assigned_to,
          page_number: field.page_number,
          x: field.x,
          y: field.y,
          width: field.width,
          height: field.height,
          placement_note: field.placement_note,
          sort_order: field.sort_order,
          is_demo: true,
        };
      });

      if (preparedFields.length > 0) {
        await supabase.from("prepared_lease_fields").insert(preparedFields);
      }

      preparedLeasesCreated++;
      summary.preparedLeasesCreated++;
    }

    if (preparedLeasesCreated > 0) {
      steps.push({
        step: "Demo Prepared Leases",
        status: "success",
        detail: `Created ${preparedLeasesCreated} prepared lease(s) for approved applications`,
      });
    } else if (approvedAppsList.length > 0) {
      steps.push({
        step: "Demo Prepared Leases",
        status: "skipped",
        detail: "Prepared leases already exist for approved applications",
      });
    }
    } // end of templateId else block for step 7

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
// Demo Rent Payments
// ---------------------------------------------------------------------------

export interface DemoRentPaymentResult {
  success: boolean;
  rentChargesCreated: number;
  paymentsCreated: number;
  steps: DemoSeedStep[];
}

/**
 * Demo tenant configurations for rent payment testing.
 * Each tenant will have a rent charge with a different status.
 */
const DEMO_RENT_TENANTS = [
  {
    name: "Jane Paid",
    firstName: "Jane",
    lastName: "Paid",
    email: "jane.paid.demo@example.com",
    rentStatus: "paid" as const,
    paymentProvider: "manual" as const,
    daysFromNow: -5, // Due 5 days ago (but paid)
  },
  {
    name: "Marcus Stripe",
    firstName: "Marcus",
    lastName: "Stripe",
    email: "marcus.stripe.demo@example.com",
    rentStatus: "paid" as const,
    paymentProvider: "stripe" as const,
    daysFromNow: -10, // Due 10 days ago (but paid via Stripe)
  },
  {
    name: "Olivia Unpaid",
    firstName: "Olivia",
    lastName: "Unpaid",
    email: "olivia.unpaid.demo@example.com",
    rentStatus: "due" as const,
    paymentProvider: null,
    daysFromNow: 5, // Due in 5 days
  },
  {
    name: "Grace Overdue",
    firstName: "Grace",
    lastName: "Overdue",
    email: "grace.overdue.demo@example.com",
    rentStatus: "overdue" as const,
    paymentProvider: null,
    daysFromNow: -15, // Due 15 days ago (overdue)
  },
  {
    name: "Henry Waived",
    firstName: "Henry",
    lastName: "Waived",
    email: "henry.waived.demo@example.com",
    rentStatus: "waived" as const,
    paymentProvider: null,
    daysFromNow: -3, // Due 3 days ago (waived)
  },
];

/**
 * Seed demo rent charges and payments for testing the landlord rent dashboard.
 * Creates demo tenants, rent charges with different statuses, and payments.
 * Idempotent - safe to run multiple times.
 */
export async function seedDemoRentPayments(): Promise<Result<DemoRentPaymentResult>> {
  try {
    console.log("[seedDemoRentPayments] Starting demo rent payment seed...");

    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    if (!supabase) {
      return fail("Database service client unavailable.");
    }

    const steps: DemoSeedStep[] = [];
    let rentChargesCreated = 0;
    let paymentsCreated = 0;

    // -------------------------------------------------------------------------
    // Step 1: Find or create demo property
    // -------------------------------------------------------------------------
    const { data: demoProperty } = await supabase
      .from("properties")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("is_demo", true)
      .maybeSingle();

    if (!demoProperty) {
      steps.push({
        step: "Demo Property",
        status: "error",
        detail: "No demo property found. Run 'Load Full Demo Data' first.",
      });
      return ok({ success: false, rentChargesCreated: 0, paymentsCreated: 0, steps });
    }

    const propertyId = demoProperty.id;
    steps.push({
      step: "Demo Property",
      status: "skipped",
      detail: `Using "${demoProperty.name}"`,
      id: propertyId,
    });

    // -------------------------------------------------------------------------
    // Step 2: Get demo beds
    // -------------------------------------------------------------------------
    const { data: demoBeds } = await supabase
      .from("beds")
      .select("*")
      .eq("property_id", propertyId)
      .eq("is_demo", true);

    if (!demoBeds || demoBeds.length === 0) {
      steps.push({
        step: "Demo Beds",
        status: "error",
        detail: "No demo beds found. Run 'Load Full Demo Data' first.",
      });
      return ok({ success: false, rentChargesCreated: 0, paymentsCreated: 0, steps });
    }

    steps.push({
      step: "Demo Beds",
      status: "skipped",
      detail: `Found ${demoBeds.length} demo bed(s)`,
    });

    // -------------------------------------------------------------------------
    // Step 3: Create demo tenant users and rent charges
    // -------------------------------------------------------------------------
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    for (let i = 0; i < DEMO_RENT_TENANTS.length; i++) {
      const tenant = DEMO_RENT_TENANTS[i];
      const bed = demoBeds[i % demoBeds.length];

      // Look for existing tenant user by email
      let tenantUserId: string;
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", tenant.email)
        .maybeSingle();

      if (existingUser) {
        tenantUserId = existingUser.id;
        console.log(`[seedDemoRentPayments] Reusing tenant user: ${tenant.email}`);
      } else {
        // Create a demo tenant user
        const { data: newUser, error: userErr } = await supabase
          .from("users")
          .insert({
            email: tenant.email,
            full_name: tenant.name,
            role: "tenant",
            is_demo: true,
          })
          .select()
          .single();

        if (userErr) {
          // User might exist with different casing or constraint issue
          console.log(`[seedDemoRentPayments] Could not create user ${tenant.email}: ${userErr.message}`);
          // Generate a UUID for the tenant
          tenantUserId = crypto.randomUUID();
        } else {
          tenantUserId = newUser.id;
          console.log(`[seedDemoRentPayments] Created tenant user: ${tenant.name}`);
        }
      }

      // Check if rent charge already exists for this tenant/property
      const { data: existingRentCharge } = await supabase
        .from("rent_charges")
        .select("id")
        .eq("property_id", propertyId)
        .eq("tenant_id", tenantUserId)
        .maybeSingle();

      if (existingRentCharge) {
        steps.push({
          step: `Rent Charge ${tenant.name}`,
          status: "skipped",
          detail: "Already exists",
          id: existingRentCharge.id,
        });
        continue;
      }

      // Calculate due date
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + tenant.daysFromNow);
      const dueDateStr = dueDate.toISOString().slice(0, 10);

      // Monthly rent amount from bed
      const monthlyRent = bed.monthly_rent ?? 650;

      // Create rent charge
      const { data: rentCharge, error: rcErr } = await supabase
        .from("rent_charges")
        .insert({
          tenant_id: tenantUserId,
          property_id: propertyId,
          bed_id: bed.id,
          period_start: thisMonthStart.toISOString().slice(0, 10),
          period_end: thisMonthEnd.toISOString().slice(0, 10),
          due_date: dueDateStr,
          amount: monthlyRent,
          status: tenant.rentStatus,
          paid_at: tenant.rentStatus === "paid" ? now.toISOString() : null,
        })
        .select()
        .single();

      if (rcErr) {
        steps.push({
          step: `Rent Charge ${tenant.name}`,
          status: "error",
          detail: rcErr.message,
        });
        continue;
      }

      rentChargesCreated++;
      steps.push({
        step: `Rent Charge ${tenant.name}`,
        status: "success",
        detail: `${tenant.rentStatus} - $${monthlyRent} due ${dueDateStr}`,
        id: rentCharge.id,
      });

      // Create payment for paid charges
      if (tenant.rentStatus === "paid" && tenant.paymentProvider) {
        const amountCents = Math.round(monthlyRent * 100);
        const hostFeeCents = tenant.paymentProvider === "stripe" ? Math.round(amountCents * 0.05) : 0;
        const landlordPayoutCents = amountCents - hostFeeCents;

        const { data: payment, error: payErr } = await supabase
          .from("payments")
          .insert({
            tenant_id: tenantUserId,
            rent_charge_id: rentCharge.id,
            property_id: propertyId,
            kind: "rent",
            amount: monthlyRent,
            payment_provider: tenant.paymentProvider,
            status: "recorded",
            host_fee_cents: tenant.paymentProvider === "stripe" ? hostFeeCents : null,
            landlord_payout_cents: tenant.paymentProvider === "stripe" ? landlordPayoutCents : null,
          })
          .select()
          .single();

        if (payErr) {
          steps.push({
            step: `Payment ${tenant.name}`,
            status: "error",
            detail: payErr.message,
          });
        } else {
          paymentsCreated++;
          const feeNote = tenant.paymentProvider === "stripe"
            ? ` (5% fee: $${(hostFeeCents / 100).toFixed(2)})`
            : " (manual)";
          steps.push({
            step: `Payment ${tenant.name}`,
            status: "success",
            detail: `$${monthlyRent}${feeNote}`,
            id: payment.id,
          });
        }
      }
    }

    console.log(`[seedDemoRentPayments] Created ${rentChargesCreated} rent charges, ${paymentsCreated} payments`);

    return ok({
      success: true,
      rentChargesCreated,
      paymentsCreated,
      steps,
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * Reset demo rent payment data (rent charges and payments).
 */
export async function resetDemoRentPayments(): Promise<Result<{ chargesDeleted: number; paymentsDeleted: number }>> {
  try {
    const ownerId = await getCurrentOwnerId();
    const supabase = getServiceClient();

    // Get demo property
    const { data: demoProperty } = await supabase
      .from("properties")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("is_demo", true)
      .maybeSingle();

    if (!demoProperty) {
      return ok({ chargesDeleted: 0, paymentsDeleted: 0 });
    }

    // Delete payments for demo property
    const { count: paymentsDeleted } = await supabase
      .from("payments")
      .delete({ count: "exact" })
      .eq("property_id", demoProperty.id);

    // Delete rent charges for demo property
    const { count: chargesDeleted } = await supabase
      .from("rent_charges")
      .delete({ count: "exact" })
      .eq("property_id", demoProperty.id);

    // Delete demo tenant users
    const demoEmails = DEMO_RENT_TENANTS.map((t) => t.email);
    await supabase
      .from("users")
      .delete()
      .in("email", demoEmails);

    return ok({
      chargesDeleted: chargesDeleted ?? 0,
      paymentsDeleted: paymentsDeleted ?? 0,
    });
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
