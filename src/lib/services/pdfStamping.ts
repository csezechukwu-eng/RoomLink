import "server-only";
import { PDFDocument } from "pdf-lib";
import type { SignatureField } from "@/lib/types";

/**
 * Extract the raw PNG bytes from a base64 data URL.
 * Expects format: "data:image/png;base64,<base64data>"
 */
function base64ToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

interface StampSignatureOptions {
  pdfBytes: ArrayBuffer;
  signatureFields: SignatureField[];
  landlordSignature?: string | null; // base64 PNG data URL
  tenantSignature?: string | null; // base64 PNG data URL
}

/**
 * Stamp signature images onto a PDF at the specified field positions.
 * Returns the modified PDF as a Uint8Array.
 */
export async function stampSignaturesOntoPdf({
  pdfBytes,
  signatureFields,
  landlordSignature,
  tenantSignature,
}: StampSignatureOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  for (const field of signatureFields) {
    const signatureData =
      field.type === "landlord" ? landlordSignature : tenantSignature;
    if (!signatureData) continue;

    const page = pages[field.page];
    if (!page) continue;

    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Convert fractional coordinates to absolute positions
    // Note: PDF coordinates have origin at bottom-left, so we flip Y
    const x = field.x * pageWidth;
    const y = pageHeight - (field.y + field.height) * pageHeight; // Flip Y
    const width = field.width * pageWidth;
    const height = field.height * pageHeight;

    try {
      const pngBytes = base64ToBytes(signatureData);
      const pngImage = await pdfDoc.embedPng(pngBytes);

      // Calculate aspect ratio to fit signature within bounds
      const imgAspect = pngImage.width / pngImage.height;
      const boxAspect = width / height;

      let drawWidth = width;
      let drawHeight = height;
      let drawX = x;
      let drawY = y;

      if (imgAspect > boxAspect) {
        // Image is wider than box, fit to width
        drawHeight = width / imgAspect;
        drawY = y + (height - drawHeight) / 2;
      } else {
        // Image is taller than box, fit to height
        drawWidth = height * imgAspect;
        drawX = x + (width - drawWidth) / 2;
      }

      page.drawImage(pngImage, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
      });
    } catch (error) {
      console.error(`Failed to stamp ${field.type} signature:`, error);
      // Continue with other signatures
    }
  }

  return await pdfDoc.save();
}

/**
 * Get the number of pages in a PDF.
 */
export async function getPdfPageCount(pdfBytes: ArrayBuffer): Promise<number> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  return pdfDoc.getPageCount();
}
