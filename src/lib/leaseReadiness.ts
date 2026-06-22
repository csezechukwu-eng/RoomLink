// Pure, client-safe lease-readiness logic. No server imports.

export interface LeaseContextApplication {
  id: string;
  status: string;
  full_name: string | null;
  email: string | null;
  desired_move_in: string | null;
  applicant_id: string | null;
}
export interface LeaseContextProperty {
  id: string;
  name: string | null;
  address: string | null;
}
export interface LeaseContextRoom {
  id: string;
  name: string | null;
}
export interface LeaseContextBed {
  id: string;
  label: string | null;
  monthly_rent: number | null;
  deposit_amount: number | null;
}

export interface LeaseContext {
  application: LeaseContextApplication;
  property: LeaseContextProperty | null;
  room: LeaseContextRoom | null;
  bed: LeaseContextBed | null;
}

export interface ReadinessItem {
  key: string;
  label: string;
  complete: boolean;
  /** Required items gate lease upload; non-required are informational. */
  required: boolean;
  hint?: string;
}

export interface LeaseReadiness {
  items: ReadinessItem[];
  ready: boolean;
}

/**
 * Compute the lease readiness checklist from real data only. `ready` is true
 * only when every *required* item is complete.
 */
export function computeLeaseReadiness(ctx: LeaseContext): LeaseReadiness {
  const { application, property, room, bed } = ctx;

  const items: ReadinessItem[] = [
    {
      key: "approved",
      label: "Application approved",
      complete: application.status === "approved",
      required: true,
      hint: "Approve the application before preparing a lease.",
    },
    {
      key: "property",
      label: "Property selected",
      complete: Boolean(property),
      required: true,
    },
    {
      key: "bed",
      label: "Bed assigned",
      complete: Boolean(bed),
      required: true,
      hint: "Assign a bed before preparing a lease.",
    },
    {
      key: "rent",
      label: "Rent amount added",
      complete: Boolean(bed && bed.monthly_rent != null && bed.monthly_rent > 0),
      required: true,
      hint: "Add monthly rent to the bed.",
    },
    {
      key: "deposit",
      label: "Deposit amount set",
      complete: Boolean(bed && bed.deposit_amount != null),
      required: true,
      hint: "Set a deposit amount (use 0 if none).",
    },
    {
      key: "tenant_name",
      label: "Tenant name available",
      complete: Boolean(application.full_name && application.full_name.trim()),
      required: true,
    },
    // Informational — present in our data but not strictly blocking.
    {
      key: "room",
      label: "Room identified",
      complete: Boolean(room),
      required: false,
    },
    {
      key: "move_in",
      label: "Move-in date selected",
      complete: Boolean(application.desired_move_in),
      required: false,
      hint: "Add a desired move-in date on the application.",
    },
    {
      key: "tenant_contact",
      label: "Tenant contact available",
      complete: Boolean(application.email && application.email.trim()),
      required: false,
    },
  ];

  const ready = items.filter((i) => i.required).every((i) => i.complete);
  return { items, ready };
}

export const LEASE_TERM_OPTIONS: { value: string; label: string }[] = [
  { value: "month_to_month", label: "Month-to-month" },
  { value: "fixed_term", label: "Fixed term" },
  { value: "short_term_bed", label: "Short-term bed rental" },
];
