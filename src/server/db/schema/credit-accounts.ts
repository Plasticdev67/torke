import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const creditTermsEnum = pgEnum("credit_terms", [
  "net_30",
  "net_60",
]);

export const creditStatusEnum = pgEnum("credit_status", [
  "pending",
  "approved",
  "rejected",
  "suspended",
]);

export const creditAccounts = pgTable("credit_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  companyName: varchar("company_name", { length: 500 }).notNull(),
  creditLimitPence: integer("credit_limit_pence").notNull(),
  creditUsedPence: integer("credit_used_pence").default(0).notNull(),
  terms: creditTermsEnum("terms").notNull(),
  status: creditStatusEnum("status").default("pending").notNull(),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
