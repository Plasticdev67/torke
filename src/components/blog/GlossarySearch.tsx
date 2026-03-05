"use client";

import { useState } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

export interface GlossaryTerm {
  term: string;
  definition: string;
  relatedTerms?: string[];
  category: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  concrete: "Concrete",
  anchors: "Anchors",
  design: "Design",
  testing: "Testing",
  standards: "Standards",
};

const CATEGORY_ORDER = ["anchors", "design", "concrete", "standards", "testing"];

interface GlossarySearchProps {
  terms: GlossaryTerm[];
}

export function GlossarySearch({ terms }: GlossarySearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());

  const toggleTerm = (term: string) => {
    setExpandedTerms((prev) => {
      const next = new Set(prev);
      if (next.has(term)) {
        next.delete(term);
      } else {
        next.add(term);
      }
      return next;
    });
  };

  const filtered = terms.filter((t) => {
    if (activeCategory && t.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sort filtered terms alphabetically
  const sorted = [...filtered].sort((a, b) => a.term.localeCompare(b.term));

  // Get unique categories in defined order
  const availableCategories = CATEGORY_ORDER.filter((cat) =>
    terms.some((t) => t.category === cat)
  );

  return (
    <>
      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
          <input
            type="text"
            placeholder="Search terms or definitions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-[#C41E3A]/50 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !activeCategory
                ? "bg-[#C41E3A] text-white"
                : "bg-[#1A1A1A] text-[#999] border border-[#333] hover:text-white"
            }`}
          >
            All
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setActiveCategory(activeCategory === cat ? null : cat)
              }
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-[#C41E3A] text-white"
                  : "bg-[#1A1A1A] text-[#999] border border-[#333] hover:text-white"
              }`}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-[#666] mb-4">
        {sorted.length} term{sorted.length !== 1 ? "s" : ""} found
      </p>

      {/* Terms list */}
      {sorted.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#999]">No terms found matching your search.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((t) => {
            const isExpanded = expandedTerms.has(t.term);
            return (
              <div
                key={t.term}
                className="bg-[#1A1A1A] border border-[#333] rounded-lg overflow-hidden hover:border-[#C41E3A]/30 transition-colors"
              >
                <button
                  onClick={() => toggleTerm(t.term)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-semibold text-white">
                      {t.term}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[#C41E3A] bg-[#C41E3A]/10 px-2 py-0.5 rounded shrink-0">
                      {CATEGORY_LABELS[t.category] ?? t.category}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[#666] shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#666] shrink-0 ml-2" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-[#333]">
                    <p className="text-sm text-[#B3B3B3] leading-relaxed mt-3">
                      {t.definition}
                    </p>
                    {t.relatedTerms && t.relatedTerms.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="text-xs text-[#666]">Related:</span>
                        {t.relatedTerms.map((rt) => (
                          <button
                            key={rt}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchQuery(rt);
                              setActiveCategory(null);
                            }}
                            className="text-xs text-[#C41E3A] hover:text-[#D6354F] underline underline-offset-2 transition-colors"
                          >
                            {rt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
