import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    template: "%s | Torke Blog",
    default: "Technical Blog | Torke",
  },
  description:
    "Technical articles on anchor design, EN 1992-4, and construction fixings engineering from Torke.",
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/design", label: "Design" },
  { href: "/blog", label: "Blog" },
];

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0A0A0A]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#C41E3A] relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-32 bg-[#A8182F] transform skew-x-[-12deg] translate-x-12" />
        <div className="absolute right-24 top-0 h-full w-4 bg-[#B31C34] transform skew-x-[-12deg] translate-x-12" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div
                className="relative w-9 h-9 bg-white/15 border border-white/25 flex items-center justify-center"
                style={{
                  clipPath:
                    "polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)",
                }}
              >
                <span className="text-white font-black text-xl leading-none tracking-tighter">
                  T
                </span>
              </div>
              <span className="ml-2.5 text-white font-bold text-lg tracking-[0.15em] hidden sm:block">
                TORKE<sup className="text-[8px] ml-0.5 align-super opacity-70">&reg;</sup>
              </span>
            </Link>

            <nav className="flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm text-white/80 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-[#222] py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#666]">
              &copy; {new Date().getFullYear()} Torke. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-[#666]">
              <Link href="/products" className="hover:text-white transition-colors">
                Products
              </Link>
              <Link href="/design" className="hover:text-white transition-colors">
                Design Tool
              </Link>
              <Link href="/blog" className="hover:text-white transition-colors">
                Blog
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
