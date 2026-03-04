import { db } from "@/server/db";
import { batches } from "@/server/db/schema/batches";
import { verificationTokens } from "@/server/db/schema/verification";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BatchDetail } from "@/components/wms/BatchDetail";
import { BatchLabel } from "@/components/wms/BatchLabel";
import { getCertUrl } from "@/server/storage";
import { buildVerificationUrl } from "@/lib/constants";

interface PageProps {
  params: Promise<{ batchId: string }>;
}

export default async function BatchDetailPage({ params }: PageProps) {
  const { batchId } = await params;

  const batch = await db.query.batches.findFirst({
    where: eq(batches.id, batchId),
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
  });

  if (!batch) {
    notFound();
  }

  // Get verification token
  const token = await db.query.verificationTokens.findFirst({
    where: eq(verificationTokens.batchId, batch.id),
  });

  // Get signed cert URL
  let certUrl: string | null = null;
  if (batch.supplierBatch.manufacturerCertUrl) {
    try {
      certUrl = await getCertUrl(batch.supplierBatch.manufacturerCertUrl);
    } catch {
      // Cert URL generation failed -- non-blocking
    }
  }

  return (
    <div className="space-y-8">
      <BatchDetail
        torkeBatchId={batch.torkeBatchId}
        status={batch.status}
        productName={batch.product.name}
        productSku={batch.product.sku}
        supplierName={batch.supplierBatch.supplier.name}
        supplierBatchNumber={batch.supplierBatch.supplierBatchNumber}
        quantity={batch.quantity}
        quantityAvailable={batch.quantityAvailable}
        quantityReserved={batch.quantityReserved}
        goodsInDate={batch.goodsInDate.toISOString()}
        certUrl={certUrl}
        expiryDate={batch.expiryDate}
        inspectionNotes={batch.inspectionNotes}
        poReference={batch.poReference}
        heatNumber={batch.supplierBatch.millCert?.heatNumber}
        millName={batch.supplierBatch.millCert?.millName}
      />

      {/* QR verification URL */}
      {token && (
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground mb-1">
            Verification URL
          </p>
          <p className="font-mono text-sm text-primary break-all">
            {buildVerificationUrl(token.token)}
          </p>
        </div>
      )}

      {/* Label preview */}
      {token && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Label Preview</h2>
          <BatchLabel
            torkeBatchId={batch.torkeBatchId}
            productSku={batch.product.sku}
            productName={batch.product.name}
            quantity={batch.quantity}
            goodsInDate={batch.goodsInDate.toISOString()}
            verificationToken={token.token}
          />
        </div>
      )}
    </div>
  );
}
