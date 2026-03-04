import { PDFDocument, rgb, StandardFonts, type PDFPage, type PDFFont } from "pdf-lib";
import { eq, sql } from "drizzle-orm";
import { orders, orderLines } from "@/server/db/schema/orders";
import { products } from "@/server/db/schema/products";
import { orderLineAllocations } from "@/server/db/schema/allocations";
import { batches } from "@/server/db/schema/batches";
import { invoices } from "@/server/db/schema/invoices";
import { deliveryAddresses } from "@/server/db/schema/addresses";
import { uploadFile } from "@/server/storage";
import type { Database } from "@/server/db";

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
const WHITE = rgb(1, 1, 1);

// Torke company details (placeholders for production)
const TORKE_DETAILS = {
  name: "Torke Ltd",
  address: "Unit 1, Industrial Estate, Sheffield, S1 1AA",
  vatNumber: "GB 000 0000 00", // TODO: Replace with real VAT number
  email: "orders@torke.co.uk",
  phone: "+44 (0) 114 000 0000",
  registration: "Registered in England & Wales. Company No. 00000000",
};

// Bank details for BACS proforma (env vars or placeholders)
const BANK_DETAILS = {
  bankName: process.env.TORKE_BANK_NAME ?? "Barclays Business",
  sortCode: process.env.TORKE_SORT_CODE ?? "XX-XX-XX",
  accountNumber: process.env.TORKE_ACCOUNT_NUMBER ?? "XXXXXXXX",
};

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

interface InvoiceLineItem {
  lineNumber: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPricePence: number;
  lineTotalPence: number;
  torkeBatchIds: string[];
}

interface InvoiceOrderData {
  order: {
    id: string;
    orderNumber: string;
    createdAt: Date;
    poNumber: string | null;
    paymentMethod: string | null;
    subtotalPence: number;
    vatPence: number;
    totalPence: number;
    userId: string;
  };
  address: {
    name: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    postcode: string;
    siteContactName: string | null;
    siteContactPhone: string | null;
  } | null;
  lineItems: InvoiceLineItem[];
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function formatPence(pence: number): string {
  const pounds = (pence / 100).toFixed(2);
  return `\u00A3${pounds}`;
}

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

function drawHorizontalLine(page: PDFPage, y: number, x1: number, x2: number) {
  page.drawLine({
    start: { x: x1, y },
    end: { x: x2, y },
    thickness: 0.5,
    color: DARK_GREY,
  });
}

// --------------------------------------------------------------------------
// Query invoice data
// --------------------------------------------------------------------------

async function queryInvoiceData(db: Database, orderId: string): Promise<InvoiceOrderData> {
  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      createdAt: orders.createdAt,
      poNumber: orders.poNumber,
      paymentMethod: orders.paymentMethod,
      subtotalPence: orders.subtotalPence,
      vatPence: orders.vatPence,
      totalPence: orders.totalPence,
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

  // Fetch order lines with product info and batch allocations
  const lines = await db
    .select({
      lineId: orderLines.id,
      quantity: orderLines.quantity,
      unitPricePence: orderLines.unitPricePence,
      lineTotalPence: orderLines.lineTotalPence,
      productName: products.name,
      productSku: products.sku,
      torkeBatchId: batches.torkeBatchId,
    })
    .from(orderLines)
    .innerJoin(products, eq(orderLines.productId, products.id))
    .leftJoin(orderLineAllocations, eq(orderLineAllocations.orderLineId, orderLines.id))
    .leftJoin(batches, eq(orderLineAllocations.batchId, batches.id))
    .where(eq(orderLines.orderId, orderId));

  // Group by line, collecting batch IDs
  const lineMap = new Map<
    string,
    InvoiceLineItem
  >();

  let lineNumber = 0;
  for (const row of lines) {
    if (!lineMap.has(row.lineId)) {
      lineNumber++;
      lineMap.set(row.lineId, {
        lineNumber,
        productName: row.productName,
        sku: row.productSku,
        quantity: row.quantity,
        unitPricePence: row.unitPricePence,
        lineTotalPence: row.lineTotalPence,
        torkeBatchIds: [],
      });
    }
    const item = lineMap.get(row.lineId)!;
    if (row.torkeBatchId && !item.torkeBatchIds.includes(row.torkeBatchId)) {
      item.torkeBatchIds.push(row.torkeBatchId);
    }
  }

  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      poNumber: order.poNumber,
      paymentMethod: order.paymentMethod,
      subtotalPence: order.subtotalPence,
      vatPence: order.vatPence,
      totalPence: order.totalPence,
      userId: order.userId,
    },
    address,
    lineItems: [...lineMap.values()],
  };
}

