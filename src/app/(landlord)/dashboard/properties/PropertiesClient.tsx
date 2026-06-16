"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  MoreVertical,
  Building,
  Trash2,
  ImagePlus,
  EyeOff,
  Eye,
  ClipboardList,
  Wrench,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { PhotoUpload } from "@/components/PhotoUpload";
import { PropertyFormModal } from "@/components/forms/PropertyFormModal";
import { deleteProperty, togglePropertyVisibility } from "@/lib/actions/properties";
import { uploadMedia, deleteMedia, setCoverMedia } from "@/lib/actions/media";
import { PROPERTY_TYPES, labelForPropertyType } from "@/lib/constants";
import type { Property, PropertyMedia, PropertyType } from "@/lib/types";

export interface PropertyData {
  id: string;
  name: string;
  address: string;
  image: string | null;
  is_hidden?: boolean;
  property_type: string;
  /** Full editable values used to prefill the inline Edit form. */
  edit: Partial<Property> & { id: string };
  rooms: number;
  beds: number;
  occupied: number;
  reserved: number;
  available: number;
  unavailable: number;
  pendingApplications: number;
  openMaintenance: number;
  needsSetup: boolean;
  photos?: PropertyMedia[];
}

interface PropertiesClientProps {
  properties: PropertyData[];
}

type TypeFilter = "all" | PropertyType;

