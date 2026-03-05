"use client";

import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCartStore } from "@/stores/cart";
import { toast } from "sonner";

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

const PAYMENT_LABELS: Record<string, string> = {
  card: "Card",
  credit: "Credit",
  bacs: "BACS",
};

export function OrderHistory() {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const { data: orders, isLoading } = trpc.orders.myOrders.useQuery({
    limit: pageSize,
    offset: page * pageSize,
  });

  const reorderQuery = trpc.orders.reorder.useQuery(
    { orderId: "" },
    { enabled: false }
  );

  async function handleReorder(orderId: string) {
    try {
      const result = await reorderQuery.refetch();
      // Use a direct fetch approach since we can't dynamically change input
      // This is handled in OrderDetail instead for full functionality
      router.push(`/account/orders/${orderId}`);
    } catch {
      toast.error("Failed to load order items");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-zinc-800" />
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
        <p className="text-zinc-400">No orders found.</p>
        <a
          href="/products"
          className="mt-4 inline-block text-sm font-medium text-[#C41E3A] hover:underline"
        >
          Browse products
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          onClick={() => router.push(`/account/orders/${order.id}`)}
          className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-zinc-100">
                  {order.orderNumber}
                </h3>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-zinc-600 text-zinc-100"}`}
                >
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                {new Date(order.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {order.paymentMethod && (
                  <span className="ml-2">
                    {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                  </span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-zinc-100">
                {formatPence(order.totalPence)}
              </p>
              <p className="text-xs text-zinc-500">
                {order.lineCount} item{order.lineCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Line preview */}
          {order.linePreview.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {order.linePreview.map((line, i) => (
                <span
                  key={i}
                  className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
                >
                  {line.productName} x{line.quantity}
                </span>
              ))}
              {order.lineCount > 3 && (
                <span className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-500">
                  +{order.lineCount - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPage((p) => Math.max(0, p - 1));
          }}
          disabled={page === 0}
          className="rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-xs text-zinc-500">Page {page + 1}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (orders.length === pageSize) {
              setPage((p) => p + 1);
            }
          }}
          disabled={orders.length < pageSize}
          className="rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
