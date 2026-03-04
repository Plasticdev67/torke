"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { StockSummaryCards } from "./StockSummaryCards";
import { ExpiryAlerts } from "./ExpiryAlerts";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import Link from "next/link";

const statusBadgeClass: Record<string, string> = {
  available: "bg-green-600/20 text-green-400 border-green-600/30",
  pending: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  quarantined: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
  depleted: "bg-zinc-600/20 text-zinc-400 border-zinc-600/30",
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function BatchBreakdown({ productId }: { productId: string }) {
  const { data: batchList, isLoading } = trpc.stock.productBatches.useQuery({
    productId,
  });

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={8} className="bg-muted/30 py-4 text-center text-sm text-muted-foreground">
          Loading batches...
        </TableCell>
      </TableRow>
    );
  }

  if (!batchList || batchList.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={8} className="bg-muted/30 py-4 text-center text-sm text-muted-foreground">
          No batches found.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {batchList.map((batch) => (
        <TableRow key={batch.batchId} className="bg-muted/20">
          <TableCell className="pl-10 text-muted-foreground text-xs">
            --
          </TableCell>
          <TableCell>
            <Link
              href={`/goods-in/${batch.batchId}`}
              className="font-mono text-xs text-primary hover:underline"
            >
              {batch.torkeBatchId}
            </Link>
          </TableCell>
          <TableCell className="text-right font-mono text-xs">
            --
          </TableCell>
          <TableCell className="text-right font-mono text-xs">
            <span className="text-green-400">{batch.quantityAvailable}</span>
          </TableCell>
          <TableCell className="text-right font-mono text-xs">
            {batch.quantityReserved}
          </TableCell>
          <TableCell className="text-xs text-muted-foreground">
            {formatDate(batch.goodsInDate)}
          </TableCell>
          <TableCell className="text-xs text-muted-foreground">
            {batch.expiryDate ? formatDate(batch.expiryDate) : "--"}
          </TableCell>
          <TableCell>
            <Badge
              variant="outline"
              className={statusBadgeClass[batch.status] || ""}
            >
              {batch.status}
            </Badge>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function StockDashboard() {
  const [search, setSearch] = useState("");
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(
    new Set()
  );

  const { data: dashboardData, isLoading } = trpc.stock.dashboard.useQuery();
  const { data: expiryAlerts } = trpc.stock.expiringBatches.useQuery({
    days: 30,
  });

  const toggleExpand = (productId: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-border bg-card"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg border border-border bg-card" />
      </div>
    );
  }

  const summary = dashboardData?.summary ?? {
    totalProducts: 0,
    totalUnitsAvailable: 0,
    lowStockCount: 0,
    expiringSoon: 0,
  };

  const filteredProducts = (dashboardData?.products ?? []).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.productName.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  });

  const alertBatches = (expiryAlerts ?? [])
    .filter(
      (b): b is typeof b & { expiryDate: string } => b.expiryDate !== null
    )
    .map((b) => ({
      batchId: b.batchId,
      torkeBatchId: b.torkeBatchId,
      productName: b.productName,
      productSku: b.productSku,
      expiryDate: b.expiryDate,
      daysRemaining: b.daysRemaining,
      severity: b.severity,
    }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <StockSummaryCards
        totalProducts={summary.totalProducts}
        totalUnitsAvailable={summary.totalUnitsAvailable}
        lowStockCount={summary.lowStockCount}
        expiringSoon={summary.expiringSoon}
      />

      {/* Expiry alerts */}
      <ExpiryAlerts batches={alertBatches} />

      {/* Search filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter by product name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Product-level table */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">No stock items found.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Complete a goods-in to add stock.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[280px]">Product Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Total Qty</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead>Batches</TableHead>
                <TableHead>Oldest Batch</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const isExpanded = expandedProducts.has(product.productId);
                return (
                  <>
                    <TableRow
                      key={product.productId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleExpand(product.productId)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-medium text-sm">
                            {product.productName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {product.sku}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {product.totalQuantity}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <span className="text-green-400">
                          {product.totalAvailable}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {product.totalReserved}
                      </TableCell>
                      <TableCell className="text-sm">
                        {product.batchCount}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {product.oldestBatchDate
                          ? formatDate(product.oldestBatchDate)
                          : "--"}
                      </TableCell>
                      <TableCell>
                        <Link
                          href="/stock/adjustments"
                          className="text-xs text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Adjust
                        </Link>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <BatchBreakdown productId={product.productId} />
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
