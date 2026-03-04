"use server";

import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { completeGoodsIn } from "@/server/services/batch-service";
import { uploadFile } from "@/server/storage";
import { randomUUID } from "crypto";

/**
 * Server Action: Upload a 3.1 certificate PDF to R2.
 * Returns the R2 key on success.
 */
export async function uploadCert(formData: FormData) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file provided");
  if (file.type !== "application/pdf") throw new Error("Only PDF files accepted");
  if (file.size > 20 * 1024 * 1024) throw new Error("File must be under 20MB");

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileId = randomUUID();
  const key = `certs/${fileId}/${file.name}`;

  await uploadFile(buffer, key, "application/pdf");

  return { key };
}

/**
 * Server Action: Submit goods-in data.
 * Creates the full batch chain in a single transaction.
 */
export async function submitGoodsIn(data: {
  productId: string;
  supplierName: string;
  supplierBatchNumber: string;
  quantity: number;
  certKey: string;
  expiryDate?: string | null;
  inspectionNotes?: string | null;
  poReference?: string | null;
  heatNumber?: string | null;
  millName?: string | null;
}) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const result = await completeGoodsIn({
    ...data,
    userId: session.user.id,
  });

  return result;
}
