"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  Package,
  Landmark,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";

// Torke bank details for BACS payments
const BANK_DETAILS = {
  accountName: "Torke Fixings Ltd",
  sortCode: "40-47-84",
  accountNumber: "72139468",
};

function formatPence(pence: number): string {
  return (pence / 100).toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
  });
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C41E3A] border-t-transparent" /></div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderRef = searchParams.get("order");

  // Step 1: Find order by orderNumber from list
  const { data: userOrders, isLoading: isListLoading } = trpc.orders.list.useQuery({
    limit: 50,
    offset: 0,
  });

  const matchedOrder = userOrders?.find((o) => o.orderNumber === orderRef);

  // Step 2: Fetch full detail with allocations
  const { data: orderDetail, isLoading: isDetailLoading } = trpc.orders.myOrderDetail.useQuery(
    { orderId: matchedOrder?.id ?? "" },
    { enabled: !!matchedOrder?.id }
  );

  const isLoading = isListLoading || (!!matchedOrder && isDetailLoading);
  const order = orderDetail ?? matchedOrder;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="h-12 w-12 mx-auto rounded-full bg-zinc-800 animate-pulse mb-4" />
        <div className="h-6 w-48 mx-auto bg-zinc-800 animate-pulse rounded" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-zinc-100 mb-4">
          Order Not Found
        </h1>
        <p className="text-zinc-400 mb-6">
          We couldn&apos;t find an order with reference &quot;{orderRef}&quot;.
        </p>
        <Button asChild className="bg-[#C41E3A] hover:bg-[#D6354F]">
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  const isAwaitingPayment = order.status === "awaiting_payment";
  const isBacs = order.paymentMethod === "bacs";
  const isConfirmed =
    order.status === "confirmed" || order.status === "allocated";

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Status Header */}
      <div className="text-center mb-8">
        {isConfirmed ? (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-zinc-100">
              Order Confirmed
            </h1>
            <p className="text-zinc-400 mt-2">
              Thank you for your order. We&apos;re preparing it for dispatch.
            </p>
          </>
        ) : isAwaitingPayment && isBacs ? (
          <>
            <Clock className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-zinc-100">
              Order Placed — Awaiting Payment
            </h1>
            <p className="text-zinc-400 mt-2">
              Your order will be processed once payment is received.
            </p>
          </>
        ) : (
          <>
            <Clock className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-zinc-100">Order Placed</h1>
            <p className="text-zinc-400 mt-2">
              Your order is being processed.
            </p>
          </>
        )}
      </div>

      {/* Order Summary */}
      <Card className="border-zinc-800 bg-zinc-900 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-zinc-500">Order Reference</p>
            <p className="text-lg font-bold font-mono text-zinc-100">
              {order.orderNumber}
            </p>
          </div>
          <Badge
            className={
              isConfirmed
                ? "bg-green-900/30 text-green-400"
                : "bg-amber-900/30 text-amber-400"
            }
          >
            {order.status.replace("_", " ")}
          </Badge>
        </div>

        <Separator className="my-4 bg-zinc-800" />

        {/* Line items with batch allocations (TRACE-07) */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-[#C41E3A]" />
            Order Items
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Torke Batch ID</th>
                  <th className="pb-2 text-center">Qty</th>
                  <th className="pb-2 text-right">Unit Price</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.orderLines.map((line) => (
                  <tr
                    key={line.id}
                    className="border-b border-zinc-800/50"
                  >
                    <td className="py-2 text-zinc-200">
                      {line.product?.name ?? "Unknown Product"}
                    </td>
                    <td className="py-2 text-zinc-400">
                      {"allocations" in line && Array.isArray(line.allocations) && line.allocations.length > 0 ? (
                        <span className="font-mono text-xs">
                          {line.allocations.map((a: { torkeBatchId: string }) => a.torkeBatchId).join(", ")}
                        </span>
                      ) : (
                        <span className="text-zinc-600 italic text-xs">Pending allocation</span>
                      )}
                    </td>
                    <td className="py-2 text-center text-zinc-400">
                      {line.quantity}
                    </td>
                    <td className="py-2 text-right text-zinc-400">
                      {formatPence(line.unitPricePence)}
                    </td>
                    <td className="py-2 text-right text-zinc-200">
                      {formatPence(line.lineTotalPence)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 space-y-1 text-sm text-right">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span>{formatPence(order.subtotalPence)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>VAT (20%)</span>
              <span>{formatPence(order.vatPence)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-zinc-100 pt-1 border-t border-zinc-800">
              <span>Total</span>
              <span>{formatPence(order.totalPence)}</span>
            </div>
          </div>
        </div>

        {/* Payment & PO info */}
        <div className="flex flex-wrap gap-6 text-sm text-zinc-400">
          <div>
            <span className="text-zinc-500">Payment: </span>
            <span className="text-zinc-200">
              {order.paymentMethod === "card"
                ? "Card"
                : order.paymentMethod === "credit"
                  ? "Credit Terms"
                  : "BACS Bank Transfer"}
            </span>
          </div>
          {order.poNumber && (
            <div>
              <span className="text-zinc-500">PO: </span>
              <span className="text-zinc-200">{order.poNumber}</span>
            </div>
          )}
        </div>
      </Card>

      {/* BACS Bank Details */}
      {isAwaitingPayment && isBacs && (
        <Card className="border-amber-900/50 bg-amber-950/20 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Landmark className="h-5 w-5 text-amber-400" />
            <h3 className="font-semibold text-amber-200">Bank Details for Payment</h3>
          </div>
          <p className="text-sm text-amber-300/80 mb-4">
            Please transfer the total amount using the details below. Use your
            order reference as the payment reference.
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-amber-400/60">Account Name</p>
              <p className="font-medium text-amber-100">
                {BANK_DETAILS.accountName}
              </p>
            </div>
            <div>
              <p className="text-amber-400/60">Sort Code</p>
              <p className="font-medium font-mono text-amber-100">
                {BANK_DETAILS.sortCode}
              </p>
            </div>
            <div>
              <p className="text-amber-400/60">Account Number</p>
              <p className="font-medium font-mono text-amber-100">
                {BANK_DETAILS.accountNumber}
              </p>
            </div>
            <div>
              <p className="text-amber-400/60">Payment Reference</p>
              <p className="font-medium font-mono text-amber-100">
                {order.orderNumber}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button
          asChild
          variant="outline"
          className="border-zinc-700 text-zinc-400 hover:text-white"
        >
          <Link href="/products">Continue Shopping</Link>
        </Button>
        <Button asChild className="bg-[#C41E3A] hover:bg-[#D6354F] text-white">
          <Link href="/account/orders">
            View Order History
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
