"use client";

import { trpc } from "@/lib/trpc";
import { useParams } from "next/navigation";
import { PickList } from "@/components/wms/PickList";
import Link from "next/link";
import { ArrowLeft, Printer, Loader2, AlertCircle } from "lucide-react";

export default function PickListPage() {
  const params = useParams();
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

  return (
    <div className="space-y-6">
      {/* Actions bar -- hidden when printing */}
      <div className="flex items-center justify-between print-hidden" data-print-hide>
        <Link
          href={`/orders/${orderId}`}
          className="inline-flex items-center gap-2 rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Order
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Printer className="h-4 w-4" />
          Print Pick List
        </button>
      </div>

      {/* Pick list content */}
      <PickList
        orderNumber={order.orderNumber}
        date={order.createdAt}
        lines={order.orderLines.map((line) => ({
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
