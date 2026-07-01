"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, Trash2, Star, Loader2 } from "lucide-react";
import type { PropertyMedia, MediaType } from "@/lib/types";

interface UploadProgress {
  filename: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/** Convert technical errors to user-friendly messages */
function getUserFriendlyError(error: unknown, filename: string): string {
  const msg = error instanceof Error ? error.message : String(error);

  // Body size limit exceeded (Next.js Server Action limit)
  if (msg.includes("Body exceeded") || msg.includes("1 MB limit") || msg.includes("413")) {
    return `${filename}: File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`;
  }

  // Server Components render error (generic production error)
  if (msg.includes("Server Components render") || msg.includes("digest")) {
    return `${filename}: Upload failed. Please try again or use a smaller file.`;
  }

  // Network errors
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed to fetch")) {
    return `${filename}: Network error. Check your connection and try again.`;
  }

  // Storage errors
  if (msg.includes("storage") || msg.includes("bucket")) {
    return `${filename}: Storage error. Please try again later.`;
  }

  // Auth errors
  if (msg.includes("session") || msg.includes("auth") || msg.includes("sign in")) {
    return `${filename}: Session expired. Please refresh and sign in again.`;
  }

  return `${filename}: ${msg || "Upload failed"}`;
}

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
  maxPhotos = 30,
}: PhotoUploadProps) {
  const [photos, setPhotos] = React.useState<PropertyMedia[]>(existingPhotos);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<UploadProgress[]>([]);
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

    // Check how many we can upload
    const availableSlots = maxPhotos - photos.length;
    if (availableSlots <= 0) {
      setError(`Maximum ${maxPhotos} photos allowed.`);
      return;
    }

    // Limit files to available slots
    let filesToUpload = Array.from(files).slice(0, availableSlots);
    const warnings: string[] = [];

    if (files.length > availableSlots) {
      warnings.push(`Only uploading ${availableSlots} of ${files.length} photos (max ${maxPhotos}).`);
    }

    // Client-side file size validation
    const oversizedFiles = filesToUpload.filter((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversizedFiles.length > 0) {
      for (const f of oversizedFiles) {
        const sizeMB = (f.size / 1024 / 1024).toFixed(1);
        warnings.push(`${f.name} (${sizeMB}MB) exceeds ${MAX_FILE_SIZE_MB}MB limit and will be skipped.`);
      }
      filesToUpload = filesToUpload.filter((f) => f.size <= MAX_FILE_SIZE_BYTES);
    }

    if (filesToUpload.length === 0) {
      setError(warnings.length > 0 ? warnings.join("\n") : "No valid files to upload.");
      return;
    }

    if (warnings.length > 0) {
      setError(warnings.join("\n"));
    } else {
      setError(null);
    }

    // Initialize progress tracking
    const initialProgress: UploadProgress[] = filesToUpload.map((file) => ({
      filename: file.name,
      status: "pending",
    }));
    setUploadProgress(initialProgress);
    setUploading(true);

    const errors: string[] = [];

    // Upload files sequentially to handle cover photo logic correctly
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];

      // Update progress to uploading
      setUploadProgress((prev) =>
        prev.map((p, idx) => (idx === i ? { ...p, status: "uploading" } : p))
      );

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("property_id", propertyId);
        formData.append("media_type", mediaType);
        if (roomId) formData.append("room_id", roomId);
        if (bedId) formData.append("bed_id", bedId);

        const result = await onUpload(formData);
        if (result.status === "error") {
          const errorMsg = getUserFriendlyError(result.message || "Upload failed", file.name);
          errors.push(errorMsg);
          setUploadProgress((prev) =>
            prev.map((p, idx) =>
              idx === i ? { ...p, status: "error", error: result.message } : p
            )
          );
        } else {
          setUploadProgress((prev) =>
            prev.map((p, idx) => (idx === i ? { ...p, status: "success" } : p))
          );
        }
      } catch (err) {
        const errorMsg = getUserFriendlyError(err, file.name);
        errors.push(errorMsg);
        setUploadProgress((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, status: "error", error: errorMsg } : p
          )
        );
      }
    }

    // Show combined errors
    if (errors.length > 0) {
      setError((prev) => {
        const existing = prev ? prev + "\n" : "";
        return existing + errors.join("\n");
      });
    }

    setUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Clear progress after a delay
    setTimeout(() => setUploadProgress([]), 2000);
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
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 whitespace-pre-line">
          {error}
        </div>
      )}

      {/* Upload progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-1">
          {uploadProgress.map((progress, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 rounded px-2 py-1 text-xs ${
                progress.status === "success"
                  ? "bg-green-50 text-green-700"
                  : progress.status === "error"
                  ? "bg-red-50 text-red-700"
                  : progress.status === "uploading"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-slate-50 text-slate-600"
              }`}
            >
              {progress.status === "uploading" && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              <span className="truncate flex-1">{progress.filename}</span>
              <span className="capitalize">{progress.status}</span>
            </div>
          ))}
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
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              className="sr-only"
            />
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            ) : (
              <>
                <ImagePlus className="h-8 w-8 text-slate-400" />
                <span className="mt-2 text-xs text-slate-500">Add photos</span>
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
