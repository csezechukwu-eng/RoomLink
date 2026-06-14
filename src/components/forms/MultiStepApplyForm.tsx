"use client";

import * as React from "react";
import { useActionState } from "react";
import { Check, Info, Lightbulb } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormAlert } from "@/components/forms/FormAlert";
import { initialActionState } from "@/lib/actions/types";
import { submitApplicationAction } from "@/lib/actions/applications";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, name: "Personal Info" },
  { id: 2, name: "Employment" },
  { id: 3, name: "Move-in Details" },
  { id: 4, name: "Questions" },
  { id: 5, name: "Review" },
];

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  employer: string;
  job_title: string;
  work_email: string;
  monthly_income: string;
  employment_status: string;
  desired_move_in: string;
  lease_length: string;
  how_heard: string;
  message: string;
}

export function MultiStepApplyForm({ bedId }: { bedId: string }) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [formData, setFormData] = React.useState<FormData>({
    full_name: "",
    email: "",
    phone: "",
    employer: "",
    job_title: "",
    work_email: "",
    monthly_income: "",
    employment_status: "full-time",
    desired_move_in: "",
    lease_length: "6",
    how_heard: "",
    message: "",
  });

  const [state, formAction] = useActionState(
    submitApplicationAction,
    initialActionState
  );
  const fieldErrors = state.fieldErrors ?? {};

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.full_name && formData.email;
      case 2:
        return formData.employer && formData.job_title;
      case 3:
        return formData.desired_move_in;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length && canProceed()) {
      setCurrentStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Step {currentStep} of {STEPS.length}</span>
      </div>

      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  step.id < currentStep
                    ? "bg-indigo-600 text-white"
                    : step.id === currentStep
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-400"
                )}
              >
                {step.id < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={cn(
                  "mt-2 hidden text-xs font-medium sm:block",
                  step.id <= currentStep ? "text-slate-900" : "text-slate-400"
                )}
              >
                {step.name}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2",
                  step.id < currentStep ? "bg-indigo-600" : "bg-slate-200"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Form Content */}
      <Card className="p-6">
        <form action={formAction}>
          <input type="hidden" name="bed_id" value={bedId} />
          <input type="hidden" name="full_name" value={formData.full_name} />
          <input type="hidden" name="email" value={formData.email} />
          <input type="hidden" name="phone" value={formData.phone} />
          <input type="hidden" name="desired_move_in" value={formData.desired_move_in} />
          <input type="hidden" name="message" value={formData.message} />

          <FormAlert state={state} />

          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
              <p className="text-sm text-slate-500">Tell us about yourself.</p>

              <FormField label="Full name" htmlFor="full_name" required error={fieldErrors.full_name}>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => updateField("full_name", e.target.value)}
                  placeholder="Jordan Pilot"
                  autoFocus
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Email" htmlFor="email" required error={fieldErrors.email}>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="you@example.com"
                  />
                </FormField>
                <FormField label="Phone" htmlFor="phone">
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="704-555-0102"
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Step 2: Employment */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Employment Information</h2>
                  <p className="text-sm text-slate-500">Tell us about your employer or school.</p>
                </div>
                <div className="hidden sm:block">
                  <WhyWeAskBox />
                </div>
              </div>

              <FormField label="Employer / School Name" htmlFor="employer" required>
                <Input
                  id="employer"
                  value={formData.employer}
                  onChange={(e) => updateField("employer", e.target.value)}
                  placeholder="American Airlines"
                  autoFocus
                />
              </FormField>

              <FormField label="Job Title / Position" htmlFor="job_title" required>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => updateField("job_title", e.target.value)}
                  placeholder="Flight Attendant"
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Work Email (Optional)" htmlFor="work_email">
                  <Input
                    id="work_email"
                    type="email"
                    value={formData.work_email}
                    onChange={(e) => updateField("work_email", e.target.value)}
                    placeholder="john.doe@aa.com"
                  />
                </FormField>
                <FormField label="Monthly Income (Optional)" htmlFor="monthly_income">
                  <Input
                    id="monthly_income"
                    value={formData.monthly_income}
                    onChange={(e) => updateField("monthly_income", e.target.value)}
                    placeholder="$3,200"
                  />
                </FormField>
              </div>

              <FormField label="Employment Status" htmlFor="employment_status">
                <Select
                  id="employment_status"
                  value={formData.employment_status}
                  onChange={(e) => updateField("employment_status", e.target.value)}
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="student">Student</option>
                </Select>
              </FormField>

              <div className="sm:hidden">
                <WhyWeAskBox />
              </div>
            </div>
          )}

          {/* Step 3: Move-in Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Move-in Details</h2>
              <p className="text-sm text-slate-500">When are you planning to move in?</p>

              <FormField label="Desired Move-in Date" htmlFor="desired_move_in" required>
                <Input
                  id="desired_move_in"
                  type="date"
                  value={formData.desired_move_in}
                  onChange={(e) => updateField("desired_move_in", e.target.value)}
                  autoFocus
                />
              </FormField>

              <FormField label="Expected Length of Stay" htmlFor="lease_length">
                <Select
                  id="lease_length"
                  value={formData.lease_length}
                  onChange={(e) => updateField("lease_length", e.target.value)}
                >
                  <option value="1">1 month</option>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                  <option value="indefinite">Indefinite</option>
                </Select>
              </FormField>
            </div>
          )}

          {/* Step 4: Questions */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Additional Questions</h2>
              <p className="text-sm text-slate-500">A few more details to help the host.</p>

              <FormField label="How did you hear about us?" htmlFor="how_heard">
                <Select
                  id="how_heard"
                  value={formData.how_heard}
                  onChange={(e) => updateField("how_heard", e.target.value)}
                >
                  <option value="">Select an option</option>
                  <option value="coworker">Coworker / Colleague</option>
                  <option value="facebook">Facebook</option>
                  <option value="google">Google Search</option>
                  <option value="craigslist">Craigslist</option>
                  <option value="other">Other</option>
                </Select>
              </FormField>

              <FormField label="Message to the host (Optional)" htmlFor="message">
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  placeholder="Tell the host a little about yourself, your schedule, and why this works for you."
                  rows={4}
                />
              </FormField>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Review Your Application</h2>
              <p className="text-sm text-slate-500">Please confirm your information before submitting.</p>

              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                <ReviewSection title="Personal Info">
                  <ReviewRow label="Name" value={formData.full_name} />
                  <ReviewRow label="Email" value={formData.email} />
                  <ReviewRow label="Phone" value={formData.phone || "Not provided"} />
                </ReviewSection>

                <ReviewSection title="Employment">
                  <ReviewRow label="Employer" value={formData.employer} />
                  <ReviewRow label="Position" value={formData.job_title} />
                  <ReviewRow label="Status" value={formData.employment_status} />
                </ReviewSection>

                <ReviewSection title="Move-in Details">
                  <ReviewRow label="Move-in Date" value={formData.desired_move_in} />
                  <ReviewRow label="Length of Stay" value={`${formData.lease_length} months`} />
                </ReviewSection>

                {formData.message && (
                  <ReviewSection title="Message">
                    <p className="text-sm text-slate-600">{formData.message}</p>
                  </ReviewSection>
                )}
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-indigo-50 p-4 text-sm text-indigo-700">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Submitting an application doesn't charge you anything. The host reviews it and, if approved, reserves this bed for you.
                </span>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Back
            </Button>

            {currentStep < STEPS.length ? (
              <Button type="button" onClick={nextStep} disabled={!canProceed()}>
                Next
              </Button>
            ) : (
              <SubmitButton pendingLabel="Submitting...">
                Submit Application
              </SubmitButton>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

function WhyWeAskBox() {
  return (
    <div className="w-64 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-indigo-700">
        <Lightbulb className="h-4 w-4" />
        Why we ask?
      </div>
      <p className="mt-2 text-xs text-indigo-600">
        We only use this information to ensure a safe and reliable community for all tenants.
      </p>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
