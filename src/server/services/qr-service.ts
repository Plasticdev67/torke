import QRCode from "qrcode";
import { buildVerificationUrl } from "@/lib/constants";

/**
 * QR code generation for batch verification labels.
 *
 * Error correction level H (highest -- survives 30% damage).
 * Essential for warehouse labels that get dirty, scratched, or wet.
 */

const QR_OPTIONS = {
  errorCorrectionLevel: "H" as const,
  width: 200,
  margin: 1,
  color: {
    dark: "#000000",
    light: "#FFFFFF",
  },
};

/**
 * Generate a QR code as a base64 data URL string.
 * Use for browser display and label embedding.
 */
export async function generateQRDataUrl(token: string): Promise<string> {
  const url = buildVerificationUrl(token);
  return QRCode.toDataURL(url, QR_OPTIONS);
}

/**
 * Generate a QR code as a PNG buffer.
 * Use for server-side image generation.
 */
export async function generateQRBuffer(token: string): Promise<Buffer> {
  const url = buildVerificationUrl(token);
  const buffer = await QRCode.toBuffer(url, {
    errorCorrectionLevel: "H",
    width: 200,
    margin: 1,
  });
  return buffer;
}

/**
 * Generate a QR code as an SVG string.
 * Use for PDF embedding (vector, resolution-independent).
 */
export async function generateQRSvg(token: string): Promise<string> {
  const url = buildVerificationUrl(token);
  return QRCode.toString(url, {
    errorCorrectionLevel: "H",
    type: "svg",
    width: 200,
    margin: 1,
  });
}
