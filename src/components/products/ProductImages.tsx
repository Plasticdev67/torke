"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductImagesProps {
  images: string[];
  productName: string;
}

export function ProductImages({ images, productName }: ProductImagesProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Normalize backslashes to forward slashes and prepend /
  const normalizedImages = images.map((img) =>
    "/" + img.replace(/\\/g, "/").replace(/^data\//, "")
  );

  if (normalizedImages.length === 0) {
    return (
      <div className="aspect-square bg-[#111] rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-[#1A1A1A] rounded-lg flex items-center justify-center mb-3">
            <span className="text-[#444] text-3xl font-bold">T</span>
          </div>
          <p className="text-sm text-[#666]">No image available</p>
        </div>
      </div>
    );
  }

  const currentImage = normalizedImages[selectedIndex] || normalizedImages[0]!;

  return (
    <div>
      {/* Main image */}
      <div className="relative aspect-square bg-[#111] rounded-lg overflow-hidden group cursor-crosshair mb-3">
        <Image
          src={currentImage}
          alt={`${productName} - Image ${selectedIndex + 1}`}
          fill
          className="object-contain p-6 transition-transform duration-300 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, 60vw"
          priority
        />
      </div>

      {/* Thumbnail strip */}
      {normalizedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {normalizedImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative w-16 h-16 rounded-md overflow-hidden shrink-0 border-2 transition-all duration-200",
                selectedIndex === index
                  ? "border-[#C41E3A] shadow-md shadow-[#C41E3A]/20"
                  : "border-[#333] hover:border-[#555]"
              )}
            >
              <Image
                src={img}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                className="object-contain p-1"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
