import { pgTable, uuid, text, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";

export const calculations = pgTable("calculations", {
  id: uuid("id").primaryKey().defaultRandom(),
  calcReference: varchar("calc_reference", { length: 50 }).notNull().unique(),
  userId: text("user_id").notNull(),
  projectName: varchar("project_name", { length: 255 }),
  engineerName: varchar("engineer_name", { length: 255 }),
  inputs: jsonb("inputs").notNull(),
  results: jsonb("results").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
