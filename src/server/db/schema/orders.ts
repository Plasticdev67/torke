import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products } from "./products";

export const orderStatusEnum = pgEnum("order_status", [
  "draft",
  "awaiting_payment",
  "confirmed",
  "allocated",
  "picking",
  "packed",
  "dispatched",
  "delivered",
  "completed",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "card",
  "credit",
  "bacs",
]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  userId: text("user_id").notNull(),
  deliveryAddressId: uuid("delivery_address_id"),
  paymentMethod: paymentMethodEnum("payment_method"),
  status: orderStatusEnum("status").default("draft").notNull(),
  poNumber: varchar("po_number", { length: 200 }),
  subtotalPence: integer("subtotal_pence").notNull(),
  vatPence: integer("vat_pence").notNull(),
  totalPence: integer("total_pence").notNull(),
  stripeSessionId: varchar("stripe_session_id", { length: 500 }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 500 }),
  creditAccountId: uuid("credit_account_id"),
  invoiceId: uuid("invoice_id"),
  certPackKey: varchar("cert_pack_key", { length: 500 }),
  trackingNumber: varchar("tracking_number", { length: 200 }),
  consignmentNumber: varchar("consignment_number", { length: 200 }),
  dispatchType: varchar("dispatch_type", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
  allocatedAt: timestamp("allocated_at"),
  dispatchedAt: timestamp("dispatched_at"),
  deliveredAt: timestamp("delivered_at"),
});

export const orderLines = pgTable("order_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  unitPricePence: integer("unit_price_pence").notNull(),
  lineTotalPence: integer("line_total_pence").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ many }) => ({
  orderLines: many(orderLines),
}));

export const orderLinesRelations = relations(orderLines, ({ one }) => ({
  order: one(orders, {
    fields: [orderLines.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderLines.productId],
    references: [products.id],
  }),
}));
