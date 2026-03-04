import {
  pgTable,
  uuid,
  text,
  varchar,
  jsonb,
  timestamp,
  integer,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const categoryEnum = pgEnum("category_type", [
  "chemical-anchors",
  "mechanical-anchors",
  "general-fixings",
]);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  parentId: uuid("parent_id"),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryParent",
  }),
  children: many(categories, { relationName: "categoryParent" }),
  products: many(products),
}));

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  categoryId: uuid("category_id")
    .references(() => categories.id)
    .notNull(),
  description: text("description"),
  technicalSpecs: jsonb("technical_specs"),
  diameter: varchar("diameter", { length: 20 }),
  material: varchar("material", { length: 100 }),
  lengthMm: integer("length_mm"),
  finish: varchar("finish", { length: 100 }),
  loadClass: varchar("load_class", { length: 50 }),
  etaReference: varchar("eta_reference", { length: 100 }),
  datasheetUrl: text("datasheet_url"),
  images: jsonb("images").$type<string[]>(),
  isActive: boolean("is_active").default(true).notNull(),
  pricePence: integer("price_pence"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));
