"use client";

import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductFilters } from "@/components/products/ProductFilters";
import { CategoryNav } from "@/components/products/CategoryNav";

interface ProductCatalogueClientProps {
  initialCategory?: string;
  initialDiameter?: string;
  initialMaterial?: string;
  initialFinish?: string;
  initialLoadClass?: string;
}

export function ProductCatalogueClient({
  initialCategory,
  initialDiameter,
  initialMaterial,
  initialFinish,
  initialLoadClass,
}: ProductCatalogueClientProps) {
  const searchParams = useSearchParams();

  // Read current filters from URL (reactive)
  const category = searchParams.get("category") || initialCategory || undefined;
  const diameter = searchParams.get("diameter") || initialDiameter || undefined;
  const material = searchParams.get("material") || initialMaterial || undefined;
  const finish = searchParams.get("finish") || initialFinish || undefined;
  const loadClass = searchParams.get("loadClass") || initialLoadClass || undefined;

  // Try Meilisearch first (for facets), fall back to DB query
  const searchResult = trpc.search.products.useQuery(
    {
      query: "",
      filters: {
        categorySlug: category,
        diameter,
        material,
        finish,
        loadClass,
      },
      limit: 100,
    },
    { staleTime: 30000 }
  );

  // Also query DB directly as fallback
  const dbResult = trpc.products.list.useQuery(
    {
      categorySlug: category,
      diameter,
      material,
      finish,
      loadClass,
      limit: 100,
    },
    {
      staleTime: 30000,
    }
  );

  // Prefer Meilisearch results for facets; use DB data as products fallback
  const useMeili =
    searchResult.data && searchResult.data.hits.length > 0;

  const products = useMeili
    ? searchResult.data.hits.map((hit) => ({
        name: hit.name,
        slug: hit.slug,
        sku: hit.sku,
        diameter: hit.diameter ?? null,
        material: hit.material ?? null,
        loadClass: hit.loadClass ?? null,
        images: hit.images ?? null,
        category: hit.categorySlug
          ? { name: hit.categorySlug.replace(/-/g, " "), slug: hit.categorySlug }
          : null,
      }))
    : (dbResult.data?.items ?? []).map((item) => ({
        name: item.name,
        slug: item.slug,
        sku: item.sku,
        diameter: item.diameter,
        material: item.material,
        loadClass: item.loadClass,
        images: item.images,
        category: item.category
          ? { name: item.category.name, slug: item.category.slug }
          : null,
      }));

  const facets = useMeili
    ? searchResult.data.facetDistribution
    : {};

  const total = useMeili
    ? searchResult.data.totalHits
    : dbResult.data?.total ?? 0;

  const isLoading = dbResult.isLoading;

  return (
    <div>
      {/* Category navigation bar */}
      <div className="mb-6">
        <CategoryNav />
      </div>

      <div className="flex gap-8">
        {/* Filters sidebar */}
        <ProductFilters
          facets={facets}
          activeFilters={{
            category,
            diameter,
            material,
            finish,
            loadClass,
          }}
        />

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          <ProductGrid
            products={products}
            total={total}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
