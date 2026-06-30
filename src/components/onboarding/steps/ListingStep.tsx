"use client";

import * as React from "react";
import { useState, useEffect, useActionState } from "react";
import {
  Camera,
  FileText,
  MapPin,
  AlertCircle,
  Check,
  Image as ImageIcon,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StepHintSlot } from "../StepHintSlot";
import { getStep } from "@/lib/onboarding/content";
import { PhotoUpload } from "@/components/PhotoUpload";
import { updateListingContentAction } from "@/lib/actions/onboarding";
import { uploadMedia, deleteMedia, setCoverMedia } from "@/lib/actions/media";
import { initialActionState } from "@/lib/actions/types";
import { FormAlert } from "@/components/forms/FormAlert";
import { SubmitButton } from "@/components/forms/SubmitButton";
import type { LandlordOnboardingState } from "@/lib/onboarding/state";
import type { PropertyMedia } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ListingStepProps {
  state: LandlordOnboardingState;
  existingPhotos?: PropertyMedia[];
  onContinue: () => void;
}

/**
 * ListingStep
 *
 * Step 5 of onboarding - Required to publish.
 * - Photo upload (cover + minimum 3)
 * - Description
 * - Neighborhood info
 */
export function ListingStep({ state, existingPhotos = [], onContinue }: ListingStepProps) {
  const step = getStep("listing");
  const { data } = state;

  // Form state
  const [formState, formAction] = useActionState(
    updateListingContentAction,
    initialActionState
  );

  // Local form state
  const [description, setDescription] = useState(data.description || "");
  const [neighborhood, setNeighborhood] = useState(data.neighborhood || "");

  // Photo state - track counts for requirements checking
  // (PhotoUpload manages its own internal state)
  const [photoCount, setPhotoCount] = useState(
    existingPhotos.length > 0 ? existingPhotos.length : data.photoCount
  );
  const [hasCoverPhoto, setHasCoverPhoto] = useState(
    existingPhotos.some((p) => p.is_cover) || data.hasCoverPhoto
  );

  // Track if content was saved
  const [contentSaved, setContentSaved] = useState(false);

  // Handle form success
  useEffect(() => {
    if (formState.status === "success") {
      setContentSaved(true);
    }
  }, [formState]);

  // Check if requirements are met
  const meetsPhotoRequirements = hasCoverPhoto && photoCount >= 3;
  const canContinue = meetsPhotoRequirements;

  // Handle photo upload callback
  const handleUpload = async (formData: FormData) => {
    const result = await uploadMedia(initialActionState, formData);
    // Refresh photos on success - the PhotoUpload component handles state internally
    // but we need to update our local state for the requirements check
    if (result.status === "success") {
      // Note: PhotoUpload handles its own state, we just need to track for requirements
      setPhotoCount((prev) => prev + 1);
      if (photoCount === 0) {
        setHasCoverPhoto(true); // First photo becomes cover
      }
    }
    return result;
  };

  // Handle photo delete callback
  const handleDelete = async (formData: FormData) => {
    const result = await deleteMedia(initialActionState, formData);
    if (result.status === "success") {
      setPhotoCount((prev) => Math.max(0, prev - 1));
    }
    return result;
  };

  // Handle set cover callback
  const handleSetCover = async (formData: FormData) => {
    const result = await setCoverMedia(initialActionState, formData);
    if (result.status === "success") {
      setHasCoverPhoto(true);
    }
    return result;
  };

  // Property ID check
  if (!data.propertyId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{step?.title}</h2>
          <p className="text-slate-500 mt-1">{step?.subtitle}</p>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-3 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            <p>Please complete the Property step first to add photos and content.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{step?.title}</h2>
        <p className="text-slate-500 mt-1">{step?.subtitle}</p>
      </div>

      {/* Photos Section */}
      <Card className="p-6">
        <h3 className="font-medium text-slate-900 flex items-center gap-2 mb-2">
          <Camera className="h-5 w-5 text-indigo-600" />
          Property Photos
          <Badge className="bg-red-50 text-red-700 text-xs ml-1">Required</Badge>
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Upload at least 3 photos with one set as the cover. High-quality photos help attract tenants.
        </p>

        {/* Photo Requirements Status */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1 text-sm",
              hasCoverPhoto
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            )}
          >
            {hasCoverPhoto ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            Cover photo
          </div>
          <div
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1 text-sm",
              photoCount >= 3
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            )}
          >
            {photoCount >= 3 ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {photoCount}/3 minimum photos
          </div>
        </div>

        {/* Photo Tips */}
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 mb-4">
          <div className="flex items-start gap-2 text-sm text-indigo-700">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Photo tips</p>
              <ul className="mt-1 list-disc list-inside text-indigo-600 text-xs">
                <li>Use natural lighting when possible</li>
                <li>Show the full room, not just details</li>
                <li>Include common areas, kitchen, and bathroom</li>
                <li>The cover photo is the first thing tenants see</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Photo Upload */}
        <PhotoUpload
          propertyId={data.propertyId}
          mediaType="property"
          existingPhotos={existingPhotos}
          onUpload={handleUpload}
          onDelete={handleDelete}
          onSetCover={handleSetCover}
          maxPhotos={10}
        />
      </Card>

      {/* Content Section */}
      <form action={formAction}>
        <input type="hidden" name="property_id" value={data.propertyId} />

        <div className="mb-4">
          <FormAlert state={formState} />
        </div>

        <Card className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-medium text-slate-900 flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-indigo-600" />
              Description
              <Badge className="bg-slate-100 text-slate-600 text-xs ml-1">Recommended</Badge>
            </h3>

            <Label htmlFor="description">Tell tenants about your property</Label>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what makes your property special. Include details about the space, atmosphere, and what tenants can expect..."
              rows={4}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-slate-500">
              A good description helps tenants understand if your place is right for them.
            </p>
          </div>

          {/* Neighborhood */}
          <div>
            <h3 className="font-medium text-slate-900 flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-indigo-600" />
              Neighborhood & Transit
              <Badge className="bg-slate-100 text-slate-600 text-xs ml-1">Recommended</Badge>
            </h3>

            <Label htmlFor="neighborhood">What&apos;s nearby?</Label>
            <Textarea
              id="neighborhood"
              name="neighborhood"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Describe the neighborhood, nearby amenities, public transit options, distance to airport, hospitals, etc..."
              rows={3}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-slate-500">
              For crash pads and commuter housing, mention proximity to airports or work hubs.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <SubmitButton>
              {contentSaved ? "Saved" : "Save Content"}
            </SubmitButton>
          </div>
        </Card>
      </form>

      {/* Continue Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-slate-900">Ready to continue?</h4>
            {canContinue ? (
              <p className="text-sm text-emerald-600 flex items-center gap-1 mt-1">
                <Check className="h-4 w-4" />
                Photo requirements met
              </p>
            ) : (
              <p className="text-sm text-amber-600 flex items-center gap-1 mt-1">
                <AlertCircle className="h-4 w-4" />
                {!hasCoverPhoto && "Set a cover photo. "}
                {photoCount < 3 && `Add ${3 - photoCount} more photo${3 - photoCount > 1 ? "s" : ""}.`}
              </p>
            )}
          </div>
          <Button
            onClick={onContinue}
            disabled={!canContinue}
            className={cn(!canContinue && "opacity-50")}
          >
            Continue
          </Button>
        </div>
      </Card>

      {/* Requirements Note */}
      <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
        <ImageIcon className="h-5 w-5 shrink-0 text-slate-400 mt-0.5" />
        <div>
          <p className="font-medium text-slate-700">Required to publish</p>
          <ul className="mt-1 list-disc list-inside text-slate-500">
            <li>At least 3 photos</li>
            <li>One photo set as cover</li>
          </ul>
        </div>
      </div>

      {/* Hint Slot */}
      <StepHintSlot hint={step?.hint || ""} />
    </div>
  );
}
