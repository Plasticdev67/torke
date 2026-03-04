import { pgTable, uuid, timestamp, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { batches } from "./batches";
import { orderLines } from "./orders";

export const orderLineAllocations = pgTable("order_line_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderLineId: uuid("order_line_id")
    .references(() => orderLines.id)
    .notNull(),
  batchId: uuid("batch_id")
    .references(() => batches.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  allocatedAt: timestamp("allocated_at").defaultNow().notNull(),
  pickedAt: timestamp("picked_at"),
  dispatchedAt: timestamp("dispatched_at"),
});

export const orderLineAllocationsRelations = relations(
  orderLineAllocations,
  ({ one }) => ({
    batch: one(batches, {
      fields: [orderLineAllocations.batchId],
      references: [batches.id],
    }),
    orderLine: one(orderLines, {
      fields: [orderLineAllocations.orderLineId],
      references: [orderLines.id],
    }),
  })
);
