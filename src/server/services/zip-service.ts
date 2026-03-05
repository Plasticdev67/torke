import JSZip from "jszip";
import { downloadFile } from "@/server/storage";

const MAX_ITEMS = 20;

/**
 * Generate a bulk ZIP containing multiple cert PDFs from R2 storage.
 */
export async function generateBulkCertZip(
  certKeys: Array<{ key: string; filename: string }>
): Promise<Buffer> {
  if (certKeys.length === 0) {
    throw new Error("No cert keys provided");
  }

  if (certKeys.length > MAX_ITEMS) {
    throw new Error(`Maximum ${MAX_ITEMS} items allowed per bulk download`);
  }

  const zip = new JSZip();

  // Fetch each PDF from R2 and add to ZIP
  const results = await Promise.allSettled(
    certKeys.map(async ({ key, filename }) => {
      const buffer = await downloadFile(key);
      return { filename, buffer };
    })
  );

  let addedCount = 0;
  for (const result of results) {
    if (result.status === "fulfilled") {
      zip.file(result.value.filename, result.value.buffer);
      addedCount++;
    } else {
      console.warn("[ZipService] Failed to fetch cert:", result.reason);
    }
  }

  if (addedCount === 0) {
    throw new Error("No cert files could be retrieved");
  }

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return zipBuffer;
}
