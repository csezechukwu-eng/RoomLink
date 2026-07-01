"use client";

import * as React from "react";
import { Loader2, ArrowRight, Home, MapPin, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateTenantHousingPreferences } from "@/lib/actions/tenant-onboarding";
import type { TenantOnboardingState } from "@/lib/onboarding/tenant-state";

interface HousingPreferencesStepProps {
  state: TenantOnboardingState;
  onContinue: () => void;
}

const STAY_LENGTH_OPTIONS = [
  { value: "1-3", label: "1-3 months" },
  { value: "3-6", label: "3-6 months" },
  { value: "6-12", label: "6-12 months" },
  { value: "12+", label: "12+ months" },
  { value: "flexible", label: "Flexible" },
];

const PROPERTY_TYPE_OPTIONS = [
  { value: "crash_pad", label: "Crash Pad" },
  { value: "shared_house", label: "Shared House" },
  { value: "co_living", label: "Co-Living Space" },
  { value: "any", label: "Any type" },
];

/**
 * HousingPreferencesStep
 *
 * Collects tenant housing preferences including location, budget, stay length.
 */
export function HousingPreferencesStep({ state, onContinue }: HousingPreferencesStepProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await updateTenantHousingPreferences(formData);
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
          <Home className="h-6 w-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">What are you looking for?</h1>
        </div>
        <p className="text-slate-600">
          Tell us about your ideal living situation so we can show you the best matches.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Location Preferences */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-slate-400" />
            Location preferences
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="preferredCity" className="block text-sm font-medium text-slate-700">
                Preferred city or area
              </label>
              <Input
                id="preferredCity"
                name="preferredCity"
                type="text"
                placeholder="e.g. Austin, TX"
                defaultValue={state.data.preferredCity || ""}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="maxCommute" className="block text-sm font-medium text-slate-700">
                Max commute to work/airport (optional)
              </label>
              <select
                id="maxCommute"
                name="maxCommute"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">No preference</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
          </div>
        </section>

        {/* Budget & Timeline */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-slate-400" />
            Budget & timeline
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="budgetMin" className="block text-sm font-medium text-slate-700">
                Monthly budget (min)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <Input
                  id="budgetMin"
                  name="budgetMin"
                  type="number"
                  placeholder="450"
                  defaultValue={state.data.budgetMin || ""}
                  className="pl-7"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="budgetMax" className="block text-sm font-medium text-slate-700">
                Monthly budget (max)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <Input
                  id="budgetMax"
                  name="budgetMax"
                  type="number"
                  placeholder="800"
                  defaultValue={state.data.budgetMax || ""}
                  className="pl-7"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="moveInDate" className="block text-sm font-medium text-slate-700">
                When do you need to move in?
              </label>
              <Input
                id="moveInDate"
                name="moveInDate"
                type="date"
                defaultValue={state.data.moveInDate || ""}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="stayLength" className="block text-sm font-medium text-slate-700">
                How long do you plan to stay?
              </label>
              <select
                id="stayLength"
                name="stayLength"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select duration</option>
                {STAY_LENGTH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Property Type */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-slate-400" />
            Property preferences
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                What type of housing are you looking for?
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {PROPERTY_TYPE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50"
                  >
                    <input
                      type="radio"
                      name="propertyType"
                      value={opt.value}
                      className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
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
