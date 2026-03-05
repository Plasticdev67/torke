import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "./orders";

export const orderShareTokens = pgTable("order_share_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: uuid("token").defaultRandom().notNull().unique(),
  orderId: uuid("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id").notNull(),
  projectName: varchar("project_name", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastAccessedAt: timestamp("last_accessed_at"),
});

export const orderShareTokensRelations = relations(
  orderShareTokens,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderShareTokens.orderId],
      references: [orders.id],
    }),
  })
);
