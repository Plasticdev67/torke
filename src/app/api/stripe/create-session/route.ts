import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { orders, orderLines } from "@/server/db/schema/orders";
import { products } from "@/server/db/schema/products";
import { createStripeCheckoutSession } from "@/server/services/payment-service";
import { eq } from "drizzle-orm";

/**
 * POST /api/stripe/create-session
 *
 * Creates a Stripe Checkout Session for a card-payment order.
 * Called by the checkout wizard after order creation.
 */
export async function POST(req: NextRequest) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { orderId, orderNumber } = body;

  if (!orderId || !orderNumber) {
    return NextResponse.json(
      { error: "orderId and orderNumber are required" },
      { status: 400 }
    );
  }

  // Verify order belongs to user
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Fetch order lines with product names
  const lines = await db
    .select({
      quantity: orderLines.quantity,
      unitPricePence: orderLines.unitPricePence,
      productName: products.name,
    })
    .from(orderLines)
    .innerJoin(products, eq(orderLines.productId, products.id))
    .where(eq(orderLines.orderId, orderId));

  try {
    const sessionUrl = await createStripeCheckoutSession(
      orderId,
      orderNumber,
      lines.map((l) => ({
        name: l.productName,
        quantity: l.quantity,
        unitAmountPence: l.unitPricePence,
      })),
      session.user.email ?? undefined
    );

    // Store Stripe session reference
    // (The webhook will handle the actual confirmation)

    return NextResponse.json({ url: sessionUrl });
  } catch (err) {
    console.error("Failed to create Stripe session:", err);
    return NextResponse.json(
      { error: "Failed to create payment session" },
      { status: 500 }
    );
  }
}