// --------------------------------------------------------------------------
// Invoice Number Generation
// --------------------------------------------------------------------------

async function generateInvoiceNumber(db: Database): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `INV-${year}${month}-`;

  const result = await db
    .select({ maxNum: sql<string>`MAX(${invoices.invoiceNumber})` })
    .from(invoices)
    .where(sql`${invoices.invoiceNumber} LIKE ${prefix + "%"}`);

  let seq = 1;
  const maxNum = result[0]?.maxNum;
  if (maxNum) {
    const parts = maxNum.split("-");
    const lastSeq = parseInt(parts[parts.length - 1]!, 10);
    if (!isNaN(lastSeq)) {
      seq = lastSeq + 1;
    }
  }

  return `${prefix}${String(seq).padStart(6, "0")}`;
}

// --------------------------------------------------------------------------
// Shared PDF Layout: Header
// --------------------------------------------------------------------------

function drawInvoiceHeader(
  page: PDFPage,
  title: string,
  boldFont: PDFFont,
  regularFont: PDFFont
): number {
  let y = A4_HEIGHT - MARGIN;

  // Red header bar
  page.drawRectangle({
    x: 0,
    y: A4_HEIGHT - 60,
    width: A4_WIDTH,
    height: 60,
    color: TORKE_RED,
  });

  drawText(page, "TORKE", 50, A4_HEIGHT - 42, boldFont, 28, WHITE);
  drawText(page, title, A4_WIDTH - 200, A4_HEIGHT - 42, boldFont, 16, WHITE);

  y = A4_HEIGHT - 80;

  // Company details
  drawText(page, TORKE_DETAILS.name, MARGIN, y, boldFont, 9);
  y -= 12;
  drawText(page, TORKE_DETAILS.address, MARGIN, y, regularFont, 8, DARK_GREY);
  y -= 12;
  drawText(page, `VAT: ${TORKE_DETAILS.vatNumber}`, MARGIN, y, regularFont, 8, DARK_GREY);
  y -= 12;
  drawText(page, `${TORKE_DETAILS.email} | ${TORKE_DETAILS.phone}`, MARGIN, y, regularFont, 8, DARK_GREY);
  y -= 15;

  drawHorizontalLine(page, y, MARGIN, A4_WIDTH - MARGIN);
  y -= 10;

  return y;
}

// --------------------------------------------------------------------------
// Shared PDF Layout: Invoice Details
// --------------------------------------------------------------------------

function drawInvoiceDetails(
  page: PDFPage,
  y: number,
  data: {
    invoiceNumber?: string;
    invoiceDate: string;
    dueDate?: string;
    orderRef: string;
    poNumber?: string | null;
  },
  boldFont: PDFFont,
  regularFont: PDFFont
): number {
  const leftCol = MARGIN;
  const valueCol = MARGIN + 100;
  const lineHeight = 14;

  if (data.invoiceNumber) {
    drawText(page, "Invoice No:", leftCol, y, boldFont, 9);
    drawText(page, data.invoiceNumber, valueCol, y, regularFont, 9);
    y -= lineHeight;
  }

  drawText(page, "Date:", leftCol, y, boldFont, 9);
  drawText(page, data.invoiceDate, valueCol, y, regularFont, 9);
  y -= lineHeight;

  if (data.dueDate) {
    drawText(page, "Due Date:", leftCol, y, boldFont, 9);
    drawText(page, data.dueDate, valueCol, y, regularFont, 9);
    y -= lineHeight;
  }

  drawText(page, "Order Ref:", leftCol, y, boldFont, 9);
  drawText(page, data.orderRef, valueCol, y, regularFont, 9);
  y -= lineHeight;

  if (data.poNumber) {
    drawText(page, "PO Number:", leftCol, y, boldFont, 9);
    drawText(page, data.poNumber, valueCol, y, regularFont, 9);
    y -= lineHeight;
  }

  return y;
}

