"use client";

import * as React from "react";
import { useActionState } from "react";
import { ChevronLeft, ChevronRight, Check, AlertCircle } from "lucide-react";
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
import type { Bed, Room, Property } from "@/lib/types";

interface ApplicationFormProps {
  property: Property;
  rooms: Array<Room & { beds: Bed[] }>;
  selectedBedId?: string;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEP_TITLES: Record<Step, string> = {
  1: "Personal Information",
  2: "Stay Details",
  3: "Commuter Status",
  4: "Employment & Emergency Contact",
  5: "Additional Details",
  6: "Review & Submit",
};

export function ApplicationForm({
  property,
  rooms,
  selectedBedId,
}: ApplicationFormProps) {
  const [state, formAction] = useActionState(
    submitApplicationAction,
    initialActionState
  );
  const [currentStep, setCurrentStep] = React.useState<Step>(1);
  const [formData, setFormData] = React.useState({
    // Personal Information
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    // Stay Details
    desired_move_in: "",
    length_of_stay: "",
    reason_for_stay: "",
    room_id: "",
    bed_id: selectedBedId || "",
    // Commuter Status
    commuter_status: "",
    commuter_status_other: "",
    // Employment
    employment_status: "",
    employer_name: "",
    monthly_income: "",
    // Emergency Contact
    emergency_contact_name: "",
    emergency_contact_phone: "",
    // Additional Details (optional)
    current_address: "",
    referral_source: "",
    preferred_payment_method: "",
    vehicle_info: "",
    pet_info: "",
    smoking_status: "",
    tenant_notes: "",
    // ID & Background
    government_id_status: "",
    background_check_consent: false,
  });

  const fieldErrors = state.fieldErrors ?? {};

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const canProceed = (step: Step): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.first_name &&
          formData.last_name &&
          formData.email &&
          formData.phone
        );
      case 2:
        return !!(
          formData.desired_move_in &&
          formData.length_of_stay &&
          formData.reason_for_stay
        );
      case 3:
        return !!formData.commuter_status;
      case 4:
        return !!(
          formData.employment_status &&
          formData.employer_name &&
          formData.monthly_income &&
          formData.emergency_contact_name &&
          formData.emergency_contact_phone
        );
      case 5:
        return !!(
          formData.government_id_status && formData.background_check_consent
        );
      default:
        return true;
    }
  };

  const goNext = () => {
    if (currentStep < 6) setCurrentStep((currentStep + 1) as Step);
  };

  const goBack = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as Step);
  };

  // Get available beds for room selection
  const availableBeds = rooms.flatMap((room) =>
    room.beds
      .filter((bed) => bed.status === "vacant")
      .map((bed) => ({
        ...bed,
        roomName: room.name,
      }))
  );

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {([1, 2, 3, 4, 5, 6] as Step[]).map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                  currentStep === step
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : currentStep > step
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-300 bg-white text-slate-400"
                }`}
              >
                {currentStep > step ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step
                )}
              </div>
              <span className="mt-2 hidden text-xs text-slate-500 sm:block">
                {STEP_TITLES[step]}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            Step {currentStep}: {STEP_TITLES[currentStep]}
          </h2>
        </div>
      </div>

      <Card className="p-6">
        <form action={formAction}>
          {/* Hidden fields */}
          <input type="hidden" name="property_id" value={property.id} />
          <input type="hidden" name="room_id" value={formData.room_id} />
          <input type="hidden" name="bed_id" value={formData.bed_id} />
          <input
            type="hidden"
            name="background_check_consent"
            value={formData.background_check_consent ? "true" : "false"}
          />

          <FormAlert state={state} />

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="First Name"
                  htmlFor="first_name"
                  required
                  error={fieldErrors.first_name}
                >
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="John"
                    aria-invalid={Boolean(fieldErrors.first_name)}
                  />
                </FormField>

                <FormField
                  label="Last Name"
                  htmlFor="last_name"
                  required
                  error={fieldErrors.last_name}
                >
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Doe"
                    aria-invalid={Boolean(fieldErrors.last_name)}
                  />
                </FormField>
              </div>

              <FormField
                label="Email Address"
                htmlFor="email"
                required
                error={fieldErrors.email}
              >
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  aria-invalid={Boolean(fieldErrors.email)}
                />
              </FormField>

              <FormField
                label="Phone Number"
                htmlFor="phone"
                required
                error={fieldErrors.phone}
              >
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                  aria-invalid={Boolean(fieldErrors.phone)}
                />
              </FormField>
            </div>
          )}

          {/* Step 2: Stay Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <FormField
                label="Desired Move-In Date"
                htmlFor="desired_move_in"
                required
                error={fieldErrors.desired_move_in}
              >
                <Input
                  id="desired_move_in"
                  name="desired_move_in"
                  type="date"
                  value={formData.desired_move_in}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  aria-invalid={Boolean(fieldErrors.desired_move_in)}
                />
              </FormField>

              <FormField
                label="Length of Stay"
                htmlFor="length_of_stay"
                required
                error={fieldErrors.length_of_stay}
              >
                <Select
                  id="length_of_stay"
                  name="length_of_stay"
                  value={formData.length_of_stay}
                  onChange={handleChange}
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

              {availableBeds.length > 0 && (
                <FormField
                  label="Preferred Bed (Optional)"
                  htmlFor="bed_id"
                  hint="Select a specific bed if you have a preference"
                >
                  <Select
                    id="bed_id"
                    name="bed_id"
                    value={formData.bed_id}
                    onChange={handleChange}
                  >
                    <option value="">No preference</option>
                    {availableBeds.map((bed) => (
                      <option key={bed.id} value={bed.id}>
                        {bed.roomName} - {bed.label} (${bed.monthly_rent}/mo)
                      </option>
                    ))}
                  </Select>
                </FormField>
              )}

              <FormField
                label="Reason for Stay"
                htmlFor="reason_for_stay"
                required
                error={fieldErrors.reason_for_stay}
                hint="Please describe why you're looking for accommodation"
              >
                <Textarea
                  id="reason_for_stay"
                  name="reason_for_stay"
                  value={formData.reason_for_stay}
                  onChange={handleChange}
                  rows={3}
                  placeholder="I'm looking for housing because..."
                  aria-invalid={Boolean(fieldErrors.reason_for_stay)}
                />
              </FormField>
            </div>
          )}

          {/* Step 3: Commuter Status */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <FormField
                label="Commuter Status"
                htmlFor="commuter_status"
                required
                error={fieldErrors.commuter_status}
                hint="Select the option that best describes your situation"
              >
                <Select
                  id="commuter_status"
                  name="commuter_status"
                  value={formData.commuter_status}
                  onChange={handleChange}
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

              {formData.commuter_status === "other" && (
                <FormField
                  label="Please Explain"
                  htmlFor="commuter_status_other"
                  hint="Describe your commuter situation"
                >
                  <Textarea
                    id="commuter_status_other"
                    name="commuter_status_other"
                    value={formData.commuter_status_other}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Please describe your situation..."
                  />
                </FormField>
              )}

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h4 className="font-medium text-slate-900">
                  Why do we ask this?
                </h4>
                <p className="mt-1 text-sm text-slate-600">
                  Understanding your commuter status helps us ensure you&apos;re a
                  good fit for our property and allows us to better serve your
                  needs.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Employment & Emergency Contact */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Employment Information
                </h3>
                <div className="space-y-4">
                  <FormField
                    label="Employment Status"
                    htmlFor="employment_status"
                    required
                    error={fieldErrors.employment_status}
                  >
                    <Select
                      id="employment_status"
                      name="employment_status"
                      value={formData.employment_status}
                      onChange={handleChange}
                      aria-invalid={Boolean(fieldErrors.employment_status)}
                    >
                      <option value="">Select employment status</option>
                      {EMPLOYMENT_STATUSES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField
                    label="Employer Name"
                    htmlFor="employer_name"
                    required
                    error={fieldErrors.employer_name}
                  >
                    <Input
                      id="employer_name"
                      name="employer_name"
                      value={formData.employer_name}
                      onChange={handleChange}
                      placeholder="Company Name"
                      aria-invalid={Boolean(fieldErrors.employer_name)}
                    />
                  </FormField>

                  <FormField
                    label="Monthly Income"
                    htmlFor="monthly_income"
                    required
                    error={fieldErrors.monthly_income}
                  >
                    <Input
                      id="monthly_income"
                      name="monthly_income"
                      type="number"
                      min="0"
                      step="100"
                      value={formData.monthly_income}
                      onChange={handleChange}
                      placeholder="5000"
                      aria-invalid={Boolean(fieldErrors.monthly_income)}
                    />
                  </FormField>
                </div>
              </div>

              <hr className="border-slate-200" />

              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Emergency Contact
                </h3>
                <div className="space-y-4">
                  <FormField
                    label="Emergency Contact Name"
                    htmlFor="emergency_contact_name"
                    required
                    error={fieldErrors.emergency_contact_name}
                  >
                    <Input
                      id="emergency_contact_name"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      aria-invalid={Boolean(fieldErrors.emergency_contact_name)}
                    />
                  </FormField>

                  <FormField
                    label="Emergency Contact Phone"
                    htmlFor="emergency_contact_phone"
                    required
                    error={fieldErrors.emergency_contact_phone}
                  >
                    <Input
                      id="emergency_contact_phone"
                      name="emergency_contact_phone"
                      type="tel"
                      value={formData.emergency_contact_phone}
                      onChange={handleChange}
                      placeholder="(555) 987-6543"
                      aria-invalid={Boolean(
                        fieldErrors.emergency_contact_phone
                      )}
                    />
                  </FormField>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Additional Details */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  ID & Background Check
                </h3>
                <div className="space-y-4">
                  <FormField
                    label="Government ID Status"
                    htmlFor="government_id_status"
                    required
                    error={fieldErrors.government_id_status}
                  >
                    <Select
                      id="government_id_status"
                      name="government_id_status"
                      value={formData.government_id_status}
                      onChange={handleChange}
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

                  <div
                    className={`rounded-lg border p-4 ${
                      fieldErrors.background_check_consent
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        name="background_check_consent_checkbox"
                        checked={formData.background_check_consent}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            background_check_consent: e.target.checked,
                          }))
                        }
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-medium text-slate-900">
                          Background Check Consent{" "}
                          <span className="text-red-500">*</span>
                        </span>
                        <p className="mt-1 text-sm text-slate-600">
                          I consent to a background check being performed as
                          part of the application process. I understand this may
                          include verification of identity, criminal history,
                          and rental history.
                        </p>
                      </div>
                    </label>
                    {fieldErrors.background_check_consent && (
                      <p className="mt-2 flex items-center gap-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        {fieldErrors.background_check_consent}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <hr className="border-slate-200" />

              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Optional Information
                </h3>
                <div className="space-y-4">
                  <FormField label="Current Address" htmlFor="current_address">
                    <Textarea
                      id="current_address"
                      name="current_address"
                      value={formData.current_address}
                      onChange={handleChange}
                      rows={2}
                      placeholder="123 Main St, City, State ZIP"
                    />
                  </FormField>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      label="How did you hear about us?"
                      htmlFor="referral_source"
                    >
                      <Select
                        id="referral_source"
                        name="referral_source"
                        value={formData.referral_source}
                        onChange={handleChange}
                      >
                        <option value="">Select source</option>
                        {REFERRAL_SOURCES.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Select>
                    </FormField>

                    <FormField
                      label="Preferred Payment Method"
                      htmlFor="preferred_payment_method"
                    >
                      <Select
                        id="preferred_payment_method"
                        name="preferred_payment_method"
                        value={formData.preferred_payment_method}
                        onChange={handleChange}
                      >
                        <option value="">Select method</option>
                        {PAYMENT_METHODS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  </div>

                  <FormField
                    label="Vehicle Information"
                    htmlFor="vehicle_info"
                    hint="Make, model, year, license plate"
                  >
                    <Input
                      id="vehicle_info"
                      name="vehicle_info"
                      value={formData.vehicle_info}
                      onChange={handleChange}
                      placeholder="2020 Honda Civic, ABC-1234"
                    />
                  </FormField>

                  <FormField
                    label="Pet Information"
                    htmlFor="pet_info"
                    hint="Type, breed, size"
                  >
                    <Input
                      id="pet_info"
                      name="pet_info"
                      value={formData.pet_info}
                      onChange={handleChange}
                      placeholder="Small dog, Labrador, 30 lbs"
                    />
                  </FormField>

                  <FormField label="Smoking Status" htmlFor="smoking_status">
                    <Select
                      id="smoking_status"
                      name="smoking_status"
                      value={formData.smoking_status}
                      onChange={handleChange}
                    >
                      <option value="">Select status</option>
                      {SMOKING_STATUSES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField
                    label="Notes or Special Requests"
                    htmlFor="tenant_notes"
                  >
                    <Textarea
                      id="tenant_notes"
                      name="tenant_notes"
                      value={formData.tenant_notes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Any additional information you'd like to share..."
                    />
                  </FormField>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Review & Submit */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <h3 className="font-semibold text-emerald-800">
                  Ready to Submit
                </h3>
                <p className="mt-1 text-sm text-emerald-700">
                  Please review your information below before submitting your
                  application.
                </p>
              </div>

              <div className="space-y-4">
                <ReviewSection title="Personal Information">
                  <ReviewItem label="Name" value={`${formData.first_name} ${formData.last_name}`} />
                  <ReviewItem label="Email" value={formData.email} />
                  <ReviewItem label="Phone" value={formData.phone} />
                </ReviewSection>

                <ReviewSection title="Stay Details">
                  <ReviewItem label="Move-In Date" value={formData.desired_move_in} />
                  <ReviewItem
                    label="Length of Stay"
                    value={
                      LENGTH_OF_STAY_OPTIONS.find(
                        (o) => o.value === formData.length_of_stay
                      )?.label || formData.length_of_stay
                    }
                  />
                  <ReviewItem label="Reason" value={formData.reason_for_stay} />
                </ReviewSection>

                <ReviewSection title="Commuter Status">
                  <ReviewItem
                    label="Status"
                    value={
                      COMMUTER_STATUSES.find(
                        (o) => o.value === formData.commuter_status
                      )?.label || formData.commuter_status
                    }
                  />
                  {formData.commuter_status_other && (
                    <ReviewItem label="Details" value={formData.commuter_status_other} />
                  )}
                </ReviewSection>

                <ReviewSection title="Employment">
                  <ReviewItem
                    label="Status"
                    value={
                      EMPLOYMENT_STATUSES.find(
                        (o) => o.value === formData.employment_status
                      )?.label || formData.employment_status
                    }
                  />
                  <ReviewItem label="Employer" value={formData.employer_name} />
                  <ReviewItem
                    label="Monthly Income"
                    value={formData.monthly_income ? `$${formData.monthly_income}` : ""}
                  />
                </ReviewSection>

                <ReviewSection title="Emergency Contact">
                  <ReviewItem label="Name" value={formData.emergency_contact_name} />
                  <ReviewItem label="Phone" value={formData.emergency_contact_phone} />
                </ReviewSection>
              </div>

              {/* Hidden form fields for submission */}
              <input type="hidden" name="first_name" value={formData.first_name} />
              <input type="hidden" name="last_name" value={formData.last_name} />
              <input type="hidden" name="email" value={formData.email} />
              <input type="hidden" name="phone" value={formData.phone} />
              <input type="hidden" name="desired_move_in" value={formData.desired_move_in} />
              <input type="hidden" name="length_of_stay" value={formData.length_of_stay} />
              <input type="hidden" name="reason_for_stay" value={formData.reason_for_stay} />
              <input type="hidden" name="commuter_status" value={formData.commuter_status} />
              <input type="hidden" name="commuter_status_other" value={formData.commuter_status_other} />
              <input type="hidden" name="employment_status" value={formData.employment_status} />
              <input type="hidden" name="employer_name" value={formData.employer_name} />
              <input type="hidden" name="monthly_income" value={formData.monthly_income} />
              <input type="hidden" name="emergency_contact_name" value={formData.emergency_contact_name} />
              <input type="hidden" name="emergency_contact_phone" value={formData.emergency_contact_phone} />
              <input type="hidden" name="government_id_status" value={formData.government_id_status} />
              <input type="hidden" name="current_address" value={formData.current_address} />
              <input type="hidden" name="referral_source" value={formData.referral_source} />
              <input type="hidden" name="preferred_payment_method" value={formData.preferred_payment_method} />
              <input type="hidden" name="vehicle_info" value={formData.vehicle_info} />
              <input type="hidden" name="pet_info" value={formData.pet_info} />
              <input type="hidden" name="smoking_status" value={formData.smoking_status} />
              <input type="hidden" name="tenant_notes" value={formData.tenant_notes} />

              <div className="pt-4">
                <SubmitButton className="w-full">
                  Submit Application
                </SubmitButton>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep !== 6 && (
            <div className="mt-6 flex justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={goBack}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                onClick={goNext}
                disabled={!canProceed(currentStep)}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}

          {currentStep === 6 && (
            <div className="mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={goBack}
                className="w-full"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Go Back and Edit
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h4>
      <dl className="space-y-2">{children}</dl>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value || "—"}</dd>
    </div>
  );
}
