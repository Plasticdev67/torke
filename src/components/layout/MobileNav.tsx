"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChevronRight, Search, LogIn, User } from "lucide-react";

const categories = [
  { name: "Chemical Anchors", slug: "chemical-anchors" },
  { name: "Mechanical Anchors", slug: "mechanical-anchors" },
  { name: "General Fixings", slug: "general-fixings" },
];

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-80 bg-[#111] border-l border-[#333] p-0"
      >
        <SheetHeader className="p-6 border-b border-[#222]">
          <SheetTitle className="text-white flex items-center gap-2">
            <div className="w-7 h-7 bg-[#C41E3A] flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            TORKE
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col py-4">
          {/* Search link */}
          <Link
            href="/search"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 px-6 py-3.5 text-[#B3B3B3] hover:text-white hover:bg-[#1A1A1A] transition-premium"
          >
            <Search className="h-5 w-5" />
            <span>Search Products</span>
          </Link>

          <div className="h-px bg-[#222] my-2 mx-6" />

          {/* All Products */}
          <Link
            href="/products"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-between px-6 py-3.5 text-white font-medium hover:bg-[#1A1A1A] transition-premium"
          >
            <span>All Products</span>
            <ChevronRight className="h-4 w-4 text-[#666]" />
          </Link>

          {/* Categories */}
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-between px-6 py-3.5 text-[#B3B3B3] hover:text-white hover:bg-[#1A1A1A] transition-premium pl-10"
            >
              <span>{cat.name}</span>
              <ChevronRight className="h-4 w-4 text-[#666]" />
            </Link>
          ))}

          <div className="h-px bg-[#222] my-2 mx-6" />

          <Link
            href="/design"
            onClick={() => onOpenChange(false)}
            className="flex items-center px-6 py-3.5 text-[#B3B3B3] hover:text-white hover:bg-[#1A1A1A] transition-premium"
          >
            Design Tool
          </Link>
          <Link
            href="/blog"
            onClick={() => onOpenChange(false)}
            className="flex items-center px-6 py-3.5 text-[#B3B3B3] hover:text-white hover:bg-[#1A1A1A] transition-premium"
          >
            Blog
          </Link>
          <Link
            href="/about"
            onClick={() => onOpenChange(false)}
            className="flex items-center px-6 py-3.5 text-[#B3B3B3] hover:text-white hover:bg-[#1A1A1A] transition-premium"
          >
            About
          </Link>
          <Link
            href="/contact"
            onClick={() => onOpenChange(false)}
            className="flex items-center px-6 py-3.5 text-[#B3B3B3] hover:text-white hover:bg-[#1A1A1A] transition-premium"
          >
            Contact
          </Link>

          <div className="h-px bg-[#222] my-2 mx-6" />

          <Link
            href="/login"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 px-6 py-3.5 text-[#B3B3B3] hover:text-white hover:bg-[#1A1A1A] transition-premium"
          >
            <LogIn className="h-5 w-5" />
            <span>Sign In</span>
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
