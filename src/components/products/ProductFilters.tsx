"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface FacetDistribution {
  [key: string]: Record<string, number>;
}

interface ProductFiltersProps {
  facets: FacetDistribution;
  activeFilters?: {
    category?: string;
    diameter?: string;
    material?: string;
    finish?: string;
    loadClass?: string;
  };
}

interface FilterSectionProps {
  title: string;
  paramName: string;
  options: Record<string, number>;
  activeValue?: string;
  onSelect: (paramName: string, value: string | null) => void;
}

function FilterSection({
  title,
  paramName,
  options,
  activeValue,
  onSelect,
}: FilterSectionProps) {
  const entries = Object.entries(options).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  if (entries.length === 0) return null;

  return (
    <div className="mb-6">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#999] mb-3">
        {title}
      </h4>
      <div className="space-y-1">
        {entries.map(([value, count]) => {
          const isActive = activeValue === value;
          return (
            <button
              key={value}
              onClick={() => onSelect(paramName, isActive ? null : value)}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-premium",
                isActive
                  ? "bg-[#C41E3A]/10 text-[#C41E3A]"
                  : "text-[#B3B3B3] hover:bg-[#2D2D2D] hover:text-white"
              )}
            >
              <span className="truncate">{value}</span>
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full ml-2 shrink-0",
                  isActive
                    ? "bg-[#C41E3A]/20 text-[#C41E3A]"
                    : "bg-[#2D2D2D] text-[#666]"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FilterContent({
  facets,
  activeFilters,
  onSelect,
  onClearAll,
}: {
  facets: FacetDistribution;
  activeFilters: ProductFiltersProps["activeFilters"];
  onSelect: (paramName: string, value: string | null) => void;
  onClearAll: () => void;
}) {
  const hasActiveFilters = Object.values(activeFilters || {}).some(Boolean);

  return (
    <div>
      {hasActiveFilters && (
        <div className="mb-4">
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 text-xs text-[#C41E3A] hover:text-[#D6354F] transition-premium"
          >
            <X className="h-3 w-3" />
            Clear all filters
          </button>
        </div>
      )}

      {facets.categorySlug &&
        Object.keys(facets.categorySlug).length > 0 && (
          <FilterSection
            title="Category"
            paramName="category"
            options={facets.categorySlug}
            activeValue={activeFilters?.category}
            onSelect={onSelect}
          />
        )}

      {facets.diameter && Object.keys(facets.diameter).length > 0 && (
        <FilterSection
          title="Diameter"
          paramName="diameter"
          options={facets.diameter}
          activeValue={activeFilters?.diameter}
          onSelect={onSelect}
        />
      )}

      {facets.material && Object.keys(facets.material).length > 0 && (
        <FilterSection
          title="Material"
          paramName="material"
          options={facets.material}
          activeValue={activeFilters?.material}
          onSelect={onSelect}
        />
      )}

      {facets.finish && Object.keys(facets.finish).length > 0 && (
        <FilterSection
          title="Finish"
          paramName="finish"
          options={facets.finish}
          activeValue={activeFilters?.finish}
          onSelect={onSelect}
        />
      )}

      {facets.loadClass && Object.keys(facets.loadClass).length > 0 && (
        <FilterSection
          title="Load Class"
          paramName="loadClass"
          options={facets.loadClass}
          activeValue={activeFilters?.loadClass}
          onSelect={onSelect}
        />
      )}
    </div>
  );
}

export function ProductFilters({
  facets,
  activeFilters = {},
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleSelect(paramName: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(paramName, value);
    } else {
      params.delete(paramName);
    }
    // Reset offset when filters change
    params.delete("offset");
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function handleClearAll() {
    const params = new URLSearchParams();
    // Keep the search query if present
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  const hasActiveFilters = Object.values(activeFilters).some(Boolean);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-20">
          <h3 className="text-white font-semibold text-sm mb-4">Filters</h3>
          <FilterContent
            facets={facets}
            activeFilters={activeFilters}
            onSelect={handleSelect}
            onClearAll={handleClearAll}
          />
        </div>
      </aside>

      {/* Mobile filter button + sheet */}
      <div className="lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-[#333] bg-[#1A1A1A] text-[#B3B3B3] hover:text-white"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1.5 w-5 h-5 rounded-full bg-[#C41E3A] text-white text-xs flex items-center justify-center">
                  {Object.values(activeFilters).filter(Boolean).length}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-80 bg-[#111] border-r border-[#333]"
          >
            <SheetHeader>
              <SheetTitle className="text-white">Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6 px-1">
              <FilterContent
                facets={facets}
                activeFilters={activeFilters}
                onSelect={(name, value) => {
                  handleSelect(name, value);
                  // Don't close on mobile — let user apply multiple filters
                }}
                onClearAll={() => {
                  handleClearAll();
                  setMobileOpen(false);
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
