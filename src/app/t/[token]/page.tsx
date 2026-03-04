import { db } from "@/server/db";
import { verificationTokens } from "@/server/db/schema/verification";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getCertUrl } from "@/server/storage";
import type { Metadata } from "next";
import {
  CheckCircle,
  Package,
  Truck,
  FileText,
  Calendar,
  Shield,
  ExternalLink,
} from "lucide-react";

// noindex, nofollow -- private verification pages (TRACE-18)
export const metadata: Metadata = {
  robots: "noindex, nofollow",
  title: "Product Verification | Torke",
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function VerificationPage({ params }: PageProps) {
  const { token } = await params;

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    return <VerificationNotFound />;
  }

  // Look up token with full batch chain
  const tokenRecord = await db.query.verificationTokens.findFirst({
    where: eq(verificationTokens.token, token),
    with: {
      batch: {
        with: {
          supplierBatch: {
            with: {
              supplier: true,
              millCert: true,
              product: true,
            },
          },
          product: true,
        },
      },
    },
  });

  if (!tokenRecord) {
    return <VerificationNotFound />;
  }

  // Update last accessed timestamp
  await db
    .update(verificationTokens)
    .set({ lastAccessedAt: new Date() })
    .where(eq(verificationTokens.id, tokenRecord.id));

  const batch = tokenRecord.batch;
  const supplierBatch = batch.supplierBatch;
  const product = batch.product;
  const supplier = supplierBatch.supplier;
  const millCert = supplierBatch.millCert;

  // Get signed cert URL if available
  let certDownloadUrl: string | null = null;
  if (supplierBatch.manufacturerCertUrl) {
    try {
      certDownloadUrl = await getCertUrl(supplierBatch.manufacturerCertUrl);
    } catch {
      // Non-blocking
    }
  }

  const goodsInDate = new Date(batch.goodsInDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-[#C41E3A]" />
              <span className="text-xl font-bold tracking-wider text-gray-900">
                TORKE
              </span>
            </div>
            <span className="text-sm text-gray-500">Product Verification</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        {/* Verification status */}
        <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
          <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Verified Product</p>
            <p className="text-sm text-green-700">
              This product has been verified through Torke's traceability system.
            </p>
          </div>
        </div>

        {/* Product information */}
        <section className="rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Product Information</h2>
          </div>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Product</dt>
              <dd className="text-sm font-medium text-gray-900">{product.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">SKU</dt>
              <dd className="text-sm font-mono text-gray-900">{product.sku}</dd>
            </div>
            {product.etaReference && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">ETA Reference</dt>
                <dd className="text-sm text-gray-900">{product.etaReference}</dd>
              </div>
            )}
          </dl>
        </section>

        {/* Batch information */}
        <section className="rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Batch Information</h2>
          </div>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Torke Batch ID</dt>
              <dd className="text-sm font-mono font-bold text-gray-900">
                {batch.torkeBatchId}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Goods-In Date</dt>
              <dd className="text-sm text-gray-900">{goodsInDate}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Quantity in Batch</dt>
              <dd className="text-sm text-gray-900">{batch.quantity}</dd>
            </div>
          </dl>
        </section>

        {/* Supplier information */}
        <section className="rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">
              Supplier Information
            </h2>
          </div>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Supplier</dt>
              <dd className="text-sm text-gray-900">{supplier.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Supplier Batch</dt>
              <dd className="text-sm font-mono text-gray-900">
                {supplierBatch.supplierBatchNumber}
              </dd>
            </div>
            {supplierBatch.productionDate && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Production Date</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(supplierBatch.productionDate).toLocaleDateString(
                    "en-GB"
                  )}
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* Certification */}
        <section className="rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Certification</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  EN 10204 3.1 Certificate
                </p>
                <p className="text-xs text-gray-500">
                  Manufacturer inspection certificate
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                <CheckCircle className="h-3 w-3" />
                Uploaded
              </span>
            </div>

            {certDownloadUrl && (
              <a
                href={certDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-[#C41E3A] px-4 py-2 text-sm font-medium text-white hover:bg-[#a51830] transition-colors"
              >
                <FileText className="h-4 w-4" />
                Download Certificate
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {millCert && (
              <div className="border-t border-gray-100 pt-3 mt-3">
                <p className="text-sm font-medium text-gray-900">
                  Mill Certificate
                </p>
                {millCert.heatNumber && (
                  <p className="text-xs text-gray-500">
                    Heat: <span className="font-mono">{millCert.heatNumber}</span>
                    {millCert.millName && ` (${millCert.millName})`}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Chain summary */}
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-5">
          <p className="text-sm text-gray-700 leading-relaxed">
            This product was received by Torke on {goodsInDate}, inspected,
            and assigned batch{" "}
            <span className="font-mono font-bold">{batch.torkeBatchId}</span>.
            Full EN 10204 3.1 certification is available for this batch.
          </p>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-6 text-center">
          <p className="text-xs text-gray-400">
            Verified by Torke | torke.co.uk
          </p>
        </footer>
      </main>
    </div>
  );
}

function VerificationNotFound() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#C41E3A]" />
            <span className="text-xl font-bold tracking-wider text-gray-900">
              TORKE
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8">
          <Shield className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Verification Not Found
          </h1>
          <p className="text-sm text-gray-600">
            This QR code does not match any Torke product batch. If you believe
            this is an error, please contact us at{" "}
            <a
              href="mailto:info@torke.co.uk"
              className="text-[#C41E3A] hover:underline"
            >
              info@torke.co.uk
            </a>
          </p>
        </div>

        <footer className="mt-8">
          <p className="text-xs text-gray-400">
            Verified by Torke | torke.co.uk
          </p>
        </footer>
      </main>
    </div>
  );
}
