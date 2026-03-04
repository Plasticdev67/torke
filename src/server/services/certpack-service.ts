import { PDFDocument, rgb, StandardFonts, type PDFPage, type PDFFont } from "pdf-lib";
import { eq, sql } from "drizzle-orm";
import { orders, orderLines } from "@/server/db/schema/orders";
import { products } from "@/server/db/schema/products";
import { orderLineAllocations } from "@/server/db/schema/allocations";
import { batches, supplierBatches, millCerts, suppliers } from "@/server/db/schema/batches";
import { deliveryAddresses } from "@/server/db/schema/addresses";
import { downloadFile, uploadFile } from "@/server/storage";
import type { Database } from "@/server/db";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

interface TraceabilityRow {
  lineNumber: number;
  productName: string;
  quantity: number;
  torkeBatchId: string;
  supplierBatch: string;
  manufacturer: string;
  heatNumber: string;
  certPageRef: string;
  certKey: string | null;
}

interface OrderData {
  order: {
    id: string;
    orderNumber: string;
    createdAt: Date;
    poNumber: string | null;
  };
  address: {
    name: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    postcode: string;
    siteContactName: string | null;
  } | null;
  traceabilityRows: TraceabilityRow[];
}

// --------------------------------------------------------------------------
// Constants
// --------------------------------------------------------------------------

const A4_WIDTH = 595;
const A4_HEIGHT = 842;
const MARGIN = 50;
const TORKE_RED = rgb(196 / 255, 30 / 255, 58 / 255);
const BLACK = rgb(0, 0, 0);
const DARK_GREY = rgb(0.3, 0.3, 0.3);
const LIGHT_GREY = rgb(0.85, 0.85, 0.85);

// --------------------------------------------------------------------------
// Query order data for cert pack
// --------------------------------------------------------------------------

