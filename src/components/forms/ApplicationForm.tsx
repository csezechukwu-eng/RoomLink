"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  DollarSign,
  User,
  Calendar,
  Briefcase,
  Shield,
  ClipboardCheck,
  Plane,
  Stethoscope,
  GraduationCap,
  Laptop,
  MapPin,
  Home,
  HelpCircle,
} from "lucide-react";
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
  EMPLOYMENT_STATUSES,
  GOVERNMENT_ID_STATUSES,
  SMOKING_STATUSES,
  REFERRAL_SOURCES,
  PAYMENT_METHODS,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { Bed, Room, Property } from "@/lib/types";

interface ApplicationFormProps {
  property: Property;
  rooms: Array<Room & { beds: Bed[] }>;
  selectedBedId?: string;
}

type Step = 1 | 2 | 3 | 4 | 5;

type ProfileType =
  | "flight_crew"
  | "healthcare"
  | "student"
  | "remote_worker"
  | "relocating"
  | "local_resident"
  | "other";

type StayCategory = "short_term" | "mid_term" | "long_term";

const PROFILE_TYPES: Array<{
  value: ProfileType;
  label: string;
  description: string;
  icon: typeof Plane;
}> = [
  {
    value: "flight_crew",
    label: "Flight Crew / Airline",
    description: "Pilots, flight attendants, and airline staff",
    icon: Plane,
  },
  {
    value: "healthcare",
    label: "Healthcare Professional",
    description: "Travel nurses, doctors, and medical staff",
    icon: Stethoscope,
  },
  {
    value: "student",
    label: "Student",
    description: "College, university, or graduate students",
    icon: GraduationCap,
  },
  {
    value: "remote_worker",
    label: "Remote Worker",
    description: "Digital nomads and remote employees",
    icon: Laptop,
  },
  {
    value: "relocating",
    label: "Relocating Professional",
    description: "Moving for work or personal reasons",
    icon: MapPin,
  },
  {
    value: "local_resident",
    label: "Local Resident",
    description: "Looking for housing in your area",
    icon: Home,
  },
  {
    value: "other",
    label: "Other",
    description: "My situation is different",
    icon: HelpCircle,
  },
];

const STAY_CATEGORIES: Array<{
  value: StayCategory;
  label: string;
  description: string;
  durations: Array<{ value: string; label: string }>;
}> = [
  {
    value: "short_term",
    label: "Monthly",
    description: "1 to 3 months",
    durations: [
      { value: "1_month", label: "1 Month" },
      { value: "2_months", label: "2 Months" },
      { value: "3_months", label: "3 Months" },
    ],
  },
  {
    value: "mid_term",
    label: "Mid-Term",
    description: "3 to 6 months",
    durations: [
      { value: "3_months", label: "3 Months" },
      { value: "4_months", label: "4 Months" },
      { value: "5_months", label: "5 Months" },
      { value: "6_months", label: "6 Months" },
    ],
  },
  {
    value: "long_term",
    label: "Long-Term / Lease",
    description: "6+ months or yearly lease",
    durations: [
      { value: "6_months", label: "6 Months" },
      { value: "9_months", label: "9 Months" },
      { value: "1_year", label: "1 Year" },
      { value: "indefinite", label: "Indefinite / Open-ended" },
    ],
  },
];

