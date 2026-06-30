"use client";

import * as React from "react";
import { useActionState, useRef, useState, useCallback, useTransition } from "react";
import { User, Upload, Check, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormAlert } from "@/components/forms/FormAlert";
import { StepHintSlot } from "../StepHintSlot";
import { Badge } from "@/components/ui/badge";
import { getStep } from "@/lib/onboarding/content";
import { updateLandlordProfileAction, uploadLandlordAvatarAction } from "@/lib/actions/onboarding";
import { initialActionState } from "@/lib/actions/types";
import type { LandlordOnboardingState } from "@/lib/onboarding/state";
import { cn } from "@/lib/utils";

interface AccountStepProps {
  state: LandlordOnboardingState;
  onContinue: () => void;
}

/**
 * AccountStep
 *
 * Step 1 of onboarding - Required to publish.
 * Collects: legal name, display name, phone, landlord type, emergency contact, avatar.
 */
export function AccountStep({ state, onContinue }: AccountStepProps) {
  const step = getStep("account");
  const { data } = state;

  // Form state
  const [profileState, profileAction] = useActionState(
    updateLandlordProfileAction,
    initialActionState
  );

  const [avatarState, avatarAction] = useActionState(
    uploadLandlordAvatarAction,
    initialActionState
  );

  // Auto-save state
  const [, startSaveTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"" | "saving" | "saved">("");
  const formRef = useRef<HTMLFormElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Local avatar preview
  const [avatarPreview, setAvatarPreview] = useState<string | null>(data.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fieldErrors = profileState.fieldErrors ?? {};

  // Auto-save function - called on field blur
  const handleAutoSave = useCallback(() => {
    if (!formRef.current) return;

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus("saving");

    // Debounce the save by 500ms
    saveTimeoutRef.current = setTimeout(() => {
      if (!formRef.current) return;

      const formData = new FormData(formRef.current);

      startSaveTransition(async () => {
        const result = await updateLandlordProfileAction(initialActionState, formData);
        if (result.status === "success") {
          setSaveStatus("saved");
          // Clear "saved" status after 2 seconds
          setTimeout(() => setSaveStatus(""), 2000);
        } else {
          setSaveStatus("");
        }
      });
    }, 500);
  }, []);

  // Handle file selection for avatar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Submit form
      const formData = new FormData();
      formData.append("avatar", file);
      avatarAction(formData);
    }
  };

  // Handle form submission success
  React.useEffect(() => {
    if (profileState.status === "success") {
      onContinue();
    }
  }, [profileState.status, onContinue]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-slate-900">{step?.title}</h2>
          {saveStatus === "saving" && (
            <span className="text-sm text-slate-400">(Saving...)</span>
          )}
          {saveStatus === "saved" && (
            <span className="text-sm text-slate-400">(Saved)</span>
          )}
        </div>
        <p className="text-slate-500 mt-1">{step?.subtitle}</p>
      </div>

      {/* Main Form */}
      <form ref={formRef} action={profileAction} className="space-y-6">
        <FormAlert state={profileState} />

        {/* Profile Photo - Optional/Recommended */}
        <div className="flex items-start gap-6">
          <div className="relative">
            <div
              className={cn(
                "h-20 w-20 rounded-full flex items-center justify-center overflow-hidden",
                avatarPreview ? "bg-slate-100" : "bg-slate-100 border-2 border-dashed border-slate-300"
              )}
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-slate-400" />
              )}
            </div>
            {avatarState.status === "success" && (
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700">Profile photo</p>
            <p className="text-xs text-slate-500 mt-1">
              Recommended. Helps tenants trust their future landlord.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3 w-3 mr-1.5" />
              Upload photo
            </Button>
            {avatarState.status === "error" && (
              <p className="text-xs text-red-600 mt-1">{avatarState.message}</p>
            )}
          </div>
        </div>

        {/* Email - Read-only */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Email
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="text-sm">{data.email}</span>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700">
              <Check className="h-3 w-3 mr-1" />
              Confirmed
            </Badge>
          </div>
        </div>

        {/* Legal Name - Required */}
        <FormField
          label="Legal name"
          htmlFor="full_name"
          required
          error={fieldErrors.full_name}
          hint="As it appears on your ID"
        >
          <Input
            id="full_name"
            name="full_name"
            defaultValue={data.fullName || ""}
            placeholder="John Smith"
            autoComplete="name"
            onBlur={handleAutoSave}
          />
        </FormField>

        {/* Display Name - Optional */}
        <FormField
          label="Display name"
          htmlFor="display_name"
          hint="How you want tenants to address you (optional)"
        >
          <Input
            id="display_name"
            name="display_name"
            defaultValue={data.displayName || ""}
            placeholder="John"
            onBlur={handleAutoSave}
          />
        </FormField>

        {/* Phone - Required */}
        <FormField
          label="Phone number"
          htmlFor="phone"
          required
          error={fieldErrors.phone}
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={data.phone || ""}
            placeholder="(555) 123-4567"
            autoComplete="tel"
            onBlur={handleAutoSave}
          />
        </FormField>

        {/* Landlord Type - Required */}
        <FormField
          label="I am a..."
          htmlFor="landlord_type"
          required
          error={fieldErrors.landlord_type}
        >
          <Select
            id="landlord_type"
            name="landlord_type"
            defaultValue={data.landlordType || ""}
            onBlur={handleAutoSave}
          >
            <option value="">Select one</option>
            <option value="individual">Individual property owner</option>
            <option value="company">Property management company</option>
            <option value="property_manager">Property manager for an owner</option>
          </Select>
        </FormField>

        {/* Emergency Contact - Recommended */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-medium text-slate-900 mb-1">
            Emergency contact
            <span className="ml-2 text-xs font-normal text-slate-500">(Recommended)</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Someone we can reach in case of emergency at your property.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Contact name" htmlFor="emergency_contact_name">
              <Input
                id="emergency_contact_name"
                name="emergency_contact_name"
                defaultValue={data.emergencyContactName || ""}
                placeholder="Jane Smith"
                onBlur={handleAutoSave}
              />
            </FormField>

            <FormField label="Contact phone" htmlFor="emergency_contact_phone">
              <Input
                id="emergency_contact_phone"
                name="emergency_contact_phone"
                type="tel"
                defaultValue={data.emergencyContactPhone || ""}
                placeholder="(555) 987-6543"
                onBlur={handleAutoSave}
              />
            </FormField>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <SubmitButton className="w-full sm:w-auto" pendingLabel="Saving...">
            Continue
          </SubmitButton>
        </div>
      </form>

      {/* Hint Slot */}
      <StepHintSlot hint={step?.hint || ""} />
    </div>
  );
}