async function queryOrderData(db: Database, orderId: string): Promise<OrderData> {
  // Fetch order
  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      createdAt: orders.createdAt,
      poNumber: orders.poNumber,
      deliveryAddressId: orders.deliveryAddressId,
      userId: orders.userId,
    })
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Fetch delivery address
  let address = null;
  if (order.deliveryAddressId) {
    const [addr] = await db
      .select()
      .from(deliveryAddresses)
      .where(eq(deliveryAddresses.id, order.deliveryAddressId));
    address = addr ?? null;
  }

  // Fetch order lines with product, allocations, batches, supplier batches, mill certs
  const lines = await db
    .select({
      lineId: orderLines.id,
      quantity: orderLines.quantity,
      productName: products.name,
      allocationBatchId: orderLineAllocations.batchId,
      allocationQty: orderLineAllocations.quantity,
      torkeBatchId: batches.torkeBatchId,
      supplierBatchId: batches.supplierBatchId,
    })
    .from(orderLines)
    .innerJoin(products, eq(orderLines.productId, products.id))
    .leftJoin(orderLineAllocations, eq(orderLineAllocations.orderLineId, orderLines.id))
    .leftJoin(batches, eq(orderLineAllocations.batchId, batches.id))
    .where(eq(orderLines.orderId, orderId));

  // Gather unique supplier batch IDs to look up certs
  const supplierBatchIds = new Set<string>();
  for (const line of lines) {
    if (line.supplierBatchId) {
      supplierBatchIds.add(line.supplierBatchId);
    }
  }

  // Fetch supplier batch + mill cert data
  const certData = new Map<
    string,
    {
      supplierBatchNumber: string;
      manufacturer: string;
      heatNumber: string;
      certUrl: string | null;
    }
  >();

  if (supplierBatchIds.size > 0) {
    const sbRows = await db
      .select({
        sbId: supplierBatches.id,
        supplierBatchNumber: supplierBatches.supplierBatchNumber,
        manufacturerCertUrl: supplierBatches.manufacturerCertUrl,
        millCertId: supplierBatches.millCertId,
        supplierName: suppliers.name,
        heatNumber: millCerts.heatNumber,
        millName: millCerts.millName,
        documentUrl: millCerts.documentUrl,
      })
      .from(supplierBatches)
      .innerJoin(suppliers, eq(supplierBatches.supplierId, suppliers.id))
      .leftJoin(millCerts, eq(supplierBatches.millCertId, millCerts.id))
      .where(
        sql`${supplierBatches.id} IN (${sql.join(
          [...supplierBatchIds].map((id) => sql`${id}`),
          sql`, `
        )})`
      );

    for (const row of sbRows) {
      certData.set(row.sbId, {
        supplierBatchNumber: row.supplierBatchNumber,
        manufacturer: row.millName ?? row.supplierName,
        heatNumber: row.heatNumber ?? "N/A",
        certUrl: row.documentUrl ?? row.manufacturerCertUrl ?? null,
      });
    }
  }

  // Build traceability rows (grouped by order line)
  const traceabilityRows: TraceabilityRow[] = [];
  const lineGroups = new Map<string, typeof lines>();
  for (const line of lines) {
    const existing = lineGroups.get(line.lineId) ?? [];
    existing.push(line);
    lineGroups.set(line.lineId, existing);
  }

  let lineNumber = 0;
  for (const [, groupLines] of lineGroups) {
    lineNumber++;
    const first = groupLines[0]!;

    if (!first.allocationBatchId || !first.torkeBatchId) {
      // No allocation yet - still show the line
      traceabilityRows.push({
        lineNumber,
        productName: first.productName,
        quantity: first.quantity,
        torkeBatchId: "Pending",
        supplierBatch: "Pending",
        manufacturer: "Pending",
        heatNumber: "Pending",
        certPageRef: "-",
        certKey: null,
      });
      continue;
    }

    // Each allocation gets a row
    for (const alloc of groupLines) {
      if (!alloc.supplierBatchId || !alloc.torkeBatchId) continue;
      const cert = certData.get(alloc.supplierBatchId);
      traceabilityRows.push({
        lineNumber,
        productName: first.productName,
        quantity: alloc.allocationQty ?? first.quantity,
        torkeBatchId: alloc.torkeBatchId,
        supplierBatch: cert?.supplierBatchNumber ?? "N/A",
        manufacturer: cert?.manufacturer ?? "N/A",
        heatNumber: cert?.heatNumber ?? "N/A",
        certPageRef: "", // filled later after merging
        certKey: cert?.certUrl ?? null,
      });
    }
  }

  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      poNumber: order.poNumber,
    },
    address,
    traceabilityRows,
  };
}

// --------------------------------------------------------------------------
// PDF Drawing Helpers
// --------------------------------------------------------------------------

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = BLACK
) {
  page.drawText(text, { x, y, size, font, color });
}

function drawTableRow(
  page: PDFPage,
  y: number,
  cols: { text: string; x: number; width: number }[],
  font: PDFFont,
  fontSize: number,
  color = BLACK
) {
  for (const col of cols) {
    // Truncate text to fit column width
    let text = col.text;
    const maxChars = Math.floor(col.width / (fontSize * 0.5));
    if (text.length > maxChars) {
      text = text.substring(0, maxChars - 2) + "..";
    }
    drawText(page, text, col.x, y, font, fontSize, color);
  }
}

function drawHorizontalLine(page: PDFPage, y: number, x1: number, x2: number) {
  page.drawLine({
    start: { x: x1, y },
    end: { x: x2, y },
    thickness: 0.5,
    color: DARK_GREY,
  });
}

// --------------------------------------------------------------------------
// Build Cover Page
// --------------------------------------------------------------------------

