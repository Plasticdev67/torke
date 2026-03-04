import { z } from "zod";
import { router, publicProcedure, warehouseProcedure } from "../trpc";
import { completeGoodsIn } from "@/server/services/batch-service";
import { batches, supplierBatches, suppliers, millCerts } from "@/server/db/schema/batches";
import { verificationTokens } from "@/server/db/schema/verification";
import { products } from "@/server/db/schema/products";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

export const batchesRouter = router({
  /**
   * Complete goods-in workflow.
   * Protected: warehouse role required.
   * Creates supplier batch, Torke batch, stock item, and verification token
   * in a single transaction.
   */
  completeGoodsIn: warehouseProcedure
    .input(
      z.object({
        supplierName: z.string().min(1, "Supplier name is required"),
        supplierBatchNumber: z.string().min(1, "Supplier batch number is required"),
        productId: z.string().uuid("Invalid product ID"),
        quantity: z.number().int().positive("Quantity must be positive"),
        certKey: z.string().min(1, "Certificate upload is required"),
        expiryDate: z.string().nullable().optional(),
        inspectionNotes: z.string().nullable().optional(),
        poReference: z.string().nullable().optional(),
        heatNumber: z.string().nullable().optional(),
        millName: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await completeGoodsIn({
        ...input,
        userId: ctx.session.user.id,
      });

      return {
        batch: result.batch,
        verificationToken: result.verificationToken,
        torkeBatchId: result.torkeBatchId,
      };
    }),

  /**
   * Get batch by ID with all related data.
   */
  getById: warehouseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const batch = await ctx.db.query.batches.findFirst({
        where: eq(batches.id, input.id),
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

      if (!batch) return null;

      // Get verification token
      const token = await ctx.db.query.verificationTokens.findFirst({
        where: eq(verificationTokens.batchId, batch.id),
      });

      return { ...batch, verificationToken: token };
    }),

  /**
   * List batches with filters and pagination.
   */
  list: warehouseProcedure
    .input(
      z.object({
        productId: z.string().uuid().optional(),
        status: z.enum(["pending", "available", "quarantined", "depleted"]).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.productId) {
        conditions.push(eq(batches.productId, input.productId));
      }
      if (input.status) {
        conditions.push(eq(batches.status, input.status));
      }
      if (input.dateFrom) {
        conditions.push(gte(batches.goodsInDate, new Date(input.dateFrom)));
      }
      if (input.dateTo) {
        conditions.push(lte(batches.goodsInDate, new Date(input.dateTo)));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countResult] = await Promise.all([
        ctx.db.query.batches.findMany({
          where,
          with: {
            supplierBatch: {
              with: { supplier: true },
            },
            product: true,
          },
          orderBy: desc(batches.goodsInDate),
          limit: input.limit,
          offset: input.offset,
        }),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(batches)
          .where(where),
      ]);

      return {
        items,
        total: Number(countResult[0]?.count ?? 0),
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Public procedure: Look up batch by verification token UUID.
   * Used by the QR verification page (/t/{token}).
   * Updates lastAccessedAt on access.
   */
  getByToken: publicProcedure
    .input(z.object({ token: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const tokenRecord = await ctx.db.query.verificationTokens.findFirst({
        where: eq(verificationTokens.token, input.token),
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

      if (!tokenRecord) return null;

      // Update last accessed timestamp
      await ctx.db
        .update(verificationTokens)
        .set({ lastAccessedAt: new Date() })
        .where(eq(verificationTokens.id, tokenRecord.id));

      return tokenRecord;
    }),
});
