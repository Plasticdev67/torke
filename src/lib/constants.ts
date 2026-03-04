export const QR_BASE_URL = "https://torke.co.uk/t";
export const TORKE_BATCH_ID_PREFIX = "TRK";

/**
 * Build a public verification URL for a QR code.
 * Uses the opaque UUID token, never the batch ID.
 */
export function buildVerificationUrl(token: string): string {
  return `${QR_BASE_URL}/${token}`;
}

/**
 * Generate a Torke batch ID in the format TRK-YYYYMMDD-NNNN.
 * @param date The goods-in date
 * @param sequenceNumber The sequence number for the day (1-9999)
 */
export function generateTorkeBatchId(
  date: Date,
  sequenceNumber: number
): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const seq = String(sequenceNumber).padStart(4, "0");
  return `${TORKE_BATCH_ID_PREFIX}-${year}${month}${day}-${seq}`;
}
