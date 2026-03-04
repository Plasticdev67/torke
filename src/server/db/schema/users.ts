import { pgTable, uuid, text, varchar, timestamp } from "drizzle-orm/pg-core";

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  companyName: varchar("company_name", { length: 500 }),
  phone: varchar("phone", { length: 50 }),
  role: varchar("role", { length: 50 }).default("customer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
