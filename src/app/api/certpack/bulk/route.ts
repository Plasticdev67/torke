import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { orders } from "@/server/db/schema/orders";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { generateBulkCertZip } from "@/server/services/zip-service";
import { generateCertPack } from "@/server/services/certpack-service";
import { eq, and, sql } from "drizzle-orm";

const MAX_ORDERS = 20;

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const orderIds: string[] = body?.orderIds;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: "orderIds array is required" },
        { status: 400 }
      );
    }

    if (orderIds.length > MAX_ORDERS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_ORDERS} orders allowed per bulk download` },
        { status: 400 }
      );
    }

    // Verify user owns all orders
    const userOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        certPackKey: orders.certPackKey,
      })
      .from(orders)
      .where(
        and(
          eq(orders.userId, session.user.id),
          sql`${orders.id} IN (${sql.join(
            orderIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        )
      );

    if (userOrders.length !== orderIds.length) {
      return NextResponse.json(
        { error: "One or more orders not found or not owned by you" },
        { status: 403 }
      );
    }

    // Ensure all orders have cert packs generated
    const certKeys: Array<{ key: string; filename: string }> = [];

    for (const order of userOrders) {
      let certPackKey = order.certPackKey;

      if (!certPackKey) {
        // Generate on demand
        try {
          await generateCertPack(db, order.id);
          // Re-fetch to get the key
          const [updated] = await db
            .select({ certPackKey: orders.certPackKey })
            .from(orders)
            .where(eq(orders.id, order.id));
          certPackKey = updated?.certPackKey ?? null;
        } catch (err) {
          console.error(
            `[BulkCertPack] Failed to generate cert pack for order ${order.id}:`,
            err
          );
          continue;
        }
      }

      if (certPackKey) {
        certKeys.push({
          key: certPackKey,
          filename: `CertPack-${order.orderNumber}.pdf`,
        });
      }
    }

    if (certKeys.length === 0) {
      return NextResponse.json(
        { error: "No cert packs available for the selected orders" },
        { status: 404 }
      );
    }

    const zipBuffer = await generateBulkCertZip(certKeys);

    const dateStr = new Date().toISOString().slice(0, 10);

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="Torke-CertPacks-${dateStr}.zip"`,
        "Content-Length": String(zipBuffer.length),
      },
    });
  } catch (error) {
    console.error("[BulkCertPack API] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate bulk cert pack" },
      { status: 500 }
    );
  }
}
