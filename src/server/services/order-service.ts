import {
  orders,
  orderLines,
  orderStatusEnum,
} from "@/server/db/schema/orders";
import { products } from "@/server/db/schema/products";
import { allocateFIFO } from "@/server/services/batch-service";
import { eq, sql } from "drizzle-orm";
import type { Database } from "@/server/db";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

// --------------------------------------------------------------------------
// Order Status State Machine
// --------------------------------------------------------------------------

/**
 * Defines all valid status transitions for orders.
 * Each key maps to an array of statuses that can be transitioned TO from that key.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ["awaiting_payment", "confirmed", "cancelled"],
  awaiting_payment: ["confirmed", "cancelled"],
  confirmed: ["allocated", "cancelled"],
  allocated: ["picking", "cancelled"],
  picking: ["packed", "cancelled"],
  packed: ["dispatched", "cancelled"],
  dispatched: ["delivered"],
  delivered: ["completed"],
  completed: [],
  cancelled: [],
};

/**
 * Check if a transition from one status to another is valid.
 */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

/**
 * Transition an order to a new status within a transaction.
 * Throws if the transition is not valid.
 * Sets timestamp columns for key status transitions.
 */
export async function transitionOrder(
  tx: Tx,
  orderId: string,
  newStatus: OrderStatus,
  metadata?: { trackingNumber?: string; consignmentNumber?: string; dispatchType?: string }
) {
  // Fetch current order status
  const [order] = await tx
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  if (!canTransition(order.status, newStatus)) {
    throw new Error(
      `Invalid order transition: ${order.status} -> ${newStatus}`
    );
  }

  // Build update payload with relevant timestamps
  const updates: Record<string, unknown> = {
    status: newStatus,
    updatedAt: new Date(),
  };

  if (newStatus === "confirmed") {
    updates.confirmedAt = new Date();
  }
  if (newStatus === "allocated") {
    updates.allocatedAt = new Date();
  }
  if (newStatus === "dispatched") {
    updates.dispatchedAt = new Date();
    if (metadata?.trackingNumber) {
      updates.trackingNumber = metadata.trackingNumber;
    }
    if (metadata?.consignmentNumber) {
      updates.consignmentNumber = metadata.consignmentNumber;
    }
    if (metadata?.dispatchType) {
      updates.dispatchType = metadata.dispatchType;
    }
  }
  if (newStatus === "delivered") {
    updates.deliveredAt = new Date();
  }

  await tx.update(orders).set(updates).where(eq(orders.id, orderId));

  return { orderId, from: order.status, to: newStatus };
}

// --------------------------------------------------------------------------
// Order Number Generation
// --------------------------------------------------------------------------

/**
 * Generate a unique order number: ORD-YYYYMM-NNNNNN
 * Uses the same MAX-query-in-transaction pattern as batch-service.ts
 */
async function generateOrderNumber(tx: Tx): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `ORD-${year}${month}-`;

  const result = await tx
    .select({ maxNum: sql<string>`MAX(${orders.orderNumber})` })
    .from(orders)
    .where(sql`${orders.orderNumber} LIKE ${prefix + "%"}`);

  let seq = 1;
  const maxNum = result[0]?.maxNum;
  if (maxNum) {
    const parts = maxNum.split("-");
    const lastSeq = parseInt(parts[parts.length - 1]!, 10);
    if (!isNaN(lastSeq)) {
      seq = lastSeq + 1;
    }
  }

  return `${prefix}${String(seq).padStart(6, "0")}`;
}

// --------------------------------------------------------------------------
// Create Order
// --------------------------------------------------------------------------

export interface CreateOrderInput {
  userId: string;
  deliveryAddressId?: string;
  paymentMethod?: "card" | "credit" | "bacs";
  poNumber?: string;
  creditAccountId?: string;
  notes?: string;
  lines: Array<{
    productId: string;
    quantity: number;
  }>;
}

/**
 * Create an order with lines in a single transaction.
 *
 * IMPORTANT: Fetches product prices from products.pricePence column.
 * Never trusts client-side prices. Throws if any product has no price set.
 */
export async function createOrder(tx: Tx, data: CreateOrderInput) {
  // 1. Fetch all product prices from the database
  const productIds = data.lines.map((l) => l.productId);
  const productRows = await tx
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
    productRows.map((p) => [p.id, { pricePence: p.pricePence, name: p.name }])
  );

  // 2. Validate all products have prices
  for (const line of data.lines) {
    const product = priceMap.get(line.productId);
    if (!product) {
      throw new Error(`Product ${line.productId} not found`);
    }
    if (product.pricePence == null) {
      throw new Error(
        `Product "${product.name}" does not have a price set. Cannot create order.`
      );
    }
  }

  // 3. Calculate order line totals
  const lineData = data.lines.map((line) => {
    const product = priceMap.get(line.productId)!;
    const unitPricePence = product.pricePence!;
    const lineTotalPence = unitPricePence * line.quantity;
    return {
      productId: line.productId,
      quantity: line.quantity,
      unitPricePence,
      lineTotalPence,
    };
  });

  const subtotalPence = lineData.reduce((sum, l) => sum + l.lineTotalPence, 0);
  const vatPence = Math.round(subtotalPence * 0.2); // 20% VAT
  const totalPence = subtotalPence + vatPence;

  // 4. Generate order number
  const orderNumber = await generateOrderNumber(tx);

  // 5. Create order
  const [order] = await tx
    .insert(orders)
    .values({
      orderNumber,
      userId: data.userId,
      deliveryAddressId: data.deliveryAddressId ?? null,
      paymentMethod: data.paymentMethod ?? null,
      poNumber: data.poNumber ?? null,
      creditAccountId: data.creditAccountId ?? null,
      notes: data.notes ?? null,
      subtotalPence,
      vatPence,
      totalPence,
      status: "draft",
    })
    .returning();

  // 6. Create order lines
  const createdLines = [];
  for (const line of lineData) {
    const [created] = await tx
      .insert(orderLines)
      .values({
        orderId: order!.id,
        ...line,
      })
      .returning();
    createdLines.push(created!);
  }

  return {
    order: order!,
    lines: createdLines,
  };
}

// --------------------------------------------------------------------------
// Allocate Order Stock
// --------------------------------------------------------------------------

/**
 * Allocate stock for all lines in an order using FIFO allocation.
 * Calls allocateFIFO from batch-service for each order line,
 * then transitions the order to 'allocated'.
 */
export async function allocateOrderStock(tx: Tx, orderId: string) {
  // Fetch order lines
  const lines = await tx
    .select()
    .from(orderLines)
    .where(eq(orderLines.orderId, orderId));

  if (lines.length === 0) {
    throw new Error(`No order lines found for order ${orderId}`);
  }

  // Allocate each line via FIFO
  const allAllocations = [];
  for (const line of lines) {
    const allocations = await allocateFIFO(
      tx,
      line.productId,
      line.quantity,
      line.id
    );
    allAllocations.push(...allocations);
  }

  // Transition order to allocated
  await transitionOrder(tx, orderId, "allocated");

  return allAllocations;
}
