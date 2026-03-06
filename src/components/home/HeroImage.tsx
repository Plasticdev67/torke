"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function HeroImage() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="relative w-full max-w-[600px]"
      style={{
        opacity: loaded ? 1 : 0,
        transform: loaded ? "translateX(0) scale(1)" : "translateX(60px) scale(0.95)",
        transition: "opacity 1s cubic-bezier(0.16,1,0.3,1) 0.3s, transform 1s cubic-bezier(0.16,1,0.3,1) 0.3s",
      }}
    >
      {/* Red glow behind image */}
      <div className="absolute -inset-8 bg-[#C41E3A]/10 rounded-3xl blur-3xl" />

      {/* Main hero — construction action shot */}
      <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/60">
        <Image
          src="/site/hero-tr500-action.png"
          alt="Engineer installing Torke TR-500 chemical anchor into concrete structure"
          width={600}
          height={400}
          className="relative z-10 w-full h-auto"
          priority
          quality={90}
        />
        {/* Gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent z-20" />
        {/* Product label */}
        <div className="absolute bottom-3 left-4 z-30 flex items-center gap-2">
          <div className="w-1 h-4 bg-[#C41E3A]" />
          <span className="text-xs font-mono text-white/90 tracking-wider">TR-500 RESIN ANCHOR</span>
        </div>
      </div>

      {/* Floating product shot — TR-500 cartridge */}
      <div className="absolute -bottom-6 -left-8 z-40 w-36 rounded-lg overflow-hidden border border-[#333] shadow-xl shadow-black/50 bg-[#1A1A1A]">
        <Image
          src="/site/tr-500-product.png"
          alt="Torke TR-500 resin cartridge"
          width={160}
          height={100}
          className="w-full h-auto"
          quality={85}
        />
      </div>
    </div>
  );
}
