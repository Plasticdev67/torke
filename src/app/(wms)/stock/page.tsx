import { StockDashboard } from "@/components/wms/StockDashboard";
import Link from "next/link";
import { ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

export default function StockOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock Overview</h1>
          <p className="text-muted-foreground">
            Product-level inventory with batch drill-down.
          </p>
        </div>
        <Link
          href="/stock/adjustments"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <ClipboardList className="h-4 w-4" />
          Stock Adjustments
        </Link>
      </div>

      <StockDashboard />
    </div>
  );
}
