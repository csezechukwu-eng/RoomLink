"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { PhotoUpload } from "@/components/PhotoUpload";
import { Card } from "@/components/ui/card";
import type { PropertyMedia } from "@/lib/types";
import { uploadMedia, deleteMedia, setCoverMedia } from "@/lib/actions/media";

interface PropertyPhotosSectionProps {
  propertyId: string;
  photos: PropertyMedia[];
}

export function PropertyPhotosSection({
  propertyId,
  photos,
}: PropertyPhotosSectionProps) {
  const router = useRouter();

  const handleUpload = async (formData: FormData) => {
    const result = await uploadMedia({ status: "idle" }, formData);
    if (result.status === "success") {
      router.refresh();
    }
    return result;
  };

  const handleDelete = async (formData: FormData) => {
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

  // Filter to only property-level photos (not room or bed)
  const propertyPhotos = photos.filter((p) => p.media_type === "property");

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <Camera className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900">Property Photos</h3>
      </div>
      <PhotoUpload
        propertyId={propertyId}
        mediaType="property"
        existingPhotos={propertyPhotos}
        onUpload={handleUpload}
        onDelete={handleDelete}
        onSetCover={handleSetCover}
        maxPhotos={30}
      />
    </Card>
  );
}

interface RoomPhotosSectionProps {
  propertyId: string;
  roomId: string;
  roomName: string;
  photos: PropertyMedia[];
}

export function RoomPhotosSection({
  propertyId,
  roomId,
  roomName,
  photos,
}: RoomPhotosSectionProps) {
  const router = useRouter();

  const handleUpload = async (formData: FormData) => {
    const result = await uploadMedia({ status: "idle" }, formData);
    if (result.status === "success") {
      router.refresh();
    }
    return result;
  };

  const handleDelete = async (formData: FormData) => {
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

  // Filter to only this room's photos
  const roomPhotos = photos.filter(
    (p) => p.media_type === "room" && p.room_id === roomId
  );

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <div className="mb-3 flex items-center gap-2">
        <Camera className="h-3.5 w-3.5 text-slate-400" />
        <h4 className="text-xs font-medium text-slate-600">
          {roomName} Photos
        </h4>
      </div>
      <PhotoUpload
        propertyId={propertyId}
        mediaType="room"
        roomId={roomId}
        existingPhotos={roomPhotos}
        onUpload={handleUpload}
        onDelete={handleDelete}
        onSetCover={handleSetCover}
        maxPhotos={5}
      />
    </div>
  );
}

interface BedPhotosSectionProps {
  propertyId: string;
  roomId: string;
  bedId: string;
  bedLabel: string;
  photos: PropertyMedia[];
}

export function BedPhotosSection({
  propertyId,
  roomId,
  bedId,
  bedLabel,
  photos,
}: BedPhotosSectionProps) {
  const router = useRouter();

  const handleUpload = async (formData: FormData) => {
    const result = await uploadMedia({ status: "idle" }, formData);
    if (result.status === "success") {
      router.refresh();
    }
    return result;
  };

  const handleDelete = async (formData: FormData) => {
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

  // Filter to only this bed's photos
  const bedPhotos = photos.filter(
    (p) => p.media_type === "bed" && p.bed_id === bedId
  );

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="mb-2 flex items-center gap-2">
        <Camera className="h-3 w-3 text-slate-400" />
        <h5 className="text-xs font-medium text-slate-500">
          {bedLabel} Photos
        </h5>
      </div>
      <PhotoUpload
        propertyId={propertyId}
        mediaType="bed"
        roomId={roomId}
        bedId={bedId}
        existingPhotos={bedPhotos}
        onUpload={handleUpload}
        onDelete={handleDelete}
        onSetCover={handleSetCover}
        maxPhotos={3}
      />
    </div>
  );
}
