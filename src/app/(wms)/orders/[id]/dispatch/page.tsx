"use client";

import { trpc } from "@/lib/trpc";
import { useParams, useRouter } from "next/navigation";
import { DispatchForm } from "@/components/wms/DispatchForm";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

export default function DispatchPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const { data: order, isLoading, error } = trpc.orders.getPickList.useQuery({
    orderId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <p className="text-sm text-destructive">
          {error?.message || "Order not found"}
        </p>
      </div>
    );
  }

  // Only accessible for packed orders
  if (order.status !== "packed") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-4">
          <AlertCircle className="h-5 w-5 text-amber-400" />
          <p className="text-sm text-amber-400">
            This order cannot be dispatched. Current status: {order.status}
          </p>
        </div>
        <Link
          href={`/orders/${orderId}`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Order
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/orders/${orderId}`}
          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Dispatch Order {order.orderNumber}
          </h1>
          <p className="text-sm text-muted-foreground">
            Confirm dispatch details and carrier information.
          </p>
        </div>
      </div>

      {/* Dispatch form */}
      <DispatchForm
        orderId={orderId}
        orderNumber={order.orderNumber}
        orderLines={order.orderLines.map((line) => ({
          id: line.id,
          quantity: line.quantity,
          product: line.product,
          allocations: line.allocations.map((a) => ({
            id: a.id,
            torkeBatchId: a.torkeBatchId,
            quantity: a.quantity,
          })),
        }))}
      />
    </div>
  );
}