// --------------------------------------------------------------------------
// Shared PDF Layout: Address blocks
// --------------------------------------------------------------------------

function drawAddressBlocks(
  page: PDFPage,
  y: number,
  address: InvoiceOrderData["address"],
  boldFont: PDFFont,
  regularFont: PDFFont
): number {
  if (!address) return y;

  const rightCol = A4_WIDTH / 2 + 20;
  const lineHeight = 12;

  drawText(page, "Deliver To:", rightCol, y + 14, boldFont, 9);
  drawText(page, address.name, rightCol, y, regularFont, 9);
  y -= lineHeight;
  drawText(page, address.addressLine1, rightCol, y, regularFont, 9);
  y -= lineHeight;
  if (address.addressLine2) {
    drawText(page, address.addressLine2, rightCol, y, regularFont, 9);
    y -= lineHeight;
  }
  drawText(page, `${address.city}, ${address.postcode}`, rightCol, y, regularFont, 9);
  y -= lineHeight;
  if (address.siteContactName) {
    drawText(page, `Site Contact: ${address.siteContactName}`, rightCol, y, regularFont, 8, DARK_GREY);
    if (address.siteContactPhone) {
      y -= lineHeight;
      drawText(page, `Tel: ${address.siteContactPhone}`, rightCol, y, regularFont, 8, DARK_GREY);
    }
    y -= lineHeight;
  }

  return y;
}

// --------------------------------------------------------------------------
// Shared PDF Layout: Line items table
// --------------------------------------------------------------------------

function drawLineItemsTable(
  page: PDFPage,
  y: number,
  lineItems: InvoiceLineItem[],
  boldFont: PDFFont,
  regularFont: PDFFont
): number {
  const tableX = MARGIN;

  // Column definitions
  const colDefs = [
    { header: "#", x: tableX, width: 18 },
    { header: "Product", x: tableX + 20, width: 120 },
    { header: "SKU", x: tableX + 142, width: 65 },
    { header: "Qty", x: tableX + 209, width: 30 },
    { header: "Unit Price", x: tableX + 241, width: 55 },
    { header: "Torke Batch ID", x: tableX + 298, width: 95 },
    { header: "Line Total", x: tableX + 395, width: 60 },
  ];

  // Header row background
  page.drawRectangle({
    x: tableX - 2,
    y: y - 4,
    width: A4_WIDTH - 2 * MARGIN + 4,
    height: 16,
    color: LIGHT_GREY,
  });

  // Header text
  for (const col of colDefs) {
    drawText(page, col.header, col.x, y, boldFont, 7);
  }
  y -= 16;
  drawHorizontalLine(page, y, tableX - 2, A4_WIDTH - MARGIN + 2);
  y -= 2;

  // Data rows
  const rowHeight = 14;
  for (const item of lineItems) {
    y -= rowHeight;

    const batchStr = item.torkeBatchIds.length > 0
      ? item.torkeBatchIds.join(", ")
      : "Pending";

    // Truncate long text
    const truncate = (text: string, maxWidth: number) => {
      const maxChars = Math.floor(maxWidth / 3.5);
      return text.length > maxChars ? text.substring(0, maxChars - 2) + ".." : text;
    };

    drawText(page, String(item.lineNumber), colDefs[0]!.x, y, regularFont, 7);
    drawText(page, truncate(item.productName, colDefs[1]!.width), colDefs[1]!.x, y, regularFont, 7);
    drawText(page, truncate(item.sku, colDefs[2]!.width), colDefs[2]!.x, y, regularFont, 7);
    drawText(page, String(item.quantity), colDefs[3]!.x, y, regularFont, 7);
    drawText(page, formatPence(item.unitPricePence), colDefs[4]!.x, y, regularFont, 7);
    drawText(page, truncate(batchStr, colDefs[5]!.width), colDefs[5]!.x, y, regularFont, 7);
    drawText(page, formatPence(item.lineTotalPence), colDefs[6]!.x, y, regularFont, 7);

    drawHorizontalLine(page, y - 3, tableX - 2, A4_WIDTH - MARGIN + 2);
  }

  return y;
}

