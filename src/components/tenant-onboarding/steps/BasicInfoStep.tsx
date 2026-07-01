"use client";

import * as React from "react";
import { Camera, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateTenantBasicInfo } from "@/lib/actions/tenant-onboarding";
import type { TenantOnboardingState } from "@/lib/onboarding/tenant-state";

interface BasicInfoStepProps {
  state: TenantOnboardingState;
  onContinue: () => void;
}

const BUDGET_OPTIONS = [
  { value: "450-600", label: "$450 - $600" },
  { value: "600-800", label: "$600 - $800" },
  { value: "800-1000", label: "$800 - $1,000" },
  { value: "1000-1500", label: "$1,000 - $1,500" },
  { value: "1500+", label: "$1,500+" },
];

const ROOMMATE_OPTIONS = [
  { value: "no_preference", label: "No preference" },
  { value: "same_gender", label: "Same gender only" },
  { value: "quiet", label: "Quiet roommates" },
  { value: "social", label: "Social roommates" },
];

const LIFESTYLE_OPTIONS = [
  { value: "quiet", label: "Quiet" },
  { value: "social", label: "Social" },
  { value: "early_riser", label: "Early riser" },
  { value: "night_owl", label: "Night owl" },
  { value: "work_from_home", label: "Work from home" },
];

/**
 * BasicInfoStep
 *
 * Collects basic tenant information including name, phone, housing preferences.
 */
export function BasicInfoStep({ state, onContinue }: BasicInfoStepProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [aboutMeLength, setAboutMeLength] = React.useState(state.data.aboutMe?.length || 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await updateTenantBasicInfo(formData);
      if (result.error) {
        setError(result.error);
      } else {
        onContinue();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">👋</span>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to your new monthly stay</h1>
        </div>
        <p className="text-slate-600">
          Let&apos;s get to know you so we can find the perfect place.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-[1fr,280px]">
          {/* Form Fields */}
          <div className="space-y-8">
            {/* Tell us about yourself */}
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Tell us a bit about yourself</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                    Full name
                  </label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="e.g. Jane Doe"
                    defaultValue={state.data.fullName || ""}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                    Phone number
                  </label>
                  <div className="flex">
                    <div className="flex items-center gap-1 px-3 border border-r-0 rounded-l-md bg-slate-50 text-sm text-slate-600">
                      <span>🇺🇸</span>
                      <span>+1</span>
                    </div>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      defaultValue={state.data.phone || ""}
                      className="rounded-l-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="moveInDate" className="block text-sm font-medium text-slate-700">
                    Move-in date
                  </label>
                  <Input
                    id="moveInDate"
                    name="moveInDate"
                    type="date"
                    defaultValue={state.data.moveInDate || ""}
                    placeholder="Select move-in date"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="budget" className="block text-sm font-medium text-slate-700">
                    Budget range (per month)
                  </label>
                  <select
                    id="budget"
                    name="budget"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    defaultValue={
                      state.data.budgetMin && state.data.budgetMax
                        ? `${state.data.budgetMin}-${state.data.budgetMax}`
                        : ""
                    }
                  >
                    <option value="">e.g. $450 - $800</option>
                    {BUDGET_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 sm:col-span-2 sm:w-1/2">
                  <label htmlFor="preferredCity" className="block text-sm font-medium text-slate-700">
                    Preferred city
                  </label>
                  <Input
                    id="preferredCity"
                    name="preferredCity"
                    type="text"
                    placeholder="e.g. Austin, TX"
                    defaultValue={state.data.preferredCity || ""}
                  />
                </div>
              </div>
            </section>

            {/* Roommate & lifestyle preferences */}
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Roommate & lifestyle preferences</h2>
              <p className="text-sm text-slate-500 mb-4">
                This helps us match you with the right home and housemates.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="roommatePreference" className="block text-sm font-medium text-slate-700">
                    I prefer
                  </label>
                  <select
                    id="roommatePreference"
                    name="roommatePreference"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    defaultValue={state.data.roommatePreference || ""}
                  >
                    <option value="">No preference</option>
                    {ROOMMATE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="lifestyle" className="block text-sm font-medium text-slate-700">
                    Lifestyle
                  </label>
                  <select
                    id="lifestyle"
                    name="lifestyle"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    defaultValue={state.data.lifestyle || ""}
                  >
                    <option value="">e.g. Quiet, Social, Early riser</option>
                    {LIFESTYLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="aboutMe" className="block text-sm font-medium text-slate-700">
                    About me (optional)
                  </label>
                  <Textarea
                    id="aboutMe"
                    name="aboutMe"
                    placeholder="Share a little about yourself, your routine, or what you're looking for in a home..."
                    defaultValue={state.data.aboutMe || ""}
                    maxLength={250}
                    rows={3}
                    onChange={(e) => setAboutMeLength(e.target.value.length)}
                  />
                  <p className="text-xs text-slate-400 text-right">{aboutMeLength} / 250</p>
                </div>
              </div>
            </section>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Profile Photo */}
          <div className="space-y-4">
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-4">
                <Camera className="h-8 w-8 text-slate-400" />
              </div>
              <p className="font-medium text-slate-900">Add a profile photo</p>
              <p className="text-sm text-slate-500 mt-1">
                Helps landlords & housemates get to know you.
              </p>
              <Button type="button" variant="outline" size="sm" className="mt-4">
                Upload Photo
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save & continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
