import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

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
      <div className="product-card bg-[#1A1A1A] border border-[#333] rounded-lg overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-[#111] overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
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
          {/* Category indicator */}
          {category && (
            <div className="absolute top-3 left-3">
              <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-1 bg-[#C41E3A]/20 text-[#C41E3A] rounded">
                {category.name}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 mb-1.5 group-hover:text-[#C41E3A] transition-colors">
            {name}
          </h3>
          <p className="text-xs text-[#999] font-mono mb-3">{sku}</p>

          {/* Spec badges */}
          <div className="flex flex-wrap gap-1.5">
            {diameter && (
              <Badge
                variant="secondary"
                className="bg-[#2D2D2D] text-[#B3B3B3] border-[#333] text-[10px] px-2 py-0.5"
              >
                {diameter}
              </Badge>
            )}
            {material && (
              <Badge
                variant="secondary"
                className="bg-[#2D2D2D] text-[#B3B3B3] border-[#333] text-[10px] px-2 py-0.5"
              >
                {material}
              </Badge>
            )}
            {loadClass && (
              <Badge
                variant="secondary"
                className="bg-[#C41E3A]/10 text-[#C41E3A] border-[#C41E3A]/20 text-[10px] px-2 py-0.5"
              >
                {loadClass}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