// --------------------------------------------------------------------------
// Shared PDF Layout: Totals
// --------------------------------------------------------------------------

function drawTotals(
  page: PDFPage,
  y: number,
  subtotalPence: number,
  vatPence: number,
  totalPence: number,
  boldFont: PDFFont,
  regularFont: PDFFont
): number {
  const rightX = A4_WIDTH - MARGIN - 120;
  const valueX = A4_WIDTH - MARGIN - 5;
  const lineHeight = 16;

  y -= 15;
  drawText(page, "Subtotal:", rightX, y, regularFont, 9);
  drawText(page, formatPence(subtotalPence), valueX - 50, y, regularFont, 9);
  y -= lineHeight;

  drawText(page, "VAT (20%):", rightX, y, regularFont, 9);
  drawText(page, formatPence(vatPence), valueX - 50, y, regularFont, 9);
  y -= lineHeight;

  drawHorizontalLine(page, y + 12, rightX - 5, A4_WIDTH - MARGIN + 2);

  drawText(page, "Total:", rightX, y, boldFont, 11);
  drawText(page, formatPence(totalPence), valueX - 50, y, boldFont, 11);
  y -= lineHeight;

  return y;
}

// --------------------------------------------------------------------------
// Shared PDF Layout: Footer
// --------------------------------------------------------------------------

function drawFooter(
  page: PDFPage,
  boldFont: PDFFont,
  regularFont: PDFFont
) {
  const y = MARGIN + 15;
  drawHorizontalLine(page, y + 5, MARGIN, A4_WIDTH - MARGIN);
  drawText(page, TORKE_DETAILS.registration, MARGIN, y - 8, regularFont, 7, DARK_GREY);
  drawText(page, "Thank you for your business", A4_WIDTH - 180, y - 8, regularFont, 7, DARK_GREY);
}

// --------------------------------------------------------------------------
// Generate Invoice
// --------------------------------------------------------------------------

export async function generateInvoice(
  db: Database,
  orderId: string
): Promise<Buffer> {
  const data = await queryInvoiceData(db, orderId);

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber(db);

  // Calculate due date based on payment method
  const now = new Date();
  let dueDate = new Date(now);
  let paymentNote = "";

  switch (data.order.paymentMethod) {
    case "card":
      paymentNote = "Paid by card";
      break;
    case "bacs":
      paymentNote = "Paid by bank transfer";
      break;
    case "credit":
      dueDate.setDate(dueDate.getDate() + 30); // Default net-30
      paymentNote = `Payment terms: Net 30 days. Due: ${dueDate.toLocaleDateString("en-GB")}`;
      break;
    default:
      paymentNote = "Payment terms: On receipt";
  }

  // Create invoice record in DB
  const [invoice] = await db
    .insert(invoices)
    .values({
      orderId,
      invoiceNumber,
      invoiceDate: now,
      dueDate,
      subtotalPence: data.order.subtotalPence,
      vatPence: data.order.vatPence,
      totalPence: data.order.totalPence,
      vatRate: 2000, // 20.00%
    })
    .returning();

  // Build PDF
  const doc = await PDFDocument.create();
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);

  const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);

  let y = drawInvoiceHeader(page, "INVOICE", boldFont, regularFont);

  // Invoice details (left column)
  y = drawInvoiceDetails(page, y, {
    invoiceNumber,
    invoiceDate: now.toLocaleDateString("en-GB"),
    dueDate: dueDate.toLocaleDateString("en-GB"),
    orderRef: data.order.orderNumber,
    poNumber: data.order.poNumber,
  }, boldFont, regularFont);

  // Delivery address (right column, drawn at same y level)
  drawAddressBlocks(page, y + 56, data.address, boldFont, regularFont);

  y -= 15;
  drawHorizontalLine(page, y, MARGIN, A4_WIDTH - MARGIN);
  y -= 15;

  // Line items table with Torke Batch ID column
  y = drawLineItemsTable(page, y, data.lineItems, boldFont, regularFont);

  // Totals
  y = drawTotals(
    page, y,
    data.order.subtotalPence,
    data.order.vatPence,
    data.order.totalPence,
    boldFont, regularFont
  );

  // Payment details
  y -= 10;
  drawText(page, "Payment:", MARGIN, y, boldFont, 9);
  drawText(page, paymentNote, MARGIN + 60, y, regularFont, 9, DARK_GREY);

  // Footer
  drawFooter(page, boldFont, regularFont);

  // Save and upload
  const pdfBytes = await doc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  const pdfKey = `invoices/${invoice!.id}.pdf`;
  await uploadFile(pdfBuffer, pdfKey, "application/pdf");

  // Update invoice with PDF key
  await db
    .update(invoices)
    .set({ pdfKey })
    .where(eq(invoices.id, invoice!.id));

  return pdfBuffer;
}

