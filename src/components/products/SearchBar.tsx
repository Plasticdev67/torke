"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { trpc } from "@/lib/trpc";
import Link from "next/link";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 200);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const searchResults = trpc.search.products.useQuery(
    { query: debouncedQuery, limit: 5 },
    {
      enabled: debouncedQuery.length >= 2,
      staleTime: 30000,
    }
  );

  const hits = searchResults.data?.hits || [];
  const totalHits = searchResults.data?.totalHits || 0;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, hits.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && selectedIndex < hits.length) {
        const hit = hits[selectedIndex];
        if (hit) {
          router.push(`/products/${hit.slug}`);
          setIsOpen(false);
        }
      } else if (selectedIndex === hits.length && query) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
        setIsOpen(false);
      } else if (query) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
        setIsOpen(false);
      }
    }
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search products, SKUs, specifications..."
          className="w-full h-9 pl-9 pr-8 bg-white/15 border border-white/20 rounded-md text-sm text-white placeholder:text-white/50 focus:outline-none focus:bg-white/20 focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-premium"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && debouncedQuery.length >= 2 && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-1 left-0 right-0 bg-[#1A1A1A] border border-[#333] rounded-md shadow-xl shadow-black/40 overflow-hidden z-50"
        >
          {searchResults.isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-[#666]" />
            </div>
          ) : hits.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-[#666]">
              No products found for &ldquo;{debouncedQuery}&rdquo;
            </div>
          ) : (
            <>
              {hits.map((hit, index) => (
                <Link
                  key={hit.slug}
                  href={`/products/${hit.slug}`}
                  onClick={() => setIsOpen(false)}
                  className={`search-result-item flex items-center gap-3 px-4 py-3 hover:bg-[#2D2D2D] transition-premium ${
                    selectedIndex === index ? "bg-[#2D2D2D]" : ""
                  }`}
                >
                  {/* Thumbnail placeholder */}
                  <div className="w-10 h-10 bg-[#2D2D2D] rounded flex-shrink-0 flex items-center justify-center">
                    <span className="text-[10px] text-[#666] font-mono">
                      IMG
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">
                      {hit.name}
                    </div>
                    <div className="text-xs text-[#999] font-mono">
                      {hit.sku}
                    </div>
                  </div>
                </Link>
              ))}
              {totalHits > 5 && (
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-center px-4 py-3 text-sm text-[#C41E3A] hover:bg-[#2D2D2D] border-t border-[#333] transition-premium ${
                    selectedIndex === hits.length ? "bg-[#2D2D2D]" : ""
                  }`}
                >
                  View all {totalHits} results for &ldquo;{query}&rdquo;
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
