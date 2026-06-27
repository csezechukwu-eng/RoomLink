"use client";

import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Download,
  EyeOff,
  Share2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface ShareListingPanelProps {
  propertyId: string;
  propertyName: string;
  isPublished: boolean;
}

export function ShareListingPanel({
  propertyId,
  propertyName,
  isPublished,
}: ShareListingPanelProps) {
  const [copied, setCopied] = React.useState(false);
  const [qrModalOpen, setQrModalOpen] = React.useState(false);
  const qrRef = React.useRef<HTMLDivElement>(null);

  // Compute the public listing URL (client-side)
  const [listingUrl, setListingUrl] = React.useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setListingUrl(`${window.location.origin}/availability/${propertyId}`);
    }
  }, [propertyId]);

  const handleCopy = async () => {
    if (!listingUrl) return;
    try {
      await navigator.clipboard.writeText(listingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = listingUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    // Convert SVG to PNG and download
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, 400, 400);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${propertyName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-qr-code.png`;
      link.href = pngUrl;
      link.click();
    };

    img.src = url;
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Share Listing
        </h2>
        {isPublished ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            <Share2 className="h-3 w-3" />
            Ready to Share
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            <EyeOff className="h-3 w-3" />
            Hidden
          </span>
        )}
      </div>

      <Card className="p-5">
        {/* Description text */}
        <p className="text-sm text-slate-600 mb-4">
          Share this public listing with tenants using a direct link or QR code.
        </p>

        {!isPublished && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-800">
              This property is not live yet. Publish the listing before sharing it.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {/* Action buttons - prominent and clear */}
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => window.open(`/availability/${propertyId}`, "_blank")}
              disabled={!isPublished}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View Live Listing
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setQrModalOpen(true)}
              className="flex items-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              Create QR Code
            </Button>
          </div>

          {/* Listing URL preview */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500 mb-1">Public listing URL</p>
            <p className="text-sm font-mono text-slate-700 break-all">
              {listingUrl || "Loading..."}
            </p>
          </div>

          {!isPublished && (
            <p className="text-xs text-slate-500">
              You can still copy the link and generate a QR code, but the listing won&apos;t be visible until published.
            </p>
          )}
        </div>
      </Card>

      {/* QR Code Modal */}
      <Modal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Listing QR Code"
        description={propertyName}
      >
        <div className="flex flex-col items-center space-y-4">
          <div
            ref={qrRef}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            {listingUrl && (
              <QRCodeSVG
                value={listingUrl}
                size={256}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#1e293b"
              />
            )}
          </div>

          <p className="text-sm text-slate-600 text-center">
            Tenants can scan this code to view and request this monthly stay.
          </p>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadQR}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download PNG
            </Button>

            <Button
              type="button"
              onClick={() => setQrModalOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
