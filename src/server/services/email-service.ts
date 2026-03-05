import { Resend } from "resend";
import { eq, sql } from "drizzle-orm";
import { orders, orderLines } from "@/server/db/schema/orders";
import { products } from "@/server/db/schema/products";
import { orderLineAllocations } from "@/server/db/schema/allocations";
import { batches } from "@/server/db/schema/batches";
import { deliveryAddresses } from "@/server/db/schema/addresses";
import { downloadFile, getCertUrl } from "@/server/storage";
import { db } from "@/server/db";
import { OrderConfirmationEmail } from "@/emails/order-confirmation";
import { DispatchNotificationEmail } from "@/emails/dispatch-notification";

// --------------------------------------------------------------------------
// Resend Client
// --------------------------------------------------------------------------

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Torke <orders@torke.co.uk>";

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function formatPence(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`;
}

/** 10 MB threshold for cert pack attachment */
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

// --------------------------------------------------------------------------
// Query helpers
// --------------------------------------------------------------------------

interface OrderEmailData {
  order: {
    id: string;
    orderNumber: string;
    createdAt: Date;
    paymentMethod: string | null;
    poNumber: string | null;
    subtotalPence: number;
    vatPence: number;
    totalPence: number;
    certPackKey: string | null;
    trackingNumber: string | null;
    consignmentNumber: string | null;
    dispatchType: string | null;
    userId: string;
  };
  customerName: string;
  customerEmail: string;
  address: {
    name: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    postcode: string;
    siteContactName: string | null;
  } | null;
  lines: Array<{
    productName: string;
    quantity: number;
    batchIds: string[];
  }>;
}

async function queryOrderEmailData(orderId: string): Promise<OrderEmailData> {
  // Fetch order
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Fetch customer email from Better Auth user table
  const userRows = await db.execute(
    sql`SELECT name, email FROM "user" WHERE id = ${order.userId} LIMIT 1`
  );
  const user = ((userRows as any).rows?.[0] ?? (userRows as any)[0]) as
    | { name: string; email: string }
    | undefined;

  if (!user?.email) {
    throw new Error(`User ${order.userId} not found or has no email`);
  }

  // Fetch delivery address
  let address: OrderEmailData["address"] = null;
  if (order.deliveryAddressId) {
    const [addr] = await db
      .select()
      .from(deliveryAddresses)
      .where(eq(deliveryAddresses.id, order.deliveryAddressId));
    if (addr) {
      address = {
        name: addr.name,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        city: addr.city,
        postcode: addr.postcode,
        siteContactName: addr.siteContactName,
      };
    }
  }

  // Fetch order lines with product and batch info
  const lineRows = await db
    .select({
      lineId: orderLines.id,
      quantity: orderLines.quantity,
      productName: products.name,
      torkeBatchId: batches.torkeBatchId,
    })
    .from(orderLines)
    .innerJoin(products, eq(orderLines.productId, products.id))
    .leftJoin(
      orderLineAllocations,
      eq(orderLineAllocations.orderLineId, orderLines.id)
    )
    .leftJoin(batches, eq(orderLineAllocations.batchId, batches.id))
    .where(eq(orderLines.orderId, orderId));

  // Group by line, collecting batch IDs
  const lineMap = new Map<
    string,
    { productName: string; quantity: number; batchIds: string[] }
  >();

  for (const row of lineRows) {
    if (!lineMap.has(row.lineId)) {
      lineMap.set(row.lineId, {
        productName: row.productName,
        quantity: row.quantity,
        batchIds: [],
      });
    }
    const item = lineMap.get(row.lineId)!;
    if (row.torkeBatchId && !item.batchIds.includes(row.torkeBatchId)) {
      item.batchIds.push(row.torkeBatchId);
    }
  }

  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      paymentMethod: order.paymentMethod,
      poNumber: order.poNumber,
      subtotalPence: order.subtotalPence,
      vatPence: order.vatPence,
      totalPence: order.totalPence,
      certPackKey: order.certPackKey,
      trackingNumber: order.trackingNumber,
      consignmentNumber: order.consignmentNumber,
      dispatchType: order.dispatchType,
      userId: order.userId,
    },
    customerName: user.name || "Customer",
    customerEmail: user.email,
    address,
    lines: [...lineMap.values()],
  };
}

// --------------------------------------------------------------------------
// Send Order Confirmation
// --------------------------------------------------------------------------

export async function sendOrderConfirmation(orderId: string): Promise<void> {
  try {
    const data = await queryOrderEmailData(orderId);

    const subject =
      data.order.paymentMethod === "bacs"
        ? `Order Received - ${data.order.orderNumber}`
        : `Order Confirmed - ${data.order.orderNumber}`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.customerEmail],
      subject,
      react: OrderConfirmationEmail({
        orderRef: data.order.orderNumber,
        customerName: data.customerName,
        orderDate: data.order.createdAt.toLocaleDateString("en-GB"),
        lines: data.lines.map((l) => ({
          product: l.productName,
          qty: l.quantity,
          batchIds: l.batchIds,
        })),
        paymentMethod: (data.order.paymentMethod as "card" | "credit" | "bacs") ?? "card",
        subtotalFormatted: formatPence(data.order.subtotalPence),
        vatFormatted: formatPence(data.order.vatPence),
        totalFormatted: formatPence(data.order.totalPence),
        poNumber: data.order.poNumber,
        deliveryAddress: data.address
          ? {
              name: data.address.name,
              line1: data.address.addressLine1,
              line2: data.address.addressLine2,
              city: data.address.city,
              postcode: data.address.postcode,
              siteContact: data.address.siteContactName,
            }
          : {
              name: "Not specified",
              line1: "",
              city: "",
              postcode: "",
            },
      }),
    });

    console.log(
      `[Email] Order confirmation sent for ${data.order.orderNumber} to ${data.customerEmail}`
    );
  } catch (error) {
    console.error(
      `[Email] Failed to send order confirmation for order ${orderId}:`,
      error
    );
  }
}

// --------------------------------------------------------------------------
// Send Dispatch Notification
// --------------------------------------------------------------------------

export async function sendDispatchNotification(orderId: string): Promise<void> {
  try {
    const data = await queryOrderEmailData(orderId);

    // Handle cert pack: attach if < 10MB, otherwise provide download URL
    let certPackAttached = false;
    let certPackUrl: string | null = null;
    let attachments: Array<{ filename: string; content: Buffer }> = [];

    if (data.order.certPackKey) {
      try {
        const certPackBuffer = await downloadFile(data.order.certPackKey);

        if (certPackBuffer.length < MAX_ATTACHMENT_BYTES) {
          // Attach directly
          certPackAttached = true;
          attachments = [
            {
              filename: `Torke-CertPack-${data.order.orderNumber}.pdf`,
              content: certPackBuffer,
            },
          ];
        } else {
          // Generate presigned URL (valid 7 days)
          certPackUrl = await getCertUrl(data.order.certPackKey);
        }
      } catch (certError) {
        console.error(
          `[Email] Failed to fetch cert pack for order ${orderId}:`,
          certError
        );
        // Continue without cert pack
      }
    }

    const subject = `Order Dispatched - ${data.order.orderNumber}`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.customerEmail],
      subject,
      react: DispatchNotificationEmail({
        orderRef: data.order.orderNumber,
        customerName: data.customerName,
        dispatchType:
          (data.order.dispatchType as "parcel" | "pallet") ?? "parcel",
        trackingNumber: data.order.trackingNumber,
        consignmentNumber: data.order.consignmentNumber,
        carrierName: null, // carrier name not stored on order currently
        certPackAttached,
        certPackUrl,
        lines: data.lines.map((l) => ({
          product: l.productName,
          qty: l.quantity,
          batchIds: l.batchIds,
        })),
      }),
      attachments:
        attachments.length > 0
          ? attachments.map((a) => ({
              filename: a.filename,
              content: a.content,
            }))
          : undefined,
    });

    console.log(
      `[Email] Dispatch notification sent for ${data.order.orderNumber} to ${data.customerEmail}${certPackAttached ? " (cert pack attached)" : certPackUrl ? " (cert pack linked)" : ""}`
    );
  } catch (error) {
    console.error(
      `[Email] Failed to send dispatch notification for order ${orderId}:`,
      error
    );
  }
}
