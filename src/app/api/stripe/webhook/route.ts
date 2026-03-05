import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/server/db";
import { orders } from "@/server/db/schema/orders";
import { transitionOrder, allocateOrderStock } from "@/server/services/order-service";
import { eq } from "drizzle-orm";

// --------------------------------------------------------------------------
// Stripe Webhook Handler
// --------------------------------------------------------------------------

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
    apiVersion: "2025-01-27.acacia" as Stripe.LatestApiVersion,
  });
}

export async function POST(req: NextRequest) {
  // CRITICAL: Use req.text() for raw body (not req.json())
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Handle checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      console.error("No orderId in Stripe session metadata");
      return NextResponse.json({ received: true });
    }

    try {
      await db.transaction(async (tx) => {
        // Check current order status (idempotency)
        const [order] = await tx
          .select({ id: orders.id, status: orders.status })
          .from(orders)
          .where(eq(orders.id, orderId));

        if (!order) {
          console.error(`Order ${orderId} not found for Stripe webhook`);
          return;
        }

        // Idempotency: skip if already confirmed or beyond
        if (order.status !== "awaiting_payment") {
          console.log(
            `Order ${orderId} already at status ${order.status}, skipping webhook`
          );
          return;
        }

        // Store Stripe payment intent ID
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

        if (paymentIntentId) {
          await tx
            .update(orders)
            .set({
              stripePaymentIntentId: paymentIntentId,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));
        }

        // Transition: awaiting_payment -> confirmed
        await transitionOrder(tx, orderId, "confirmed");

        // Allocate stock (FIFO)
        await allocateOrderStock(tx, orderId);
      });
    } catch (err) {
      console.error(`Error processing Stripe webhook for order ${orderId}:`, err);
      // Return 200 anyway to prevent Stripe retries on business logic errors
      // The order can be manually reconciled
    }
  }

  return NextResponse.json({ received: true });
}
