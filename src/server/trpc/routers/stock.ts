import { z } from "zod";
import { router, warehouseProcedure } from "../trpc";
import { batches } from "@/server/db/schema/batches";
import { stockItems } from "@/server/db/schema/stock";
import { products } from "@/server/db/schema/products";
import { eq, and, sql, lte, gt, isNotNull } from "drizzle-orm";

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
});
