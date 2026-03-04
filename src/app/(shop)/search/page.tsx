import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "@/components/products/SearchResults";

interface SearchParams {
  q?: string;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  return {
    title: params.q ? `Search: ${params.q}` : "Search Products",
    description: params.q
      ? `Search results for "${params.q}" in the Torke product catalogue.`
      : "Search the Torke product catalogue for construction fixings.",
  };
}

export default async function SearchPage() {
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
          <li className="text-white font-medium">Search</li>
        </ol>
      </nav>

      <Suspense
        fallback={
          <div>
            <div className="mb-6">
              <div className="h-8 w-64 skeleton-dark rounded mb-2" />
              <div className="h-4 w-24 skeleton-dark rounded" />
            </div>
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
        }
      >
        <SearchResults />
      </Suspense>
    </div>
  );
}
