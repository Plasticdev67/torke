import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  date,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products } from "./products";

export const batchStatusEnum = pgEnum("batch_status", [
  "pending",
  "available",
  "quarantined",
  "depleted",
]);

export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 500 }).notNull(),
  code: varchar("code", { length: 50 }).unique(),
  contactInfo: jsonb("contact_info"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  supplierBatches: many(supplierBatches),
}));

export const millCerts = pgTable("mill_certs", {
  id: uuid("id").primaryKey().defaultRandom(),
  heatNumber: varchar("heat_number", { length: 100 }),
  millName: varchar("mill_name", { length: 500 }),
  documentUrl: text("document_url").notNull(),
  chemicalComposition: jsonb("chemical_composition"),
  mechanicalProperties: jsonb("mechanical_properties"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const millCertsRelations = relations(millCerts, ({ many }) => ({
  supplierBatches: many(supplierBatches),
}));

export const supplierBatches = pgTable("supplier_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  supplierId: uuid("supplier_id")
    .references(() => suppliers.id)
    .notNull(),
  supplierBatchNumber: varchar("supplier_batch_number", {
    length: 200,
  }).notNull(),
  millCertId: uuid("mill_cert_id").references(() => millCerts.id),
  manufacturerCertUrl: text("manufacturer_cert_url"),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  quantityReceived: integer("quantity_received").notNull(),
  productionDate: date("production_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const supplierBatchesRelations = relations(
  supplierBatches,
  ({ one, many }) => ({
    supplier: one(suppliers, {
      fields: [supplierBatches.supplierId],
      references: [suppliers.id],
    }),
    millCert: one(millCerts, {
      fields: [supplierBatches.millCertId],
      references: [millCerts.id],
    }),
    product: one(products, {
      fields: [supplierBatches.productId],
      references: [products.id],
    }),
    batches: many(batches),
  })
);

export const batches = pgTable("batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  torkeBatchId: varchar("torke_batch_id", { length: 50 }).notNull().unique(),
  supplierBatchId: uuid("supplier_batch_id")
    .references(() => supplierBatches.id)
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  goodsInDate: timestamp("goods_in_date").defaultNow().notNull(),
  receivedBy: uuid("received_by").notNull(),
  inspectionNotes: text("inspection_notes"),
  quantity: integer("quantity").notNull(),
  quantityAvailable: integer("quantity_available").notNull(),
  quantityReserved: integer("quantity_reserved").default(0).notNull(),
  status: batchStatusEnum("status").default("pending").notNull(),
  expiryDate: date("expiry_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const batchesRelations = relations(batches, ({ one }) => ({
  supplierBatch: one(supplierBatches, {
    fields: [batches.supplierBatchId],
    references: [supplierBatches.id],
  }),
  product: one(products, {
    fields: [batches.productId],
    references: [products.id],
  }),
}));
