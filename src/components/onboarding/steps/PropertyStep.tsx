"use client";

import * as React from "react";
import { useState, useEffect, useActionState, useCallback, useTransition, useRef } from "react";
import {
  Building2,
  MapPin,
  Bed,
  DollarSign,
  Check,
  AlertCircle,
  Calendar,
  Wifi,
  Sofa,
  Car,
  WashingMachine,
  Home,
  Bath,
  Users,
  Heart,
  Snowflake,
  Sun,
  Lock,
  Package,
  Flame,
  UtensilsCrossed,
  Droplets,
  Trees,
  Sparkles,
  Bike,
  Dumbbell,
  Phone,
  Monitor,
  Laptop,
  PanelTop,
  Shirt,
  Coins,
  ScrollText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StepHintSlot } from "../StepHintSlot";
import { getStep } from "@/lib/onboarding/content";
import {
  createOrUpdatePropertyListingAction,
  createRoomAndBedAction,
} from "@/lib/actions/onboarding";
import { initialActionState } from "@/lib/actions/types";
import { FormAlert } from "@/components/forms/FormAlert";
import { SubmitButton } from "@/components/forms/SubmitButton";
import type { LandlordOnboardingState } from "@/lib/onboarding/state";
import { PROPERTY_TYPES, PROPERTY_OCCUPANCY_TYPES, BUNK_TYPES, PROPERTY_AMENITIES, AMENITY_CATEGORIES, getAmenitiesByCategory } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PropertyStepProps {
  state: LandlordOnboardingState;
  onContinue: () => void;
}

// localStorage keys for form persistence
const PROPERTY_FORM_STORAGE_KEY = "roomlink_property_form_draft";
const ROOM_FORM_STORAGE_KEY = "roomlink_room_form_draft";

/**
 * PropertyStep
 *
 * Step 4 of onboarding - Required to publish.
 * - Property basics (name, type, address)
 * - Amenities
 * - Room and bed setup with pricing
 */
