"use client";

import * as React from "react";
import { MessageSquare, ArrowRight, Loader2, Bell, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptHouseRules } from "@/lib/actions/tenant-onboarding";
import type { TenantOnboardingState } from "@/lib/onboarding/tenant-state";

interface MessagingRulesStepProps {
  state: TenantOnboardingState;
  onContinue: () => void;
}

const NOTIFICATION_OPTIONS = [
  { id: "messages", label: "New messages from landlords", defaultChecked: true },
  { id: "applications", label: "Application status updates", defaultChecked: true },
  { id: "availability", label: "New beds matching my preferences", defaultChecked: true },
  { id: "rent", label: "Rent payment reminders", defaultChecked: true },
  { id: "announcements", label: "House announcements", defaultChecked: true },
];

/**
 * MessagingRulesStep
 *
 * Communication preferences and house rules acceptance.
 */
export function MessagingRulesStep({ state, onContinue }: MessagingRulesStepProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [rulesAccepted, setRulesAccepted] = React.useState(state.data.houseRulesAccepted);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!rulesAccepted) {
      setError("Please accept the community guidelines to continue.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await acceptHouseRules();
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
          <MessageSquare className="h-6 w-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">Stay connected</h1>
        </div>
        <p className="text-slate-600">
          Set up your communication preferences and review our community guidelines.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Notification Preferences */}
        <section className="rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">Notification preferences</h2>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Choose what updates you&apos;d like to receive. You can change these anytime.
          </p>

          <div className="space-y-3">
            {NOTIFICATION_OPTIONS.map((option) => (
              <label
                key={option.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 has-[:checked]:border-indigo-200 has-[:checked]:bg-indigo-50"
              >
                <input
                  type="checkbox"
                  name={`notification_${option.id}`}
                  defaultChecked={option.defaultChecked}
                  className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700">{option.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Community Guidelines */}
        <section className="rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">Community guidelines</h2>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto text-sm text-slate-600 space-y-3">
            <p className="font-medium text-slate-900">As a renta bed tenant, you agree to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Treat all housemates, landlords, and staff with respect</li>
              <li>Keep shared spaces clean and tidy</li>
              <li>Follow quiet hours (typically 10 PM - 8 AM) unless otherwise specified</li>
              <li>Not sublet or share your bed without landlord approval</li>
              <li>Report any maintenance issues promptly</li>
              <li>Pay rent on time as agreed in your lease</li>
              <li>Give proper notice before moving out (as specified in your lease)</li>
              <li>Not engage in illegal activities on the property</li>
            </ul>
            <p className="mt-4">
              Individual properties may have additional house rules. You&apos;ll be able to review these before applying.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rulesAccepted}
              onChange={(e) => setRulesAccepted(e.target.checked)}
              className="h-5 w-5 mt-0.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700">
              I have read and agree to the community guidelines. I understand that individual properties may have additional rules.
            </span>
          </label>
        </section>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
          <Button type="submit" disabled={isSubmitting || !rulesAccepted}>
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