// --------------------------------------------------------------------------
// Generate Proforma Invoice (BACS)
// --------------------------------------------------------------------------

export async function generateProforma(
  db: Database,
  orderId: string
): Promise<Buffer> {
  const data = await queryInvoiceData(db, orderId);

  // Build PDF
  const doc = await PDFDocument.create();
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);

  const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);

  let y = drawInvoiceHeader(page, "PROFORMA INVOICE", boldFont, regularFont);

  // Proforma details (no invoice number - proforma is not a tax document)
  y = drawInvoiceDetails(page, y, {
    invoiceDate: new Date().toLocaleDateString("en-GB"),
    orderRef: data.order.orderNumber,
    poNumber: data.order.poNumber,
  }, boldFont, regularFont);

  // Delivery address
  drawAddressBlocks(page, y + 42, data.address, boldFont, regularFont);

  y -= 15;
  drawHorizontalLine(page, y, MARGIN, A4_WIDTH - MARGIN);
  y -= 15;

  // Line items
  y = drawLineItemsTable(page, y, data.lineItems, boldFont, regularFont);

  // Totals
  y = drawTotals(
    page, y,
    data.order.subtotalPence,
    data.order.vatPence,
    data.order.totalPence,
    boldFont, regularFont
  );

  // Bank details section (prominent)
  y -= 15;
  page.drawRectangle({
    x: MARGIN - 5,
    y: y - 85,
    width: A4_WIDTH - 2 * MARGIN + 10,
    height: 100,
    color: rgb(0.95, 0.95, 0.95),
    borderColor: TORKE_RED,
    borderWidth: 1,
  });

  drawText(page, "Payment Details", MARGIN + 5, y - 2, boldFont, 11, TORKE_RED);
  y -= 18;

  const bankLeft = MARGIN + 10;
  const bankValueLeft = MARGIN + 130;
  const bankLineHeight = 14;

  drawText(page, "Bank Name:", bankLeft, y, boldFont, 9);
  drawText(page, BANK_DETAILS.bankName, bankValueLeft, y, regularFont, 9);
  y -= bankLineHeight;

  drawText(page, "Sort Code:", bankLeft, y, boldFont, 9);
  drawText(page, BANK_DETAILS.sortCode, bankValueLeft, y, regularFont, 9);
  y -= bankLineHeight;

  drawText(page, "Account Number:", bankLeft, y, boldFont, 9);
  drawText(page, BANK_DETAILS.accountNumber, bankValueLeft, y, regularFont, 9);
  y -= bankLineHeight;

  drawText(page, "Payment Reference:", bankLeft, y, boldFont, 9);
  drawText(page, data.order.orderNumber, bankValueLeft, y, boldFont, 9, TORKE_RED);
  y -= bankLineHeight;

  drawText(page, "Amount Due:", bankLeft, y, boldFont, 9);
  drawText(page, formatPence(data.order.totalPence), bankValueLeft, y, boldFont, 10, TORKE_RED);
  y -= bankLineHeight + 5;

  // Payment note
  y -= 10;
  drawText(
    page,
    "Please use the order number as your payment reference.",
    MARGIN,
    y,
    regularFont,
    8,
    DARK_GREY
  );
  y -= 12;
  drawText(
    page,
    "Your order will be processed once payment is received and confirmed.",
    MARGIN,
    y,
    regularFont,
    8,
    DARK_GREY
  );

  // Footer
  drawFooter(page, boldFont, regularFont);

  // Save and upload
  const pdfBytes = await doc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  const proformaKey = `proformas/${orderId}.pdf`;
  await uploadFile(pdfBuffer, proformaKey, "application/pdf");

  return pdfBuffer;
}
