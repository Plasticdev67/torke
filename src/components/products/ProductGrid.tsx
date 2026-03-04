import { ProductCard } from "./ProductCard";

interface Product {
  name: string;
  slug: string;
  sku: string;
  diameter?: string | null;
  material?: string | null;
  loadClass?: string | null;
  images?: string[] | null;
  category?: { name: string; slug: string } | null;
}

interface ProductGridProps {
  products: Product[];
  total?: number;
  isLoading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="bg-[#1A1A1A] border border-[#333] rounded-lg overflow-hidden">
      <div className="aspect-[4/3] skeleton-dark" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 skeleton-dark rounded" />
        <div className="h-3 w-1/3 skeleton-dark rounded" />
        <div className="flex gap-1.5">
          <div className="h-5 w-12 skeleton-dark rounded" />
          <div className="h-5 w-16 skeleton-dark rounded" />
        </div>
      </div>
    </div>
  );
}

export function ProductGrid({
  products,
  total,
  isLoading = false,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div>
        <div className="mb-4">
          <div className="h-5 w-40 skeleton-dark rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-[#666]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="text-white font-medium mb-1">No products found</h3>
        <p className="text-sm text-[#999] text-center max-w-sm">
          No products match your current filters. Try broadening your search or
          clearing some filters.
        </p>
      </div>
    );
  }

  return (
    <div>
      {total !== undefined && (
        <div className="mb-4">
          <p className="text-sm text-[#999]">
            Showing{" "}
            <span className="text-white font-medium">{products.length}</span>
            {total > products.length && (
              <>
                {" "}
                of <span className="text-white font-medium">{total}</span>
              </>
            )}{" "}
            products
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.slug} {...product} />
        ))}
      </div>
    </div>
  );
}
