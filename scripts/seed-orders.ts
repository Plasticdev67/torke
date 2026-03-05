/**
 * Database seed script for orders, batches, allocations, and traceability data.
 *
 * Creates realistic test data for Phase 4 features:
 * - Cert portal search and downloads
 * - Verification share links
 * - QR-to-cert flow
 *
 * Prerequisites:
 * - seed-products.ts has been run (products exist)
 * - DATABASE_URL environment variable set
 *
 * Idempotent: checks if data exists before creating.
 *
 * Usage: npx tsx scripts/seed-orders.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, sql } from "drizzle-orm";
import { products } from "../src/server/db/schema/products.js";
import { orders, orderLines } from "../src/server/db/schema/orders.js";
import {
  suppliers,
  millCerts,
  supplierBatches,
  batches,
} from "../src/server/db/schema/batches.js";
import { orderLineAllocations } from "../src/server/db/schema/allocations.js";
import { deliveryAddresses } from "../src/server/db/schema/addresses.js";
import { userProfiles } from "../src/server/db/schema/users.js";
import { verificationTokens } from "../src/server/db/schema/verification.js";

// ───────────────────────────────────────────────────────
// Database connection
// ───────────────────────────────────────────────────────

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("ERROR: DATABASE_URL environment variable is required.");
  console.error(
    '  export DATABASE_URL=postgresql://postgres:torke@localhost:5432/torke'
  );
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

// ───────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ───────────────────────────────────────────────────────
// Seed functions
// ───────────────────────────────────────────────────────

async function ensureCustomerUser(): Promise<string> {
  // Check if a customer user profile exists
  const existing = await db
    .select({ userId: userProfiles.userId })
    .from(userProfiles)
    .where(eq(userProfiles.role, "customer"))
    .limit(1);

  if (existing.length > 0) {
    console.log(`  = Customer user exists: ${existing[0]!.userId}`);
    return existing[0]!.userId;
  }

  // Create a customer profile
  const userId = "user_customer";
  await db.insert(userProfiles).values({
    userId,
    companyName: "Henderson Structural Ltd",
    phone: "0117 987 6543",
    role: "customer",
  });
  console.log(`  + Created customer profile: ${userId}`);
  return userId;
}

async function ensureWarehouseUser(): Promise<string> {
  // receivedBy on batches is a uuid column, so we need the profile id (uuid), not the userId (text)
  const existing = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.role, "warehouse"))
    .limit(1);

  if (existing.length > 0) {
    return existing[0]!.id;
  }
  // Fallback: create a placeholder UUID
  const fallback = crypto.randomUUID();
  console.log(`  WARNING: No warehouse user found, using generated UUID: ${fallback}`);
  return fallback;
}

async function seedSuppliers() {
  const data = [
    { name: "ArcelorMittal Distribution UK", code: "ARCEL01" },
    { name: "Hilti (GB) Ltd", code: "HILTI01" },
    { name: "fischer fixings UK Ltd", code: "FISCH01" },
  ];

  const ids: string[] = [];
  for (const s of data) {
    const existing = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(eq(suppliers.code, s.code!))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  = Supplier ${s.name} exists`);
      ids.push(existing[0]!.id);
      continue;
    }

    const result = await db
      .insert(suppliers)
      .values(s)
      .returning({ id: suppliers.id });
    console.log(`  + Supplier: ${s.name} -> ${result[0]!.id}`);
    ids.push(result[0]!.id);
  }
  return ids;
}

async function seedMillCerts() {
  const data = [
    {
      heatNumber: "HN-2025-84921",
      millName: "ArcelorMittal Scunthorpe",
      documentUrl: "certs/mill/heat-84921.pdf",
      chemicalComposition: { C: "0.08", Mn: "0.45", Si: "0.22", P: "0.012", S: "0.008" },
      mechanicalProperties: { yieldStrength: "355", tensileStrength: "470", elongation: "22" },
    },
    {
      heatNumber: "HN-2025-73105",
      millName: "ArcelorMittal Scunthorpe",
      documentUrl: "certs/mill/heat-73105.pdf",
      chemicalComposition: { C: "0.07", Mn: "0.50", Si: "0.20", P: "0.010", S: "0.006" },
      mechanicalProperties: { yieldStrength: "360", tensileStrength: "480", elongation: "21" },
    },
    {
      heatNumber: "HN-2025-55042",
      millName: "Tata Steel Shotton",
      documentUrl: "certs/mill/heat-55042.pdf",
      chemicalComposition: { C: "0.06", Mn: "0.42", Si: "0.18" },
      mechanicalProperties: { yieldStrength: "340", tensileStrength: "450", elongation: "24" },
    },
  ];

  const ids: string[] = [];
  for (const mc of data) {
    const existing = await db
      .select({ id: millCerts.id })
      .from(millCerts)
      .where(eq(millCerts.heatNumber, mc.heatNumber!))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  = Mill cert ${mc.heatNumber} exists`);
      ids.push(existing[0]!.id);
      continue;
    }

    const result = await db
      .insert(millCerts)
      .values(mc)
      .returning({ id: millCerts.id });
    console.log(`  + Mill cert: ${mc.heatNumber} -> ${result[0]!.id}`);
    ids.push(result[0]!.id);
  }
  return ids;
}

async function getProducts(limit: number) {
  const prods = await db
    .select({ id: products.id, name: products.name, sku: products.sku, pricePence: products.pricePence })
    .from(products)
    .where(eq(products.isActive, true))
    .limit(limit);

  if (prods.length === 0) {
    console.error("ERROR: No products found. Run seed-products.ts first.");
    process.exit(1);
  }
  return prods;
}

async function seedSupplierBatches(
  supplierIds: string[],
  millCertIds: string[],
  productIds: { id: string; name: string }[]
) {
  const data = [
    {
      supplierId: supplierIds[0]!,
      supplierBatchNumber: "AM-2025-M12-0301",
      millCertId: millCertIds[0]!,
      productId: productIds[0]!.id,
      quantityReceived: 500,
      productionDate: "2025-02-15",
    },
    {
      supplierId: supplierIds[0]!,
      supplierBatchNumber: "AM-2025-M16-0445",
      millCertId: millCertIds[1]!,
      productId: productIds[1]!.id,
      quantityReceived: 300,
      productionDate: "2025-02-20",
    },
    {
      supplierId: supplierIds[1]!,
      supplierBatchNumber: "HI-2025-HIT-RE500",
      millCertId: millCertIds[2]!,
      productId: productIds[2]!.id,
      quantityReceived: 200,
      productionDate: "2025-01-28",
    },
    {
      supplierId: supplierIds[2]!,
      supplierBatchNumber: "FI-2025-FIS-EM390",
      millCertId: millCertIds[0]!,
      productId: productIds[3]?.id ?? productIds[0]!.id,
      quantityReceived: 400,
      productionDate: "2025-03-01",
    },
  ];

  const ids: string[] = [];
  for (const sb of data) {
    const existing = await db
      .select({ id: supplierBatches.id })
      .from(supplierBatches)
      .where(eq(supplierBatches.supplierBatchNumber, sb.supplierBatchNumber))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  = Supplier batch ${sb.supplierBatchNumber} exists`);
      ids.push(existing[0]!.id);
      continue;
    }

    const result = await db
      .insert(supplierBatches)
      .values(sb)
      .returning({ id: supplierBatches.id });
    console.log(`  + Supplier batch: ${sb.supplierBatchNumber} -> ${result[0]!.id}`);
    ids.push(result[0]!.id);
  }
  return ids;
}

async function seedBatches(
  supplierBatchIds: string[],
  productIds: { id: string }[],
  warehouseUserId: string
) {
  const data = [
    {
      torkeBatchId: "TRK-2025-00001",
      supplierBatchId: supplierBatchIds[0]!,
      productId: productIds[0]!.id,
      goodsInDate: daysAgo(30),
      receivedBy: warehouseUserId,
      inspectionNotes: "Visual inspection passed. No surface defects.",
      quantity: 500,
      quantityAvailable: 350,
      quantityReserved: 150,
      status: "available" as const,
    },
    {
      torkeBatchId: "TRK-2025-00002",
      supplierBatchId: supplierBatchIds[1]!,
      productId: productIds[1]!.id,
      goodsInDate: daysAgo(25),
      receivedBy: warehouseUserId,
      inspectionNotes: "All items within spec. Mill cert verified.",
      quantity: 300,
      quantityAvailable: 200,
      quantityReserved: 100,
      status: "available" as const,
    },
    {
      torkeBatchId: "TRK-2025-00003",
      supplierBatchId: supplierBatchIds[2]!,
      productId: productIds[2]!.id,
      goodsInDate: daysAgo(20),
      receivedBy: warehouseUserId,
      quantity: 200,
      quantityAvailable: 150,
      quantityReserved: 50,
      status: "available" as const,
    },
    {
      torkeBatchId: "TRK-2025-00004",
      supplierBatchId: supplierBatchIds[3]!,
      productId: productIds[3]?.id ?? productIds[0]!.id,
      goodsInDate: daysAgo(10),
      receivedBy: warehouseUserId,
      quantity: 400,
      quantityAvailable: 400,
      quantityReserved: 0,
      status: "available" as const,
    },
  ];

  const ids: string[] = [];
  for (const b of data) {
    const existing = await db
      .select({ id: batches.id })
      .from(batches)
      .where(eq(batches.torkeBatchId, b.torkeBatchId))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  = Batch ${b.torkeBatchId} exists`);
      ids.push(existing[0]!.id);
      continue;
    }

    const result = await db
      .insert(batches)
      .values(b)
      .returning({ id: batches.id });
    console.log(`  + Batch: ${b.torkeBatchId} -> ${result[0]!.id}`);
    ids.push(result[0]!.id);
  }
  return ids;
}

async function seedVerificationTokens(batchIds: string[]) {
  const ids: string[] = [];
  for (const batchId of batchIds) {
    const existing = await db
      .select({ id: verificationTokens.id, token: verificationTokens.token })
      .from(verificationTokens)
      .where(eq(verificationTokens.batchId, batchId))
      .limit(1);

    if (existing.length > 0) {
      ids.push(existing[0]!.token);
      continue;
    }

    const result = await db
      .insert(verificationTokens)
      .values({ batchId })
      .returning({ id: verificationTokens.id, token: verificationTokens.token });
    console.log(`  + Verification token for batch -> /t/${result[0]!.token}`);
    ids.push(result[0]!.token);
  }
  return ids;
}

async function seedDeliveryAddress(userId: string) {
  const existing = await db
    .select({ id: deliveryAddresses.id })
    .from(deliveryAddresses)
    .where(eq(deliveryAddresses.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    console.log(`  = Delivery address exists`);
    return existing[0]!.id;
  }

  const result = await db
    .insert(deliveryAddresses)
    .values({
      userId,
      name: "Main Office",
      addressLine1: "Unit 7, Avonmouth Business Park",
      addressLine2: "Crowley Way",
      city: "Bristol",
      county: "Avon",
      postcode: "BS11 9FD",
      siteContactName: "Dave Henderson",
      siteContactPhone: "07700 900123",
      isDefault: true,
    })
    .returning({ id: deliveryAddresses.id });
  console.log(`  + Delivery address -> ${result[0]!.id}`);
  return result[0]!.id;
}

async function seedOrders(
  userId: string,
  addressId: string,
  productList: { id: string; pricePence: number | null }[],
  batchIds: string[]
) {
  const orderDefs = [
    {
      orderNumber: "ORD-202503-000001",
      status: "dispatched" as const,
      paymentMethod: "credit" as const,
      poNumber: "PO-HEND-2025-044",
      lines: [
        { productIdx: 0, qty: 100, batchIdx: 0 },
        { productIdx: 1, qty: 50, batchIdx: 1 },
      ],
      daysAgo: 14,
    },
    {
      orderNumber: "ORD-202503-000002",
      status: "confirmed" as const,
      paymentMethod: "bacs" as const,
      poNumber: "PO-HEND-2025-051",
      lines: [
        { productIdx: 2, qty: 30, batchIdx: 2 },
      ],
      daysAgo: 7,
    },
    {
      orderNumber: "ORD-202503-000003",
      status: "dispatched" as const,
      paymentMethod: "credit" as const,
      poNumber: "PO-HEND-2025-063",
      lines: [
        { productIdx: 0, qty: 50, batchIdx: 0 },
        { productIdx: 2, qty: 20, batchIdx: 2 },
        { productIdx: 3 ?? 0, qty: 75, batchIdx: 3 },
      ],
      daysAgo: 3,
    },
  ];

  for (const od of orderDefs) {
    // Check if order exists
    const existing = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.orderNumber, od.orderNumber))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  = Order ${od.orderNumber} exists`);
      continue;
    }

    // Calculate totals
    const lineTotals = od.lines.map((l) => {
      const price = productList[l.productIdx]?.pricePence ?? 2500;
      return { ...l, unitPrice: price, lineTotal: price * l.qty };
    });
    const subtotal = lineTotals.reduce((sum, l) => sum + l.lineTotal, 0);
    const vat = Math.round(subtotal * 0.2);

    // Create order
    const orderResult = await db
      .insert(orders)
      .values({
        orderNumber: od.orderNumber,
        userId,
        deliveryAddressId: addressId,
        paymentMethod: od.paymentMethod,
        status: od.status,
        poNumber: od.poNumber,
        subtotalPence: subtotal,
        vatPence: vat,
        totalPence: subtotal + vat,
        createdAt: daysAgo(od.daysAgo),
        updatedAt: daysAgo(od.daysAgo),
        confirmedAt: daysAgo(od.daysAgo),
        allocatedAt: daysAgo(od.daysAgo - 1),
        dispatchedAt: od.status === "dispatched" ? daysAgo(od.daysAgo - 2) : undefined,
      })
      .returning({ id: orders.id });

    const orderId = orderResult[0]!.id;
    console.log(`  + Order: ${od.orderNumber} (${od.status}) -> ${orderId}`);

    // Create order lines + allocations
    for (const lt of lineTotals) {
      const productId = productList[lt.productIdx]?.id ?? productList[0]!.id;
      const lineResult = await db
        .insert(orderLines)
        .values({
          orderId,
          productId,
          quantity: lt.qty,
          unitPricePence: lt.unitPrice,
          lineTotalPence: lt.lineTotal,
        })
        .returning({ id: orderLines.id });

      const lineId = lineResult[0]!.id;

      // Create allocation linking line to batch
      const batchId = batchIds[lt.batchIdx] ?? batchIds[0]!;
      await db.insert(orderLineAllocations).values({
        orderLineId: lineId,
        batchId,
        quantity: lt.qty,
        allocatedAt: daysAgo(od.daysAgo - 1),
        dispatchedAt: od.status === "dispatched" ? daysAgo(od.daysAgo - 2) : undefined,
      });

      console.log(`    + Line: qty ${lt.qty} -> batch ${lt.batchIdx}`);
    }
  }
}

// ───────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────

async function seed() {
  console.log("=== Torke Order & Traceability Seed ===\n");

  // 1. Users
  console.log("Users:");
  const customerId = await ensureCustomerUser();
  const warehouseId = await ensureWarehouseUser();

  // 2. Products (must already exist)
  console.log("\nProducts:");
  const prods = await getProducts(6);
  console.log(`  Found ${prods.length} products`);
  for (const p of prods) {
    console.log(`    - ${p.sku}: ${p.name} (${p.pricePence ? `£${(p.pricePence / 100).toFixed(2)}` : "no price"})`);
  }

  // 3. Suppliers
  console.log("\nSuppliers:");
  const supplierIds = await seedSuppliers();

  // 4. Mill certs
  console.log("\nMill Certs:");
  const millCertIds = await seedMillCerts();

  // 5. Supplier batches
  console.log("\nSupplier Batches:");
  const supplierBatchIds = await seedSupplierBatches(
    supplierIds,
    millCertIds,
    prods.map((p) => ({ id: p.id, name: p.name }))
  );

  // 6. Batches
  console.log("\nBatches:");
  const batchIds = await seedBatches(
    supplierBatchIds,
    prods,
    warehouseId
  );

  // 7. Verification tokens (for /t/[token] QR links)
  console.log("\nVerification Tokens:");
  const tokenIds = await seedVerificationTokens(batchIds);

  // 8. Delivery address
  console.log("\nDelivery Address:");
  const addressId = await seedDeliveryAddress(customerId);

  // 9. Orders with lines and allocations
  console.log("\nOrders:");
  await seedOrders(customerId, addressId, prods, batchIds);

  // Summary
  console.log("\n=== SEED COMPLETE ===\n");
  console.log("Test data created:");
  console.log(`  Suppliers:        ${supplierIds.length}`);
  console.log(`  Mill certs:       ${millCertIds.length}`);
  console.log(`  Supplier batches: ${supplierBatchIds.length}`);
  console.log(`  Batches:          ${batchIds.length}`);
  console.log(`  Orders:           3 (with lines + allocations)`);
  console.log(`  Verification tokens: ${tokenIds.length}`);
  console.log("");
  console.log("Test user: user_customer (Henderson Structural Ltd)");
  console.log("");
  console.log("QR verification links:");
  for (let i = 0; i < tokenIds.length; i++) {
    console.log(`  Batch TRK-2025-0000${i + 1}: /t/${tokenIds[i]}`);
  }
  console.log("");
  console.log("Orders for cert search:");
  console.log("  ORD-202503-000001 (dispatched, 2 lines, credit)");
  console.log("  ORD-202503-000002 (confirmed, 1 line, BACS)");
  console.log("  ORD-202503-000003 (dispatched, 3 lines, credit)");
  console.log("");
  console.log("NOTE: Cert pack PDFs won't be in R2 storage.");
  console.log("The cert portal will show orders but downloads will fail");
  console.log("until you dispatch an order through the WMS flow.");

  await client.end();
}

seed().catch((err) => {
  console.error("Fatal error:", err);
  client.end();
  process.exit(1);
});
