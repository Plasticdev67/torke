"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Package,
  ClipboardCheck,
  Truck,
  BoxSelect,
  Loader2,
  AlertCircle,
} from "lucide-react";

type QueueStatus = "all" | "confirmed" | "allocated" | "picking" | "packed";

const STATUS_TABS: { value: QueueStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "allocated", label: "Allocated" },
  { value: "picking", label: "Picking" },
  { value: "packed", label: "Packed" },
];

const STATUS_BADGES: Record<
  string,
  { label: string; className: string }
> = {
  confirmed: {
    label: "Confirmed",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  allocated: {
    label: "Allocated",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  picking: {
    label: "Picking",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  packed: {
    label: "Packed",
    className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
};

export function OrderQueue() {
  const [activeTab, setActiveTab] = useState<QueueStatus>("all");

  const { data: queueOrders, isLoading, error } = trpc.orders.queue.useQuery(
    activeTab === "all" ? {} : { status: activeTab },
    { refetchInterval: 30_000 }
  );

  return (
    <div className="space-y-6">
      {/* Tab filters */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeTab === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">
            Failed to load orders: {error.message}
          </p>
        </div>
      )}

      {/* Empty state */}
      {queueOrders && queueOrders.length === 0 && (
        <div className="py-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            No orders in queue{activeTab !== "all" ? ` with status "${activeTab}"` : ""}.
          </p>
        </div>
      )}

      {/* Order list */}
      {queueOrders && queueOrders.length > 0 && (
        <div className="space-y-3">
          {queueOrders.map((order) => {
            const badge = STATUS_BADGES[order.status];
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {order.orderNumber}
                      </span>
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
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {order.lineCount} item{order.lineCount !== 1 ? "s" : ""}
                      </span>
                      <span>
                        {order.confirmedAt
                          ? new Date(order.confirmedAt).toLocaleDateString("en-GB")
                          : new Date(order.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {"\u00A3"}
                      {(order.totalPence / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
