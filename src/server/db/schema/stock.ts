import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { batches } from "./batches";
import { products } from "./products";

export const stockItems = pgTable("stock_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  batchId: uuid("batch_id")
    .references(() => batches.id)
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  binLocation: varchar("bin_location", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const stockItemsRelations = relations(stockItems, ({ one }) => ({
  batch: one(batches, {
    fields: [stockItems.batchId],
    references: [batches.id],
  }),
  product: one(products, {
    fields: [stockItems.productId],
    references: [products.id],
  }),
}));
