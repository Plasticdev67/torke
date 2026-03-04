import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { orders } from "@/server/db/schema/orders";
import { downloadFile } from "@/server/storage";
import { generateCertPack } from "@/server/services/certpack-service";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // TODO: Add auth check - verify user owns order or has warehouse role
    // For now, just verify the order exists
    const [order] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        certPackKey: orders.certPackKey,
        userId: orders.userId,
      })
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    let pdfBuffer: Buffer;

    if (order.certPackKey) {
      // Stream existing cert pack from R2
      try {
        pdfBuffer = await downloadFile(order.certPackKey);
      } catch {
        // If cached cert pack is missing, regenerate
        pdfBuffer = await generateCertPack(db, orderId);
      }
    } else {
      // Generate on demand
      pdfBuffer = await generateCertPack(db, orderId);
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="CertPack-${order.orderNumber}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("[CertPack API] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate cert pack" },
      { status: 500 }
    );
  }
}
