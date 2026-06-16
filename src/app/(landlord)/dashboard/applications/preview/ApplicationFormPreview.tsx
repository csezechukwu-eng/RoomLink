"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/FormField";
import {
  COMMUTER_STATUSES,
  EMPLOYMENT_STATUSES,
  GOVERNMENT_ID_STATUSES,
  SMOKING_STATUSES,
  LENGTH_OF_STAY_OPTIONS,
  REFERRAL_SOURCES,
  PAYMENT_METHODS,
} from "@/lib/constants";
import type { Property } from "@/lib/types";

interface ApplicationFormPreviewProps {
  property: Property;
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

export function ApplicationFormPreview({ property }: ApplicationFormPreviewProps) {
  const [currentStep, setCurrentStep] = React.useState<Step>(1);

  const goNext = () => {
    if (currentStep < 6) setCurrentStep((currentStep + 1) as Step);
  };

  const goBack = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as Step);
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Property Info */}
      <Card className="mb-6 p-4 bg-slate-50">
        <p className="text-sm text-slate-500">Applying to:</p>
        <p className="font-semibold text-slate-900">{property.name}</p>
        <p className="text-sm text-slate-500">{property.address}</p>
      </Card>

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
                {currentStep > step ? <Check className="h-5 w-5" /> : step}
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
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="First Name" htmlFor="first_name" required>
                <Input id="first_name" placeholder="John" disabled />
              </FormField>
              <FormField label="Last Name" htmlFor="last_name" required>
                <Input id="last_name" placeholder="Doe" disabled />
              </FormField>
            </div>
            <FormField label="Email Address" htmlFor="email" required>
              <Input id="email" type="email" placeholder="john@example.com" disabled />
            </FormField>
            <FormField label="Phone Number" htmlFor="phone" required>
              <Input id="phone" type="tel" placeholder="(555) 123-4567" disabled />
            </FormField>
          </div>
        )}

        {/* Step 2: Stay Details */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <FormField label="Desired Move-In Date" htmlFor="desired_move_in" required>
              <Input id="desired_move_in" type="date" disabled />
            </FormField>
            <FormField label="Length of Stay" htmlFor="length_of_stay" required>
              <Select id="length_of_stay" disabled>
                <option value="">Select length of stay</option>
                {LENGTH_OF_STAY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              label="Reason for Stay"
              htmlFor="reason_for_stay"
              required
              hint="Please describe why you're looking for accommodation"
            >
              <Textarea
                id="reason_for_stay"
                rows={3}
                placeholder="I'm looking for housing because..."
                disabled
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
              hint="Select the option that best describes your situation"
            >
              <Select id="commuter_status" disabled>
                <option value="">Select commuter status</option>
                {COMMUTER_STATUSES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="font-medium text-slate-900">Why do we ask this?</h4>
              <p className="mt-1 text-sm text-slate-600">
                Understanding your commuter status helps us ensure you&apos;re a good fit
                for our property and allows us to better serve your needs.
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
                <FormField label="Employment Status" htmlFor="employment_status" required>
                  <Select id="employment_status" disabled>
                    <option value="">Select employment status</option>
                    {EMPLOYMENT_STATUSES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Employer Name" htmlFor="employer_name" required>
                  <Input id="employer_name" placeholder="Company Name" disabled />
                </FormField>
                <FormField label="Monthly Income" htmlFor="monthly_income" required>
                  <Input id="monthly_income" type="number" placeholder="5000" disabled />
                </FormField>
              </div>
            </div>
            <hr className="border-slate-200" />
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Emergency Contact
              </h3>
              <div className="space-y-4">
                <FormField label="Emergency Contact Name" htmlFor="emergency_contact_name" required>
                  <Input id="emergency_contact_name" placeholder="Jane Doe" disabled />
                </FormField>
                <FormField label="Emergency Contact Phone" htmlFor="emergency_contact_phone" required>
                  <Input id="emergency_contact_phone" type="tel" placeholder="(555) 987-6543" disabled />
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
                <FormField label="Government ID Status" htmlFor="government_id_status" required>
                  <Select id="government_id_status" disabled>
                    <option value="">Select ID status</option>
                    {GOVERNMENT_ID_STATUSES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      disabled
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                    />
                    <div>
                      <span className="font-medium text-slate-900">
                        Background Check Consent <span className="text-red-500">*</span>
                      </span>
                      <p className="mt-1 text-sm text-slate-600">
                        I consent to a background check being performed as part of the
                        application process.
                      </p>
                    </div>
                  </label>
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
                  <Textarea id="current_address" rows={2} placeholder="123 Main St, City, State ZIP" disabled />
                </FormField>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="How did you hear about us?" htmlFor="referral_source">
                    <Select id="referral_source" disabled>
                      <option value="">Select source</option>
                      {REFERRAL_SOURCES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Preferred Payment Method" htmlFor="preferred_payment_method">
                    <Select id="preferred_payment_method" disabled>
                      <option value="">Select method</option>
                      {PAYMENT_METHODS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>
                <FormField label="Vehicle Information" htmlFor="vehicle_info" hint="Make, model, year, license plate">
                  <Input id="vehicle_info" placeholder="2020 Honda Civic, ABC-1234" disabled />
                </FormField>
                <FormField label="Pet Information" htmlFor="pet_info" hint="Type, breed, size">
                  <Input id="pet_info" placeholder="Small dog, Labrador, 30 lbs" disabled />
                </FormField>
                <FormField label="Smoking Status" htmlFor="smoking_status">
                  <Select id="smoking_status" disabled>
                    <option value="">Select status</option>
                    {SMOKING_STATUSES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Notes or Special Requests" htmlFor="tenant_notes">
                  <Textarea
                    id="tenant_notes"
                    rows={3}
                    placeholder="Any additional information you'd like to share..."
                    disabled
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
              <h3 className="font-semibold text-emerald-800">Ready to Submit</h3>
              <p className="mt-1 text-sm text-emerald-700">
                In a real application, tenants would review all their information here
                before submitting.
              </p>
            </div>

            <div className="space-y-4">
              <PreviewSection title="Personal Information">
                <PreviewItem label="Name" value="John Doe" />
                <PreviewItem label="Email" value="john@example.com" />
                <PreviewItem label="Phone" value="(555) 123-4567" />
              </PreviewSection>

              <PreviewSection title="Stay Details">
                <PreviewItem label="Move-In Date" value="Jan 15, 2025" />
                <PreviewItem label="Length of Stay" value="6+ months" />
                <PreviewItem label="Reason" value="Work assignment in the area" />
              </PreviewSection>

              <PreviewSection title="Commuter Status">
                <PreviewItem label="Status" value="Travel Nurse / Healthcare Traveler" />
              </PreviewSection>

              <PreviewSection title="Employment">
                <PreviewItem label="Status" value="Employed Full-time" />
                <PreviewItem label="Employer" value="Regional Medical Center" />
                <PreviewItem label="Monthly Income" value="$5,000" />
              </PreviewSection>
            </div>

            <div className="pt-4">
              <Button className="w-full" disabled>
                Submit Application (Preview Only)
              </Button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep !== 6 && (
          <div className="mt-6 flex justify-between">
            <Button type="button" variant="ghost" onClick={goBack} disabled={currentStep === 1}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button type="button" onClick={goNext}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}

        {currentStep === 6 && (
          <div className="mt-4">
            <Button type="button" variant="ghost" onClick={goBack} className="w-full">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Go Back
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h4>
      <dl className="space-y-2">{children}</dl>
    </div>
  );
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
