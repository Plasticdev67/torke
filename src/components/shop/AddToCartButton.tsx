"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart";
import { toast } from "sonner";

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  sku: string;
  unitPricePence: number;
  className?: string;
}

export function AddToCartButton({
  productId,
  productName,
  sku,
  unitPricePence,
  className,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = () => {
    addItem({
      productId,
      productName,
      sku,
      unitPricePence,
      quantity,
    });
    toast.success(`Added ${productName} to basket`, {
      description: `Quantity: ${quantity}`,
    });
    setQuantity(1);
  };

  return (
    <div className={className}>
      {/* Quantity selector */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-[#999]">Qty:</span>
        <div className="flex items-center border border-[#333] rounded-md">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-2 py-1.5 text-[#999] hover:text-white transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="px-3 py-1.5 text-sm text-white font-medium min-w-[2.5rem] text-center tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="px-2 py-1.5 text-[#999] hover:text-white transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Add to basket button */}
      <Button
        onClick={handleAdd}
        size="lg"
        className="w-full bg-[#C41E3A] hover:bg-[#D6354F] text-white font-semibold h-12"
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Add to Basket
      </Button>
    </div>
  );
}
