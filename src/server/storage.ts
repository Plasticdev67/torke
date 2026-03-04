import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || "",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET = process.env.R2_BUCKET || "torke-assets";

export async function uploadCertPdf(
  file: Buffer,
  supplierBatchId: string,
  filename: string
): Promise<string> {
  const key = `certs/${supplierBatchId}/${filename}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file,
      ContentType: "application/pdf",
    })
  );

  return key;
}

export async function uploadFile(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  );

  return key;
}

export async function getCertUrl(key: string): Promise<string> {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (publicUrl) {
    return `${publicUrl}/${key}`;
  }

  // Fall back to presigned URL
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn: 3600 });
}
