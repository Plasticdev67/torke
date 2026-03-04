"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const categories = [
  { name: "All Products", slug: "", count: 32 },
  { name: "Chemical Anchors", slug: "chemical-anchors", count: 7 },
  { name: "Mechanical Anchors", slug: "mechanical-anchors", count: 15 },
  { name: "General Fixings", slug: "general-fixings", count: 10 },
];

export function CategoryNav() {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "";

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.slug;
        return (
          <Link
            key={cat.slug}
            href={
              cat.slug ? `/products?category=${cat.slug}` : "/products"
            }
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-premium",
              isActive
                ? "bg-[#C41E3A] text-white"
                : "text-[#B3B3B3] hover:text-white hover:bg-[#1A1A1A]"
            )}
          >
            {cat.name}
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-[#2D2D2D] text-[#999]"
              )}
            >
              {cat.count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
