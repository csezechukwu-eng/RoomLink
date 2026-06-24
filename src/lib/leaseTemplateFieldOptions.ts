// Lease template field options - shared between client and server
import type {
  LeaseTemplateFieldType,
  LeaseTemplateFieldAssignedTo,
} from "@/lib/types";

export interface FieldTypeOption {
  value: LeaseTemplateFieldType;
  label: string;
  description: string;
  /** Default label when adding this field type */
  defaultLabel: string;
  /** Default required value */
  defaultRequired: boolean;
  /** Field key prefix for unique ID generation */
  keyPrefix: string;
  /** Default width as percentage (0-100) */
  defaultWidth: number;
  /** Default height as percentage (0-100) */
  defaultHeight: number;
}

export const FIELD_TYPE_OPTIONS: FieldTypeOption[] = [
  {
    value: "tenant_signature",
    label: "Signature",
    description: "Tenant's signature on the lease",
    defaultLabel: "Tenant Signature",
    defaultRequired: true,
    keyPrefix: "SIG",
    defaultWidth: 30, // ~200px at 650px width
    defaultHeight: 6, // ~50px at 850px height
  },
  {
    value: "tenant_initials",
    label: "Initials",
    description: "Tenant's initials (e.g., for clauses)",
    defaultLabel: "Tenant Initials",
    defaultRequired: false,
    keyPrefix: "INIT",
    defaultWidth: 12, // ~80px
    defaultHeight: 5, // ~40px
  },
  {
    value: "date_signed",
    label: "Date Signed",
    description: "Date when the document is signed",
    defaultLabel: "Date Signed",
    defaultRequired: true,
    keyPrefix: "DATE",
    defaultWidth: 18, // ~120px
    defaultHeight: 3.5, // ~30px
  },
  {
    value: "tenant_full_name",
    label: "Full Name",
    description: "Tenant's printed full name",
    defaultLabel: "Tenant Full Name",
    defaultRequired: true,
    keyPrefix: "NAME",
    defaultWidth: 30, // ~200px
    defaultHeight: 3.5, // ~30px
  },
  {
    value: "email",
    label: "Email",
    description: "Email address field",
    defaultLabel: "Email Address",
    defaultRequired: false,
    keyPrefix: "EMAIL",
    defaultWidth: 30, // ~200px
    defaultHeight: 3.5, // ~30px
  },
  {
    value: "phone",
    label: "Phone",
    description: "Phone number field",
    defaultLabel: "Phone Number",
    defaultRequired: false,
    keyPrefix: "PHONE",
    defaultWidth: 22, // ~150px
    defaultHeight: 3.5, // ~30px
  },
  {
    value: "text",
    label: "Text",
    description: "Generic text input field",
    defaultLabel: "Text Field",
    defaultRequired: false,
    keyPrefix: "TEXT",
    defaultWidth: 30, // ~200px
    defaultHeight: 3.5, // ~30px
  },
  {
    value: "checkbox",
    label: "Checkbox",
    description: "Agreement checkbox field",
    defaultLabel: "I Agree",
    defaultRequired: false,
    keyPrefix: "CHECK",
    defaultWidth: 3.5, // ~24px square
    defaultHeight: 3, // ~24px square
  },
];

/** Field groups for the designer palette */
export const FIELD_PALETTE_GROUPS: {
  title: string;
  fields: LeaseTemplateFieldType[];
}[] = [
  {
    title: "Signing Fields",
    fields: ["tenant_signature", "tenant_initials", "date_signed"],
  },
  {
    title: "Person Fields",
    fields: ["tenant_full_name", "email", "phone"],
  },
  {
    title: "Text & Agreement",
    fields: ["text", "checkbox"],
  },
];

export const ASSIGNED_TO_OPTIONS: {
  value: LeaseTemplateFieldAssignedTo;
  label: string;
}[] = [
  { value: "tenant", label: "Tenant" },
  { value: "landlord", label: "Landlord" },
];

export function getFieldTypeLabel(value: LeaseTemplateFieldType): string {
  return FIELD_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function getFieldTypeOption(value: LeaseTemplateFieldType) {
  return FIELD_TYPE_OPTIONS.find((o) => o.value === value);
}

export function getAssignedToLabel(value: LeaseTemplateFieldAssignedTo): string {
  return ASSIGNED_TO_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

/** Generate a unique field key for a given field type within a template */
export function generateFieldKey(
  fieldType: LeaseTemplateFieldType,
  existingKeys: string[]
): string {
  const option = getFieldTypeOption(fieldType);
  const prefix = option?.keyPrefix ?? "FIELD";

  // Find the highest number for this prefix
  let maxNum = 0;
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);

  for (const key of existingKeys) {
    const match = key.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  // Generate next number, padded to 3 digits
  const nextNum = maxNum + 1;
  return `${prefix}-${nextNum.toString().padStart(3, "0")}`;
}
