"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  MapPin,
  MoreVertical,
  Building,
  Trash2,
  ImagePlus,
  EyeOff,
  Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { PhotoUpload } from "@/components/PhotoUpload";
import { deleteProperty, togglePropertyVisibility } from "@/lib/actions/properties";
import { uploadMedia, deleteMedia, setCoverMedia } from "@/lib/actions/media";
import type { PropertyMedia } from "@/lib/types";

export interface PropertyData {
  id: string;
  name: string;
  address: string;
  image: string | null;
  status: "active" | "inactive";
  is_hidden?: boolean;
  beds: number;
  occupied: number;
  reserved: number;
  available: number;
  revenue: number;
  property_type: string;
  description: string | null;
  house_rules: string | null;
  photos?: PropertyMedia[];
}

interface PropertiesClientProps {
  properties: PropertyData[];
}

export function PropertiesClient({ properties }: PropertiesClientProps) {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter properties based on search
  const filteredProperties = properties.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Status</span>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
            All
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Sort By</span>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
            Newest
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* View Toggle */}
        <div className="ml-auto flex items-center rounded-lg border border-slate-200 bg-white p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-md p-1.5 ${viewMode === "grid" ? "bg-slate-100 text-slate-900" : "text-slate-400"}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-md p-1.5 ${viewMode === "list" ? "bg-slate-100 text-slate-900" : "text-slate-400"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Property Grid */}
      {filteredProperties.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <p className="text-slate-500">No properties match your search.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </>
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

  // Close menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedOutsideMenu = menuRef.current && !menuRef.current.contains(target);
      const clickedOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);

      // Only close if clicked outside both the menu button AND the dropdown
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
    if (result.status === "success") {
      router.refresh();
    }
    return result;
  };

  const handleDeletePhoto = async (formData: FormData) => {
    const result = await deleteMedia({ status: "idle" }, formData);
    if (result.status === "success") {
      router.refresh();
    }
    return result;
  };

  const handleSetCover = async (formData: FormData) => {
    const result = await setCoverMedia({ status: "idle" }, formData);
    if (result.status === "success") {
      router.refresh();
    }
    return result;
  };

  const propertyPhotos = (property.photos ?? []).filter(
    (p) => p.media_type === "property"
  );

  return (
    <div className="relative">
      <Card>
        {/* Image and Info - with opacity when hidden */}
        <div className={property.is_hidden ? "opacity-60" : ""}>
          {/* Image */}
          <div className="relative h-48 overflow-hidden rounded-t-lg bg-gradient-to-br from-slate-200 to-slate-300">
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
                property.is_hidden ? "bg-slate-500 hover:bg-slate-600" : "bg-emerald-500 hover:bg-emerald-600"
              }`}
              title={property.is_hidden ? "Click to show property" : "Click to hide property"}
            >
              {isToggling ? "..." : property.is_hidden ? "Hidden" : "Active"}
            </button>
          </div>

          {/* Content */}
          <div className="px-4 pt-4">
            <h3 className="font-semibold text-slate-900">{property.name}</h3>
            {property.address && (
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                {property.address}
              </p>
            )}

            {/* Stats */}
            <div className="mt-4 grid grid-cols-4 gap-2 text-sm">
              <div className="text-center">
                <span className="font-bold text-slate-900">{property.beds}</span>
                <p className="text-xs text-slate-500">Beds</p>
              </div>
              <div className="text-center">
                <span className="font-bold text-amber-600">{property.occupied}</span>
                <p className="text-xs text-slate-500">Occupied</p>
              </div>
              <div className="text-center">
                <span className="font-bold text-indigo-600">{property.reserved}</span>
                <p className="text-xs text-slate-500">Reserved</p>
              </div>
              <div className="text-center">
                <span className="font-bold text-emerald-600">{property.available}</span>
                <p className="text-xs text-slate-500">Available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions - always full opacity */}
        <div className="px-4 pb-4 pt-4">
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/properties/${property.id}`}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              View Property
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Dropdown Menu - outside Card to avoid opacity */}
      {menuOpen && (
        <div ref={dropdownRef} className="absolute right-4 bottom-16 z-50 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
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
          Are you sure you want to delete <strong>{property.name}</strong>? This action cannot be undone.
        </p>
        {property.beds > 0 && (
          <p className="mt-2 text-sm text-amber-600">
            Warning: This property has {property.beds} beds. You must remove all rooms and beds first.
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
