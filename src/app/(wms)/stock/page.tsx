import { db } from "@/server/db";
import { batches } from "@/server/db/schema/batches";
import { stockItems } from "@/server/db/schema/stock";
import { products } from "@/server/db/schema/products";
import { eq, and, lte, gt, isNotNull, sql } from "drizzle-orm";
import { StockTable } from "@/components/wms/StockTable";
import { ExpiryAlerts } from "@/components/wms/ExpiryAlerts";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Boxes, BarChart3, AlertTriangle } from "lucide-react";

export default async function StockOverviewPage() {
  // Fetch stock items with batch and product details
  const items = await db
    .select({
      stockItemId: stockItems.id,
      batchId: batches.id,
      torkeBatchId: batches.torkeBatchId,
      batchStatus: batches.status,
      quantityAvailable: batches.quantityAvailable,
      quantityReserved: batches.quantityReserved,
      quantityTotal: batches.quantity,
      goodsInDate: batches.goodsInDate,
      expiryDate: batches.expiryDate,
      productId: products.id,
      productName: products.name,
      productSku: products.sku,
    })
    .from(stockItems)
    .innerJoin(batches, eq(stockItems.batchId, batches.id))
    .innerJoin(products, eq(stockItems.productId, products.id));

  // Summary statistics
  const summaryResult = await db
    .select({
      totalProducts: sql<number>`COUNT(DISTINCT ${stockItems.productId})`,
      totalBatches: sql<number>`COUNT(DISTINCT ${stockItems.batchId})`,
      totalUnitsAvailable: sql<number>`COALESCE(SUM(${batches.quantityAvailable}), 0)`,
    })
    .from(stockItems)
    .innerJoin(batches, eq(stockItems.batchId, batches.id));

  const summary = {
    totalProducts: Number(summaryResult[0]?.totalProducts ?? 0),
    totalBatches: Number(summaryResult[0]?.totalBatches ?? 0),
    totalUnitsAvailable: Number(summaryResult[0]?.totalUnitsAvailable ?? 0),
  };

  // Expiring batches (within 30 days)
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiringBatches = await db
    .select({
      batchId: batches.id,
      torkeBatchId: batches.torkeBatchId,
      expiryDate: batches.expiryDate,
      quantityAvailable: batches.quantityAvailable,
      productId: products.id,
      productName: products.name,
      productSku: products.sku,
    })
    .from(batches)
    .innerJoin(products, eq(batches.productId, products.id))
    .where(
      and(
        isNotNull(batches.expiryDate),
        lte(batches.expiryDate, thirtyDaysFromNow.toISOString().split("T")[0]!),
        gt(batches.quantityAvailable, 0)
      )
    );

  const expiryAlerts = expiringBatches
    .filter((b): b is typeof b & { expiryDate: string } => b.expiryDate !== null)
    .map((b) => {
      const expiryMs = new Date(b.expiryDate).getTime();
      const daysRemaining = Math.ceil((expiryMs - now.getTime()) / (24 * 60 * 60 * 1000));
      return {
        ...b,
        daysRemaining,
        severity: (daysRemaining < 7 ? "critical" : "warning") as "critical" | "warning",
      };
    });

  const summaryCards = [
    {
      label: "Total Products",
      value: summary.totalProducts,
      icon: Package,
    },
    {
      label: "Total Batches",
      value: summary.totalBatches,
      icon: Boxes,
    },
    {
      label: "Units Available",
      value: summary.totalUnitsAvailable,
      icon: BarChart3,
    },
    {
      label: "Expiring Soon",
      value: expiryAlerts.length,
      icon: AlertTriangle,
      highlight: expiryAlerts.length > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Stock Overview</h1>
        <p className="text-muted-foreground">
          Batch-tracked inventory with quantity per batch per product.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <card.icon
                className={`h-8 w-8 ${card.highlight ? "text-amber-500" : "text-muted-foreground"}`}
              />
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expiry alerts */}
      <ExpiryAlerts batches={expiryAlerts} />

      {/* Stock table */}
      <StockTable items={items} />
    </div>
  );
}
