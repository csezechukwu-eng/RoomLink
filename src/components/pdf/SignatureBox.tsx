"use client";

import * as React from "react";
import { GripVertical, X } from "lucide-react";
import type { SignatureFieldType } from "@/lib/types";

export interface SignatureBoxProps {
  type: SignatureFieldType;
  signatureImage?: string | null; // base64 data URL for landlord signature
  x: number; // pixel position
  y: number; // pixel position
  width: number; // pixel width
  height: number; // pixel height
  containerWidth: number;
  containerHeight: number;
  onMove?: (x: number, y: number) => void;
  onRemove?: () => void;
  editable?: boolean;
}

export function SignatureBox({
  type,
  signatureImage,
  x,
  y,
  width,
  height,
  containerWidth,
  containerHeight,
  onMove,
  onRemove,
  editable = true,
}: SignatureBoxProps) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editable) return;
    e.preventDefault();
    setIsDragging(true);
    const rect = boxRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const parent = boxRef.current?.parentElement;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      let newX = e.clientX - parentRect.left - dragOffset.x;
      let newY = e.clientY - parentRect.top - dragOffset.y;

      // Constrain to container
      newX = Math.max(0, Math.min(newX, containerWidth - width));
      newY = Math.max(0, Math.min(newY, containerHeight - height));

      onMove?.(newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, containerWidth, containerHeight, width, height, onMove]);

  const isLandlord = type === "landlord";
  const bgColor = isLandlord ? "bg-indigo-50" : "bg-emerald-50";
  const borderColor = isLandlord ? "border-indigo-300" : "border-emerald-300";
  const textColor = isLandlord ? "text-indigo-700" : "text-emerald-700";

  return (
    <div
      ref={boxRef}
      className={`absolute flex flex-col items-center justify-center rounded border-2 border-dashed ${bgColor} ${borderColor} ${
        editable ? "cursor-move" : ""
      } ${isDragging ? "z-50 opacity-80" : "z-10"}`}
      style={{
        left: x,
        top: y,
        width,
        height,
      }}
      onMouseDown={handleMouseDown}
    >
      {editable && (
        <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1">
          <span
            className={`rounded-full bg-white px-2 py-0.5 text-xs font-medium shadow-sm ${textColor}`}
          >
            {isLandlord ? "Landlord" : "Tenant"}
          </span>
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="rounded-full bg-white p-0.5 text-slate-400 shadow-sm hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {signatureImage ? (
        <img
          src={signatureImage}
          alt={`${type} signature`}
          className="max-h-full max-w-full object-contain p-1"
          draggable={false}
        />
      ) : (
        <div className="flex flex-col items-center gap-1 p-2">
          {editable && <GripVertical className={`h-4 w-4 ${textColor} opacity-50`} />}
          <span className={`text-xs ${textColor}`}>
            {isLandlord ? "Sign here" : "Tenant signs here"}
          </span>
        </div>
      )}
    </div>
  );
}
