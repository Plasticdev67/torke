"use client";

import { AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface ExpiryBatch {
  batchId: string;
  torkeBatchId: string;
  productName: string;
  productSku: string;
  expiryDate: string | null;
  daysRemaining: number;
  severity: "critical" | "warning";
}

interface ExpiryAlertsProps {
  batches: ExpiryBatch[];
}

/**
 * Alert banner for batches nearing expiry (WMS-05).
 * Red for <7 days, amber for 7-30 days.
 */
export function ExpiryAlerts({ batches }: ExpiryAlertsProps) {
  if (batches.length === 0) return null;

  const criticalCount = batches.filter((b) => b.severity === "critical").length;
  const warningCount = batches.filter((b) => b.severity === "warning").length;

  return (
    <div className="rounded-lg border border-amber-600/30 bg-amber-950/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h3 className="font-semibold text-foreground">Expiry Alerts</h3>
        {criticalCount > 0 && (
          <Badge variant="outline" className="bg-red-600/20 text-red-400 border-red-600/30">
            {criticalCount} critical
          </Badge>
        )}
        {warningCount > 0 && (
          <Badge variant="outline" className="bg-amber-600/20 text-amber-400 border-amber-600/30">
            {warningCount} warning
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {batches.map((batch) => (
          <div
            key={batch.batchId}
            className="flex items-center justify-between rounded-md border border-border bg-card p-3"
          >
            <div className="flex items-center gap-3">
              <Clock
                className={
                  batch.severity === "critical"
                    ? "h-4 w-4 text-red-500"
                    : "h-4 w-4 text-amber-500"
                }
              />
              <div>
                <p className="text-sm font-medium">
                  {batch.productName}
                  <span className="ml-2 text-muted-foreground font-mono text-xs">
                    {batch.torkeBatchId}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Expires: {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString("en-GB") : "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={
                  batch.severity === "critical"
                    ? "text-sm font-bold text-red-400"
                    : "text-sm font-bold text-amber-400"
                }
              >
                {batch.daysRemaining <= 0
                  ? "EXPIRED"
                  : `${batch.daysRemaining}d remaining`}
              </span>
              <Link
                href={`/goods-in/${batch.batchId}`}
                className="text-xs text-primary hover:underline"
              >
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
