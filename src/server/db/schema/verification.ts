import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { batches } from "./batches";

export const verificationTokens = pgTable("verification_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: uuid("token").defaultRandom().notNull().unique(),
  batchId: uuid("batch_id")
    .references(() => batches.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastAccessedAt: timestamp("last_accessed_at"),
});

export const verificationTokensRelations = relations(
  verificationTokens,
  ({ one }) => ({
    batch: one(batches, {
      fields: [verificationTokens.batchId],
      references: [batches.id],
    }),
  })
);
