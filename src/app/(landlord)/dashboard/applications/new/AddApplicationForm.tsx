"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/FormField";
import { FormAlert } from "@/components/forms/FormAlert";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { submitApplicationAction } from "@/lib/actions/applications";
import { initialActionState } from "@/lib/actions/types";
import {
  COMMUTER_STATUSES,
  EMPLOYMENT_STATUSES,
  GOVERNMENT_ID_STATUSES,
  SMOKING_STATUSES,
  LENGTH_OF_STAY_OPTIONS,
  REFERRAL_SOURCES,
  PAYMENT_METHODS,
} from "@/lib/constants";
import type { Property, RoomWithBeds } from "@/lib/types";

interface AddApplicationFormProps {
  propertiesWithRooms: Array<{
    property: Property;
    rooms: RoomWithBeds[];
  }>;
}

export function AddApplicationForm({ propertiesWithRooms }: AddApplicationFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(submitApplicationAction, initialActionState);
  const [selectedPropertyId, setSelectedPropertyId] = React.useState("");
  const [selectedBedId, setSelectedBedId] = React.useState("");

  const fieldErrors = state.fieldErrors ?? {};

  // Get rooms for selected property
  const selectedPropertyData = propertiesWithRooms.find(
    (p) => p.property.id === selectedPropertyId
  );
  const availableBeds = selectedPropertyData?.rooms.flatMap((room) =>
    room.beds
      .filter((bed) => bed.status === "vacant")
      .map((bed) => ({
        ...bed,
        roomName: room.name,
      }))
  ) ?? [];

  // Redirect on success
  React.useEffect(() => {
    if (state.status === "success") {
      router.push("/dashboard/applications");
    }
  }, [state.status, router]);

  return (
    <Card className="p-6">
      <form action={formAction} className="space-y-8">
        <FormAlert state={state} />

        {/* Property & Bed Selection */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Property & Bed</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Property" htmlFor="property_id" required error={fieldErrors.property_id}>
              <Select
                id="property_id"
                name="property_id"
                value={selectedPropertyId}
                onChange={(e) => {
                  setSelectedPropertyId(e.target.value);
                  setSelectedBedId("");
                }}
                aria-invalid={Boolean(fieldErrors.property_id)}
              >
                <option value="">Select a property</option>
                {propertiesWithRooms.map(({ property }) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Bed (Optional)" htmlFor="bed_id">
              <Select
                id="bed_id"
                name="bed_id"
                value={selectedBedId}
                onChange={(e) => setSelectedBedId(e.target.value)}
                disabled={!selectedPropertyId}
              >
                <option value="">Select a bed (optional)</option>
                {availableBeds.map((bed) => (
                  <option key={bed.id} value={bed.id}>
                    {bed.roomName} - {bed.label} (${bed.monthly_rent}/mo)
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* Personal Information */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Personal Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="First Name" htmlFor="first_name" required error={fieldErrors.first_name}>
                <Input
                  id="first_name"
                  name="first_name"
                  placeholder="John"
                  aria-invalid={Boolean(fieldErrors.first_name)}
                />
              </FormField>
              <FormField label="Last Name" htmlFor="last_name" required error={fieldErrors.last_name}>
                <Input
                  id="last_name"
                  name="last_name"
                  placeholder="Doe"
                  aria-invalid={Boolean(fieldErrors.last_name)}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Email Address" htmlFor="email" required error={fieldErrors.email}>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  aria-invalid={Boolean(fieldErrors.email)}
                />
              </FormField>
              <FormField label="Phone Number" htmlFor="phone" required error={fieldErrors.phone}>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  aria-invalid={Boolean(fieldErrors.phone)}
                />
              </FormField>
            </div>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* Stay Details */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Stay Details</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Desired Move-In Date" htmlFor="desired_move_in" required error={fieldErrors.desired_move_in}>
                <Input
                  id="desired_move_in"
                  name="desired_move_in"
                  type="date"
                  aria-invalid={Boolean(fieldErrors.desired_move_in)}
                />
              </FormField>
              <FormField label="Length of Stay" htmlFor="length_of_stay" required error={fieldErrors.length_of_stay}>
                <Select
                  id="length_of_stay"
                  name="length_of_stay"
                  aria-invalid={Boolean(fieldErrors.length_of_stay)}
                >
                  <option value="">Select length of stay</option>
                  {LENGTH_OF_STAY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
            <FormField label="Commuter Status" htmlFor="commuter_status" required error={fieldErrors.commuter_status}>
              <Select
                id="commuter_status"
                name="commuter_status"
                aria-invalid={Boolean(fieldErrors.commuter_status)}
              >
                <option value="">Select commuter status</option>
                {COMMUTER_STATUSES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Reason for Stay" htmlFor="reason_for_stay" required error={fieldErrors.reason_for_stay}>
              <Textarea
                id="reason_for_stay"
                name="reason_for_stay"
                rows={3}
                placeholder="Why is the applicant looking for accommodation?"
                aria-invalid={Boolean(fieldErrors.reason_for_stay)}
              />
            </FormField>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* Employment */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Employment Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="Employment Status" htmlFor="employment_status" required error={fieldErrors.employment_status}>
                <Select
                  id="employment_status"
                  name="employment_status"
                  aria-invalid={Boolean(fieldErrors.employment_status)}
                >
                  <option value="">Select status</option>
                  {EMPLOYMENT_STATUSES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Employer Name" htmlFor="employer_name" required error={fieldErrors.employer_name}>
                <Input
                  id="employer_name"
                  name="employer_name"
                  placeholder="Company Name"
                  aria-invalid={Boolean(fieldErrors.employer_name)}
                />
              </FormField>
              <FormField label="Monthly Income" htmlFor="monthly_income" required error={fieldErrors.monthly_income}>
                <Input
                  id="monthly_income"
                  name="monthly_income"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="5000"
                  aria-invalid={Boolean(fieldErrors.monthly_income)}
                />
              </FormField>
            </div>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* Emergency Contact */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Emergency Contact</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Contact Name" htmlFor="emergency_contact_name" required error={fieldErrors.emergency_contact_name}>
              <Input
                id="emergency_contact_name"
                name="emergency_contact_name"
                placeholder="Jane Doe"
                aria-invalid={Boolean(fieldErrors.emergency_contact_name)}
              />
            </FormField>
            <FormField label="Contact Phone" htmlFor="emergency_contact_phone" required error={fieldErrors.emergency_contact_phone}>
              <Input
                id="emergency_contact_phone"
                name="emergency_contact_phone"
                type="tel"
                placeholder="(555) 987-6543"
                aria-invalid={Boolean(fieldErrors.emergency_contact_phone)}
              />
            </FormField>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* ID & Background */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">ID & Background Check</h3>
          <div className="space-y-4">
            <FormField label="Government ID Status" htmlFor="government_id_status" required error={fieldErrors.government_id_status}>
              <Select
                id="government_id_status"
                name="government_id_status"
                aria-invalid={Boolean(fieldErrors.government_id_status)}
              >
                <option value="">Select ID status</option>
                {GOVERNMENT_ID_STATUSES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="background_check_consent"
                  value="true"
                  defaultChecked
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-medium text-slate-900">
                    Background Check Consent <span className="text-red-500">*</span>
                  </span>
                  <p className="mt-1 text-sm text-slate-600">
                    The applicant has consented to a background check.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* Optional Details */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Additional Details (Optional)</h3>
          <div className="space-y-4">
            <FormField label="Current Address" htmlFor="current_address">
              <Textarea
                id="current_address"
                name="current_address"
                rows={2}
                placeholder="123 Main St, City, State ZIP"
              />
            </FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Referral Source" htmlFor="referral_source">
                <Select id="referral_source" name="referral_source">
                  <option value="">Select source</option>
                  {REFERRAL_SOURCES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Payment Preference" htmlFor="preferred_payment_method">
                <Select id="preferred_payment_method" name="preferred_payment_method">
                  <option value="">Select method</option>
                  {PAYMENT_METHODS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Vehicle Information" htmlFor="vehicle_info">
                <Input id="vehicle_info" name="vehicle_info" placeholder="2020 Honda Civic, ABC-1234" />
              </FormField>
              <FormField label="Pet Information" htmlFor="pet_info">
                <Input id="pet_info" name="pet_info" placeholder="Small dog, Labrador" />
              </FormField>
            </div>
            <FormField label="Smoking Status" htmlFor="smoking_status">
              <Select id="smoking_status" name="smoking_status">
                <option value="">Select status</option>
                {SMOKING_STATUSES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Applicant Notes" htmlFor="tenant_notes">
              <Textarea
                id="tenant_notes"
                name="tenant_notes"
                rows={3}
                placeholder="Any notes from the applicant..."
              />
            </FormField>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <SubmitButton>Add Application</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