const STEP_INFO: Record<Step, { title: string; description: string; icon: typeof User }> = {
  1: { title: "Personal Information", description: "Tell us about yourself", icon: User },
  2: { title: "Stay Duration", description: "When and how long", icon: Calendar },
  3: { title: "About You", description: "Your background", icon: Briefcase },
  4: { title: "Verification", description: "ID & background check", icon: Shield },
  5: { title: "Review & Submit", description: "Confirm your details", icon: ClipboardCheck },
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
    stay_category: "" as StayCategory | "",
    length_of_stay: "",
    desired_move_in: "",
    room_id: "",
    bed_id: selectedBedId || "",
    // Profile Type
    profile_type: "" as ProfileType | "",
    // Flight Crew fields
    airline_name: "",
    base_airport: "",
    crew_schedule_type: "",
    // Healthcare fields
    hospital_name: "",
    staffing_agency: "",
    assignment_type: "",
    // Student fields
    school_name: "",
    program_name: "",
    expected_graduation: "",
    // Remote Worker fields
    company_name: "",
    industry: "",
    // Relocating fields
    relocation_reason: "",
    previous_location: "",
    // Local Resident fields
    current_situation: "",
    // Other fields
    profile_explanation: "",
    // Employment (for non-student/other profiles)
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const setField = (name: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const canProceed = (step: Step): boolean => {
    switch (step) {
      case 1:
        return !!(formData.first_name && formData.last_name && formData.email && formData.phone);
      case 2:
        return !!(formData.stay_category && formData.length_of_stay && formData.desired_move_in);
      case 3:
        if (!formData.profile_type) return false;
        // Check profile-specific required fields
        switch (formData.profile_type) {
          case "flight_crew":
            return !!(formData.airline_name && formData.base_airport);
          case "healthcare":
            return !!(formData.hospital_name);
          case "student":
            return !!(formData.school_name && formData.program_name);
          case "remote_worker":
            return !!(formData.company_name);
          case "relocating":
            return !!(formData.relocation_reason);
          case "local_resident":
            return !!(formData.current_situation);
          case "other":
            return !!(formData.profile_explanation);
          default:
            return false;
        }
      case 4:
        return !!(
          formData.emergency_contact_name &&
          formData.emergency_contact_phone &&
          formData.government_id_status &&
          formData.background_check_consent
        );
      default:
        return true;
    }
  };

  const goNext = () => {
    if (currentStep < 5) setCurrentStep((currentStep + 1) as Step);
  };

  const goBack = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as Step);
  };

  const availableBeds = rooms.flatMap((room) =>
    room.beds
      .filter((bed) => bed.status === "vacant")
      .map((bed) => ({ ...bed, roomName: room.name }))
  );

  const selectedCategory = STAY_CATEGORIES.find((c) => c.value === formData.stay_category);
  const selectedProfile = PROFILE_TYPES.find((p) => p.value === formData.profile_type);

  // Build commuter_status from profile_type for backend compatibility
  const getCommuterStatus = () => {
    switch (formData.profile_type) {
      case "flight_crew": return "airline_crew";
      case "healthcare": return "travel_nurse";
      case "student": return "student";
      case "remote_worker": return "contract_worker";
      case "relocating": return "temporary_relocation";
      case "local_resident": return "local_resident";
      default: return "other";
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress Steps - Modern Design */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute left-0 right-0 top-6 h-0.5 bg-slate-200" />
          <div
            className="absolute left-0 top-6 h-0.5 bg-indigo-600 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
          />

          {([1, 2, 3, 4, 5] as Step[]).map((step) => {
            const info = STEP_INFO[step];
            const Icon = info.icon;
            const isActive = currentStep === step;
            const isCompleted = currentStep > step;

            return (
              <div key={step} className="relative z-10 flex flex-col items-center">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isActive
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                      : isCompleted
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-300 bg-white text-slate-400"
                  }`}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="mt-3 text-center hidden sm:block">
                  <p className={`text-sm font-medium ${isActive ? "text-indigo-600" : "text-slate-500"}`}>
                    {info.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Step Title - Mobile */}
        <div className="mt-6 text-center sm:hidden">
          <h2 className="text-lg font-semibold text-slate-900">{STEP_INFO[currentStep].title}</h2>
          <p className="text-sm text-slate-500">{STEP_INFO[currentStep].description}</p>
        </div>
      </div>

      {/* Application Fee Notice */}
      {property.application_fee_required && property.application_fee_amount && (
        <Card className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900">
                Application Fee: {formatCurrency(property.application_fee_amount)}
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                This property requires an application fee. Payment instructions will be provided after submission.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        {/* Step Header */}
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <h2 className="text-xl font-semibold text-slate-900">{STEP_INFO[currentStep].title}</h2>
          <p className="text-sm text-slate-500">{STEP_INFO[currentStep].description}</p>
        </div>

        <form action={formAction} className="p-6">
          {/* Hidden fields */}
          <input type="hidden" name="property_id" value={property.id} />
          <input type="hidden" name="room_id" value={formData.room_id} />
          <input type="hidden" name="bed_id" value={formData.bed_id} />
          <input type="hidden" name="background_check_consent" value={formData.background_check_consent ? "true" : "false"} />
          <input type="hidden" name="commuter_status" value={getCommuterStatus()} />

          <FormAlert state={state} />

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField label="First Name" htmlFor="first_name" required error={fieldErrors.first_name}>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Enter your first name"
                    className="h-11"
                  />
                </FormField>

                <FormField label="Last Name" htmlFor="last_name" required error={fieldErrors.last_name}>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Enter your last name"
                    className="h-11"
                  />
                </FormField>
              </div>

              <FormField label="Email Address" htmlFor="email" required error={fieldErrors.email}>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="h-11"
                />
              </FormField>

              <FormField label="Phone Number" htmlFor="phone" required error={fieldErrors.phone}>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                  className="h-11"
                />
              </FormField>
            </div>
          )}

          {/* Step 2: Stay Duration */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Stay Category Selection */}
              <div>
                <label className="mb-3 block text-sm font-medium text-slate-700">
                  How long are you looking to stay? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {STAY_CATEGORIES.map((category) => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => {
                        setField("stay_category", category.value);
                        setField("length_of_stay", "");
                      }}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        formData.stay_category === category.value
                          ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <p className={`font-semibold ${formData.stay_category === category.value ? "text-indigo-700" : "text-slate-900"}`}>
                        {category.label}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{category.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Selection */}
              {selectedCategory && (
                <FormField label="Specific Duration" htmlFor="length_of_stay" required>
                  <Select
                    id="length_of_stay"
                    name="length_of_stay"
                    value={formData.length_of_stay}
                    onChange={handleChange}
                    className="h-11"
                  >
                    <option value="">Select duration</option>
                    {selectedCategory.durations.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </Select>
                </FormField>
              )}

              {/* Move-in Date */}
              <FormField label="Desired Move-In Date" htmlFor="desired_move_in" required error={fieldErrors.desired_move_in}>
                <Input
                  id="desired_move_in"
                  name="desired_move_in"
                  type="date"
                  value={formData.desired_move_in}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="h-11"
                />
              </FormField>

              {/* Bed Selection */}
              {availableBeds.length > 0 && (
                <FormField label="Preferred Bed (Optional)" htmlFor="bed_id" hint="Select a specific bed if you have a preference">
                  <Select id="bed_id" name="bed_id" value={formData.bed_id} onChange={handleChange} className="h-11">
                    <option value="">No preference</option>
                    {availableBeds.map((bed) => (
                      <option key={bed.id} value={bed.id}>
                        {bed.roomName} - {bed.label} ({formatCurrency(bed.monthly_rent)}/mo)
                      </option>
                    ))}
                  </Select>
                </FormField>
              )}
            </div>
          )}

          {/* Step 3: About You */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Profile Type Selection */}
              <div>
                <label className="mb-3 block text-sm font-medium text-slate-700">
                  What best describes you? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {PROFILE_TYPES.map((profile) => {
                    const Icon = profile.icon;
                    const isSelected = formData.profile_type === profile.value;
                    return (
                      <button
                        key={profile.value}
                        type="button"
                        onClick={() => setField("profile_type", profile.value)}
                        className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className={`font-semibold ${isSelected ? "text-indigo-700" : "text-slate-900"}`}>
                            {profile.label}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-500">{profile.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Fields Based on Profile Type */}
              {formData.profile_type === "flight_crew" && (
                <div className="space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
                  <h3 className="font-semibold text-indigo-900">Flight Crew Details</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="Airline" htmlFor="airline_name" required>
                      <Input
                        id="airline_name"
                        name="airline_name"
                        value={formData.airline_name}
                        onChange={handleChange}
                        placeholder="e.g., Delta, United, American"
                        className="h-11"
                      />
                    </FormField>
                    <FormField label="Base Airport" htmlFor="base_airport" required>
                      <Input
                        id="base_airport"
                        name="base_airport"
                        value={formData.base_airport}
                        onChange={handleChange}
                        placeholder="e.g., CLT, ATL, ORD"
                        className="h-11"
                      />
                    </FormField>
                  </div>
                  <FormField label="Schedule Type" htmlFor="crew_schedule_type">
                    <Select id="crew_schedule_type" name="crew_schedule_type" value={formData.crew_schedule_type} onChange={handleChange} className="h-11">
                      <option value="">Select schedule type</option>
                      <option value="reserve">Reserve</option>
                      <option value="line_holder">Line Holder</option>
                      <option value="mixed">Mixed/Variable</option>
                    </Select>
                  </FormField>
                </div>
              )}

              {formData.profile_type === "healthcare" && (
                <div className="space-y-4 rounded-xl border border-teal-100 bg-teal-50/50 p-5">
                  <h3 className="font-semibold text-teal-900">Healthcare Details</h3>
                  <FormField label="Hospital / Facility" htmlFor="hospital_name" required>
                    <Input
                      id="hospital_name"
                      name="hospital_name"
                      value={formData.hospital_name}
                      onChange={handleChange}
                      placeholder="Name of hospital or medical facility"
                      className="h-11"
                    />
                  </FormField>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="Staffing Agency (if applicable)" htmlFor="staffing_agency">
                      <Input
                        id="staffing_agency"
                        name="staffing_agency"
                        value={formData.staffing_agency}
                        onChange={handleChange}
                        placeholder="e.g., Aya, Cross Country"
                        className="h-11"
                      />
                    </FormField>
                    <FormField label="Assignment Type" htmlFor="assignment_type">
                      <Select id="assignment_type" name="assignment_type" value={formData.assignment_type} onChange={handleChange} className="h-11">
                        <option value="">Select type</option>
                        <option value="travel_nurse">Travel Nurse</option>
                        <option value="travel_therapist">Travel Therapist</option>
                        <option value="locum_tenens">Locum Tenens</option>
                        <option value="permanent">Permanent Staff</option>
                        <option value="per_diem">Per Diem</option>
                      </Select>
                    </FormField>
                  </div>
                </div>
              )}

              {formData.profile_type === "student" && (
                <div className="space-y-4 rounded-xl border border-purple-100 bg-purple-50/50 p-5">
                  <h3 className="font-semibold text-purple-900">Student Details</h3>
                  <FormField label="School / University" htmlFor="school_name" required>
                    <Input
                      id="school_name"
                      name="school_name"
                      value={formData.school_name}
                      onChange={handleChange}
                      placeholder="Name of your school"
                      className="h-11"
                    />
                  </FormField>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="Program / Major" htmlFor="program_name" required>
                      <Input
                        id="program_name"
                        name="program_name"
                        value={formData.program_name}
                        onChange={handleChange}
                        placeholder="e.g., Computer Science, Nursing"
                        className="h-11"
                      />
                    </FormField>
                    <FormField label="Expected Graduation" htmlFor="expected_graduation">
                      <Input
                        id="expected_graduation"
                        name="expected_graduation"
                        type="month"
                        value={formData.expected_graduation}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </FormField>
                  </div>
                </div>
              )}

              {formData.profile_type === "remote_worker" && (
                <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/50 p-5">
                  <h3 className="font-semibold text-blue-900">Remote Work Details</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="Company" htmlFor="company_name" required>
                      <Input
                        id="company_name"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        placeholder="Company name"
                        className="h-11"
                      />
                    </FormField>
                    <FormField label="Industry" htmlFor="industry">
                      <Input
                        id="industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        placeholder="e.g., Technology, Marketing"
                        className="h-11"
                      />
                    </FormField>
                  </div>
                </div>
              )}

              {formData.profile_type === "relocating" && (
                <div className="space-y-4 rounded-xl border border-orange-100 bg-orange-50/50 p-5">
                  <h3 className="font-semibold text-orange-900">Relocation Details</h3>
                  <FormField label="Reason for Relocation" htmlFor="relocation_reason" required>
                    <Select id="relocation_reason" name="relocation_reason" value={formData.relocation_reason} onChange={handleChange} className="h-11">
                      <option value="">Select reason</option>
                      <option value="new_job">New Job / Career Opportunity</option>
                      <option value="job_transfer">Job Transfer</option>
                      <option value="family">Family Reasons</option>
                      <option value="lifestyle">Lifestyle Change</option>
                      <option value="other">Other</option>
                    </Select>
                  </FormField>
                  <FormField label="Moving From" htmlFor="previous_location">
                    <Input
                      id="previous_location"
                      name="previous_location"
                      value={formData.previous_location}
                      onChange={handleChange}
                      placeholder="City, State"
                      className="h-11"
                    />
                  </FormField>
                </div>
              )}

              {formData.profile_type === "local_resident" && (
                <div className="space-y-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-5">
                  <h3 className="font-semibold text-emerald-900">Current Situation</h3>
                  <FormField label="Tell us about your housing needs" htmlFor="current_situation" required>
                    <Textarea
                      id="current_situation"
                      name="current_situation"
                      value={formData.current_situation}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Briefly describe why you're looking for housing..."
                      className="resize-none"
                    />
                  </FormField>
                </div>
              )}

              {formData.profile_type === "other" && (
                <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="font-semibold text-slate-900">Tell Us More</h3>
                  <FormField label="Describe your situation" htmlFor="profile_explanation" required>
                    <Textarea
                      id="profile_explanation"
                      name="profile_explanation"
                      value={formData.profile_explanation}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Please describe your background and why you're looking for housing..."
                      className="resize-none"
                    />
                  </FormField>
                </div>
              )}

              {/* Employment for non-student profiles */}
              {formData.profile_type && formData.profile_type !== "student" && (
                <div className="space-y-4 pt-4">
                  <h3 className="font-semibold text-slate-900">Employment Information</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="Employment Status" htmlFor="employment_status">
                      <Select id="employment_status" name="employment_status" value={formData.employment_status} onChange={handleChange} className="h-11">
                        <option value="">Select status</option>
                        {EMPLOYMENT_STATUSES.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label="Monthly Income" htmlFor="monthly_income">
                      <Input
                        id="monthly_income"
                        name="monthly_income"
                        type="number"
                        min="0"
                        step="100"
                        value={formData.monthly_income}
                        onChange={handleChange}
                        placeholder="5000"
                        className="h-11"
                      />
                    </FormField>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Verification */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Emergency Contact</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Contact Name" htmlFor="emergency_contact_name" required error={fieldErrors.emergency_contact_name}>
                    <Input
                      id="emergency_contact_name"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleChange}
                      placeholder="Full name"
                      className="h-11"
                    />
                  </FormField>
                  <FormField label="Contact Phone" htmlFor="emergency_contact_phone" required error={fieldErrors.emergency_contact_phone}>
                    <Input
                      id="emergency_contact_phone"
                      name="emergency_contact_phone"
                      type="tel"
                      value={formData.emergency_contact_phone}
                      onChange={handleChange}
                      placeholder="(555) 987-6543"
                      className="h-11"
                    />
                  </FormField>
                </div>
              </div>

              {/* ID & Background */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">ID & Background Check</h3>
                <FormField label="Government ID Status" htmlFor="government_id_status" required error={fieldErrors.government_id_status}>
                  <Select id="government_id_status" name="government_id_status" value={formData.government_id_status} onChange={handleChange} className="h-11">
                    <option value="">Select ID status</option>
                    {GOVERNMENT_ID_STATUSES.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </FormField>

                <div className={`rounded-xl border-2 p-5 ${
                  formData.background_check_consent ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-slate-50"
                } ${fieldErrors.background_check_consent ? "border-red-300 bg-red-50" : ""}`}>
                  <label className="flex cursor-pointer items-start gap-4">
                    <input
                      type="checkbox"
                      checked={formData.background_check_consent}
                      onChange={(e) => setField("background_check_consent", e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-medium text-slate-900">
                        Background Check Consent <span className="text-red-500">*</span>
                      </span>
                      <p className="mt-1 text-sm text-slate-600">
                        I consent to a background check being performed as part of the application process.
                        This may include verification of identity, criminal history, and rental history.
                      </p>
                    </div>
                  </label>
                  {fieldErrors.background_check_consent && (
                    <p className="mt-3 flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {fieldErrors.background_check_consent}
                    </p>
                  )}
                </div>
              </div>

              {/* Optional Details */}
              <div className="space-y-4 border-t border-slate-200 pt-6">
                <h3 className="font-semibold text-slate-900">Additional Information (Optional)</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="How did you hear about us?" htmlFor="referral_source">
                    <Select id="referral_source" name="referral_source" value={formData.referral_source} onChange={handleChange} className="h-11">
                      <option value="">Select source</option>
                      {REFERRAL_SOURCES.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Preferred Payment Method" htmlFor="preferred_payment_method">
                    <Select id="preferred_payment_method" name="preferred_payment_method" value={formData.preferred_payment_method} onChange={handleChange} className="h-11">
                      <option value="">Select method</option>
                      {PAYMENT_METHODS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </Select>
                  </FormField>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Vehicle Info" htmlFor="vehicle_info" hint="Make, model, license plate">
                    <Input id="vehicle_info" name="vehicle_info" value={formData.vehicle_info} onChange={handleChange} placeholder="2020 Honda Civic, ABC-1234" className="h-11" />
                  </FormField>
                  <FormField label="Pet Info" htmlFor="pet_info" hint="Type, breed, size">
                    <Input id="pet_info" name="pet_info" value={formData.pet_info} onChange={handleChange} placeholder="Small dog, 25 lbs" className="h-11" />
                  </FormField>
                </div>
                <FormField label="Smoking Status" htmlFor="smoking_status">
                  <Select id="smoking_status" name="smoking_status" value={formData.smoking_status} onChange={handleChange} className="h-11">
                    <option value="">Select status</option>
                    {SMOKING_STATUSES.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Notes or Special Requests" htmlFor="tenant_notes">
                  <Textarea id="tenant_notes" name="tenant_notes" value={formData.tenant_notes} onChange={handleChange} rows={3} placeholder="Any additional information..." className="resize-none" />
                </FormField>
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
                <h3 className="font-semibold text-emerald-800">Ready to Submit!</h3>
                <p className="mt-1 text-sm text-emerald-700">Please review your information below before submitting.</p>
              </div>

              <div className="space-y-4">
                <ReviewSection title="Personal Information" icon={User}>
                  <ReviewItem label="Name" value={`${formData.first_name} ${formData.last_name}`} />
                  <ReviewItem label="Email" value={formData.email} />
                  <ReviewItem label="Phone" value={formData.phone} />
                </ReviewSection>

                <ReviewSection title="Stay Details" icon={Calendar}>
                  <ReviewItem label="Stay Type" value={selectedCategory?.label || ""} />
                  <ReviewItem label="Duration" value={selectedCategory?.durations.find(d => d.value === formData.length_of_stay)?.label || formData.length_of_stay} />
                  <ReviewItem label="Move-In Date" value={formData.desired_move_in} />
                </ReviewSection>

                <ReviewSection title="About You" icon={selectedProfile?.icon || Briefcase}>
                  <ReviewItem label="Profile Type" value={selectedProfile?.label || ""} />
                  {formData.profile_type === "flight_crew" && (
                    <>
                      <ReviewItem label="Airline" value={formData.airline_name} />
                      <ReviewItem label="Base Airport" value={formData.base_airport} />
                    </>
                  )}
                  {formData.profile_type === "healthcare" && (
                    <>
                      <ReviewItem label="Hospital" value={formData.hospital_name} />
                      {formData.staffing_agency && <ReviewItem label="Agency" value={formData.staffing_agency} />}
                    </>
                  )}
                  {formData.profile_type === "student" && (
                    <>
                      <ReviewItem label="School" value={formData.school_name} />
                      <ReviewItem label="Program" value={formData.program_name} />
                    </>
                  )}
                  {formData.profile_type === "remote_worker" && (
                    <ReviewItem label="Company" value={formData.company_name} />
                  )}
                </ReviewSection>

                <ReviewSection title="Emergency Contact" icon={Shield}>
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
              <input type="hidden" name="reason_for_stay" value={`Profile: ${selectedProfile?.label}. ${formData.profile_explanation || formData.current_situation || ""}`} />
              <input type="hidden" name="commuter_status_other" value={formData.profile_explanation || formData.current_situation || ""} />
              <input type="hidden" name="employment_status" value={formData.employment_status || (formData.profile_type === "student" ? "student" : "")} />
              <input type="hidden" name="employer_name" value={formData.employer_name || formData.company_name || formData.airline_name || formData.hospital_name || formData.school_name || ""} />
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
                <SubmitButton className="w-full h-12 text-base">
                  Submit Application
                </SubmitButton>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className={`mt-8 flex ${currentStep === 1 ? "justify-end" : "justify-between"} border-t border-slate-100 pt-6`}>
            {currentStep > 1 && (
              <Button type="button" variant="ghost" onClick={goBack} className="h-11">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
            {currentStep < 5 && (
              <Button type="button" onClick={goNext} disabled={!canProceed(currentStep)} className="h-11 px-6">
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
            {currentStep === 5 && (
              <Button type="button" variant="ghost" onClick={goBack} className="h-11">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Go Back and Edit
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

function ReviewSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <Icon className="h-4 w-4 text-slate-500" />
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
      </div>
      <dl className="divide-y divide-slate-100 px-4">{children}</dl>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-3 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value || "—"}</dd>
    </div>
  );
}
