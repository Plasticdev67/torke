"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart";

function formatPrice(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`;
}

export function BasketItems() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-[#999] mb-2">Your basket is empty</p>
        <p className="text-sm text-[#666]">
          Browse our products and add items to get started.
        </p>
      </div>
    );
  }

  const subtotalPence = items.reduce(
    (sum, item) => sum + item.unitPricePence * item.quantity,
    0
  );

  return (
    <div>
      {/* Items list */}
      <div className="divide-y divide-[#222]">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-4 py-4 first:pt-0"
          >
            {/* Product info */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {item.productName}
              </p>
              <p className="text-xs text-[#999] font-mono mt-0.5">
                {item.sku}
              </p>
              <p className="text-sm text-[#B3B3B3] mt-1">
                {formatPrice(item.unitPricePence)} each
              </p>
            </div>

            {/* Quantity controls */}
            <div className="flex items-center border border-[#333] rounded-md shrink-0">
              <button
                type="button"
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                className="px-2 py-1.5 text-[#999] hover:text-white transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="px-3 py-1.5 text-sm text-white font-medium min-w-[2.5rem] text-center tabular-nums">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                className="px-2 py-1.5 text-[#999] hover:text-white transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Line total */}
            <div className="text-right shrink-0 w-24">
              <p className="text-white font-semibold tabular-nums">
                {formatPrice(item.unitPricePence * item.quantity)}
              </p>
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={() => removeItem(item.productId)}
              className="text-[#666] hover:text-[#C41E3A] transition-colors shrink-0"
              aria-label={`Remove ${item.productName}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Subtotal and actions */}
      <div className="border-t border-[#333] mt-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[#999]">Subtotal (ex. VAT)</span>
          <span className="text-lg font-bold text-white tabular-nums">
            {formatPrice(subtotalPence)}
          </span>
        </div>
        <p className="text-xs text-[#666] mb-4">
          Final prices confirmed at checkout. VAT calculated on delivery address.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={clear}
          className="border-[#333] text-[#999] hover:text-white hover:bg-[#1A1A1A]"
        >
          Clear Basket
        </Button>
      </div>
    </div>
  );
}
