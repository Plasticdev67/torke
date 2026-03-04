import { db } from "@/server/db";
import {
  suppliers,
  supplierBatches,
  batches,
  millCerts,
} from "@/server/db/schema/batches";
import { stockItems } from "@/server/db/schema/stock";
import { verificationTokens } from "@/server/db/schema/verification";
import { orderLineAllocations } from "@/server/db/schema/allocations";
import { TORKE_BATCH_ID_PREFIX } from "@/lib/constants";
import { eq, and, sql, asc, gt } from "drizzle-orm";
import type { Database } from "@/server/db";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface GoodsInData {
  supplierName: string;
  supplierBatchNumber: string;
  productId: string;
  quantity: number;
  certKey: string; // R2 key for uploaded cert PDF
  userId: string;
  expiryDate?: string | null; // ISO date for chemical products (WMS-05)
  inspectionNotes?: string | null;
  poReference?: string | null;
  heatNumber?: string | null;
  millName?: string | null;
}

export interface GoodsInResult {
  batch: typeof batches.$inferSelect;
  verificationToken: string; // UUID token for QR code
  torkeBatchId: string;
}

export interface FIFOAllocation {
  batchId: string;
  torkeBatchId: string;
  quantityAllocated: number;
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/**
 * Find an existing supplier by name, or create a new one within the
 * provided transaction.
 */
async function findOrCreateSupplier(
  tx: Parameters<Parameters<Database["transaction"]>[0]>[0],
  supplierName: string
) {
  const existing = await tx.query.suppliers.findFirst({
    where: eq(suppliers.name, supplierName),
  });

  if (existing) return existing;

  const [created] = await tx
    .insert(suppliers)
    .values({ name: supplierName })
    .returning();

  return created!;
}

/**
 * Generate a Torke batch ID (TRK-YYYYMMDD-NNNN) by querying the highest
 * sequence number for today within the transaction to prevent race conditions.
 */
async function generateTorkeBatchId(
  tx: Parameters<Parameters<Database["transaction"]>[0]>[0]
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;
  const prefix = `${TORKE_BATCH_ID_PREFIX}-${dateStr}-`;

  // Find max sequence for today
  const result = await tx
    .select({ maxId: sql<string>`MAX(${batches.torkeBatchId})` })
    .from(batches)
    .where(sql`${batches.torkeBatchId} LIKE ${prefix + "%"}`);

  let seq = 1;
  const maxId = result[0]?.maxId;
  if (maxId) {
    const parts = maxId.split("-");
    const lastSeq = parseInt(parts[parts.length - 1]!, 10);
    if (!isNaN(lastSeq)) {
      seq = lastSeq + 1;
    }
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

// --------------------------------------------------------------------------
// Core: completeGoodsIn
// --------------------------------------------------------------------------

/**
 * Complete a goods-in workflow in a single database transaction.
 *
 * Creates: supplier (if new), optional mill cert, supplier batch, Torke batch,
 * stock item, and verification token -- all atomically.
 *
 * The batch is created with status='available' because goods-in completion
 * equals availability (TRACE-05).
 */
export async function completeGoodsIn(
  data: GoodsInData
): Promise<GoodsInResult> {
  return db.transaction(async (tx) => {
    // 1. Find or create supplier
    const supplier = await findOrCreateSupplier(tx, data.supplierName);

    // 2. Optionally create mill cert record
    let millCertId: string | null = null;
    if (data.heatNumber || data.millName) {
      const [millCert] = await tx
        .insert(millCerts)
        .values({
          heatNumber: data.heatNumber ?? null,
          millName: data.millName ?? null,
          documentUrl: data.certKey, // same R2 key as the cert PDF
        })
        .returning();
      millCertId = millCert!.id;
    }

    // 3. Create supplier batch record
    const [supplierBatch] = await tx
      .insert(supplierBatches)
      .values({
        supplierId: supplier.id,
        supplierBatchNumber: data.supplierBatchNumber,
        productId: data.productId,
        quantityReceived: data.quantity,
        manufacturerCertUrl: data.certKey,
        millCertId,
      })
      .returning();

    // 4. Generate Torke batch ID
    const torkeBatchId = await generateTorkeBatchId(tx);

    // 5. Create batch record -- status='available' (TRACE-05)
    const [batch] = await tx
      .insert(batches)
      .values({
        torkeBatchId,
        supplierBatchId: supplierBatch!.id,
        productId: data.productId,
        receivedBy: data.userId,
        quantity: data.quantity,
        quantityAvailable: data.quantity,
        quantityReserved: 0,
        status: "available",
        expiryDate: data.expiryDate ?? null,
        inspectionNotes: data.inspectionNotes ?? null,
        poReference: data.poReference ?? null,
      })
      .returning();

    // 6. Create stock item
    await tx.insert(stockItems).values({
      batchId: batch!.id,
      productId: data.productId,
      quantity: data.quantity,
    });

    // 7. Create verification token (TRACE-18, TRACE-19)
    const [token] = await tx
      .insert(verificationTokens)
      .values({
        batchId: batch!.id,
      })
      .returning();

    return {
      batch: batch!,
      verificationToken: token!.token,
      torkeBatchId,
    };
  });
}

// --------------------------------------------------------------------------
// FIFO Allocation (TRACE-06)
// --------------------------------------------------------------------------

/**
 * Allocate stock for a product using FIFO (oldest batch first).
 *
 * Queries available batches ordered by goodsInDate ASC. If the oldest batch
 * has insufficient quantity, splits across batches. Throws if insufficient
 * total stock.
 *
 * Used in Phase 2 for order fulfilment, but logic is defined now.
 */
export async function allocateFIFO(
  tx: Parameters<Parameters<Database["transaction"]>[0]>[0],
  productId: string,
  quantityNeeded: number,
  orderLineId: string
): Promise<FIFOAllocation[]> {
  // Get available batches ordered by goods-in date (oldest first = FIFO)
  const availableBatches = await tx
    .select()
    .from(batches)
    .where(
      and(
        eq(batches.productId, productId),
        eq(batches.status, "available"),
        gt(batches.quantityAvailable, 0)
      )
    )
    .orderBy(asc(batches.goodsInDate));

  let remaining = quantityNeeded;
  const allocations: FIFOAllocation[] = [];

  for (const batch of availableBatches) {
    if (remaining <= 0) break;

    const toAllocate = Math.min(remaining, batch.quantityAvailable);

    // Update batch quantities
    await tx
      .update(batches)
      .set({
        quantityAvailable: batch.quantityAvailable - toAllocate,
        quantityReserved: batch.quantityReserved + toAllocate,
        status:
          batch.quantityAvailable - toAllocate === 0
            ? "depleted"
            : "available",
        updatedAt: new Date(),
      })
      .where(eq(batches.id, batch.id));

    // Create allocation record
    await tx.insert(orderLineAllocations).values({
      orderLineId,
      batchId: batch.id,
      quantity: toAllocate,
    });

    allocations.push({
      batchId: batch.id,
      torkeBatchId: batch.torkeBatchId,
      quantityAllocated: toAllocate,
    });

    remaining -= toAllocate;
  }

  if (remaining > 0) {
    throw new Error(
      `Insufficient stock for product ${productId}. ` +
        `Needed ${quantityNeeded}, only ${quantityNeeded - remaining} available.`
    );
  }

  return allocations;
}

// --------------------------------------------------------------------------
// Recall Query (TRACE-08)
// --------------------------------------------------------------------------

/**
 * Trace the chain from a supplier batch number to all affected orders.
 *
 * supplierBatch -> batch(es) -> allocation(s) -> orderLine(s)
 *
 * Returns all affected order line IDs for a given supplier batch number.
 * This proves the data model supports recall queries.
 */
export async function recallQuery(supplierBatchNumber: string) {
  const results = await db
    .select({
      supplierBatchId: supplierBatches.id,
      supplierBatchNumber: supplierBatches.supplierBatchNumber,
      supplierId: supplierBatches.supplierId,
      batchId: batches.id,
      torkeBatchId: batches.torkeBatchId,
      allocationId: orderLineAllocations.id,
      orderLineId: orderLineAllocations.orderLineId,
      quantityAllocated: orderLineAllocations.quantity,
    })
    .from(supplierBatches)
    .innerJoin(batches, eq(batches.supplierBatchId, supplierBatches.id))
    .leftJoin(
      orderLineAllocations,
      eq(orderLineAllocations.batchId, batches.id)
    )
    .where(eq(supplierBatches.supplierBatchNumber, supplierBatchNumber));

  return results;
}
