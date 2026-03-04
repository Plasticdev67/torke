import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { batches } from "./batches";
import { products } from "./products";

export const adjustmentReasonEnum = pgEnum("adjustment_reason", [
  "damage",
  "returns",
  "cycle_count_variance",
  "other",
]);

export const stockAdjustments = pgTable("stock_adjustments", {
  id: uuid("id").primaryKey().defaultRandom(),
  batchId: uuid("batch_id")
    .references(() => batches.id)
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  quantityChange: integer("quantity_change").notNull(),
  reason: adjustmentReasonEnum("reason").notNull(),
  notes: text("notes"),
  adjustedBy: text("adjusted_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stockAdjustmentsRelations = relations(
  stockAdjustments,
  ({ one }) => ({
    batch: one(batches, {
      fields: [stockAdjustments.batchId],
      references: [batches.id],
    }),
    product: one(products, {
      fields: [stockAdjustments.productId],
      references: [products.id],
    }),
  })
);
