"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search,
  Menu,
  User,
  ChevronDown,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileNav } from "./MobileNav";
import { SearchBar } from "@/components/products/SearchBar";
import { TorkeLogo } from "@/components/brand/TorkeLogo";

const categories = [
  {
    name: "Chemical Anchors",
    slug: "chemical-anchors",
    description: "Injection resins, anchor rods, and accessories",
  },
  {
    name: "Mechanical Anchors",
    slug: "mechanical-anchors",
    description: "Expansion anchors, through bolts, and screw anchors",
  },
  {
    name: "General Fixings",
    slug: "general-fixings",
    description: "Shot fired fixings, drill bits, and diamond blades",
  },
];

export function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {/* Red brand bar — clean, bold, packaging-matched */}
      <div className="bg-[#C41E3A]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="shrink-0">
              <TorkeLogo size="md" variant="light" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-white/80 hover:text-white hover:bg-white/10 transition-premium"
                  >
                  Products
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-72 bg-[#1A1A1A] border-[#333]"
              >
                <DropdownMenuItem asChild>
                  <Link
                    href="/products"
                    className="cursor-pointer text-white hover:bg-[#2D2D2D] focus:bg-[#2D2D2D] focus:text-white"
                  >
                    <div>
                      <div className="font-medium">All Products</div>
                      <div className="text-xs text-[#999]">
                        Browse the full catalogue
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <div className="h-px bg-[#333] my-1" />
                {categories.map((cat) => (
                  <DropdownMenuItem key={cat.slug} asChild>
                    <Link
                      href={`/products?category=${cat.slug}`}
                      className="cursor-pointer text-white hover:bg-[#2D2D2D] focus:bg-[#2D2D2D] focus:text-white"
                    >
                      <div>
                        <div className="font-medium">{cat.name}</div>
                        <div className="text-xs text-[#999]">
                          {cat.description}
                        </div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

              <Button
                variant="ghost"
                asChild
                className="text-white/80 hover:text-white hover:bg-white/10 transition-premium"
              >
                <Link href="/design">TRACE</Link>
              </Button>
              <Button
                variant="ghost"
                asChild
                className="text-white/80 hover:text-white hover:bg-white/10 transition-premium"
              >
                <Link href="/blog">Blog</Link>
              </Button>
              <Button
                variant="ghost"
                asChild
                className="text-white/80 hover:text-white hover:bg-white/10 transition-premium"
              >
                <Link href="/about">About</Link>
              </Button>
              <Button
                variant="ghost"
                asChild
                className="text-white/80 hover:text-white hover:bg-white/10 transition-premium"
              >
                <Link href="/contact">Contact</Link>
              </Button>
            </nav>

            {/* Search Bar — Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <SearchBar />
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Mobile search toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white/80 hover:text-white hover:bg-white/10"
                asChild
              >
                <Link href="/search">
                  <Search className="h-5 w-5" />
                </Link>
              </Button>

              {/* Account */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex text-white/80 hover:text-white hover:bg-white/10"
                asChild
              >
                <Link href="/login">
                  <LogIn className="h-5 w-5" />
                </Link>
              </Button>

              {/* Mobile menu trigger */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Thin accent line below header */}
      <div className="h-[2px] bg-gradient-to-r from-[#A8182F] via-[#C41E3A] to-[#A8182F]" />

      {/* Mobile Nav */}
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
    </header>
  );
}
