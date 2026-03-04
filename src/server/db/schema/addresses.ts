import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const deliveryAddresses = pgTable("delivery_addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  addressLine1: varchar("address_line_1", { length: 500 }).notNull(),
  addressLine2: varchar("address_line_2", { length: 500 }),
  city: varchar("city", { length: 200 }).notNull(),
  county: varchar("county", { length: 200 }),
  postcode: varchar("postcode", { length: 20 }).notNull(),
  country: varchar("country", { length: 10 }).default("GB").notNull(),
  siteContactName: varchar("site_contact_name", { length: 300 }),
  siteContactPhone: varchar("site_contact_phone", { length: 50 }),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