export function PropertyStep({ state, onContinue }: PropertyStepProps) {
  const step = getStep("property");
  const { data } = state;

  // Track if we've loaded from localStorage
  const hasLoadedFromStorage = useRef(false);

  // Track which section we're on
  const [currentSection, setCurrentSection] = useState<"property" | "room">(
    data.propertyId ? "room" : "property"
  );

  // Property form state
  const [propertyState, propertyAction] = useActionState(
    createOrUpdatePropertyListingAction,
    initialActionState
  );

  // Room/bed form state
  const [roomState, roomAction] = useActionState(
    createRoomAndBedAction,
    initialActionState
  );

  // Auto-save state
  const [, startSaveTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"" | "saving" | "saved">("");
  const propertyFormRef = useRef<HTMLFormElement>(null);
  const roomFormRef = useRef<HTMLFormElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Local state for property ID (updated after creation)
  const [propertyId, setPropertyId] = useState<string | null>(data.propertyId);

  // Helper to get default property form state
  const getDefaultPropertyForm = useCallback(() => ({
    name: data.propertyName || "",
    property_type: data.propertyType || "",
    address: data.address || "",
    city: data.city || "",
    state: data.state || "",
    zip: data.zip || "",
    description: data.description || "",
    occupancy_type: data.occupancyType || "",
    default_min_stay_days: data.defaultMinStayDays?.toString() || "30",
    // Property details
    num_bedrooms: "",
    num_bathrooms: "",
    // Additional details
    laundry: data.laundry || "",
    parking: data.parking || "",
    // Bathroom & Laundry
    has_dryer: false,
    has_paid_laundry: false,
    toilet_paper_provided: false,
    // Comfort
    has_air_conditioning: false,
    has_balcony: false,
    has_heating: false,
    linen_provided: false,
    has_blackout_blinds: false,
    bedroom_essentials: false,
    bedroom_door_lock: false,
    // Community
    has_chill_out_area: false,
    has_shared_living_area: false,
    has_bbq_area: false,
    has_dining_area: false,
    has_dishwasher: false,
    // Outdoors
    has_outdoor_space: false,
    // Services
    common_area_cleaning: false,
    room_cleaning: false,
    // Transport & Access
    has_bicycles: false,
    has_free_street_parking: false,
    has_on_site_parking: false,
    has_paid_parking: false,
    // Wellness & Recreation
    has_gym: false,
    has_yoga_space: false,
    // Work
    has_high_speed_wifi: false,
    has_meeting_rooms: false,
    has_private_call_room: false,
    has_workspace: false,
    has_desk_workspace: false,
  }), [data]);

  // Helper to get default room form state
  const getDefaultRoomForm = useCallback(() => ({
    room_name: data.roomName || "Room 1",
    bed_label: data.bedLabel || "Bed 1",
    bunk_type: "single",
    monthly_rent: data.monthlyRent?.toString() || "",
    deposit_amount: data.depositAmount?.toString() || "",
    available_from: data.availableFrom || "",
    min_stay_days: data.minStayDays?.toString() || "",
    max_stay_days: data.maxStayDays?.toString() || "",
  }), [data]);

  // Local form state for property
  const [propertyForm, setPropertyForm] = useState(getDefaultPropertyForm);

  // Local form state for room/bed
  const [roomForm, setRoomForm] = useState(getDefaultRoomForm);

  // Load saved form data from localStorage on mount
  useEffect(() => {
    if (hasLoadedFromStorage.current) return;
    hasLoadedFromStorage.current = true;

    try {
      // Load property form
      const savedPropertyForm = localStorage.getItem(PROPERTY_FORM_STORAGE_KEY);
      if (savedPropertyForm) {
        const parsed = JSON.parse(savedPropertyForm);
        setPropertyForm(prev => ({ ...prev, ...parsed }));
      }

      // Load room form
      const savedRoomForm = localStorage.getItem(ROOM_FORM_STORAGE_KEY);
      if (savedRoomForm) {
        const parsed = JSON.parse(savedRoomForm);
        setRoomForm(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error("Error loading form data from localStorage:", error);
    }
  }, []);

  // Save property form to localStorage whenever it changes
  useEffect(() => {
    if (!hasLoadedFromStorage.current) return; // Don't save during initial load
    try {
      localStorage.setItem(PROPERTY_FORM_STORAGE_KEY, JSON.stringify(propertyForm));
    } catch (error) {
      console.error("Error saving property form to localStorage:", error);
    }
  }, [propertyForm]);

  // Save room form to localStorage whenever it changes
  useEffect(() => {
    if (!hasLoadedFromStorage.current) return; // Don't save during initial load
    try {
      localStorage.setItem(ROOM_FORM_STORAGE_KEY, JSON.stringify(roomForm));
    } catch (error) {
      console.error("Error saving room form to localStorage:", error);
    }
  }, [roomForm]);

  // Handle property form success
  useEffect(() => {
    if (propertyState.status === "success" && propertyState.data?.propertyId) {
      setPropertyId(propertyState.data.propertyId);
      setCurrentSection("room");
      // Clear property form from localStorage after successful save
      try {
        localStorage.removeItem(PROPERTY_FORM_STORAGE_KEY);
      } catch (error) {
        console.error("Error clearing property form from localStorage:", error);
      }
    }
  }, [propertyState]);

  // Handle room/bed form success - advance to next step
  useEffect(() => {
    if (roomState.status === "success") {
      // Clear room form from localStorage after successful save
      try {
        localStorage.removeItem(ROOM_FORM_STORAGE_KEY);
      } catch (error) {
        console.error("Error clearing room form from localStorage:", error);
      }
      // Short delay before continuing
      const timer = setTimeout(onContinue, 500);
      return () => clearTimeout(timer);
    }
  }, [roomState, onContinue]);

  // Property form handlers
  const handlePropertyChange = (field: string, value: string | boolean) => {
    setPropertyForm((prev) => ({ ...prev, [field]: value }));
  };

  // Room form handlers
  const handleRoomChange = (field: string, value: string) => {
    setRoomForm((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-save for property form
  const handlePropertyAutoSave = useCallback(() => {
    if (!propertyFormRef.current || !propertyId) return; // Only auto-save if property exists

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus("saving");

    saveTimeoutRef.current = setTimeout(() => {
      if (!propertyFormRef.current) return;

      const formData = new FormData(propertyFormRef.current);

      startSaveTransition(async () => {
        const result = await createOrUpdatePropertyListingAction(initialActionState, formData);
        if (result.status === "success") {
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus(""), 2000);
        } else {
          setSaveStatus("");
        }
      });
    }, 500);
  }, [propertyId]);

  // Auto-save for room form
  const handleRoomAutoSave = useCallback(() => {
    if (!roomFormRef.current || !propertyId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus("saving");

    saveTimeoutRef.current = setTimeout(() => {
      if (!roomFormRef.current) return;

      const formData = new FormData(roomFormRef.current);

      startSaveTransition(async () => {
        const result = await createRoomAndBedAction(initialActionState, formData);
        if (result.status === "success") {
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus(""), 2000);
        } else {
          setSaveStatus("");
        }
      });
    }, 500);
  }, [propertyId]);

  // Check if property section is complete
  const isPropertyComplete = Boolean(
    propertyForm.name && propertyForm.property_type && propertyForm.address
  );

  // Check if room section is complete
  const isRoomComplete = Boolean(
    roomForm.room_name &&
    roomForm.bed_label &&
    roomForm.monthly_rent &&
    parseFloat(roomForm.monthly_rent) > 0
  );

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

      {/* Section Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setCurrentSection("property")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            currentSection === "property"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Property Details
            {isPropertyComplete && propertyId && (
              <Check className="h-4 w-4 text-emerald-500" />
            )}
          </div>
        </button>
        <button
          type="button"
          onClick={() => propertyId && setCurrentSection("room")}
          disabled={!propertyId}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            currentSection === "room"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700",
            !propertyId && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-2">
            <Bed className="h-4 w-4" />
            Room & Pricing
            {isRoomComplete && data.hasBedWithRent && (
              <Check className="h-4 w-4 text-emerald-500" />
            )}
          </div>
        </button>
      </div>

      {/* Property Section */}
      {currentSection === "property" && (
        <form ref={propertyFormRef} action={propertyAction}>
          <input type="hidden" name="property_id" value={propertyId || ""} />

          {/* Property Form Alert */}
          <div className="mb-4">
            <FormAlert state={propertyState} />
          </div>

          <Card className="p-6 space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="font-medium text-slate-900 flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-indigo-600" />
                Basic Information
              </h3>

              <div className="grid gap-4">
                {/* Property Name */}
                <div>
                  <Label htmlFor="name" className="flex items-center gap-1">
                    Listing Title
                    <Badge className="bg-red-50 text-red-700 text-xs ml-1">Required</Badge>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={propertyForm.name}
                    onChange={(e) => handlePropertyChange("name", e.target.value)}
                    onBlur={handlePropertyAutoSave}
                    placeholder="e.g., Cozy Crash Pad Near Airport"
                    className={cn(
                      "mt-1",
                      propertyState.fieldErrors?.name && "border-red-500"
                    )}
                  />
                  {propertyState.fieldErrors?.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {propertyState.fieldErrors.name}
                    </p>
                  )}
                </div>

                {/* Property Type */}
                <div>
                  <Label htmlFor="property_type" className="flex items-center gap-1">
                    Property Type
                    <Badge className="bg-red-50 text-red-700 text-xs ml-1">Required</Badge>
                  </Label>
                  <select
                    id="property_type"
                    name="property_type"
                    value={propertyForm.property_type}
                    onChange={(e) => handlePropertyChange("property_type", e.target.value)}
                    className={cn(
                      "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500",
                      propertyState.fieldErrors?.property_type && "border-red-500"
                    )}
                  >
                    <option value="">Select type...</option>
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {propertyState.fieldErrors?.property_type && (
                    <p className="mt-1 text-sm text-red-600">
                      {propertyState.fieldErrors.property_type}
                    </p>
                  )}
                </div>

                {/* Occupancy Type */}
                <div>
                  <Label htmlFor="occupancy_type">Occupancy Type</Label>
                  <select
                    id="occupancy_type"
                    name="occupancy_type"
                    value={propertyForm.occupancy_type}
                    onChange={(e) => handlePropertyChange("occupancy_type", e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Select occupancy type...</option>
                    {PROPERTY_OCCUPANCY_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="font-medium text-slate-900 flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-indigo-600" />
                Location
              </h3>

              <div className="grid gap-4">
                <div>
                  <Label htmlFor="address" className="flex items-center gap-1">
                    Street Address
                    <Badge className="bg-red-50 text-red-700 text-xs ml-1">Required</Badge>
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={propertyForm.address}
                    onChange={(e) => handlePropertyChange("address", e.target.value)}
                    onBlur={handlePropertyAutoSave}
                    placeholder="123 Main Street"
                    className={cn(
                      "mt-1",
                      propertyState.fieldErrors?.address && "border-red-500"
                    )}
                  />
                  {propertyState.fieldErrors?.address && (
                    <p className="mt-1 text-sm text-red-600">
                      {propertyState.fieldErrors.address}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={propertyForm.city}
                      onChange={(e) => handlePropertyChange("city", e.target.value)}
                      onBlur={handlePropertyAutoSave}
                      placeholder="San Francisco"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      value={propertyForm.state}
                      onChange={(e) => handlePropertyChange("state", e.target.value)}
                      onBlur={handlePropertyAutoSave}
                      placeholder="CA"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      name="zip"
                      value={propertyForm.zip}
                      onChange={(e) => handlePropertyChange("zip", e.target.value)}
                      onBlur={handlePropertyAutoSave}
                      placeholder="94102"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="flex items-center gap-1">
                Description
                <Badge className="bg-slate-100 text-slate-600 text-xs ml-1">Recommended</Badge>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={propertyForm.description}
                onChange={(e) => handlePropertyChange("description", e.target.value)}
                placeholder="Describe your property..."
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Property Details */}
            <div>
              <h3 className="font-medium text-slate-900 flex items-center gap-2 mb-4">
                <Home className="h-5 w-5 text-indigo-600" />
                Property Details
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="num_bedrooms" className="flex items-center gap-1">
                    <Bed className="h-4 w-4 text-slate-400" />
                    Bedrooms
                    <Badge className="bg-red-50 text-red-700 text-xs ml-1">Required</Badge>
                  </Label>
                  <Input
                    id="num_bedrooms"
                    name="num_bedrooms"
                    type="number"
                    min="1"
                    value={propertyForm.num_bedrooms}
                    onChange={(e) => handlePropertyChange("num_bedrooms", e.target.value)}
                    placeholder="1"
                    className={cn(
                      "mt-1",
                      propertyState.fieldErrors?.num_bedrooms && "border-red-500"
                    )}
                  />
                  {propertyState.fieldErrors?.num_bedrooms && (
                    <p className="mt-1 text-sm text-red-600">
                      {propertyState.fieldErrors.num_bedrooms}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="num_bathrooms" className="flex items-center gap-1">
                    <Bath className="h-4 w-4 text-slate-400" />
                    Bathrooms
                    <Badge className="bg-red-50 text-red-700 text-xs ml-1">Required</Badge>
                  </Label>
                  <Input
                    id="num_bathrooms"
                    name="num_bathrooms"
                    type="number"
                    min="1"
                    value={propertyForm.num_bathrooms}
                    onChange={(e) => handlePropertyChange("num_bathrooms", e.target.value)}
                    placeholder="1"
                    className={cn(
                      "mt-1",
                      propertyState.fieldErrors?.num_bathrooms && "border-red-500"
                    )}
                  />
                  {propertyState.fieldErrors?.num_bathrooms && (
                    <p className="mt-1 text-sm text-red-600">
                      {propertyState.fieldErrors.num_bathrooms}
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* Standard Inclusions */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <h3 className="font-medium text-emerald-900 mb-2">Included with All Room Link Properties</h3>
              <p className="text-sm text-emerald-700 mb-3">
                The following amenities are automatically included with all properties listed on Room Link:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <Check className="h-4 w-4" />
                  <span>Fully Furnished</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <Check className="h-4 w-4" />
                  <span>Utilities Included</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <Check className="h-4 w-4" />
                  <span>WiFi Included</span>
                </div>
              </div>
            </div>

            {/* Additional Amenities */}
            <div>
              <h3 className="font-medium text-slate-900 mb-4">Additional Details</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="laundry" className="flex items-center gap-1">
                    <WashingMachine className="h-4 w-4 text-slate-400" />
                    Laundry
                  </Label>
                  <Input
                    id="laundry"
                    name="laundry"
                    value={propertyForm.laundry}
                    onChange={(e) => handlePropertyChange("laundry", e.target.value)}
                    placeholder="e.g., In-unit washer/dryer"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="parking" className="flex items-center gap-1">
                    <Car className="h-4 w-4 text-slate-400" />
                    Parking
                  </Label>
                  <Input
                    id="parking"
                    name="parking"
                    value={propertyForm.parking}
                    onChange={(e) => handlePropertyChange("parking", e.target.value)}
                    placeholder="e.g., Street parking available"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* All Amenities */}
            <div>
              <h3 className="font-medium text-slate-900 mb-4">All Amenities</h3>

              {/* Comfort */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Comfort</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_air_conditioning" value="true" checked={propertyForm.has_air_conditioning} onChange={(e) => handlePropertyChange("has_air_conditioning", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Snowflake className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Air conditioning</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_heating" value="true" checked={propertyForm.has_heating} onChange={(e) => handlePropertyChange("has_heating", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Sun className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Heating</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_balcony" value="true" checked={propertyForm.has_balcony} onChange={(e) => handlePropertyChange("has_balcony", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Balcony</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="linen_provided" value="true" checked={propertyForm.linen_provided} onChange={(e) => handlePropertyChange("linen_provided", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Bed className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Linen</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_blackout_blinds" value="true" checked={propertyForm.has_blackout_blinds} onChange={(e) => handlePropertyChange("has_blackout_blinds", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <PanelTop className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Blackout blinds</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="bedroom_door_lock" value="true" checked={propertyForm.bedroom_door_lock} onChange={(e) => handlePropertyChange("bedroom_door_lock", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Lock className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Bedroom door lock</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="bedroom_essentials" value="true" checked={propertyForm.bedroom_essentials} onChange={(e) => handlePropertyChange("bedroom_essentials", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Package className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Bedroom essentials</span>
                  </label>
                </div>
              </div>

              {/* Bathroom & Laundry */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Bathroom & Laundry</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_dryer" value="true" checked={propertyForm.has_dryer} onChange={(e) => handlePropertyChange("has_dryer", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Shirt className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Dryer</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_paid_laundry" value="true" checked={propertyForm.has_paid_laundry} onChange={(e) => handlePropertyChange("has_paid_laundry", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Coins className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Paid laundry</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="toilet_paper_provided" value="true" checked={propertyForm.toilet_paper_provided} onChange={(e) => handlePropertyChange("toilet_paper_provided", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <ScrollText className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Toilet paper</span>
                  </label>
                </div>
              </div>

              {/* Community */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Community</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_chill_out_area" value="true" checked={propertyForm.has_chill_out_area} onChange={(e) => handlePropertyChange("has_chill_out_area", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Sofa className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Chill-out area</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_shared_living_area" value="true" checked={propertyForm.has_shared_living_area} onChange={(e) => handlePropertyChange("has_shared_living_area", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Sofa className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Shared living area</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_bbq_area" value="true" checked={propertyForm.has_bbq_area} onChange={(e) => handlePropertyChange("has_bbq_area", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Flame className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">BBQ area</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_dining_area" value="true" checked={propertyForm.has_dining_area} onChange={(e) => handlePropertyChange("has_dining_area", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <UtensilsCrossed className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Dining area</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_dishwasher" value="true" checked={propertyForm.has_dishwasher} onChange={(e) => handlePropertyChange("has_dishwasher", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Droplets className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Dishwasher</span>
                  </label>
                </div>
              </div>

              {/* Transport & Access */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Transport & Access</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_bicycles" value="true" checked={propertyForm.has_bicycles} onChange={(e) => handlePropertyChange("has_bicycles", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Bike className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Bicycles</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_free_street_parking" value="true" checked={propertyForm.has_free_street_parking} onChange={(e) => handlePropertyChange("has_free_street_parking", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Car className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Free street parking</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_on_site_parking" value="true" checked={propertyForm.has_on_site_parking} onChange={(e) => handlePropertyChange("has_on_site_parking", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Car className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">On-site parking</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_paid_parking" value="true" checked={propertyForm.has_paid_parking} onChange={(e) => handlePropertyChange("has_paid_parking", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Car className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Paid parking</span>
                  </label>
                </div>
              </div>

              {/* Outdoors & Services */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Outdoors & Services</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_outdoor_space" value="true" checked={propertyForm.has_outdoor_space} onChange={(e) => handlePropertyChange("has_outdoor_space", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Trees className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Outdoor space</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="common_area_cleaning" value="true" checked={propertyForm.common_area_cleaning} onChange={(e) => handlePropertyChange("common_area_cleaning", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Sparkles className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Common area cleaning</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="room_cleaning" value="true" checked={propertyForm.room_cleaning} onChange={(e) => handlePropertyChange("room_cleaning", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Sparkles className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Room cleaning</span>
                  </label>
                </div>
              </div>

              {/* Wellness & Recreation */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Wellness & Recreation</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_gym" value="true" checked={propertyForm.has_gym} onChange={(e) => handlePropertyChange("has_gym", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Dumbbell className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Gym / fitness center</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_yoga_space" value="true" checked={propertyForm.has_yoga_space} onChange={(e) => handlePropertyChange("has_yoga_space", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Heart className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Yoga space</span>
                  </label>
                </div>
              </div>

              {/* Work */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">Work</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_high_speed_wifi" value="true" checked={propertyForm.has_high_speed_wifi} onChange={(e) => handlePropertyChange("has_high_speed_wifi", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Wifi className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">High-speed WiFi</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_workspace" value="true" checked={propertyForm.has_workspace} onChange={(e) => handlePropertyChange("has_workspace", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Monitor className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Workspace</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_desk_workspace" value="true" checked={propertyForm.has_desk_workspace} onChange={(e) => handlePropertyChange("has_desk_workspace", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Laptop className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Desk workspace</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_meeting_rooms" value="true" checked={propertyForm.has_meeting_rooms} onChange={(e) => handlePropertyChange("has_meeting_rooms", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Meeting rooms</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" name="has_private_call_room" value="true" checked={propertyForm.has_private_call_room} onChange={(e) => handlePropertyChange("has_private_call_room", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Private call room</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Default Stay */}
            <div>
              <Label htmlFor="default_min_stay_days">Default Minimum Stay (days)</Label>
              <Input
                id="default_min_stay_days"
                name="default_min_stay_days"
                type="number"
                min="1"
                value={propertyForm.default_min_stay_days}
                onChange={(e) => handlePropertyChange("default_min_stay_days", e.target.value)}
                className="mt-1 max-w-32"
              />
              <p className="mt-1 text-xs text-slate-500">
                Minimum nights for new bookings (30 = monthly)
              </p>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <SubmitButton className="px-6">
                {propertyId ? "Continue" : "Create Property"}
              </SubmitButton>
            </div>
          </Card>
        </form>
      )}

      {/* Room Section */}
      {currentSection === "room" && propertyId && (
        <form ref={roomFormRef} action={roomAction}>
          <input type="hidden" name="property_id" value={propertyId} />
          <input type="hidden" name="room_id" value={data.roomId || ""} />
          <input type="hidden" name="bed_id" value={data.bedId || ""} />

          {/* Room Form Alert */}
          <div className="mb-4">
            <FormAlert state={roomState} />
          </div>

          <Card className="p-6 space-y-6">
            {/* Room Info */}
            <div>
              <h3 className="font-medium text-slate-900 flex items-center gap-2 mb-4">
                <Bed className="h-5 w-5 text-indigo-600" />
                Room & Bed Setup
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Set up your first room and bed. You can add more rooms and beds later from the dashboard.
              </p>

              <div className="grid gap-4">
                {/* Room Name */}
                <div>
                  <Label htmlFor="room_name" className="flex items-center gap-1">
                    Room Name
                    <Badge className="bg-red-50 text-red-700 text-xs ml-1">Required</Badge>
                  </Label>
                  <Input
                    id="room_name"
                    name="room_name"
                    value={roomForm.room_name}
                    onChange={(e) => handleRoomChange("room_name", e.target.value)}
                    onBlur={handleRoomAutoSave}
                    placeholder="e.g., Room A, Master Bedroom"
                    className={cn(
                      "mt-1",
                      roomState.fieldErrors?.room_name && "border-red-500"
                    )}
                  />
                  {roomState.fieldErrors?.room_name && (
                    <p className="mt-1 text-sm text-red-600">
                      {roomState.fieldErrors.room_name}
                    </p>
                  )}
                </div>

                {/* Bed Label */}
                <div>
                  <Label htmlFor="bed_label" className="flex items-center gap-1">
                    Bed Label
                    <Badge className="bg-red-50 text-red-700 text-xs ml-1">Required</Badge>
                  </Label>
                  <Input
                    id="bed_label"
                    name="bed_label"
                    value={roomForm.bed_label}
                    onChange={(e) => handleRoomChange("bed_label", e.target.value)}
                    placeholder="e.g., Bed 1, Queen Bed"
                    className={cn(
                      "mt-1",
                      roomState.fieldErrors?.bed_label && "border-red-500"
                    )}
                  />
                  {roomState.fieldErrors?.bed_label && (
                    <p className="mt-1 text-sm text-red-600">
                      {roomState.fieldErrors.bed_label}
                    </p>
                  )}
                </div>

                {/* Bunk Type */}
                <div>
                  <Label htmlFor="bunk_type">Bed Type</Label>
                  <select
                    id="bunk_type"
                    name="bunk_type"
                    value={roomForm.bunk_type}
                    onChange={(e) => handleRoomChange("bunk_type", e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {BUNK_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="font-medium text-slate-900 flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-indigo-600" />
                Pricing
              </h3>

              <div className="grid gap-4">
                {/* Monthly Rent */}
                <div>
                  <Label htmlFor="monthly_rent" className="flex items-center gap-1">
                    Monthly Rent
                    <Badge className="bg-red-50 text-red-700 text-xs ml-1">Required</Badge>
                  </Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      $
                    </span>
                    <Input
                      id="monthly_rent"
                      name="monthly_rent"
                      type="number"
                      min="1"
                      step="1"
                      value={roomForm.monthly_rent}
                      onChange={(e) => handleRoomChange("monthly_rent", e.target.value)}
                      onBlur={handleRoomAutoSave}
                      placeholder="800"
                      className={cn(
                        "pl-7",
                        roomState.fieldErrors?.monthly_rent && "border-red-500"
                      )}
                    />
                  </div>
                  {roomState.fieldErrors?.monthly_rent && (
                    <p className="mt-1 text-sm text-red-600">
                      {roomState.fieldErrors.monthly_rent}
                    </p>
                  )}
                </div>

                {/* Deposit */}
                <div>
                  <Label htmlFor="deposit_amount">Security Deposit</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      $
                    </span>
                    <Input
                      id="deposit_amount"
                      name="deposit_amount"
                      type="number"
                      min="0"
                      step="1"
                      value={roomForm.deposit_amount}
                      onChange={(e) => handleRoomChange("deposit_amount", e.target.value)}
                      placeholder="800"
                      className="pl-7"
                    />
                  </div>
                  {roomState.fieldErrors?.deposit_amount && (
                    <p className="mt-1 text-sm text-red-600">
                      {roomState.fieldErrors.deposit_amount}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Availability */}
            <div>
              <h3 className="font-medium text-slate-900 flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-indigo-600" />
                Availability
              </h3>

              <div className="grid gap-4">
                {/* Available From */}
                <div>
                  <Label htmlFor="available_from">Available From</Label>
                  <Input
                    id="available_from"
                    name="available_from"
                    type="date"
                    value={roomForm.available_from}
                    onChange={(e) => handleRoomChange("available_from", e.target.value)}
                    className="mt-1 max-w-48"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Leave empty if available now
                  </p>
                </div>

                {/* Stay Length */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_stay_days">Min Stay (days)</Label>
                    <Input
                      id="min_stay_days"
                      name="min_stay_days"
                      type="number"
                      min="1"
                      value={roomForm.min_stay_days}
                      onChange={(e) => handleRoomChange("min_stay_days", e.target.value)}
                      placeholder="30"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_stay_days">Max Stay (days)</Label>
                    <Input
                      id="max_stay_days"
                      name="max_stay_days"
                      type="number"
                      min="1"
                      value={roomForm.max_stay_days}
                      onChange={(e) => handleRoomChange("max_stay_days", e.target.value)}
                      placeholder="No limit"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Host Fee Note */}
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-indigo-600 mt-0.5" />
                <div>
                  <p className="font-medium text-indigo-900">5% Host Fee</p>
                  <p className="text-sm text-indigo-700">
                    Room Link charges a 5% fee on rent payments. You&apos;ll receive 95% of the monthly rent directly to your bank.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-between pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentSection("property")}
              >
                Back to Property
              </Button>
              <SubmitButton className="px-6">
                Continue
              </SubmitButton>
            </div>
          </Card>
        </form>
      )}

      {/* Requirements Note */}
      <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
        <AlertCircle className="h-5 w-5 shrink-0 text-slate-400 mt-0.5" />
        <div>
          <p className="font-medium text-slate-700">Required to publish</p>
          <ul className="mt-1 list-disc list-inside text-slate-500">
            <li>Property name, type, and address</li>
            <li>At least one bed with monthly rent</li>
          </ul>
        </div>
      </div>

      {/* Hint Slot */}
      <StepHintSlot hint={step?.hint || ""} />
    </div>
  );
}
