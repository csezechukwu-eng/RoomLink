"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  EyeOff,
  Calendar,
  Users,
  Camera,
  AlertCircle,
  Check,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/FormField";
import { FormAlert } from "@/components/forms/FormAlert";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { updateListingSettings } from "@/lib/actions/listingSettings";
import { initialActionState } from "@/lib/actions/types";
import { formatCurrency } from "@/lib/utils";
import type { Property, BedStatusCounts } from "@/lib/types";
import { COMPLIANCE_TEXT } from "@/lib/productConfig";

// Occupancy type options with labels
const OCCUPANCY_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "coed", label: "Co-ed (all genders welcome)" },
  { value: "women_only_house", label: "Women-only house" },
  { value: "women_only_rooms_available", label: "Women-only rooms available" },
] as const;

interface ListingSettingsPanelProps {
  property: Property;
  bedCounts: BedStatusCounts;
  /** Minimum rent across all beds */
  minRent: number | null;
  /** Maximum rent across all beds */
  maxRent: number | null;
  /** Minimum deposit across all beds */
  minDeposit: number | null;
  /** Maximum deposit across all beds */
  maxDeposit: number | null;
}

export function ListingSettingsPanel({
  property,
  bedCounts,
  minRent,
  maxRent,
  minDeposit,
  maxDeposit,
}: ListingSettingsPanelProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateListingSettings, initialActionState);

  // Refresh on success
  React.useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state, router]);

  const isPublished = !property.is_hidden;

  // Format rent range
  const rentDisplay = minRent !== null
    ? minRent === maxRent
      ? formatCurrency(minRent)
      : `${formatCurrency(minRent)} - ${formatCurrency(maxRent)}`
    : "Not set";

  // Format deposit range
  const depositDisplay = minDeposit !== null
    ? minDeposit === maxDeposit
      ? formatCurrency(minDeposit)
      : `${formatCurrency(minDeposit)} - ${formatCurrency(maxDeposit)}`
    : "Not set";

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Listing Settings
        </h2>
        {isPublished ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            <Globe className="h-3 w-3" />
            Published
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
            <EyeOff className="h-3 w-3" />
            Hidden
          </span>
        )}
      </div>

      <Card className="p-5">
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="id" value={property.id} />

          <FormAlert state={state} />

          {/* Quick Stats - Read Only */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
              <p className="text-2xl font-bold text-slate-900">{bedCounts.total}</p>
              <p className="text-xs text-slate-500">Total Beds</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">{bedCounts.vacant}</p>
              <p className="text-xs text-slate-500">Available</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
              <p className="text-sm font-semibold text-slate-900">{rentDisplay}</p>
              <p className="text-xs text-slate-500">Monthly Rent</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
              <p className="text-sm font-semibold text-slate-900">{depositDisplay}</p>
              <p className="text-xs text-slate-500">Deposit</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            Rent and deposit are set per-bed in the Rooms & Beds section above.
            Capacity and availability are computed from your beds.
          </p>

          {/* Publish Toggle */}
          <FormField
            label="Publish listing"
            htmlFor="is_hidden"
          >
            <Select
              id="is_hidden"
              name="is_hidden"
              defaultValue={property.is_hidden ? "true" : "false"}
            >
              <option value="false">Yes - Visible in public listings</option>
              <option value="true">No - Hidden from public</option>
            </Select>
          </FormField>

          {/* Minimum Stay */}
          <FormField
            label="Minimum stay"
            htmlFor="default_min_stay_days"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-600">
                30 days (monthly stay)
              </span>
              <input
                type="hidden"
                name="default_min_stay_days"
                value={property.default_min_stay_days ?? 30}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              renta bed is a monthly-stay marketplace. Minimum stay is 30 days.
            </p>
          </FormField>

          {/* Billing Period */}
          <FormField label="Billing period" htmlFor="billing_period">
            <div className="text-sm text-slate-600">Monthly</div>
            <p className="mt-1 text-xs text-slate-500">
              Rent is collected monthly through renta bed.
            </p>
          </FormField>

          {/* Occupancy Type */}
          <FormField
            label="Occupancy type"
            htmlFor="occupancy_type"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <Select
                id="occupancy_type"
                name="occupancy_type"
                defaultValue={property.occupancy_type ?? ""}
                className="flex-1"
              >
                {OCCUPANCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </FormField>

          {/* Fair Housing Compliance Note */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                {COMPLIANCE_TEXT.occupancyPreferences}
              </p>
            </div>
          </div>

          {/* Checkout Photos */}
          <FormField
            label="Checkout photos required"
            htmlFor="checkout_photo_required"
          >
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-slate-400" />
              <Select
                id="checkout_photo_required"
                name="checkout_photo_required"
                defaultValue={property.checkout_photo_required ? "true" : "false"}
                className="flex-1"
              >
                <option value="true">Yes - Tenants must upload move-out photos</option>
                <option value="false">No - Photos not required</option>
              </Select>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              When enabled, tenants will be prompted to document condition at checkout.
            </p>
          </FormField>

          {/* Public Info Summary */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
            <h4 className="text-sm font-medium text-slate-900">Public listing shows:</h4>
            <ul className="text-xs text-slate-600 space-y-1">
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500" />
                Property name: {property.name}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500" />
                Location: {[property.city, property.state].filter(Boolean).join(", ") || "Not set"}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500" />
                Monthly rent range: {rentDisplay}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500" />
                Available beds: {bedCounts.vacant} of {bedCounts.total}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500" />
                Minimum stay: 30 days
              </li>
            </ul>
            <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
              Edit property name, description, and house rules in the Edit Property modal.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <SubmitButton>Save Listing Settings</SubmitButton>
          </div>
        </form>
      </Card>
    </section>
  );
}
