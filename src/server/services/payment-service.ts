import Stripe from "stripe";
import { creditAccounts } from "@/server/db/schema/credit-accounts";
import { orders } from "@/server/db/schema/orders";
import { transitionOrder } from "@/server/services/order-service";
import { eq, and, sql } from "drizzle-orm";
import type { Database } from "@/server/db";

// --------------------------------------------------------------------------
// Stripe Client
// --------------------------------------------------------------------------

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    _stripe = new Stripe(key, { apiVersion: "2025-01-27.acacia" as Stripe.LatestApiVersion });
  }
  return _stripe;
}

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

export interface StripeLineItem {
  name: string;
  quantity: number;
  unitAmountPence: number;
}

export interface ProcessPaymentResult {
  /** Stripe checkout URL (only for card payments) */
  sessionUrl?: string;
  /** Order status after payment processing */
  status: string;
}

// --------------------------------------------------------------------------
// Create Stripe Checkout Session
// --------------------------------------------------------------------------

/**
 * Create a Stripe Checkout Session for card payment.
 *
 * Uses Stripe-hosted checkout page with SCA compliance.
 * Returns the session URL for client redirect.
 */
export async function createStripeCheckoutSession(
  orderId: string,
  orderRef: string,
  lineItems: StripeLineItem[],
  customerEmail?: string
): Promise<string> {
  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    currency: "gbp",
    customer_email: customerEmail,
    line_items: lineItems.map((item) => ({
      price_data: {
        currency: "gbp",
        product_data: {
          name: item.name,
        },
        unit_amount: item.unitAmountPence,
      },
      quantity: item.quantity,
    })),
    // Add VAT as separate line item
    // (VAT is calculated server-side, included in order total)
    metadata: {
      orderId,
      orderRef,
    },
    success_url: `${appUrl}/checkout/success?order=${orderRef}`,
    cancel_url: `${appUrl}/basket`,
  });

  if (!session.url) {
    throw new Error("Failed to create Stripe checkout session");
  }

  return session.url;
}

// --------------------------------------------------------------------------
// Validate Credit Account
// --------------------------------------------------------------------------

/**
 * Check if user has an approved credit account with sufficient available credit.
 */
export async function validateCreditAccount(
  tx: Tx,
  userId: string,
  totalPence: number
): Promise<{
  valid: boolean;
  account: typeof creditAccounts.$inferSelect;
  availableCredit: number;
}> {
  const [account] = await tx
    .select()
    .from(creditAccounts)
    .where(
      and(
        eq(creditAccounts.userId, userId),
        eq(creditAccounts.status, "approved")
      )
    );

  if (!account) {
    throw new Error("No approved credit account found");
  }

  const availableCredit =
    account.creditLimitPence - account.creditUsedPence;

  return {
    valid: availableCredit >= totalPence,
    account,
    availableCredit,
  };
}

// --------------------------------------------------------------------------
// Process Payment (Strategy Pattern)
// --------------------------------------------------------------------------

/**
 * Process payment based on method:
 * - Card: Create Stripe Checkout Session, transition to awaiting_payment
 * - Credit: Validate credit, deduct from available, transition to confirmed
 * - BACS: Transition to awaiting_payment (admin confirms later)
 */
export async function processPayment(
  tx: Tx,
  orderId: string,
  method: "card" | "credit" | "bacs",
  userId: string,
  orderRef: string,
  lineItems?: StripeLineItem[],
  customerEmail?: string
): Promise<ProcessPaymentResult> {
  switch (method) {
    case "card": {
      // Create Stripe session
      const sessionUrl = await createStripeCheckoutSession(
        orderId,
        orderRef,
        lineItems ?? [],
        customerEmail
      );

      // Store Stripe session reference on the order
      // Transition: draft -> awaiting_payment
      await transitionOrder(tx, orderId, "awaiting_payment");

      return { sessionUrl, status: "awaiting_payment" };
    }

    case "credit": {
      // Get order total for credit validation
      const [order] = await tx
        .select({ totalPence: orders.totalPence, creditAccountId: orders.creditAccountId })
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!order) throw new Error(`Order ${orderId} not found`);

      const { valid, account } = await validateCreditAccount(
        tx,
        userId,
        order.totalPence
      );

      if (!valid) {
        throw new Error("Insufficient credit available");
      }

      // Deduct from credit account
      await tx
        .update(creditAccounts)
        .set({
          creditUsedPence: sql`${creditAccounts.creditUsedPence} + ${order.totalPence}`,
          updatedAt: new Date(),
        })
        .where(eq(creditAccounts.id, account.id));

      // Transition: draft -> awaiting_payment -> confirmed
      await transitionOrder(tx, orderId, "awaiting_payment");
      await transitionOrder(tx, orderId, "confirmed");

      return { status: "confirmed" };
    }

    case "bacs": {
      // Transition: draft -> awaiting_payment
      await transitionOrder(tx, orderId, "awaiting_payment");

      return { status: "awaiting_payment" };
    }
  }
}