export function PropertiesClient({ properties }: PropertiesClientProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>("all");
  const [vacantOnly, setVacantOnly] = React.useState(false);
  const [setupOnly, setSetupOnly] = React.useState(false);
  const [hiddenFilter, setHiddenFilter] = React.useState<"all" | "active" | "hidden">(
    "all"
  );

  const q = searchQuery.trim().toLowerCase();
  const filteredProperties = properties.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q) && !p.address.toLowerCase().includes(q))
      return false;
    if (typeFilter !== "all" && p.property_type !== typeFilter) return false;
    if (vacantOnly && p.available <= 0) return false;
    if (setupOnly && !p.needsSetup) return false;
    if (hiddenFilter === "active" && p.is_hidden) return false;
    if (hiddenFilter === "hidden" && !p.is_hidden) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All types</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={hiddenFilter}
            onChange={(e) =>
              setHiddenFilter(e.target.value as "all" | "active" | "hidden")
            }
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            active={vacantOnly}
            onClick={() => setVacantOnly((v) => !v)}
            label="Has vacant beds"
          />
          <FilterChip
            active={setupOnly}
            onClick={() => setSetupOnly((v) => !v)}
            label="Needs setup"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredProperties.length === 0 ? (
        <Card className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <p className="text-slate-500">No properties match your filters.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-indigo-200 bg-indigo-50 text-indigo-700"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function PropertyCard({ property }: { property: PropertyData }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [photoModalOpen, setPhotoModalOpen] = React.useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isToggling, setIsToggling] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedOutsideMenu = menuRef.current && !menuRef.current.contains(target);
      const clickedOutsideDropdown =
        dropdownRef.current && !dropdownRef.current.contains(target);
      if (clickedOutsideMenu && (clickedOutsideDropdown || !dropdownRef.current)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async () => {
    setIsDeleting(true);
    const formData = new FormData();
    formData.append("id", property.id);
    await deleteProperty({ status: "idle" }, formData);
    setIsDeleting(false);
    setDeleteModalOpen(false);
    router.refresh();
  };

  const handleToggleVisibility = async () => {
    setIsToggling(true);
    setMenuOpen(false);
    const formData = new FormData();
    formData.append("id", property.id);
    formData.append("is_hidden", property.is_hidden ? "false" : "true");
    await togglePropertyVisibility({ status: "idle" }, formData);
    setIsToggling(false);
    router.refresh();
  };

  const handleUpload = async (formData: FormData) => {
    const result = await uploadMedia({ status: "idle" }, formData);
    if (result.status === "success") router.refresh();
    return result;
  };

  const handleDeletePhoto = async (formData: FormData) => {
    const result = await deleteMedia({ status: "idle" }, formData);
    if (result.status === "success") router.refresh();
    return result;
  };

  const handleSetCover = async (formData: FormData) => {
    const result = await setCoverMedia({ status: "idle" }, formData);
    if (result.status === "success") router.refresh();
    return result;
  };

  const propertyPhotos = (property.photos ?? []).filter(
    (p) => p.media_type === "property"
  );

  return (
    <div className="relative">
      <Card className="overflow-hidden">
        <div className={property.is_hidden ? "opacity-60" : ""}>
          {/* Image */}
          <div className="relative h-44 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
            {property.image ? (
              <Image
                src={property.image}
                alt={property.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Building className="h-12 w-12 text-slate-400" />
              </div>
            )}
            <button
              onClick={handleToggleVisibility}
              disabled={isToggling}
              className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50 ${
                property.is_hidden
                  ? "bg-slate-500 hover:bg-slate-600"
                  : "bg-emerald-500 hover:bg-emerald-600"
              }`}
              title={property.is_hidden ? "Click to show property" : "Click to hide property"}
            >
              {isToggling ? "..." : property.is_hidden ? "Hidden" : "Active"}
            </button>
            <span className="absolute right-3 top-3 rounded-md bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm">
              {labelForPropertyType(property.property_type as PropertyType)}
            </span>
          </div>

          {/* Content */}
          <div className="px-4 pt-4">
            <h3 className="font-semibold text-slate-900">{property.name}</h3>
            {property.address && (
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{property.address}</span>
              </p>
            )}

            {/* Bed status pills */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              <StatPill label="Rooms" value={property.rooms} tone="slate" />
              <StatPill label="Vacant" value={property.available} tone="emerald" />
              <StatPill label="Reserved" value={property.reserved} tone="blue" />
              <StatPill label="Occupied" value={property.occupied} tone="dark" />
            </div>

            {/* Operational badges */}
            {(property.pendingApplications > 0 ||
              property.openMaintenance > 0 ||
              property.needsSetup) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {property.pendingApplications > 0 && (
                  <Badge tone="amber" icon={<ClipboardList className="h-3 w-3" />}>
                    {property.pendingApplications} pending
                  </Badge>
                )}
                {property.openMaintenance > 0 && (
                  <Badge tone="blue" icon={<Wrench className="h-3 w-3" />}>
                    {property.openMaintenance} maintenance
                  </Badge>
                )}
                {property.needsSetup && <Badge tone="slate">Needs setup</Badge>}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 pt-4">
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/properties/${property.id}`}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
            >
              View Property
            </Link>
            <PropertyFormModal
              mode="edit"
              property={property.edit}
              iconOnly
              triggerLabel="Edit"
              triggerVariant="outline"
            />
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="More actions"
                className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div
          ref={dropdownRef}
          className="absolute bottom-16 right-4 z-50 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          <button
            onClick={() => {
              setMenuOpen(false);
              setPhotoModalOpen(true);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <ImagePlus className="h-4 w-4" />
            {propertyPhotos.length > 0 ? "Change Photos" : "Add Photos"}
          </button>
          <button
            onClick={handleToggleVisibility}
            disabled={isToggling}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {property.is_hidden ? (
              <>
                <Eye className="h-4 w-4" />
                Show Property
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Property
              </>
            )}
          </button>
          <hr className="my-1 border-slate-200" />
          <button
            onClick={() => {
              setMenuOpen(false);
              setDeleteModalOpen(true);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete Property
          </button>
        </div>
      )}

      {/* Photo Upload Modal */}
      <Modal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        title="Property Photos"
      >
        <PhotoUpload
          propertyId={property.id}
          mediaType="property"
          existingPhotos={propertyPhotos}
          onUpload={handleUpload}
          onDelete={handleDeletePhoto}
          onSetCover={handleSetCover}
          maxPhotos={10}
        />
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setPhotoModalOpen(false)}>Done</Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Property"
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete <strong>{property.name}</strong>? This
          action cannot be undone.
        </p>
        {property.beds > 0 && (
          <p className="mt-2 text-sm text-amber-600">
            Warning: This property has {property.beds} beds. You must remove all
            rooms and beds first.
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isDeleting || property.beds > 0}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

const PILL_TONES = {
  slate: "text-slate-900",
  emerald: "text-emerald-600",
  blue: "text-blue-600",
  dark: "text-slate-700",
} as const;

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: keyof typeof PILL_TONES;
}) {
  return (
    <div className="rounded-lg bg-slate-50 py-2 text-center">
      <span className={`text-base font-bold ${PILL_TONES[tone]}`}>{value}</span>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

const BADGE_TONES = {
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700",
  slate: "bg-slate-100 text-slate-600",
} as const;

function Badge({
  tone,
  icon,
  children,
}: {
  tone: keyof typeof BADGE_TONES;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_TONES[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}