function buildCoverPages(
  doc: PDFDocument,
  orderData: OrderData,
  boldFont: PDFFont,
  regularFont: PDFFont
): PDFPage[] {
  const pages: PDFPage[] = [];
  let page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
  pages.push(page);
  let y = A4_HEIGHT - MARGIN;

  // --- Torke header bar ---
  page.drawRectangle({
    x: 0,
    y: A4_HEIGHT - 60,
    width: A4_WIDTH,
    height: 60,
    color: TORKE_RED,
  });

  drawText(page, "TORKE", 50, A4_HEIGHT - 42, boldFont, 28, rgb(1, 1, 1));
  drawText(page, "Certificate Pack", A4_WIDTH - 200, A4_HEIGHT - 42, regularFont, 14, rgb(1, 1, 1));

  y = A4_HEIGHT - 90;

  // --- Order details ---
  const detailsStartY = y;
  const labelX = MARGIN;
  const valueX = MARGIN + 130;
  const lineHeight = 18;

  drawText(page, "Order Number:", labelX, y, boldFont, 10);
  drawText(page, orderData.order.orderNumber, valueX, y, regularFont, 10);
  y -= lineHeight;

  drawText(page, "Order Date:", labelX, y, boldFont, 10);
  drawText(page, orderData.order.createdAt.toLocaleDateString("en-GB"), valueX, y, regularFont, 10);
  y -= lineHeight;

  if (orderData.order.poNumber) {
    drawText(page, "PO Number:", labelX, y, boldFont, 10);
    drawText(page, orderData.order.poNumber, valueX, y, regularFont, 10);
    y -= lineHeight;
  }

  if (orderData.address) {
    drawText(page, "Delivery Address:", labelX, y, boldFont, 10);
    const addrParts = [
      orderData.address.name,
      orderData.address.addressLine1,
      orderData.address.addressLine2,
      orderData.address.city,
      orderData.address.postcode,
    ].filter(Boolean);
    drawText(page, addrParts.join(", "), valueX, y, regularFont, 9);
    y -= lineHeight;

    if (orderData.address.siteContactName) {
      drawText(page, "Site Contact:", labelX, y, boldFont, 10);
      drawText(page, orderData.address.siteContactName, valueX, y, regularFont, 10);
      y -= lineHeight;
    }
  }

  y -= 10;
  drawHorizontalLine(page, y, MARGIN, A4_WIDTH - MARGIN);
  y -= 20;

  // --- Traceability Table ---
  drawText(page, "Traceability Summary", MARGIN, y, boldFont, 13, TORKE_RED);
  y -= 20;

  // Table column definitions
  const tableX = MARGIN;
  const colDefs = [
    { header: "#", x: tableX, width: 20 },
    { header: "Product", x: tableX + 22, width: 100 },
    { header: "Qty", x: tableX + 124, width: 30 },
    { header: "Torke Batch", x: tableX + 156, width: 75 },
    { header: "Supplier Batch", x: tableX + 233, width: 75 },
    { header: "Manufacturer", x: tableX + 310, width: 75 },
    { header: "Heat No.", x: tableX + 387, width: 55 },
    { header: "Cert Page", x: tableX + 444, width: 55 },
  ];

  // Draw header row background
  page.drawRectangle({
    x: tableX - 2,
    y: y - 4,
    width: A4_WIDTH - 2 * MARGIN + 4,
    height: 16,
    color: LIGHT_GREY,
  });

  // Draw header text
  drawTableRow(
    page,
    y,
    colDefs.map((c) => ({ text: c.header, x: c.x, width: c.width })),
    boldFont,
    7
  );

  y -= 16;
  drawHorizontalLine(page, y, tableX - 2, A4_WIDTH - MARGIN + 2);
  y -= 2;

  // Draw data rows
  const rowHeight = 14;
  for (const row of orderData.traceabilityRows) {
    // Check if we need a new page
    if (y < MARGIN + 50) {
      page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
      pages.push(page);
      y = A4_HEIGHT - MARGIN;
      drawText(page, "Traceability Summary (continued)", MARGIN, y, boldFont, 13, TORKE_RED);
      y -= 20;
    }

    y -= rowHeight;
    drawTableRow(
      page,
      y,
      [
        { text: String(row.lineNumber), x: colDefs[0]!.x, width: colDefs[0]!.width },
        { text: row.productName, x: colDefs[1]!.x, width: colDefs[1]!.width },
        { text: String(row.quantity), x: colDefs[2]!.x, width: colDefs[2]!.width },
        { text: row.torkeBatchId, x: colDefs[3]!.x, width: colDefs[3]!.width },
        { text: row.supplierBatch, x: colDefs[4]!.x, width: colDefs[4]!.width },
        { text: row.manufacturer, x: colDefs[5]!.x, width: colDefs[5]!.width },
        { text: row.heatNumber, x: colDefs[6]!.x, width: colDefs[6]!.width },
        { text: row.certPageRef, x: colDefs[7]!.x, width: colDefs[7]!.width },
      ],
      regularFont,
      7
    );

    drawHorizontalLine(page, y - 3, tableX - 2, A4_WIDTH - MARGIN + 2);
  }

  // Footer
  y -= 30;
  if (y < MARGIN + 20) {
    page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
    pages.push(page);
    y = A4_HEIGHT - MARGIN;
  }

  const dateStr = new Date().toLocaleDateString("en-GB");
  drawText(
    page,
    `Generated by Torke - ${dateStr}. Original certificates appended unaltered.`,
    MARGIN,
    y,
    regularFont,
    8,
    DARK_GREY
  );

  return pages;
}

