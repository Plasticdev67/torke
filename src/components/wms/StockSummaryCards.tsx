"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Package, AlertTriangle, Clock, Boxes } from "lucide-react";

interface StockSummaryCardsProps {
  totalProducts: number;
  totalUnitsAvailable: number;
  lowStockCount: number;
  expiringSoon: number;
}

export function StockSummaryCards({
  totalProducts,
  totalUnitsAvailable,
  lowStockCount,
  expiringSoon,
}: StockSummaryCardsProps) {
  const cards = [
    {
      label: "Total Products in Stock",
      value: totalProducts,
      icon: Package,
      highlight: false,
    },
    {
      label: "Total Units Available",
      value: totalUnitsAvailable,
      icon: Boxes,
      highlight: false,
    },
    {
      label: "Low Stock Items",
      value: lowStockCount,
      icon: AlertTriangle,
      highlight: lowStockCount > 0,
      highlightClass: "text-amber-500",
    },
    {
      label: "Expiring Soon",
      value: expiringSoon,
      icon: Clock,
      highlight: expiringSoon > 0,
      highlightClass: "text-red-500",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="flex items-center gap-4 pt-6">
            <card.icon
              className={`h-8 w-8 ${
                card.highlight
                  ? card.highlightClass
                  : "text-muted-foreground"
              }`}
            />
            <div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
