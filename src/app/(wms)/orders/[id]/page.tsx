"use client";

import { trpc } from "@/lib/trpc";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Printer,
  Package,
  Truck,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  awaiting_payment: { label: "Awaiting Payment", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  confirmed: { label: "Confirmed", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  allocated: { label: "Allocated", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  picking: { label: "Picking", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  packed: { label: "Packed", className: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  dispatched: { label: "Dispatched", className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  delivered: { label: "Delivered", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  completed: { label: "Completed", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  cancelled: { label: "Cancelled", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function WMSOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const utils = trpc.useUtils();

  const { data: order, isLoading, error } = trpc.orders.getPickList.useQuery({
    orderId,
  });

  const startPicking = trpc.orders.startPicking.useMutation({
    onSuccess: () => {
      toast.success("Picking started");
      utils.orders.getPickList.invalidate({ orderId });
    },
    onError: (err) => toast.error(err.message),
  });

  const completePacking = trpc.orders.completePacking.useMutation({
    onSuccess: () => {
      toast.success("Order packed");
      utils.orders.getPickList.invalidate({ orderId });
    },
    onError: (err) => toast.error(err.message),
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

  const badge = STATUS_BADGES[order.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/orders"
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {order.orderNumber}
              </h1>
              {badge && (
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    badge.className
                  )}
                >
                  {badge.label}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Created {new Date(order.createdAt).toLocaleDateString("en-GB")}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {(order.status === "confirmed" || order.status === "allocated") && (
            <button
              onClick={() => startPicking.mutate({ orderId })}
              disabled={startPicking.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Package className="h-4 w-4" />
              Start Picking
            </button>
          )}

          {(order.status === "allocated" ||
            order.status === "picking" ||
            order.status === "packed") && (
            <Link
              href={`/orders/${orderId}/pick`}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              <Printer className="h-4 w-4" />
              Print Pick List
            </Link>
          )}

          {order.status === "picking" && (
            <button
              onClick={() => completePacking.mutate({ orderId })}
              disabled={completePacking.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Mark Packed
            </button>
          )}

          {order.status === "packed" && (
            <Link
              href={`/orders/${orderId}/dispatch`}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Truck className="h-4 w-4" />
              Dispatch
            </Link>
          )}
        </div>
      </div>

      {/* Order info */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Order Details
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Payment Method</dt>
              <dd className="font-medium text-foreground capitalize">
                {order.paymentMethod ?? "N/A"}
              </dd>
            </div>
            {order.poNumber && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">PO Number</dt>
                <dd className="font-medium text-foreground">{order.poNumber}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-mono text-foreground">
                {"\u00A3"}{(order.subtotalPence / 100).toFixed(2)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">VAT</dt>
              <dd className="font-mono text-foreground">
                {"\u00A3"}{(order.vatPence / 100).toFixed(2)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <dt className="font-semibold text-foreground">Total</dt>
              <dd className="font-mono font-semibold text-foreground">
                {"\u00A3"}{(order.totalPence / 100).toFixed(2)}
              </dd>
            </div>
          </dl>
        </div>

        {order.deliveryAddress && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Delivery Address
            </h2>
            <address className="text-sm not-italic text-muted-foreground leading-relaxed">
              {order.deliveryAddress.name && (
                <span className="block font-medium text-foreground">
                  {order.deliveryAddress.name}
                </span>
              )}
              {order.deliveryAddress.addressLine1}
              <br />
              {order.deliveryAddress.addressLine2 && (
                <>
                  {order.deliveryAddress.addressLine2}
                  <br />
                </>
              )}
              {order.deliveryAddress.city}, {order.deliveryAddress.postcode}
              <br />
              {order.deliveryAddress.county && (
                <>
                  {order.deliveryAddress.county}
                  <br />
                </>
              )}
            </address>
          </div>
        )}
      </div>

      {/* Line items with allocations */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Line Items & Batch Allocations
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-2 text-muted-foreground font-medium">#</th>
                <th className="px-4 py-2 text-muted-foreground font-medium">
                  Product
                </th>
                <th className="px-4 py-2 text-muted-foreground font-medium">Qty</th>
                <th className="px-4 py-2 text-muted-foreground font-medium">
                  Unit Price
                </th>
                <th className="px-4 py-2 text-muted-foreground font-medium">
                  Line Total
                </th>
                <th className="px-4 py-2 text-muted-foreground font-medium">
                  Batch Allocations
                </th>
              </tr>
            </thead>
            <tbody>
              {order.orderLines.map((line, idx) => (
                <tr
                  key={line.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground">
                      {line.product?.name ?? "Unknown Product"}
                    </span>
                    {line.product?.sku && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({line.product.sku})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground">{line.quantity}</td>
                  <td className="px-4 py-3 font-mono text-foreground">
                    {"\u00A3"}{(line.unitPricePence / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-mono text-foreground">
                    {"\u00A3"}{(line.lineTotalPence / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {line.allocations && line.allocations.length > 0 ? (
                      <div className="space-y-1">
                        {line.allocations.map((alloc) => (
                          <div
                            key={alloc.id}
                            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs"
                          >
                            <span className="font-mono text-emerald-400">
                              {alloc.torkeBatchId}
                            </span>
                            <span className="text-muted-foreground">
                              x{alloc.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Not yet allocated
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch info if dispatched */}
      {order.status === "dispatched" && order.dispatchType && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Dispatch Details
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Dispatch Type</dt>
              <dd className="font-medium text-foreground capitalize">
                {order.dispatchType}
              </dd>
            </div>
            {order.trackingNumber && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tracking Number</dt>
                <dd className="font-mono text-foreground">
                  {order.trackingNumber}
                </dd>
              </div>
            )}
            {order.consignmentNumber && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Consignment Number</dt>
                <dd className="font-mono text-foreground">
                  {order.consignmentNumber}
                </dd>
              </div>
            )}
            {order.dispatchedAt && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Dispatched At</dt>
                <dd className="text-foreground">
                  {new Date(order.dispatchedAt).toLocaleString("en-GB")}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
