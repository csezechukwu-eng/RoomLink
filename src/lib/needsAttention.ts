import type { PropertyWorkspace } from "@/lib/queries";

export type IssueSeverity = "urgent" | "review" | "setup";

export interface AttentionIssue {
  id: string;
  severity: IssueSeverity;
  /** lucide icon name handled by the panel */
  kind:
    | "rent_overdue"
    | "maintenance_open"
    | "bed_unavailable"
    | "application_pending"
    | "bed_reserved"
    | "property_no_photos"
    | "room_no_beds"
    | "bed_setup";
  title: string;
  description: string;
  /** Human-readable location, e.g. "Room A · Top Bunk 1". */
  location?: string;
  /** In-page anchor (e.g. "#room-<id>") or route to act on the issue. */
  href?: string;
  actionLabel: string;
}

/**
 * Derive property-specific "Needs Attention" issues purely from real data.
 * No issue is emitted unless its underlying record/condition actually exists.
 */
export function computeNeedsAttention(
  workspace: PropertyWorkspace
): AttentionIssue[] {
  const { property, rooms, media, applications, rentCharges, maintenance } =
    workspace;
  const issues: AttentionIssue[] = [];

  // --- Urgent -------------------------------------------------------------
  const overdue = rentCharges.filter((c) => c.status === "overdue");
  for (const charge of overdue) {
    issues.push({
      id: `rent-${charge.id}`,
      severity: "urgent",
      kind: "rent_overdue",
      title: "Rent overdue",
      description: "This charge is past due and needs follow-up.",
      location: [charge.tenant_name, charge.bed_label].filter(Boolean).join(" · "),
      href: "#payments",
      actionLabel: "Review",
    });
  }

  const openMaintenance = maintenance.filter(
    (m) => m.status === "open" || m.status === "in_progress"
  );
  for (const req of openMaintenance) {
    const urgent = req.priority === "urgent" || req.priority === "high";
    issues.push({
      id: `maint-${req.id}`,
      severity: urgent ? "urgent" : "review",
      kind: "maintenance_open",
      title: urgent ? "Urgent maintenance" : "Open maintenance",
      description: req.title,
      location: [req.room_name, req.bed_label].filter(Boolean).join(" · "),
      href: "#maintenance",
      actionLabel: "View",
    });
  }

  // --- Needs Review -------------------------------------------------------
  const pendingApps = applications.filter(
    (a) => a.status === "submitted" || a.status === "under_review"
  );
  for (const app of pendingApps) {
    issues.push({
      id: `app-${app.id}`,
      severity: "review",
      kind: "application_pending",
      title: "Application waiting review",
      description: `${app.full_name} applied${
        app.bed_label ? ` for ${app.bed_label}` : ""
      }.`,
      location: [app.room_name, app.bed_label].filter(Boolean).join(" · "),
      href: `/dashboard/applications/${app.id}`,
      actionLabel: "Review",
    });
  }

  // --- Setup Missing ------------------------------------------------------
  const propertyPhotos = media.filter((m) => m.media_type === "property");
  if (propertyPhotos.length === 0) {
    issues.push({
      id: `prop-photos-${property.id}`,
      severity: "setup",
      kind: "property_no_photos",
      title: "Property has no photos",
      description: "Add photos so listings and applicants can see the space.",
      location: property.name,
      href: "#photos",
      actionLabel: "Add photos",
    });
  }

  for (const room of rooms) {
    if (room.beds.length === 0) {
      issues.push({
        id: `room-nobeds-${room.id}`,
        severity: "setup",
        kind: "room_no_beds",
        title: "Room has no beds",
        description: "Add beds to start tracking availability and rent.",
        location: room.name,
        href: `#room-${room.id}`,
        actionLabel: "Add beds",
      });
    }

    for (const bed of room.beds) {
      const loc = `${room.name} · ${bed.label}`;

      if (bed.status === "reserved") {
        issues.push({
          id: `bed-reserved-${bed.id}`,
          severity: "review",
          kind: "bed_reserved",
          title: "Bed reserved",
          description: "Confirm move-in and deposit for this reservation.",
          location: loc,
          href: `#room-${room.id}`,
          actionLabel: "Open",
        });
      }
      if (bed.status === "unavailable") {
        issues.push({
          id: `bed-unavailable-${bed.id}`,
          severity: "review",
          kind: "bed_unavailable",
          title: "Bed unavailable",
          description: "This bed is marked unavailable and earns no rent.",
          location: loc,
          href: `#room-${room.id}`,
          actionLabel: "Open",
        });
      }
      // Consolidate a bed's setup gaps into a single calm row so one
      // under-configured bed doesn't flood the panel with duplicates.
      const missing: string[] = [];
      if (!bed.monthly_rent || bed.monthly_rent <= 0) missing.push("rent");
      if (!bed.deposit_amount || bed.deposit_amount <= 0) missing.push("deposit");
      const bedPhotos = media.filter(
        (m) => m.media_type === "bed" && m.bed_id === bed.id
      );
      if (bedPhotos.length === 0) missing.push("photos");

      if (missing.length > 0) {
        issues.push({
          id: `bed-setup-${bed.id}`,
          severity: "setup",
          kind: "bed_setup",
          title: "Finish bed setup",
          description: `Add ${missing.join(", ")} for this bed.`,
          location: loc,
          href: `#room-${room.id}`,
          actionLabel: "Fix",
        });
      }
    }
  }

  return issues;
}

export const SEVERITY_META: Record<
  IssueSeverity,
  { label: string; dot: string; badge: string }
> = {
  urgent: {
    label: "Urgent",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  },
  review: {
    label: "Needs Review",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  },
  setup: {
    label: "Setup Missing",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
  },
};
