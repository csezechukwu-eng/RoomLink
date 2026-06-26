"use server";

import { revalidatePath } from "next/cache";
import {
  checkFullDemoReadiness,
  seedFullDemoData,
  resetFullDemoData,
  linkTemplateToStayType,
  getDemoApplicationIds,
} from "@/lib/services/demo";
import type { LeaseStayType } from "@/lib/types";
import type { ActionState } from "@/lib/actions/types";

// ---------------------------------------------------------------------------
// Check Full Demo Readiness
// ---------------------------------------------------------------------------

export async function checkDemoReadinessAction(): Promise<ActionState> {
  const result = await checkFullDemoReadiness();

  if (result.error !== null) {
    return {
      status: "error",
      message: result.error,
    };
  }

  return {
    status: "success",
    message: "Demo readiness check complete",
    data: result.data,
  };
}

// ---------------------------------------------------------------------------
// Seed Full Demo Data (One-Click)
// ---------------------------------------------------------------------------

export async function seedFullDemoDataAction(): Promise<ActionState> {
  console.log("[seedFullDemoDataAction] Starting...");

  try {
    const result = await seedFullDemoData();
    console.log("[seedFullDemoDataAction] seedFullDemoData returned:", JSON.stringify({
      hasError: result.error !== null,
      error: result.error,
      dataSuccess: result.data?.success,
      stepsCount: result.data?.steps?.length ?? 0,
    }));

    // Handle Result error (e.g., auth failure)
    if (result.error !== null) {
      console.error("[seedFullDemoDataAction] Result error:", result.error);
      return {
        status: "error",
        message: result.error,
      };
    }

    // Handle success: false (internal failures)
    if (!result.data.success) {
      const errorSteps = result.data.steps.filter((s) => s.status === "error");
      const errorMessages = errorSteps.map((s) => `${s.step}: ${s.detail}`).join("; ");
      console.error("[seedFullDemoDataAction] Data creation failed:", errorMessages);
      return {
        status: "error",
        message: errorMessages || "Demo data creation failed - check server logs",
        data: {
          steps: result.data.steps,
          summary: result.data.summary,
        },
      };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/demo");
    revalidatePath("/dashboard/properties");
    revalidatePath("/dashboard/leases");
    revalidatePath("/dashboard/leases/applications");
    revalidatePath("/dashboard/applications");

    const { steps, summary } = result.data;
    const successSteps = steps.filter((s) => s.status === "success").length;
    const errorSteps = steps.filter((s) => s.status === "error").length;
    const skippedSteps = steps.filter((s) => s.status === "skipped").length;

    let message = "";
    if (errorSteps > 0) {
      const errorDetails = steps.filter((s) => s.status === "error").map((s) => s.detail).join("; ");
      message = `Demo setup completed with ${errorSteps} error(s): ${errorDetails}`;
    } else if (successSteps > 0) {
      message = `Demo data loaded successfully! Created ${successSteps} item(s)`;
    } else {
      message = "Demo data already exists - nothing new created";
    }

    return {
      status: errorSteps > 0 ? "error" : "success",
      message,
      data: {
        steps,
        summary,
        successSteps,
        errorSteps,
        skippedSteps,
      },
    };
  } catch (e) {
    console.error("[seedFullDemoDataAction] Exception caught:", e);
    const errorMessage = e instanceof Error ? e.message : "Failed to seed demo data";
    return {
      status: "error",
      message: `Server error: ${errorMessage}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Reset Full Demo Data
// ---------------------------------------------------------------------------

export async function resetFullDemoDataAction(): Promise<ActionState> {
  const result = await resetFullDemoData();

  if (result.error !== null) {
    return {
      status: "error",
      message: result.error,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/demo");
  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard/leases");
  revalidatePath("/dashboard/leases/applications");
  revalidatePath("/dashboard/applications");

  const {
    propertiesDeleted,
    roomsDeleted,
    bedsDeleted,
    applicationsDeleted,
    leasesDeleted,
    templatesDeleted,
    fieldsDeleted,
  } = result.data;

  const parts = [];
  if (propertiesDeleted > 0) parts.push(`${propertiesDeleted} property/properties`);
  if (roomsDeleted > 0) parts.push(`${roomsDeleted} room(s)`);
  if (bedsDeleted > 0) parts.push(`${bedsDeleted} bed(s)`);
  if (applicationsDeleted > 0) parts.push(`${applicationsDeleted} application(s)`);
  if (leasesDeleted > 0) parts.push(`${leasesDeleted} lease(s)`);
  if (templatesDeleted > 0) parts.push(`${templatesDeleted} template(s)`);
  if (fieldsDeleted > 0) parts.push(`${fieldsDeleted} field(s)`);

  return {
    status: "success",
    message: parts.length > 0 ? `Deleted ${parts.join(", ")}` : "No demo data to delete",
    data: result.data,
  };
}

// ---------------------------------------------------------------------------
// Link Template to Stay Type
// ---------------------------------------------------------------------------

export async function linkTemplateToStayTypeAction(
  templateId: string,
  stayType: LeaseStayType
): Promise<ActionState> {
  const result = await linkTemplateToStayType(templateId, stayType);

  if (result.error !== null) {
    return {
      status: "error",
      message: result.error,
    };
  }

  revalidatePath("/dashboard/demo");
  revalidatePath("/dashboard/leases");
  revalidatePath("/dashboard/leases/applications");

  return {
    status: "success",
    message: `Template linked to ${stayType.replace(/_/g, " ")} rental type`,
  };
}

// ---------------------------------------------------------------------------
// Get Demo Application IDs
// ---------------------------------------------------------------------------

export async function getDemoApplicationIdsAction(): Promise<ActionState> {
  const result = await getDemoApplicationIds();

  if (result.error !== null) {
    return {
      status: "error",
      message: result.error,
    };
  }

  return {
    status: "success",
    message: `Found ${result.data.length} demo application(s)`,
    data: result.data,
  };
}
