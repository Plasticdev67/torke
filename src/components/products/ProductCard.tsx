import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface ProductCardProps {
  name: string;
  slug: string;
  sku: string;
  diameter?: string | null;
  material?: string | null;
  loadClass?: string | null;
  images?: string[] | null;
  category?: { name: string; slug: string } | null;
}

export function ProductCard({
  name,
  slug,
  sku,
  diameter,
  material,
  loadClass,
  images,
  category,
}: ProductCardProps) {
  const imageUrl = images?.[0] ? `/${images[0].replace(/\\/g, "/").replace(/^data\//, "")}` : null;

  return (
    <Link href={`/products/${slug}`} className="group block">
      <div className="product-card bg-[#1A1A1A] border border-[#333] rounded-lg overflow-hidden transition-all duration-300 hover:border-[#C41E3A]/40 hover:shadow-[0_0_20px_rgba(196,30,58,0.08)] hover:-translate-y-1">
        {/* Image area with gradient background */}
        <div className="relative aspect-[4/3] bg-gradient-to-b from-[#151515] to-[#0A0A0A] overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-contain p-6 group-hover:scale-105 transition-transform duration-500 ease-out"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto bg-[#2D2D2D] rounded-lg flex items-center justify-center mb-2">
                  <span className="text-[#666] text-lg font-mono">T</span>
                </div>
                <span className="text-xs text-[#666]">No image</span>
              </div>
            </div>
          )}
        </div>

        {/* Red accent separator */}
        <div className="px-4 pt-4">
          <div className="h-[1px] w-8 bg-[#C41E3A] mb-3 group-hover:w-12 transition-all duration-300" />
        </div>

        {/* Info */}
        <div className="px-4 pb-4">
          {/* Category */}
          {category && (
            <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-[#999] mb-1.5 max-w-full truncate">
              {category.name}
            </p>
          )}

          {/* Product name */}
          <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 mb-1.5 group-hover:text-[#C41E3A] transition-colors duration-200">
            {toTitleCase(name)}
          </h3>

          {/* SKU */}
          <p className="text-[11px] text-[#666] font-mono mb-3">SKU: {sku}</p>

          {/* Spec badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {diameter && (
              <Badge
                variant="outline"
                className="bg-transparent text-[#999] border-[#333] text-[9px] px-2 py-0.5 rounded-sm font-normal"
              >
                {diameter}
              </Badge>
            )}
            {material && (
              <Badge
                variant="outline"
                className="bg-transparent text-[#999] border-[#333] text-[9px] px-2 py-0.5 rounded-sm font-normal"
              >
                {material}
              </Badge>
            )}
            {loadClass && (
              <Badge
                variant="outline"
                className="bg-transparent text-[#C41E3A] border-[#C41E3A]/30 text-[9px] px-2 py-0.5 rounded-sm font-normal"
              >
                {loadClass}
              </Badge>
            )}
          </div>

          {/* View Details CTA */}
          <span className="text-[11px] font-medium text-[#C41E3A] opacity-0 group-hover:opacity-100 transition-opacity duration-300 inline-flex items-center gap-1">
            View Details
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="translate-x-0 group-hover:translate-x-0.5 transition-transform duration-300">
              <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
