import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductCatalogueClient } from "./catalogue-client";

interface SearchParams {
  category?: string;
  diameter?: string;
  material?: string;
  finish?: string;
  loadClass?: string;
  page?: string;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const categoryNames: Record<string, string> = {
    "chemical-anchors": "Chemical Anchors",
    "mechanical-anchors": "Mechanical Anchors",
    "general-fixings": "General Fixings",
  };

  const categoryName = params.category
    ? categoryNames[params.category]
    : null;

  return {
    title: categoryName ? `${categoryName} | Products` : "Products",
    description: categoryName
      ? `Browse Torke ${categoryName} - professional construction fixings with full batch traceability.`
      : "Browse the full Torke product catalogue - chemical anchors, mechanical anchors, and general fixings.",
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <a
              href="/"
              className="text-[#999] hover:text-white transition-premium"
            >
              Home
            </a>
          </li>
          <li className="text-[#666]">/</li>
          <li className="text-white font-medium">Products</li>
          {params.category && (
            <>
              <li className="text-[#666]">/</li>
              <li className="text-[#C41E3A] font-medium capitalize">
                {params.category.replace(/-/g, " ")}
              </li>
            </>
          )}
        </ol>
      </nav>

      <Suspense
        fallback={
          <div className="flex gap-8">
            <div className="hidden lg:block w-64 shrink-0">
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}>
                    <div className="h-4 w-20 skeleton-dark rounded mb-3" />
                    <div className="space-y-2">
                      <div className="h-8 skeleton-dark rounded" />
                      <div className="h-8 skeleton-dark rounded" />
                      <div className="h-8 skeleton-dark rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-[#1A1A1A] border border-[#333] rounded-lg overflow-hidden"
                  >
                    <div className="aspect-[4/3] skeleton-dark" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 w-3/4 skeleton-dark rounded" />
                      <div className="h-3 w-1/3 skeleton-dark rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      >
        <ProductCatalogueClient
          initialCategory={params.category}
          initialDiameter={params.diameter}
          initialMaterial={params.material}
          initialFinish={params.finish}
          initialLoadClass={params.loadClass}
        />
      </Suspense>
    </div>
  );
}
