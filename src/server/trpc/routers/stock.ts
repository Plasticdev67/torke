import { z } from "zod";
import { router, warehouseProcedure } from "../trpc";
import { batches } from "@/server/db/schema/batches";
import { stockItems } from "@/server/db/schema/stock";
import { products } from "@/server/db/schema/products";
import { stockAdjustments, adjustmentReasonEnum } from "@/server/db/schema/stock-adjustments";
import { eq, and, sql, lte, gt, isNotNull, desc, asc } from "drizzle-orm";

export const stockRouter = router({
  /**
   * Stock overview: batch-tracked inventory grouped by product.
   * Shows quantity per batch per product.
   */
  overview: warehouseProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(200).default(100),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get all stock items with batch and product details
      const items = await ctx.db
        .select({
          stockItemId: stockItems.id,
          batchId: batches.id,
          torkeBatchId: batches.torkeBatchId,
          batchStatus: batches.status,
          quantityAvailable: batches.quantityAvailable,
          quantityReserved: batches.quantityReserved,
          quantityTotal: batches.quantity,
          goodsInDate: batches.goodsInDate,
          expiryDate: batches.expiryDate,
          productId: products.id,
          productName: products.name,
          productSku: products.sku,
        })
        .from(stockItems)
        .innerJoin(batches, eq(stockItems.batchId, batches.id))
        .innerJoin(products, eq(stockItems.productId, products.id))
        .limit(input.limit)
        .offset(input.offset);

      // Summary statistics
      const summary = await ctx.db
        .select({
          totalProducts: sql<number>`COUNT(DISTINCT ${stockItems.productId})`,
          totalBatches: sql<number>`COUNT(DISTINCT ${stockItems.batchId})`,
          totalUnitsAvailable: sql<number>`COALESCE(SUM(${batches.quantityAvailable}), 0)`,
        })
        .from(stockItems)
        .innerJoin(batches, eq(stockItems.batchId, batches.id));

      // Count expiring soon (within 30 days)
      const now = new Date();
      const thirtyDaysFromNow = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );
      const expiringCount = await ctx.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(batches)
        .where(
          and(
            isNotNull(batches.expiryDate),
            lte(batches.expiryDate, thirtyDaysFromNow.toISOString().split("T")[0]!),
            gt(batches.quantityAvailable, 0)
          )
        );

      return {
        items,
        summary: {
          totalProducts: Number(summary[0]?.totalProducts ?? 0),
          totalBatches: Number(summary[0]?.totalBatches ?? 0),
          totalUnitsAvailable: Number(summary[0]?.totalUnitsAvailable ?? 0),
          expiringSoon: Number(expiringCount[0]?.count ?? 0),
        },
      };
    }),

  /**
   * Product-level stock dashboard with aggregated summaries.
   * Groups by product, returning totals and batch counts.
   */
  dashboard: warehouseProcedure
    .query(async ({ ctx }) => {
      const now = new Date();
      const thirtyDaysFromNow = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );

      // Product-level aggregation
      const productSummaries = await ctx.db
        .select({
          productId: products.id,
          productName: products.name,
          sku: products.sku,
          totalQuantity: sql<number>`COALESCE(SUM(${batches.quantity}), 0)`,
          totalAvailable: sql<number>`COALESCE(SUM(${batches.quantityAvailable}), 0)`,
          totalReserved: sql<number>`COALESCE(SUM(${batches.quantityReserved}), 0)`,
          batchCount: sql<number>`COUNT(DISTINCT ${batches.id})`,
          oldestBatchDate: sql<string>`MIN(${batches.goodsInDate})`,
          nearestExpiry: sql<string | null>`MIN(${batches.expiryDate})`,
        })
        .from(stockItems)
        .innerJoin(batches, eq(stockItems.batchId, batches.id))
        .innerJoin(products, eq(stockItems.productId, products.id))
        .groupBy(products.id, products.name, products.sku);

      // Top-level summary cards
      const totals = await ctx.db
        .select({
          totalProducts: sql<number>`COUNT(DISTINCT ${stockItems.productId})`,
          totalUnitsAvailable: sql<number>`COALESCE(SUM(${batches.quantityAvailable}), 0)`,
        })
        .from(stockItems)
        .innerJoin(batches, eq(stockItems.batchId, batches.id));

      // Low stock (< 10 units available per product)
      const lowStockProducts = await ctx.db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(
          ctx.db
            .select({
              productId: stockItems.productId,
              totalAvailable: sql<number>`SUM(${batches.quantityAvailable})`.as("total_available"),
            })
            .from(stockItems)
            .innerJoin(batches, eq(stockItems.batchId, batches.id))
            .groupBy(stockItems.productId)
            .as("product_totals")
        )
        .where(sql`"total_available" < 10`);

      // Expiring soon count (within 30 days)
      const expiringCount = await ctx.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(batches)
        .where(
          and(
            isNotNull(batches.expiryDate),
            lte(batches.expiryDate, thirtyDaysFromNow.toISOString().split("T")[0]!),
            gt(batches.quantityAvailable, 0)
          )
        );

      return {
        products: productSummaries.map((p) => ({
          ...p,
          totalQuantity: Number(p.totalQuantity),
          totalAvailable: Number(p.totalAvailable),
          totalReserved: Number(p.totalReserved),
          batchCount: Number(p.batchCount),
        })),
        summary: {
          totalProducts: Number(totals[0]?.totalProducts ?? 0),
          totalUnitsAvailable: Number(totals[0]?.totalUnitsAvailable ?? 0),
          lowStockCount: Number(lowStockProducts[0]?.count ?? 0),
          expiringSoon: Number(expiringCount[0]?.count ?? 0),
        },
      };
    }),

  /**
   * Batches for a specific product with drill-down details.
   */
  productBatches: warehouseProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const batchList = await ctx.db
        .select({
          batchId: batches.id,
          torkeBatchId: batches.torkeBatchId,
          quantityAvailable: batches.quantityAvailable,
          quantityReserved: batches.quantityReserved,
          goodsInDate: batches.goodsInDate,
          expiryDate: batches.expiryDate,
          status: batches.status,
        })
        .from(stockItems)
        .innerJoin(batches, eq(stockItems.batchId, batches.id))
        .where(eq(stockItems.productId, input.productId))
        .orderBy(asc(batches.goodsInDate));

      return batchList;
    }),

  /**
   * Batches expiring within N days (default 30).
   * For WMS-05 expiry alerts.
   */
  expiringBatches: warehouseProcedure
    .input(
      z.object({
        days: z.number().int().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const cutoffDate = new Date(
        now.getTime() + input.days * 24 * 60 * 60 * 1000
      );

      const expiring = await ctx.db
        .select({
          batchId: batches.id,
          torkeBatchId: batches.torkeBatchId,
          expiryDate: batches.expiryDate,
          quantityAvailable: batches.quantityAvailable,
          productId: products.id,
          productName: products.name,
          productSku: products.sku,
        })
        .from(batches)
        .innerJoin(products, eq(batches.productId, products.id))
        .where(
          and(
            isNotNull(batches.expiryDate),
            lte(batches.expiryDate, cutoffDate.toISOString().split("T")[0]!),
            gt(batches.quantityAvailable, 0)
          )
        );

      // Add days remaining calculation
      return expiring.map((item) => {
        const expiryMs = new Date(item.expiryDate!).getTime();
        const daysRemaining = Math.ceil(
          (expiryMs - now.getTime()) / (24 * 60 * 60 * 1000)
        );
        return {
          ...item,
          daysRemaining,
          severity: daysRemaining < 7 ? ("critical" as const) : ("warning" as const),
        };
      });
    }),

  /**
   * Stock adjustment mutation - adjusts batch quantity with reason code.
   * Validates non-negative resulting quantity, logs for audit.
   */
  adjust: warehouseProcedure
    .input(
      z.object({
        batchId: z.string().uuid(),
        productId: z.string().uuid(),
        quantityChange: z.number().int().refine((v) => v !== 0, {
          message: "Quantity change must be non-zero",
        }),
        reason: z.enum(["damage", "returns", "cycle_count_variance", "other"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        // 1. Get current batch
        const [batch] = await tx
          .select({
            id: batches.id,
            quantityAvailable: batches.quantityAvailable,
            quantity: batches.quantity,
          })
          .from(batches)
          .where(eq(batches.id, input.batchId));

        if (!batch) {
          throw new Error("Batch not found");
        }

        const newAvailable = batch.quantityAvailable + input.quantityChange;
        if (newAvailable < 0) {
          throw new Error(
            `Cannot reduce below zero. Current available: ${batch.quantityAvailable}, requested change: ${input.quantityChange}`
          );
        }

        // 2. Insert adjustment record
        await tx.insert(stockAdjustments).values({
          batchId: input.batchId,
          productId: input.productId,
          quantityChange: input.quantityChange,
          reason: input.reason,
          notes: input.notes ?? null,
          adjustedBy: ctx.session.user.id,
        });

        // 3. Update batch quantityAvailable
        const newStatus = newAvailable === 0 ? "depleted" : undefined;
        await tx
          .update(batches)
          .set({
            quantityAvailable: newAvailable,
            ...(newStatus ? { status: newStatus as "depleted" } : {}),
            updatedAt: new Date(),
          })
          .where(eq(batches.id, input.batchId));

        // 4. Update stockItems quantity
        const newTotal = batch.quantity + input.quantityChange;
        await tx
          .update(stockItems)
          .set({
            quantity: newTotal,
            updatedAt: new Date(),
          })
          .where(eq(stockItems.batchId, input.batchId));

        return { newAvailable, newStatus: newStatus ?? null };
      });

      return result;
    }),

  /**
   * Adjustment history - recent adjustments with joined batch/product data.
   */
  adjustmentHistory: warehouseProcedure
    .query(async ({ ctx }) => {
      const history = await ctx.db
        .select({
          id: stockAdjustments.id,
          batchId: stockAdjustments.batchId,
          torkeBatchId: batches.torkeBatchId,
          productId: stockAdjustments.productId,
          productName: products.name,
          sku: products.sku,
          quantityChange: stockAdjustments.quantityChange,
          reason: stockAdjustments.reason,
          notes: stockAdjustments.notes,
          adjustedBy: stockAdjustments.adjustedBy,
          createdAt: stockAdjustments.createdAt,
        })
        .from(stockAdjustments)
        .innerJoin(batches, eq(stockAdjustments.batchId, batches.id))
        .innerJoin(products, eq(stockAdjustments.productId, products.id))
        .orderBy(desc(stockAdjustments.createdAt))
        .limit(100);

      return history;
    }),
});
