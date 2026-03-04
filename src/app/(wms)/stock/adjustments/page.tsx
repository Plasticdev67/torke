"use client";

import { trpc } from "@/lib/trpc";
import { StockAdjustmentForm } from "@/components/wms/StockAdjustmentForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const reasonLabels: Record<string, string> = {
  damage: "Damage",
  returns: "Returns",
  cycle_count_variance: "Cycle Count",
  other: "Other",
};

const reasonBadgeClass: Record<string, string> = {
  damage: "bg-red-600/20 text-red-400 border-red-600/30",
  returns: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  cycle_count_variance: "bg-amber-600/20 text-amber-400 border-amber-600/30",
  other: "bg-zinc-600/20 text-zinc-400 border-zinc-600/30",
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdjustmentHistory() {
  const { data: history, isLoading } = trpc.stock.adjustmentHistory.useQuery();

  if (isLoading) {
    return (
      <div className="h-48 animate-pulse rounded-lg border border-border bg-card" />
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">No adjustments recorded yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Use the form to submit your first stock adjustment.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead className="text-right">Change</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Adjusted By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((adj) => (
            <TableRow key={adj.id}>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {formatDate(adj.createdAt)}
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm font-medium">{adj.productName}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {adj.sku}
                  </p>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {adj.torkeBatchId}
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-bold">
                <span
                  className={
                    adj.quantityChange > 0 ? "text-green-400" : "text-red-400"
                  }
                >
                  {adj.quantityChange > 0 ? "+" : ""}
                  {adj.quantityChange}
                </span>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={reasonBadgeClass[adj.reason] || ""}
                >
                  {reasonLabels[adj.reason] || adj.reason}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                {adj.notes || "--"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {adj.adjustedBy.slice(0, 8)}...
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function StockAdjustmentsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/stock"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Stock
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Stock Adjustments
        </h1>
        <p className="text-muted-foreground">
          Record stock corrections with reason codes for audit trail.
        </p>
      </div>

      {/* Split layout: form left, history right */}
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <StockAdjustmentForm />
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Adjustments
          </h2>
          <AdjustmentHistory />
        </div>
      </div>
    </div>
  );
}