// --------------------------------------------------------------------------
// Main: Generate Cert Pack
// --------------------------------------------------------------------------

export async function generateCertPack(
  db: Database,
  orderId: string
): Promise<Buffer> {
  const startTime = Date.now();

  // 1. Query order data
  const orderData = await queryOrderData(db, orderId);

  // 2. Collect unique cert URLs and fetch them
  const uniqueCerts = new Map<string, Uint8Array | null>();
  for (const row of orderData.traceabilityRows) {
    if (row.certKey && !uniqueCerts.has(row.certKey)) {
      try {
        const pdfBytes = await downloadFile(row.certKey);
        uniqueCerts.set(row.certKey, pdfBytes);
      } catch {
        // Mark as unavailable - don't throw
        uniqueCerts.set(row.certKey, null);
      }
    }
  }

  // 3. Create the merged PDF document
  const mergedDoc = await PDFDocument.create();
  const boldFont = await mergedDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await mergedDoc.embedFont(StandardFonts.Helvetica);

  // 4. Calculate page references BEFORE building cover page
  //    Cover page count is estimated (1 for most orders, 2+ for large)
  const coverPageCount = Math.ceil(
    Math.max(1, (orderData.traceabilityRows.length * 14 + 200) / (A4_HEIGHT - 2 * MARGIN))
  );

  let currentPage = coverPageCount + 1; // certs start after cover
  const certPageMap = new Map<string, string>();
  for (const [certKey, certBytes] of uniqueCerts) {
    if (certBytes) {
      try {
        const certDoc = await PDFDocument.load(certBytes);
        const pageCount = certDoc.getPageCount();
        const startPage = currentPage;
        const endPage = currentPage + pageCount - 1;
        certPageMap.set(
          certKey,
          startPage === endPage ? String(startPage) : `${startPage}-${endPage}`
        );
        currentPage = endPage + 1;
      } catch {
        certPageMap.set(certKey, "Error");
      }
    } else {
      certPageMap.set(certKey, "Unavailable");
    }
  }

  // Update cert page refs on traceability rows
  for (const row of orderData.traceabilityRows) {
    if (row.certKey) {
      row.certPageRef = certPageMap.get(row.certKey) ?? "-";
    }
  }

  // 5. Build cover page(s)
  buildCoverPages(mergedDoc, orderData, boldFont, regularFont);

  // 6. Append original cert PDFs unaltered
  for (const [, certBytes] of uniqueCerts) {
    if (!certBytes) continue;
    try {
      const certDoc = await PDFDocument.load(certBytes);
      const copiedPages = await mergedDoc.copyPages(certDoc, certDoc.getPageIndices());
      for (const copiedPage of copiedPages) {
        mergedDoc.addPage(copiedPage);
      }
    } catch {
      // Skip corrupted certs - already marked as Error in table
    }
  }

  // 7. Save PDF
  const pdfBytes = await mergedDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  // 8. Upload to R2
  const certPackKey = `certpacks/${orderId}.pdf`;
  await uploadFile(pdfBuffer, certPackKey, "application/pdf");

  // 9. Update order with cert pack key
  await db
    .update(orders)
    .set({ certPackKey, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  const duration = Date.now() - startTime;
  console.log(`[CertPack] Generated cert pack for order ${orderId} in ${duration}ms`);

  return pdfBuffer;
}
