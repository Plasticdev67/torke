"use client";

import { useState } from "react";
import type { PostMeta } from "@/lib/mdx";
import { BlogCard } from "./BlogCard";

const categories = [
  { value: "all", label: "All" },
  { value: "technical-guide", label: "Technical Guide" },
  { value: "product-comparison", label: "Product Comparison" },
  { value: "specification-guidance", label: "Specification Guidance" },
  { value: "eurocode-explainer", label: "Eurocode Explainer" },
];

export function BlogCategoryFilter({ posts }: { posts: PostMeta[] }) {
  const [active, setActive] = useState("all");

  const filtered =
    active === "all" ? posts : posts.filter((p) => p.category === active);

  return (
    <>
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActive(cat.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              active === cat.value
                ? "bg-[#C41E3A] text-white"
                : "bg-[#1A1A1A] text-[#999] hover:text-white border border-[#333]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-[#666] py-12">
          No articles in this category yet.
        </p>
      )}
    </>
  );
}
