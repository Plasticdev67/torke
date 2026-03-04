"use client";

import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { ProductGrid } from "./ProductGrid";
import { ProductFilters } from "./ProductFilters";

export function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || undefined;
  const diameter = searchParams.get("diameter") || undefined;
  const material = searchParams.get("material") || undefined;
  const finish = searchParams.get("finish") || undefined;
  const loadClass = searchParams.get("loadClass") || undefined;

  const searchResult = trpc.search.products.useQuery(
    {
      query,
      filters: { categorySlug: category, diameter, material, finish, loadClass },
      limit: 40,
    },
    { enabled: query.length >= 1 }
  );

  const hits = searchResult.data?.hits || [];
  const facets = searchResult.data?.facetDistribution || {};
  const totalHits = searchResult.data?.totalHits || 0;
  const processingTime = searchResult.data?.processingTimeMs || 0;

  const products = hits.map((hit) => ({
    name: hit.name,
    slug: hit.slug,
    sku: hit.sku,
    diameter: hit.diameter,
    material: hit.material,
    loadClass: hit.loadClass,
    images: hit.images,
    category: hit.categorySlug
      ? { name: hit.categorySlug, slug: hit.categorySlug }
      : null,
  }));

  return (
    <div>
      {/* Results header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">
          {query ? (
            <>
              {totalHits} result{totalHits !== 1 ? "s" : ""} for &ldquo;
              {query}&rdquo;
            </>
          ) : (
            "Search Products"
          )}
        </h1>
        {processingTime > 0 && (
          <p className="text-xs text-[#666]">
            Found in {processingTime}ms
          </p>
        )}
      </div>

      <div className="flex gap-8">
        <ProductFilters
          facets={facets}
          activeFilters={{ category, diameter, material, finish, loadClass }}
        />
        <div className="flex-1">
          <ProductGrid
            products={products}
            total={totalHits}
            isLoading={searchResult.isLoading}
          />
        </div>
      </div>
    </div>
  );
}
