import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { orders } from "@/server/db/schema/orders";
import { invoices } from "@/server/db/schema/invoices";
import { downloadFile } from "@/server/storage";
import { generateInvoice, generateProforma } from "@/server/services/invoice-service";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    // TODO: Add auth check - verify user owns order
    const [order] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        invoiceId: orders.invoiceId,
        userId: orders.userId,
      })
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    let pdfBuffer: Buffer;
    let filename: string;

    if (type === "proforma") {
      // Proforma invoice
      pdfBuffer = await generateProforma(db, orderId);
      filename = `Proforma-${order.orderNumber}.pdf`;
    } else {
      // Regular invoice
      if (order.invoiceId) {
        // Try to fetch existing invoice PDF
        const [invoice] = await db
          .select({ pdfKey: invoices.pdfKey, invoiceNumber: invoices.invoiceNumber })
          .from(invoices)
          .where(eq(invoices.id, order.invoiceId));

        if (invoice?.pdfKey) {
          try {
            pdfBuffer = await downloadFile(invoice.pdfKey);
            filename = `Invoice-${invoice.invoiceNumber}.pdf`;
          } catch {
            // Regenerate if R2 fetch fails
            pdfBuffer = await generateInvoice(db, orderId);
            filename = `Invoice-${order.orderNumber}.pdf`;
          }
        } else {
          pdfBuffer = await generateInvoice(db, orderId);
          filename = `Invoice-${order.orderNumber}.pdf`;
        }
      } else {
        // Generate on demand
        pdfBuffer = await generateInvoice(db, orderId);
        filename = `Invoice-${order.orderNumber}.pdf`;
      }
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("[Invoice API] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
