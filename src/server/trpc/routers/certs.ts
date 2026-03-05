import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { orders, orderLines } from "@/server/db/schema/orders";
import { products } from "@/server/db/schema/products";
import { orderLineAllocations } from "@/server/db/schema/allocations";
import { batches, supplierBatches, millCerts } from "@/server/db/schema/batches";
import { eq, and, sql, desc, ilike } from "drizzle-orm";

export const certsRouter = router({
  /**
   * Search certifications for the current user.
   * Filters by order number, batch ID, product code, date range.
   */
  search: protectedProcedure
    .input(
      z.object({
        orderNumber: z.string().optional(),
        batchId: z.string().optional(),
        productCode: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Build filter conditions
      const conditions = [eq(orders.userId, userId)];

      if (input.orderNumber?.trim()) {
        conditions.push(ilike(orders.orderNumber, `%${input.orderNumber.trim()}%`));
      }

      if (input.dateFrom) {
        conditions.push(sql`${orders.createdAt} >= ${input.dateFrom}`);
      }

      if (input.dateTo) {
        conditions.push(sql`${orders.createdAt} <= ${input.dateTo}::timestamp + interval '1 day'`);
      }

      // If filtering by batch ID or product code, we need to join through the chain
      const hasBatchFilter = !!input.batchId?.trim();
      const hasProductFilter = !!input.productCode?.trim();

      // First, get matching order IDs with all filters applied
      let orderIdsQuery;

      if (hasBatchFilter || hasProductFilter) {
        // Need to join through orderLines -> allocations -> batches -> products
        let q = ctx.db
          .selectDistinct({ orderId: orders.id })
          .from(orders)
          .innerJoin(orderLines, eq(orderLines.orderId, orders.id))
          .leftJoin(
            orderLineAllocations,
            eq(orderLineAllocations.orderLineId, orderLines.id)
          )
          .leftJoin(batches, eq(orderLineAllocations.batchId, batches.id))
          .innerJoin(products, eq(orderLines.productId, products.id));

        const joinConditions = [...conditions];

        if (hasBatchFilter) {
          joinConditions.push(
            ilike(batches.torkeBatchId, `%${input.batchId!.trim()}%`)
          );
        }

        if (hasProductFilter) {
          joinConditions.push(
            sql`(${ilike(products.sku, `%${input.productCode!.trim()}%`)} OR ${ilike(products.name, `%${input.productCode!.trim()}%`)})`
          );
        }

        orderIdsQuery = q.where(and(...joinConditions));
      } else {
        orderIdsQuery = ctx.db
          .selectDistinct({ orderId: orders.id })
          .from(orders)
          .where(and(...conditions));
      }

      const matchingOrderIds = await orderIdsQuery;
      const totalCount = matchingOrderIds.length;

      if (totalCount === 0) {
        return { results: [], totalCount: 0 };
      }

      // Get paginated order IDs
      const paginatedIds = matchingOrderIds
        .slice(input.offset, input.offset + input.limit)
        .map((r) => r.orderId);

      if (paginatedIds.length === 0) {
        return { results: [], totalCount };
      }

      // Fetch full order data with lines, allocations, batches
      const orderData = await ctx.db
        .select({
          orderId: orders.id,
          orderNumber: orders.orderNumber,
          orderDate: orders.createdAt,
          status: orders.status,
          certPackKey: orders.certPackKey,
          lineId: orderLines.id,
          productName: products.name,
          productSku: products.sku,
          lineQuantity: orderLines.quantity,
          allocationId: orderLineAllocations.id,
          torkeBatchId: batches.torkeBatchId,
          allocationQty: orderLineAllocations.quantity,
          batchId: batches.id,
          supplierBatchId: batches.supplierBatchId,
        })
        .from(orders)
        .innerJoin(orderLines, eq(orderLines.orderId, orders.id))
        .innerJoin(products, eq(orderLines.productId, products.id))
        .leftJoin(
          orderLineAllocations,
          eq(orderLineAllocations.orderLineId, orderLines.id)
        )
        .leftJoin(batches, eq(orderLineAllocations.batchId, batches.id))
        .where(
          sql`${orders.id} IN (${sql.join(
            paginatedIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        )
        .orderBy(desc(orders.createdAt));

      // Fetch supplier batch cert URLs for batch cert downloads
      const batchSupplierIds = new Set<string>();
      for (const row of orderData) {
        if (row.supplierBatchId) batchSupplierIds.add(row.supplierBatchId);
      }

      const certUrls = new Map<string, string | null>();
      if (batchSupplierIds.size > 0) {
        const sbRows = await ctx.db
          .select({
            sbId: supplierBatches.id,
            manufacturerCertUrl: supplierBatches.manufacturerCertUrl,
            documentUrl: millCerts.documentUrl,
          })
          .from(supplierBatches)
          .leftJoin(millCerts, eq(supplierBatches.millCertId, millCerts.id))
          .where(
            sql`${supplierBatches.id} IN (${sql.join(
              [...batchSupplierIds].map((id) => sql`${id}`),
              sql`, `
            )})`
          );

        for (const row of sbRows) {
          certUrls.set(row.sbId, row.documentUrl ?? row.manufacturerCertUrl ?? null);
        }
      }

      // Group results by order
      const orderMap = new Map<
        string,
        {
          orderId: string;
          orderNumber: string;
          orderDate: Date;
          status: string;
          certPackKey: string | null;
          lines: Map<
            string,
            {
              productName: string;
              productSku: string;
              quantity: number;
              allocations: Array<{
                torkeBatchId: string;
                quantity: number;
                batchCertKey: string | null;
              }>;
            }
          >;
        }
      >();

      for (const row of orderData) {
        if (!orderMap.has(row.orderId)) {
          orderMap.set(row.orderId, {
            orderId: row.orderId,
            orderNumber: row.orderNumber,
            orderDate: row.orderDate,
            status: row.status,
            certPackKey: row.certPackKey,
            lines: new Map(),
          });
        }

        const order = orderMap.get(row.orderId)!;

        if (!order.lines.has(row.lineId)) {
          order.lines.set(row.lineId, {
            productName: row.productName,
            productSku: row.productSku,
            quantity: row.lineQuantity,
            allocations: [],
          });
        }

        const line = order.lines.get(row.lineId)!;

        if (row.torkeBatchId && row.allocationId) {
          const certKey = row.supplierBatchId
            ? certUrls.get(row.supplierBatchId) ?? null
            : null;

          line.allocations.push({
            torkeBatchId: row.torkeBatchId,
            quantity: row.allocationQty ?? row.lineQuantity,
            batchCertKey: certKey,
          });
        }
      }

      // Convert to array output
      const results = [...orderMap.values()].map((order) => ({
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        status: order.status,
        certPackKey: order.certPackKey,
        lines: [...order.lines.values()].map((line) => ({
          productName: line.productName,
          productSku: line.productSku,
          quantity: line.quantity,
          allocations: line.allocations,
        })),
      }));

      return { results, totalCount };
    }),

  /**
   * Get full cert detail for a single order.
   */
  orderCertDetail: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify ownership
      const [order] = await ctx.db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          certPackKey: orders.certPackKey,
          userId: orders.userId,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.id, input.orderId));

      if (!order || order.userId !== userId) {
        return null;
      }

      // Fetch lines with allocations and batch data
      const lineData = await ctx.db
        .select({
          lineId: orderLines.id,
          productName: products.name,
          productSku: products.sku,
          lineQuantity: orderLines.quantity,
          torkeBatchId: batches.torkeBatchId,
          allocationQty: orderLineAllocations.quantity,
          supplierBatchId: batches.supplierBatchId,
        })
        .from(orderLines)
        .innerJoin(products, eq(orderLines.productId, products.id))
        .leftJoin(
          orderLineAllocations,
          eq(orderLineAllocations.orderLineId, orderLines.id)
        )
        .leftJoin(batches, eq(orderLineAllocations.batchId, batches.id))
        .where(eq(orderLines.orderId, input.orderId));

      // Get cert URLs
      const supplierBatchIds = new Set<string>();
      for (const row of lineData) {
        if (row.supplierBatchId) supplierBatchIds.add(row.supplierBatchId);
      }

      const certUrls = new Map<string, string | null>();
      if (supplierBatchIds.size > 0) {
        const sbRows = await ctx.db
          .select({
            sbId: supplierBatches.id,
            manufacturerCertUrl: supplierBatches.manufacturerCertUrl,
            documentUrl: millCerts.documentUrl,
          })
          .from(supplierBatches)
          .leftJoin(millCerts, eq(supplierBatches.millCertId, millCerts.id))
          .where(
            sql`${supplierBatches.id} IN (${sql.join(
              [...supplierBatchIds].map((id) => sql`${id}`),
              sql`, `
            )})`
          );

        for (const row of sbRows) {
          certUrls.set(row.sbId, row.documentUrl ?? row.manufacturerCertUrl ?? null);
        }
      }

      // Group by line
      const lineMap = new Map<
        string,
        {
          productName: string;
          productSku: string;
          quantity: number;
          allocations: Array<{
            torkeBatchId: string;
            quantity: number;
            batchCertKey: string | null;
          }>;
        }
      >();

      for (const row of lineData) {
        if (!lineMap.has(row.lineId)) {
          lineMap.set(row.lineId, {
            productName: row.productName,
            productSku: row.productSku,
            quantity: row.lineQuantity,
            allocations: [],
          });
        }

        if (row.torkeBatchId) {
          const certKey = row.supplierBatchId
            ? certUrls.get(row.supplierBatchId) ?? null
            : null;

          lineMap.get(row.lineId)!.allocations.push({
            torkeBatchId: row.torkeBatchId,
            quantity: row.allocationQty ?? row.lineQuantity,
            batchCertKey: certKey,
          });
        }
      }

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderDate: order.createdAt,
        status: order.status,
        certPackKey: order.certPackKey,
        lines: [...lineMap.values()],
      };
    }),
});
