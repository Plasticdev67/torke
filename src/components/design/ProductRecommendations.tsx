"use client";

import { useState } from "react";
import { ShoppingCart, ExternalLink, Package, Minus, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useDesignStore } from "@/stores/design";
import { useCartStore } from "@/stores/cart";

/** Map group pattern to default quantity */
function groupSizeToQuantity(pattern: string): number {
  switch (pattern) {
    case "single":
      return 1;
    case "2x1":
      return 2;
    case "2x2":
      return 4;
    case "3x2":
      return 6;
    default:
      return 1;
  }
}

export function ProductRecommendations() {
  const anchorType = useDesignStore((s) => s.inputs.anchorType);
  const anchorDiameter = useDesignStore((s) => s.inputs.anchorDiameter);
  const groupPattern = useDesignStore((s) => s.inputs.groupPattern);
  const results = useDesignStore((s) => s.results);
  const calcReference = useDesignStore((s) => s.calcReference);
  const addItem = useCartStore((s) => s.addItem);

  // Map anchor type to category slug
  const categorySlug =
    anchorType === "chemical" ? "chemical-anchors" : "mechanical-anchors";

  const diameterStr = `M${anchorDiameter}`;

  // Query products matching anchor type and diameter
  const { data, isLoading } = trpc.products.list.useQuery(
    {
      categorySlug,
      diameter: diameterStr,
      limit: 3,
      sortBy: "name",
      sortDir: "asc",
    },
    { enabled: !!results }
  );

  // Local quantity state per product
  const defaultQty = groupSizeToQuantity(groupPattern);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  if (!results) return null;

  const items = data?.items ?? [];

  const getQty = (productId: string) => quantities[productId] ?? defaultQty;

  const setQty = (productId: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(1, qty) }));
  };

  const handleAddToCart = (product: (typeof items)[number]) => {
    const qty = getQty(product.id);
    addItem({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: qty,
      unitPricePence: product.pricePence ?? 0,
      calcReference: calcReference ?? `DESIGN-DRAFT-${Date.now()}`,
    });
    setAddedIds((prev) => new Set(prev).add(product.id));
    // Reset after 2s
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  return (
    <div className="border-t border-[#222] bg-[#111] px-4 py-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white">
          Recommended Products
        </h3>
        <p className="text-xs text-[#666]">
          Based on your {diameterStr} {anchorType} anchor design
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#333] border-t-[#C41E3A]" />
          <span className="text-xs text-[#666]">Finding matching products...</span>
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="rounded-lg border border-[#222] bg-[#1A1A1A] p-4 text-center">
          <Package className="mx-auto mb-2 h-6 w-6 text-[#444]" />
          <p className="text-sm text-[#888]">No matching products found.</p>
          <a
            href="/products"
            className="mt-2 inline-flex items-center gap-1 text-xs text-[#C41E3A] hover:underline"
          >
            Browse catalogue <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((product) => {
            const qty = getQty(product.id);
            const added = addedIds.has(product.id);
            const hasPrice = product.pricePence != null;

            return (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-lg border border-[#222] bg-[#1A1A1A] p-3"
              >
                {/* Product info */}
                <div className="min-w-0 flex-1">
                  <a
                    href={`/products/${product.slug}`}
                    className="block truncate text-sm font-medium text-white hover:text-[#C41E3A]"
                  >
                    {product.name}
                  </a>
                  <p className="text-xs text-[#666]">{product.sku}</p>
                  {hasPrice ? (
                    <p className="mt-0.5 text-sm font-semibold text-[#C41E3A]">
                      {"\u00A3"}
                      {(product.pricePence! / 100).toFixed(2)}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-[#888]">
                      Contact for pricing
                    </p>
                  )}
                </div>

                {/* Quantity control + add to cart */}
                <div className="flex shrink-0 items-center gap-2">
                  <div className="flex items-center rounded border border-[#333]">
                    <button
                      type="button"
                      onClick={() => setQty(product.id, qty - 1)}
                      className="px-1.5 py-1 text-[#888] hover:text-white"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) =>
                        setQty(product.id, parseInt(e.target.value) || 1)
                      }
                      className="w-10 bg-transparent text-center text-xs text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQty(product.id, qty + 1)}
                      className="px-1.5 py-1 text-[#888] hover:text-white"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    disabled={!hasPrice || added}
                    className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                      added
                        ? "bg-green-700 text-white"
                        : hasPrice
                        ? "bg-[#C41E3A] text-white hover:bg-[#A81830]"
                        : "cursor-not-allowed bg-[#333] text-[#666]"
                    }`}
                  >
                    <ShoppingCart className="h-3 w-3" />
                    {added ? "Added" : "Add"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
