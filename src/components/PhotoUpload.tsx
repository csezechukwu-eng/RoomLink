"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, Trash2, Star, Loader2 } from "lucide-react";
import type { PropertyMedia, MediaType } from "@/lib/types";

interface PhotoUploadProps {
  propertyId: string;
  mediaType: MediaType;
  roomId?: string;
  bedId?: string;
  existingPhotos?: PropertyMedia[];
  onUpload: (formData: FormData) => Promise<{ status: string; message?: string }>;
  onDelete: (formData: FormData) => Promise<{ status: string; message?: string }>;
  onSetCover: (formData: FormData) => Promise<{ status: string; message?: string }>;
  maxPhotos?: number;
}

export function PhotoUpload({
  propertyId,
  mediaType,
  roomId,
  bedId,
  existingPhotos = [],
  onUpload,
  onDelete,
  onSetCover,
  maxPhotos = 10,
}: PhotoUploadProps) {
  const [photos, setPhotos] = React.useState<PropertyMedia[]>(existingPhotos);
  const [uploading, setUploading] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [settingCoverId, setSettingCoverId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync with external photo changes
  React.useEffect(() => {
    setPhotos(existingPhotos);
  }, [existingPhotos]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (photos.length >= maxPhotos) {
      setError(`Maximum ${maxPhotos} photos allowed.`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("property_id", propertyId);
      formData.append("media_type", mediaType);
      if (roomId) formData.append("room_id", roomId);
      if (bedId) formData.append("bed_id", bedId);

      const result = await onUpload(formData);
      if (result.status === "error") {
        setError(result.message || "Upload failed.");
      }
    } catch (err) {
      setError("Upload failed. Please try again.");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (mediaId: string) => {
    setError(null);
    setDeletingId(mediaId);

    try {
      const formData = new FormData();
      formData.append("media_id", mediaId);

      const result = await onDelete(formData);
      if (result.status === "error") {
        setError(result.message || "Delete failed.");
      } else {
        // Remove from local state
        setPhotos((prev) => prev.filter((p) => p.id !== mediaId));
      }
    } catch (err) {
      setError("Delete failed. Please try again.");
      console.error("Delete error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetCover = async (mediaId: string) => {
    setError(null);
    setSettingCoverId(mediaId);

    try {
      const formData = new FormData();
      formData.append("media_id", mediaId);

      const result = await onSetCover(formData);
      if (result.status === "error") {
        setError(result.message || "Failed to set cover.");
      } else {
        // Update local state
        setPhotos((prev) =>
          prev.map((p) => ({
            ...p,
            is_cover: p.id === mediaId,
          }))
        );
      }
    } catch (err) {
      setError("Failed to set cover. Please try again.");
      console.error("Set cover error:", err);
    } finally {
      setSettingCoverId(null);
    }
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="space-y-4">
      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Photo grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
          >
            {photo.public_url ? (
              <Image
                src={photo.public_url}
                alt={photo.alt_text || "Property photo"}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                No preview
              </div>
            )}

            {/* Cover badge */}
            {photo.is_cover && (
              <div className="absolute left-2 top-2 rounded bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
                Cover
              </div>
            )}

            {/* Action buttons overlay */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              {!photo.is_cover && (
                <button
                  type="button"
                  onClick={() => handleSetCover(photo.id)}
                  disabled={settingCoverId === photo.id}
                  className="rounded-full bg-white p-2 text-slate-700 shadow-md hover:bg-slate-100 disabled:opacity-50"
                  title="Set as cover"
                >
                  {settingCoverId === photo.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Star className="h-4 w-4" />
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(photo.id)}
                disabled={deletingId === photo.id}
                className="rounded-full bg-white p-2 text-red-600 shadow-md hover:bg-red-50 disabled:opacity-50"
                title="Delete photo"
              >
                {deletingId === photo.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ))}

        {/* Upload button */}
        {canAddMore && (
          <label
            className={`flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-indigo-400 hover:bg-indigo-50 ${
              uploading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              disabled={uploading}
              className="sr-only"
            />
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            ) : (
              <>
                <ImagePlus className="h-8 w-8 text-slate-400" />
                <span className="mt-2 text-xs text-slate-500">Add photo</span>
              </>
            )}
          </label>
        )}
      </div>

      {/* Photo count */}
      <p className="text-xs text-slate-500">
        {photos.length} of {maxPhotos} photos
      </p>
    </div>
  );
}

/**
 * Compact version for inline use in forms.
 */
export function PhotoUploadCompact({
  propertyId,
  mediaType,
  roomId,
  bedId,
  existingPhotos = [],
  onUpload,
  onDelete,
  onSetCover,
}: PhotoUploadProps) {
  return (
    <PhotoUpload
      propertyId={propertyId}
      mediaType={mediaType}
      roomId={roomId}
      bedId={bedId}
      existingPhotos={existingPhotos}
      onUpload={onUpload}
      onDelete={onDelete}
      onSetCover={onSetCover}
      maxPhotos={5}
    />
  );
}
