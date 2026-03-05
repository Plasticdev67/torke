"use client";

import { useState } from "react";
import { FileText, Download, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Resource {
  id: string;
  name: string;
  slug: string;
  sku: string;
  datasheetUrl: string;
  etaReference: string | null;
  category: string;
  categoryLabel: string;
  subcategory: string | null;
}

interface CategoryOption {
  slug: string;
  label: string;
}

interface ResourceFilterProps {
  resources: Resource[];
  categoryOptions: CategoryOption[];
}

export function ResourceFilter({ resources, categoryOptions }: ResourceFilterProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = resources.filter((r) => {
    if (activeCategory && r.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        (r.etaReference?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  // Group filtered results by category
  const grouped = new Map<string, Resource[]>();
  for (const r of filtered) {
    const existing = grouped.get(r.category) ?? [];
    existing.push(r);
    grouped.set(r.category, existing);
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or ETA reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-[#C41E3A]/50 transition-colors"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !activeCategory
                ? "bg-[#C41E3A] text-white"
                : "bg-[#1A1A1A] text-[#999] border border-[#333] hover:text-white"
            }`}
          >
            All ({resources.length})
          </button>
          {categoryOptions.map((cat) => {
            const count = resources.filter((r) => r.category === cat.slug).length;
            return (
              <button
                key={cat.slug}
                onClick={() =>
                  setActiveCategory(activeCategory === cat.slug ? null : cat.slug)
                }
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === cat.slug
                    ? "bg-[#C41E3A] text-white"
                    : "bg-[#1A1A1A] text-[#999] border border-[#333] hover:text-white"
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-[#333] mx-auto mb-4" />
          <p className="text-[#999]">No resources found matching your criteria.</p>
        </div>
      ) : (
        [...grouped.entries()].map(([catSlug, catResources]) => {
          const catLabel =
            categoryOptions.find((c) => c.slug === catSlug)?.label ?? catSlug;
          return (
            <div key={catSlug} className="mb-10">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="inline-block w-1 h-5 bg-[#C41E3A]" />
                {catLabel}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {catResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="bg-[#1A1A1A] border border-[#333] rounded-lg p-5 hover:border-[#C41E3A]/30 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate group-hover:text-[#C41E3A] transition-colors">
                          {resource.name}
                        </h3>
                        <p className="text-xs text-[#666] font-mono mt-0.5">
                          {resource.sku}
                        </p>
                      </div>
                      <FileText className="h-5 w-5 text-[#333] shrink-0 ml-2" />
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <Badge className="bg-[#C41E3A]/10 text-[#C41E3A] border-[#C41E3A]/20 text-[10px] px-2 py-0.5">
                        Datasheet
                      </Badge>
                      {resource.etaReference && (
                        <Badge className="bg-[#2D2D2D] text-[#B3B3B3] border-[#333] text-[10px] px-2 py-0.5">
                          ETA: {resource.etaReference}
                        </Badge>
                      )}
                      {resource.subcategory && (
                        <Badge className="bg-[#2D2D2D] text-[#B3B3B3] border-[#333] text-[10px] px-2 py-0.5">
                          {resource.subcategory}
                        </Badge>
                      )}
                    </div>

                    <a
                      href={resource.datasheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-1.5 text-sm text-[#C41E3A] hover:text-[#D6354F] font-medium transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download PDF
                    </a>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
