"use client";

import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart";
import { toast } from "sonner";
import Link from "next/link";

function formatPence(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-600 text-zinc-100",
  awaiting_payment: "bg-amber-600 text-amber-50",
  confirmed: "bg-green-600 text-green-50",
  allocated: "bg-blue-600 text-blue-50",
  picking: "bg-blue-500 text-blue-50",
  packed: "bg-blue-700 text-blue-50",
  dispatched: "bg-purple-600 text-purple-50",
  delivered: "bg-purple-700 text-purple-50",
  completed: "bg-green-700 text-green-50",
  cancelled: "bg-red-600 text-red-50",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  awaiting_payment: "Awaiting Payment",
  confirmed: "Confirmed",
  allocated: "Allocated",
  picking: "Picking",
  packed: "Packed",
  dispatched: "Dispatched",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function OrderDetail({ orderId }: { orderId: string }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const { data: order, isLoading } = trpc.orders.myOrderDetail.useQuery({
    orderId,
  });

  const { data: reorderItems } = trpc.orders.reorder.useQuery(
    { orderId },
    { enabled: false }
  );

  const reorderQuery = trpc.orders.reorder;

  async function handleReorder() {
    try {
      // Fetch reorder items
      const utils = trpc.useUtils();
      const items = await utils.orders.reorder.fetch({ orderId });

      // Add all items to cart
      for (const item of items) {
        addItem({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          unitPricePence: item.unitPricePence,
          quantity: item.quantity,
        });
      }

      toast.success("Items added to basket");
      router.push("/basket");
    } catch {
      toast.error("Failed to add items to basket");
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 rounded bg-zinc-800" />
        <div className="h-48 rounded-lg bg-zinc-800" />
        <div className="h-64 rounded-lg bg-zinc-800" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center text-zinc-400">Order not found.</div>
    );
  }

  const isDispatched = [
    "dispatched",
    "delivered",
    "completed",
  ].includes(order.status);
  const isBacs = order.paymentMethod === "bacs";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/account/orders"
        className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-200"
      >
        &larr; Back to orders
      </Link>

      {/* Order header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-100">
              {order.orderNumber}
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-zinc-600 text-zinc-100"}`}
            >
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Placed{" "}
            {new Date(order.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          {order.poNumber && (
            <p className="text-sm text-zinc-400">
              PO: {order.poNumber}
            </p>
          )}
        </div>
        <button
          onClick={handleReorder}
          className="rounded-md bg-[#C41E3A] px-4 py-2 text-sm font-medium text-white hover:bg-[#a3182f] transition-colors"
        >
          Reorder
        </button>
      </div>

      {/* Tracking info */}
      {isDispatched && (order.trackingNumber || order.consignmentNumber) && (
        <div className="rounded-lg border border-blue-800/40 bg-blue-900/20 p-4">
          <h3 className="text-sm font-semibold text-blue-300">
            Tracking Information
          </h3>
          <div className="mt-2 space-y-1 text-sm">
            <p className="text-zinc-300">
              Dispatch:{" "}
              {order.dispatchType === "pallet"
                ? "Pallet Delivery"
                : "Parcel Delivery"}
            </p>
            {order.trackingNumber && (
              <p className="text-zinc-300">
                Tracking: <span className="font-mono font-bold text-blue-300">{order.trackingNumber}</span>
              </p>
            )}
            {order.consignmentNumber && (
              <p className="text-zinc-300">
                Consignment: <span className="font-mono font-bold text-blue-300">{order.consignmentNumber}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Delivery address */}
      {order.deliveryAddress && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-2 text-sm font-semibold text-zinc-300">
            Delivery Address
          </h3>
          <div className="space-y-0.5 text-sm text-zinc-400">
            <p>{order.deliveryAddress.name}</p>
            <p>{order.deliveryAddress.addressLine1}</p>
            {order.deliveryAddress.addressLine2 && (
              <p>{order.deliveryAddress.addressLine2}</p>
            )}
            <p>
              {order.deliveryAddress.city}, {order.deliveryAddress.postcode}
            </p>
            {order.deliveryAddress.siteContactName && (
              <p className="mt-1 text-xs text-zinc-500">
                Site Contact: {order.deliveryAddress.siteContactName}
                {order.deliveryAddress.siteContactPhone &&
                  ` (${order.deliveryAddress.siteContactPhone})`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Line items table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-400">
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2 text-center">Qty</th>
              <th className="px-3 py-2 text-right">Unit Price</th>
              <th className="px-3 py-2 text-right">Line Total</th>
              <th className="px-3 py-2">Torke Batch ID(s)</th>
            </tr>
          </thead>
          <tbody>
            {order.orderLines.map((line) => (
              <tr
                key={line.id}
                className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
              >
                <td className="px-3 py-3 font-medium text-zinc-200">
                  {line.product.name}
                </td>
                <td className="px-3 py-3 font-mono text-xs text-zinc-400">
                  {line.product.sku}
                </td>
                <td className="px-3 py-3 text-center text-zinc-300">
                  {line.quantity}
                </td>
                <td className="px-3 py-3 text-right text-zinc-300">
                  {formatPence(line.unitPricePence)}
                </td>
                <td className="px-3 py-3 text-right font-medium text-zinc-200">
                  {formatPence(line.lineTotalPence)}
                </td>
                <td className="px-3 py-3">
                  {line.allocations.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {line.allocations.map((alloc, i) => (
                        <span
                          key={i}
                          className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-300"
                        >
                          {alloc.torkeBatchId}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-500">Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64 space-y-2 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex justify-between text-sm text-zinc-400">
            <span>Subtotal</span>
            <span>{formatPence(order.subtotalPence)}</span>
          </div>
          <div className="flex justify-between text-sm text-zinc-400">
            <span>VAT (20%)</span>
            <span>{formatPence(order.vatPence)}</span>
          </div>
          <div className="flex justify-between border-t border-zinc-800 pt-2 text-base font-bold text-zinc-100">
            <span>Total</span>
            <span>{formatPence(order.totalPence)}</span>
          </div>
        </div>
      </div>

      {/* Download buttons */}
      <div className="flex flex-wrap gap-3">
        {order.hasInvoice && (
          <a
            href={`/api/invoice/${order.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            Download Invoice
          </a>
        )}
        {isBacs && (
          <a
            href={`/api/invoice/${order.id}?type=proforma`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            Download Proforma
          </a>
        )}
        {order.certPackKey && isDispatched && (
          <a
            href={`/api/certpack/${order.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md bg-[#C41E3A] px-4 py-2 text-sm font-medium text-white hover:bg-[#a3182f] transition-colors"
          >
            Download Cert Pack
          </a>
        )}
      </div>
    </div>
  );
}
