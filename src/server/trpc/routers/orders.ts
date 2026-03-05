import { z } from "zod";
import { router, protectedProcedure, warehouseProcedure } from "../trpc";
import { orders, orderLines } from "@/server/db/schema/orders";
import { products } from "@/server/db/schema/products";
import { creditAccounts } from "@/server/db/schema/credit-accounts";
import { deliveryAddresses } from "@/server/db/schema/addresses";
import { orderLineAllocations } from "@/server/db/schema/allocations";
import { batches } from "@/server/db/schema/batches";
import { invoices } from "@/server/db/schema/invoices";
import {
  createOrder,
  transitionOrder,
  allocateOrderStock,
} from "@/server/services/order-service";
import {
  sendOrderConfirmation,
  sendDispatchNotification,
} from "@/server/services/email-service";
import { generateCertPack } from "@/server/services/certpack-service";
import { eq, and, sql, desc, asc, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const ordersRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        deliveryAddressId: z.string().uuid(),
        paymentMethod: z.enum(["card", "credit", "bacs"]),
        poNumber: z.string().max(200).optional(),
        items: z
          .array(
            z.object({
              productId: z.string().uuid(),
              quantity: z.number().int().positive(),
              calcReference: z.string().max(50).optional(),
            })
          )
          .min(1, "At least one item is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Require PO number for credit payment
      if (input.paymentMethod === "credit" && !input.poNumber?.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "PO number is required for credit payment",
        });
      }

      // Verify the delivery address belongs to the user
      const [address] = await ctx.db
        .select({ id: deliveryAddresses.id })
        .from(deliveryAddresses)
        .where(
          and(
            eq(deliveryAddresses.id, input.deliveryAddressId),
            eq(deliveryAddresses.userId, userId)
          )
        );

      if (!address) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Delivery address not found",
        });
      }

      // If credit payment, verify user has an approved credit account with sufficient limit
      let creditAccountId: string | undefined;
      if (input.paymentMethod === "credit") {
        const [creditAccount] = await ctx.db
          .select()
          .from(creditAccounts)
          .where(
            and(
              eq(creditAccounts.userId, userId),
              eq(creditAccounts.status, "approved")
            )
          );

        if (!creditAccount) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "No approved credit account found. Please contact Torke to set up credit terms.",
          });
        }

        // Pre-calculate order total to check credit limit
        const productIds = input.items.map((i) => i.productId);
        const productRows = await ctx.db
          .select({
            id: products.id,
            pricePence: products.pricePence,
            name: products.name,
          })
          .from(products)
          .where(
            sql`${products.id} IN (${sql.join(
              productIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          );

        const priceMap = new Map(
          productRows.map((p) => [p.id, p.pricePence])
        );

        let subtotal = 0;
        for (const item of input.items) {
          const price = priceMap.get(item.productId);
          if (price != null) {
            subtotal += price * item.quantity;
          }
        }
        const total = subtotal + Math.round(subtotal * 0.2);

        const availableCredit =
          creditAccount.creditLimitPence - creditAccount.creditUsedPence;
        if (total > availableCredit) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Insufficient credit. Available: ${(availableCredit / 100).toFixed(2)}, Order total: ${(total / 100).toFixed(2)}`,
          });
        }

        creditAccountId = creditAccount.id;
      }

      // Create order in a transaction with server-side price validation
      const result = await ctx.db.transaction(async (tx) => {
        const order = await createOrder(tx, {
          userId,
          deliveryAddressId: input.deliveryAddressId,
          paymentMethod: input.paymentMethod,
          poNumber: input.poNumber,
          creditAccountId,
          lines: input.items,
        });

        // Set initial status based on payment method
        if (input.paymentMethod === "card") {
          // Card: stays draft until Stripe payment completes
          // The checkout UI will redirect to Stripe
        } else if (input.paymentMethod === "credit") {
          // Credit: auto-confirm since credit is pre-approved
          await transitionOrder(tx, order.order.id, "awaiting_payment");
          await transitionOrder(tx, order.order.id, "confirmed");

          // Update credit account used amount
          await tx
            .update(creditAccounts)
            .set({
              creditUsedPence: sql`${creditAccounts.creditUsedPence} + ${order.order.totalPence}`,
              updatedAt: new Date(),
            })
            .where(eq(creditAccounts.id, creditAccountId!));
        } else if (input.paymentMethod === "bacs") {
          // BACS: move to awaiting_payment, admin confirms later
          await transitionOrder(tx, order.order.id, "awaiting_payment");
        }

        return order;
      });

      // Fire-and-forget: send order confirmation email
      sendOrderConfirmation(result.order.id).catch(console.error);

      return {
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        totalPence: result.order.totalPence,
        status: result.order.status,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const order = await ctx.db.query.orders.findFirst({
        where: eq(orders.id, input.orderId),
        with: {
          orderLines: {
            with: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      // Check ownership — allow warehouse staff to view any order
      // For regular users, only allow viewing own orders
      if (order.userId !== userId) {
        // Check if user has warehouse role by looking at session
        // The warehouseProcedure handles this separately
        // For protectedProcedure, only own orders
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own orders",
        });
      }

      // Fetch delivery address if set
      let deliveryAddress = null;
      if (order.deliveryAddressId) {
        const [addr] = await ctx.db
          .select()
          .from(deliveryAddresses)
          .where(eq(deliveryAddresses.id, order.deliveryAddressId));
        deliveryAddress = addr ?? null;
      }

      return {
        ...order,
        deliveryAddress,
      };
    }),

  /** Warehouse staff can view any order */
  getByIdAdmin: warehouseProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.query.orders.findFirst({
        where: eq(orders.id, input.orderId),
        with: {
          orderLines: {
            with: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      let deliveryAddress = null;
      if (order.deliveryAddressId) {
        const [addr] = await ctx.db
          .select()
          .from(deliveryAddresses)
          .where(eq(deliveryAddresses.id, order.deliveryAddressId));
        deliveryAddress = addr ?? null;
      }

      return {
        ...order,
        deliveryAddress,
      };
    }),

  confirmPayment: warehouseProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        // Transition from awaiting_payment to confirmed
        await transitionOrder(tx, input.orderId, "confirmed");

        // Allocate stock after confirming BACS payment
        const allocations = await allocateOrderStock(tx, input.orderId);

        return {
          orderId: input.orderId,
          status: "confirmed" as const,
          allocationsCount: allocations.length,
        };
      });
    }),

  getCreditAccount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [creditAccount] = await ctx.db
      .select()
      .from(creditAccounts)
      .where(eq(creditAccounts.userId, userId));

    return creditAccount ?? null;
  }),

  /** List all credit accounts (warehouse admin) */
  listCreditAccounts: warehouseProcedure.query(async ({ ctx }) => {
    const accounts = await ctx.db
      .select()
      .from(creditAccounts)
      .orderBy(desc(creditAccounts.createdAt));

    return accounts;
  }),

  /** Approve a credit account application (warehouse admin) */
  approveCreditAccount: warehouseProcedure
    .input(
      z.object({
        accountId: z.string().uuid(),
        creditLimitPence: z.number().int().positive(),
        terms: z.enum(["net_30", "net_60"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [account] = await ctx.db
        .select()
        .from(creditAccounts)
        .where(eq(creditAccounts.id, input.accountId));

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credit account not found",
        });
      }

      if (account.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot approve account in ${account.status} status`,
        });
      }

      const [updated] = await ctx.db
        .update(creditAccounts)
        .set({
          status: "approved",
          creditLimitPence: input.creditLimitPence,
          terms: input.terms,
          approvedBy: ctx.session.user.id,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(creditAccounts.id, input.accountId))
        .returning();

      return updated!;
    }),

  /** Reject a credit account application (warehouse admin) */
  rejectCreditAccount: warehouseProcedure
    .input(z.object({ accountId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [account] = await ctx.db
        .select()
        .from(creditAccounts)
        .where(eq(creditAccounts.id, input.accountId));

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credit account not found",
        });
      }

      if (account.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot reject account in ${account.status} status`,
        });
      }

      const [updated] = await ctx.db
        .update(creditAccounts)
        .set({
          status: "rejected",
          updatedAt: new Date(),
        })
        .where(eq(creditAccounts.id, input.accountId))
        .returning();

      return updated!;
    }),

  // -----------------------------------------------------------------------
  // WMS: Order Queue, Pick Lists, Packing, Dispatch
  // -----------------------------------------------------------------------

  /** Order queue for warehouse operators */
  queue: warehouseProcedure
    .input(
      z
        .object({
          status: z
            .enum(["confirmed", "allocated", "picking", "packed"])
            .optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const statusFilter = input?.status;

      const queueStatuses = ["confirmed", "allocated", "picking", "packed"] as const;

      const queueOrders = await ctx.db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          userId: orders.userId,
          status: orders.status,
          totalPence: orders.totalPence,
          confirmedAt: orders.confirmedAt,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(
          statusFilter
            ? eq(orders.status, statusFilter)
            : sql`${orders.status} IN ('confirmed', 'allocated', 'picking', 'packed')`
        )
        .orderBy(asc(orders.confirmedAt));

      // Fetch line counts for each order
      const orderIds = queueOrders.map((o) => o.id);
      let lineCounts: Record<string, number> = {};

      if (orderIds.length > 0) {
        const counts = await ctx.db
          .select({
            orderId: orderLines.orderId,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(orderLines)
          .where(
            sql`${orderLines.orderId} IN (${sql.join(
              orderIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          )
          .groupBy(orderLines.orderId);

        lineCounts = Object.fromEntries(
          counts.map((c) => [c.orderId, c.count])
        );
      }

      return queueOrders.map((o) => ({
        ...o,
        lineCount: lineCounts[o.id] ?? 0,
      }));
    }),

  /** Get pick list for an order with FIFO batch allocations */
  getPickList: warehouseProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.query.orders.findFirst({
        where: eq(orders.id, input.orderId),
        with: {
          orderLines: {
            with: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      // Fetch delivery address
      let deliveryAddress = null;
      if (order.deliveryAddressId) {
        const [addr] = await ctx.db
          .select()
          .from(deliveryAddresses)
          .where(eq(deliveryAddresses.id, order.deliveryAddressId));
        deliveryAddress = addr ?? null;
      }

      // Fetch allocations with batch info for each line
      const lineIds = order.orderLines.map((l) => l.id);
      let allocations: Array<{
        id: string;
        orderLineId: string;
        batchId: string;
        quantity: number;
        torkeBatchId: string;
      }> = [];

      if (lineIds.length > 0) {
        const allocs = await ctx.db
          .select({
            id: orderLineAllocations.id,
            orderLineId: orderLineAllocations.orderLineId,
            batchId: orderLineAllocations.batchId,
            quantity: orderLineAllocations.quantity,
            torkeBatchId: batches.torkeBatchId,
          })
          .from(orderLineAllocations)
          .innerJoin(batches, eq(orderLineAllocations.batchId, batches.id))
          .where(
            sql`${orderLineAllocations.orderLineId} IN (${sql.join(
              lineIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          )
          .orderBy(asc(batches.goodsInDate));

        allocations = allocs;
      }

      // Group allocations by order line
      const allocationsByLine: Record<
        string,
        typeof allocations
      > = {};
      for (const alloc of allocations) {
        if (!allocationsByLine[alloc.orderLineId]) {
          allocationsByLine[alloc.orderLineId] = [];
        }
        allocationsByLine[alloc.orderLineId]!.push(alloc);
      }

      return {
        ...order,
        deliveryAddress,
        orderLines: order.orderLines.map((line) => ({
          ...line,
          allocations: allocationsByLine[line.id] ?? [],
        })),
      };
    }),

  /** Start picking an order (allocated -> picking) */
  startPicking: warehouseProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const result = await transitionOrder(tx, input.orderId, "picking");

        // Set pickedAt on all allocations for this order's lines
        const lines = await tx
          .select({ id: orderLines.id })
          .from(orderLines)
          .where(eq(orderLines.orderId, input.orderId));

        const lineIds = lines.map((l) => l.id);
        if (lineIds.length > 0) {
          await tx
            .update(orderLineAllocations)
            .set({ pickedAt: new Date() })
            .where(
              sql`${orderLineAllocations.orderLineId} IN (${sql.join(
                lineIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            );
        }

        return {
          orderId: input.orderId,
          status: "picking" as const,
        };
      });
    }),

  /** Complete packing (picking -> packed) */
  completePacking: warehouseProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        await transitionOrder(tx, input.orderId, "packed");
        return {
          orderId: input.orderId,
          status: "packed" as const,
        };
      });
    }),

  /** Dispatch an order (packed -> dispatched) */
  dispatch: warehouseProcedure
    .input(
      z
        .object({
          orderId: z.string().uuid(),
          dispatchType: z.enum(["parcel", "pallet"]),
          trackingNumber: z.string().optional(),
          consignmentNumber: z.string().optional(),
          carrierName: z.string().optional(),
          notes: z.string().optional(),
        })
        .refine(
          (data) => {
            if (data.dispatchType === "parcel" && !data.trackingNumber?.trim()) {
              return false;
            }
            if (data.dispatchType === "pallet" && !data.consignmentNumber?.trim()) {
              return false;
            }
            return true;
          },
          {
            message:
              "Tracking number required for parcel, consignment number required for pallet",
          }
        )
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        await transitionOrder(tx, input.orderId, "dispatched", {
          trackingNumber: input.trackingNumber,
          consignmentNumber: input.consignmentNumber,
          dispatchType: input.dispatchType,
        });

        // Update dispatchedAt on all allocations for this order's lines
        const lines = await tx
          .select({ id: orderLines.id })
          .from(orderLines)
          .where(eq(orderLines.orderId, input.orderId));

        const lineIds = lines.map((l) => l.id);
        if (lineIds.length > 0) {
          await tx
            .update(orderLineAllocations)
            .set({ dispatchedAt: new Date() })
            .where(
              sql`${orderLineAllocations.orderLineId} IN (${sql.join(
                lineIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            );
        }

        return {
          orderId: input.orderId,
          status: "dispatched" as const,
        };
      });

      // Generate cert pack first (sets order.certPackKey), then send dispatch email
      // which will attach the cert pack if available
      generateCertPack(ctx.db, input.orderId)
        .then(() => sendDispatchNotification(input.orderId))
        .catch(console.error);

      return result;
    }),

  /** Mark order as delivered (dispatched -> delivered) */
  markDelivered: warehouseProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        await transitionOrder(tx, input.orderId, "delivered");
        return {
          orderId: input.orderId,
          status: "delivered" as const,
        };
      });
    }),

  /** Complete order (delivered -> completed) */
  complete: warehouseProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        await transitionOrder(tx, input.orderId, "completed");
        return {
          orderId: input.orderId,
          status: "completed" as const,
        };
      });
    }),

  /** List orders for current user */
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;

      const userOrders = await ctx.db.query.orders.findMany({
        where: eq(orders.userId, userId),
        with: {
          orderLines: {
            with: {
              product: true,
            },
          },
        },
        orderBy: desc(orders.createdAt),
        limit,
        offset,
      });

      return userOrders;
    }),

  // -----------------------------------------------------------------------
  // Customer Account Portal
  // -----------------------------------------------------------------------

  /** Current user's orders (card-style listing) */
  myOrders: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;

      const userOrders = await ctx.db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          totalPence: orders.totalPence,
          paymentMethod: orders.paymentMethod,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset);

      // Fetch line counts + preview items
      const orderIds = userOrders.map((o) => o.id);
      let lineData: Array<{
        orderId: string;
        productName: string;
        quantity: number;
      }> = [];

      if (orderIds.length > 0) {
        lineData = await ctx.db
          .select({
            orderId: orderLines.orderId,
            productName: products.name,
            quantity: orderLines.quantity,
          })
          .from(orderLines)
          .innerJoin(products, eq(orderLines.productId, products.id))
          .where(
            sql`${orderLines.orderId} IN (${sql.join(
              orderIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          );
      }

      // Group line data by order
      const linesByOrder: Record<
        string,
        Array<{ productName: string; quantity: number }>
      > = {};
      for (const line of lineData) {
        if (!linesByOrder[line.orderId]) {
          linesByOrder[line.orderId] = [];
        }
        linesByOrder[line.orderId]!.push({
          productName: line.productName,
          quantity: line.quantity,
        });
      }

      return userOrders.map((o) => ({
        ...o,
        lineCount: linesByOrder[o.id]?.length ?? 0,
        linePreview: (linesByOrder[o.id] ?? []).slice(0, 3),
      }));
    }),

  /** Full order detail for current user */
  myOrderDetail: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const order = await ctx.db.query.orders.findFirst({
        where: eq(orders.id, input.orderId),
        with: {
          orderLines: {
            with: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      if (order.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own orders",
        });
      }

      // Fetch delivery address
      let deliveryAddress = null;
      if (order.deliveryAddressId) {
        const [addr] = await ctx.db
          .select()
          .from(deliveryAddresses)
          .where(eq(deliveryAddresses.id, order.deliveryAddressId));
        deliveryAddress = addr ?? null;
      }

      // Fetch allocations (batch refs) for each order line
      const lineIds = order.orderLines.map((l) => l.id);
      let allocations: Array<{
        orderLineId: string;
        torkeBatchId: string;
        quantity: number;
      }> = [];

      if (lineIds.length > 0) {
        allocations = await ctx.db
          .select({
            orderLineId: orderLineAllocations.orderLineId,
            torkeBatchId: batches.torkeBatchId,
            quantity: orderLineAllocations.quantity,
          })
          .from(orderLineAllocations)
          .innerJoin(batches, eq(orderLineAllocations.batchId, batches.id))
          .where(
            sql`${orderLineAllocations.orderLineId} IN (${sql.join(
              lineIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          );
      }

      // Group allocations by line
      const allocationsByLine: Record<
        string,
        Array<{ torkeBatchId: string; quantity: number }>
      > = {};
      for (const alloc of allocations) {
        if (!allocationsByLine[alloc.orderLineId]) {
          allocationsByLine[alloc.orderLineId] = [];
        }
        allocationsByLine[alloc.orderLineId]!.push({
          torkeBatchId: alloc.torkeBatchId,
          quantity: alloc.quantity,
        });
      }

      // Check if invoice exists
      const invoiceRows = await ctx.db
        .select({ id: invoices.id })
        .from(invoices)
        .where(eq(invoices.orderId, input.orderId));

      const hasInvoice = invoiceRows.length > 0;

      return {
        ...order,
        deliveryAddress,
        hasInvoice,
        orderLines: order.orderLines.map((line) => ({
          ...line,
          allocations: allocationsByLine[line.id] ?? [],
        })),
      };
    }),

  /** Get items from a past order for reordering */
  reorder: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify ownership
      const [order] = await ctx.db
        .select({ id: orders.id, userId: orders.userId })
        .from(orders)
        .where(eq(orders.id, input.orderId));

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      if (order.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only reorder your own orders",
        });
      }

      // Get order line items with current product prices
      const items = await ctx.db
        .select({
          productId: orderLines.productId,
          productName: products.name,
          sku: products.sku,
          quantity: orderLines.quantity,
          currentPricePence: products.pricePence,
        })
        .from(orderLines)
        .innerJoin(products, eq(orderLines.productId, products.id))
        .where(eq(orderLines.orderId, input.orderId));

      return items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPricePence: item.currentPricePence ?? 0,
      }));
    }),

  /** Account spending summary for current user */
  accountSummary: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Total orders and total spent (all time)
    const [totals] = await ctx.db
      .select({
        totalOrders: sql<number>`COUNT(*)::int`,
        totalSpentPence: sql<number>`COALESCE(SUM(${orders.totalPence}), 0)::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.userId, userId),
          sql`${orders.status} NOT IN ('draft', 'cancelled')`
        )
      );

    // Monthly spending (current month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthly] = await ctx.db
      .select({
        monthlySpentPence: sql<number>`COALESCE(SUM(${orders.totalPence}), 0)::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.userId, userId),
          sql`${orders.status} NOT IN ('draft', 'cancelled')`,
          sql`${orders.createdAt} >= ${monthStart.toISOString()}`
        )
      );

    // Top products by order frequency
    const topProducts = await ctx.db
      .select({
        productName: products.name,
        orderCount: sql<number>`COUNT(DISTINCT ${orderLines.orderId})::int`,
      })
      .from(orderLines)
      .innerJoin(products, eq(orderLines.productId, products.id))
      .innerJoin(orders, eq(orderLines.orderId, orders.id))
      .where(
        and(
          eq(orders.userId, userId),
          sql`${orders.status} NOT IN ('draft', 'cancelled')`
        )
      )
      .groupBy(products.name)
      .orderBy(sql`COUNT(DISTINCT ${orderLines.orderId}) DESC`)
      .limit(5);

    // Credit account status
    const [creditAccount] = await ctx.db
      .select({
        status: creditAccounts.status,
        creditLimitPence: creditAccounts.creditLimitPence,
        creditUsedPence: creditAccounts.creditUsedPence,
      })
      .from(creditAccounts)
      .where(eq(creditAccounts.userId, userId));

    // Count of cert packs available
    const [certPacks] = await ctx.db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.userId, userId),
          sql`${orders.certPackKey} IS NOT NULL`
        )
      );

    return {
      totalOrders: totals?.totalOrders ?? 0,
      totalSpentPence: totals?.totalSpentPence ?? 0,
      monthlySpentPence: monthly?.monthlySpentPence ?? 0,
      topProducts: topProducts ?? [],
      creditAccount: creditAccount ?? null,
      certPackCount: certPacks?.count ?? 0,
    };
  }),
});
