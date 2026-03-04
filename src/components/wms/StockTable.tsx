"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

interface StockItem {
  stockItemId: string;
  batchId: string;
  torkeBatchId: string;
  batchStatus: string;
  quantityAvailable: number;
  quantityReserved: number;
  quantityTotal: number;
  goodsInDate: Date | string;
  expiryDate: string | null;
  productId: string;
  productName: string;
  productSku: string;
}

interface StockTableProps {
  items: StockItem[];
}

const statusBadgeClass: Record<string, string> = {
  available: "bg-green-600/20 text-green-400 border-green-600/30",
  pending: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  quarantined: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
  depleted: "bg-zinc-600/20 text-zinc-400 border-zinc-600/30",
};

function isExpiringSoon(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntil = (expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
  return daysUntil <= 30;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function StockTable({ items }: StockTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">No stock items found.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Complete a goods-in to add stock.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Batch ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Available / Total</TableHead>
            <TableHead>Goods-In</TableHead>
            <TableHead>Expiry</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.stockItemId}>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">{item.productName}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {item.productSku}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Link
                  href={`/goods-in/${item.batchId}`}
                  className="font-mono text-sm text-primary hover:underline"
                >
                  {item.torkeBatchId}
                </Link>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={statusBadgeClass[item.batchStatus] || ""}
                >
                  {item.batchStatus}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                <span className="text-green-400">{item.quantityAvailable}</span>
                <span className="text-muted-foreground"> / {item.quantityTotal}</span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(item.goodsInDate)}
              </TableCell>
              <TableCell>
                {item.expiryDate ? (
                  <span
                    className={
                      isExpiringSoon(item.expiryDate)
                        ? "text-sm font-medium text-red-400"
                        : "text-sm text-muted-foreground"
                    }
                  >
                    {formatDate(item.expiryDate)}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">--</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
