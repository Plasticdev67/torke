import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Shield,
  Layers,
  QrCode,
  Award,
  CheckCircle2,
  FlaskConical,
  Ruler,
  Crosshair,
  Hammer,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/server/db";
import {
  products,
  categories as categoriesTable,
} from "@/server/db/schema/products";
import { eq, asc, count } from "drizzle-orm";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { AnimatedCounter } from "@/components/home/AnimatedCounter";
import { HeroImage } from "@/components/home/HeroImage";

export default async function HomePage() {
  let featuredProducts: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    images: string[] | null;
    pricePence: number | null;
    diameter: string | null;
    material: string | null;
    categoryName: string | null;
  }[] = [];

  let categoryCounts: {
    name: string;
    slug: string;
    description: string | null;
    productCount: number;
  }[] = [];

  try {
    featuredProducts = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        sku: products.sku,
        images: products.images,
        pricePence: products.pricePence,
        diameter: products.diameter,
        material: products.material,
        categoryName: categoriesTable.name,
      })
      .from(products)
      .leftJoin(categoriesTable, eq(products.categoryId, categoriesTable.id))
      .where(eq(products.isActive, true))
      .orderBy(asc(products.createdAt))
      .limit(4);

    categoryCounts = await db
      .select({
        name: categoriesTable.name,
        slug: categoriesTable.slug,
        description: categoriesTable.description,
        productCount: count(products.id),
      })
      .from(categoriesTable)
      .leftJoin(products, eq(categoriesTable.id, products.categoryId))
      .groupBy(
        categoriesTable.id,
        categoriesTable.name,
        categoriesTable.slug,
        categoriesTable.description
      )
      .orderBy(asc(categoriesTable.sortOrder));
  } catch {
    // Fallback if DB is unavailable
  }

  const displayCategories =
    categoryCounts.length > 0
      ? categoryCounts
      : [
          {
            name: "Chemical Anchors",
            slug: "chemical-anchors",
            description:
              "High-performance epoxy and hybrid resin systems for heavy-duty anchoring in concrete and masonry.",
            productCount: 7,
          },
          {
            name: "Mechanical Anchors",
            slug: "mechanical-anchors",
            description:
              "Expansion anchors, through bolts, and screw anchors engineered for reliable concrete connections.",
            productCount: 15,
          },
          {
            name: "General Fixings",
            slug: "general-fixings",
            description:
              "Shot fired fixings, drill bits, diamond blades, and corebits for professional installation.",
            productCount: 10,
          },
        ];

  const categoryIcons: Record<string, typeof Hammer> = {
    "chemical-anchors": FlaskConical,
    "mechanical-anchors": Hammer,
    "general-fixings": Wrench,
  };

  const certifications = [
    {
      icon: Award,
      title: "ETA Certified",
      description: "European Technical Assessments for structural fixings",
    },
    {
      icon: CheckCircle2,
      title: "CE Marked",
      description: "Full compliance with EU Construction Products Regulation",
    },
    {
      icon: Shield,
      title: "EN 10204 3.1",
      description:
        "Mill test certificates with every batch for full material traceability",
    },
    {
      icon: Ruler,
      title: "EN 1992-4",
      description:
        "Design data verified to the Eurocode anchor design standard",
    },
    {
      icon: CheckCircle2,
      title: "UKCA Marked",
      description:
        "UK Conformity Assessed for the British construction market",
    },
    {
      icon: Crosshair,
      title: "ISO 9001",
      description:
        "Quality management system certified across all operations",
    },
  ];

  return (
    <div>
      {/* ================================================================
          HERO SECTION — Split layout with packaging image
          ================================================================ */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#0D0D0D] to-[#0A0A0A]" />

        {/* Blueprint grid */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px),
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: "100px 100px, 100px 100px, 20px 20px, 20px 20px",
            }}
          />
        </div>

        {/* Diagonal red wash — packaging DNA */}
        <div className="absolute -right-20 top-0 h-full w-[50%] bg-gradient-to-l from-[#C41E3A]/[0.06] to-transparent transform skew-x-[-12deg] translate-x-[10%]" />
        <div className="absolute right-[12%] top-[-10%] h-[130%] w-[3px] bg-[#C41E3A]/15 transform skew-x-[-12deg]" />
        <div className="absolute right-[28%] top-[-10%] h-[130%] w-[1px] bg-[#C41E3A]/8 transform skew-x-[-12deg]" />

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#0A0A0A] to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left — Text content */}
            <div>
              {/* Red accent bar */}
              <div className="flex items-center gap-4 mb-8 hero-entrance" style={{ animationDelay: "0s" }}>
                <div className="w-16 h-1 bg-[#C41E3A]" />
                <span className="text-xs font-mono text-[#C41E3A] tracking-[0.3em] uppercase">
                  Precision Construction Fixings
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white tracking-tight leading-[0.92] mb-8 hero-entrance" style={{ animationDelay: "0.1s" }}>
                Engineered
                <br />
                to Hold.
                <br />
                <span className="text-[#C41E3A]">Proven to Last.</span>
              </h1>

              <p className="text-lg sm:text-xl text-[#999] mb-12 max-w-xl leading-relaxed font-medium hero-entrance" style={{ animationDelay: "0.2s" }}>
                ETA-certified structural fixings with mill-to-site batch
                traceability. Every product, every batch, every certificate
                — verified and accessible via QR code.
              </p>

              {/* Animated stat counters */}
              <div className="flex flex-wrap gap-8 sm:gap-12 mb-12 hero-entrance" style={{ animationDelay: "0.3s" }}>
                <div className="border-l-2 border-[#C41E3A] pl-4">
                  <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                    <AnimatedCounter end={32} suffix="+" />
                  </div>
                  <div className="text-xs text-[#666] font-mono uppercase tracking-wider mt-1">
                    Products
                  </div>
                </div>
                <div className="border-l-2 border-[#C41E3A]/60 pl-4">
                  <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                    EN 10204
                  </div>
                  <div className="text-xs text-[#666] font-mono uppercase tracking-wider mt-1">
                    3.1 Certified
                  </div>
                </div>
                <div className="border-l-2 border-[#C41E3A]/40 pl-4">
                  <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                    <AnimatedCounter end={100} suffix="%" />
                  </div>
                  <div className="text-xs text-[#666] font-mono uppercase tracking-wider mt-1">
                    Batch Traced
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 hero-entrance" style={{ animationDelay: "0.4s" }}>
                <Button
                  asChild
                  size="lg"
                  className="bg-[#C41E3A] hover:bg-[#D6354F] text-white font-semibold px-8 h-14 text-base shadow-lg shadow-[#C41E3A]/25 hover:shadow-[#C41E3A]/40 transition-all duration-300"
                >
                  <Link href="/products">
                    Browse Products
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-[#333] bg-transparent text-white hover:bg-[#1A1A1A] hover:border-[#C41E3A]/30 font-semibold px-8 h-14 text-base"
                >
                  <Link href="/design">
                    Torke TRACE Calculator
                    <Crosshair className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right — Packaging hero image */}
            <div className="hidden lg:flex justify-center lg:justify-end">
              <HeroImage />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          TRUST STRIP — Certification badges horizontal bar
          ================================================================ */}
      <section className="relative bg-[#0D0D0D] border-y border-[#1A1A1A]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between gap-6 overflow-x-auto scrollbar-hide">
            <span className="text-[10px] font-mono text-[#555] uppercase tracking-[0.2em] whitespace-nowrap shrink-0">
              Certified to
            </span>
            <div className="flex items-center gap-8 sm:gap-12">
              {["ETA Certified", "CE Marked", "UKCA", "EN 10204 3.1", "EN 1992-4", "ISO 9001"].map(
                (cert) => (
                  <span
                    key={cert}
                    className="text-xs sm:text-sm font-semibold text-[#666] whitespace-nowrap tracking-wide hover:text-white transition-colors duration-300"
                  >
                    {cert}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          FEATURED PRODUCTS SECTION
          ================================================================ */}
      {featuredProducts.length > 0 && (
        <section className="relative">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-28">
            <ScrollReveal>
              <div className="flex items-end justify-between mb-14">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-[2px] bg-[#C41E3A]" />
                    <span className="text-xs font-mono text-[#C41E3A] tracking-[0.2em] uppercase">
                      Featured
                    </span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                    Featured Products
                  </h2>
                </div>
                <Link
                  href="/products"
                  className="hidden sm:flex items-center gap-2 text-sm text-[#999] hover:text-[#C41E3A] transition-colors font-medium group"
                >
                  View all products
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, i) => (
                <ScrollReveal key={product.id} delay={i * 100}>
                  <Link href={`/products/${product.slug}`} className="group block h-full">
                    <div className="relative bg-[#1A1A1A] border border-[#282828] rounded-lg overflow-hidden transition-all duration-300 hover:border-[#C41E3A]/30 hover:shadow-2xl hover:shadow-[#C41E3A]/5 hover:-translate-y-1 h-full">
                      <div className="relative aspect-square bg-gradient-to-b from-[#151515] to-[#0F0F0F] overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={`/${product.images[0]!.replace(/\\/g, "/").replace(/^data\//, "")}`}
                            alt={product.name}
                            fill
                            className="object-contain p-6 group-hover:scale-105 transition-transform duration-700 ease-out"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                              <Crosshair className="h-8 w-8 text-[#333]" />
                            </div>
                          </div>
                        )}
                        {/* Red corner accent on hover */}
                        <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-t-[#C41E3A]/80 border-l-[40px] border-l-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      <div className="p-5">
                        <div className="h-[1px] w-8 bg-[#C41E3A] mb-3 group-hover:w-12 transition-all duration-300" />
                        {product.categoryName && (
                          <span className="text-[10px] font-mono text-[#C41E3A] tracking-wider uppercase">
                            {product.categoryName}
                          </span>
                        )}
                        <h3 className="text-sm font-semibold text-white mt-1 mb-2 line-clamp-2 group-hover:text-[#C41E3A] transition-colors">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-3 text-[11px] text-[#666] font-mono">
                          {product.diameter && <span>{product.diameter}</span>}
                          {product.material && <span className="text-[#555]">{product.material}</span>}
                        </div>
                        <div className="mt-3 text-xs text-[#C41E3A] font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          View details <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>

            <Link
              href="/products"
              className="sm:hidden flex items-center justify-center gap-2 mt-8 text-sm text-[#999] hover:text-[#C41E3A] transition-colors font-medium"
            >
              View all products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ================================================================
          ENGINEERING CREDENTIALS — Full-width dark band
          ================================================================ */}
      <section className="relative bg-[#080808] overflow-hidden">
        {/* Subtle diagonal accent */}
        <div className="absolute left-0 top-0 h-full w-[30%] bg-gradient-to-r from-[#C41E3A]/[0.04] to-transparent transform skew-x-[12deg] -translate-x-[20%]" />
        <div className="absolute right-0 bottom-0 h-full w-[20%] bg-gradient-to-l from-[#C41E3A]/[0.02] to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-28">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-[2px] bg-[#C41E3A]" />
                <span className="text-xs font-mono text-[#C41E3A] tracking-[0.2em] uppercase">
                  Compliance
                </span>
                <div className="w-10 h-[2px] bg-[#C41E3A]" />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight">
                Engineering Credentials
              </h2>
              <p className="text-[#777] max-w-2xl mx-auto text-base sm:text-lg">
                Every Torke product meets or exceeds the most demanding
                construction industry standards. No compromises.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {certifications.map((cert, i) => {
              const Icon = cert.icon;
              return (
                <ScrollReveal key={cert.title} delay={i * 80}>
                  <div className="relative bg-[#111] border border-[#1E1E1E] rounded-lg p-6 group hover:border-[#C41E3A]/25 hover:bg-[#141414] transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-[#C41E3A]/10 border border-[#C41E3A]/15 rounded-lg flex items-center justify-center group-hover:bg-[#C41E3A]/20 group-hover:border-[#C41E3A]/30 transition-all duration-300">
                        <Icon className="h-5 w-5 text-[#C41E3A]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white mb-1.5">
                          {cert.title}
                        </h3>
                        <p className="text-xs text-[#777] leading-relaxed">
                          {cert.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================
          CATEGORY CARDS — Product range
          ================================================================ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-28">
        <ScrollReveal>
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-[2px] bg-[#C41E3A]" />
              <span className="text-xs font-mono text-[#C41E3A] tracking-[0.2em] uppercase">
                Range
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              Product Range
            </h2>
            <p className="text-[#777] text-base sm:text-lg max-w-xl">
              Three categories. Full ETA certification. Complete traceability on
              every batch.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayCategories.map((cat, i) => {
            const Icon = categoryIcons[cat.slug] || Hammer;
            return (
              <ScrollReveal key={cat.slug} delay={i * 120}>
                <Link href={`/products?category=${cat.slug}`} className="group block h-full">
                  <div className="relative bg-[#1A1A1A] border border-[#282828] rounded-xl p-8 h-full transition-all duration-500 hover:border-[#C41E3A]/40 hover:shadow-2xl hover:shadow-[#C41E3A]/10 overflow-hidden">
                    {/* Diagonal accent */}
                    <div className="absolute top-0 right-0 w-32 h-full bg-[#C41E3A]/[0.04] transform skew-x-[-12deg] translate-x-14 group-hover:bg-[#C41E3A]/[0.10] transition-all duration-700" />

                    <div className="relative w-14 h-14 bg-[#C41E3A]/10 border border-[#C41E3A]/15 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#C41E3A]/20 group-hover:border-[#C41E3A]/30 transition-all duration-300">
                      <Icon className="h-7 w-7 text-[#C41E3A]" />
                    </div>

                    <div className="relative w-10 h-[2px] bg-[#C41E3A] mb-5 group-hover:w-20 transition-all duration-500" />

                    <h3 className="relative text-xl font-bold text-white mb-3">
                      {cat.name}
                    </h3>
                    <p className="relative text-sm text-[#888] mb-8 leading-relaxed">
                      {cat.description}
                    </p>

                    <div className="relative flex items-center justify-between">
                      <span className="text-xs text-[#555] font-mono tracking-wide">
                        {cat.productCount} products
                      </span>
                      <span className="text-[#C41E3A] group-hover:translate-x-2 transition-transform duration-300">
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* ================================================================
          TR RESIN RANGE — Product showcase with action imagery
          ================================================================ */}
      <section className="relative bg-[#080808] overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-[40%] bg-gradient-to-r from-[#C41E3A]/[0.03] to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-28">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-[2px] bg-[#C41E3A]" />
                <span className="text-xs font-mono text-[#C41E3A] tracking-[0.2em] uppercase">
                  Chemical Anchor Systems
                </span>
                <div className="w-10 h-[2px] bg-[#C41E3A]" />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight">
                The TR Resin Range
              </h2>
              <p className="text-[#777] max-w-2xl mx-auto text-base sm:text-lg">
                ETA-certified injection mortars engineered for structural anchoring
                in concrete and masonry. Three formulations, one standard of excellence.
              </p>
            </div>
          </ScrollReveal>

          {/* Product cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              {
                name: "TR-500",
                subtitle: "Epoxy Resin Anchor",
                description: "Heavy-duty pure epoxy for maximum load capacity in cracked and non-cracked concrete. ETA Option 1.",
                image: "/site/tr-500-product.png",
                accent: "bg-[#C41E3A]",
                slug: "tr-500",
              },
              {
                name: "TR-200",
                subtitle: "Hybrid Resin Anchor",
                description: "Fast-curing vinylester hybrid for high throughput installations. Excellent in diamond-cored holes.",
                image: "/site/tr-200-product.png",
                accent: "bg-[#666]",
                slug: "tr-200",
              },
              {
                name: "TR-PLUS",
                subtitle: "Polyester Resin",
                description: "Cost-effective polyester resin for non-structural and light-duty anchoring applications.",
                image: "/site/tr-plus-product.png",
                accent: "bg-[#444]",
                slug: "tr-plus",
              },
            ].map((product, i) => (
              <ScrollReveal key={product.name} delay={i * 120}>
                <Link href={`/products/${product.slug}`} className="group block h-full">
                  <div className="relative bg-[#111] border border-[#1E1E1E] rounded-xl overflow-hidden h-full transition-all duration-300 hover:border-[#C41E3A]/30 hover:shadow-2xl hover:shadow-[#C41E3A]/10 hover:-translate-y-1">
                    {/* Product image */}
                    <div className="relative aspect-[16/10] bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] overflow-hidden">
                      <Image
                        src={product.image}
                        alt={`Torke ${product.name} ${product.subtitle}`}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>

                    <div className="p-6">
                      <div className={`w-8 h-[3px] ${product.accent} mb-4 group-hover:w-14 transition-all duration-300`} />
                      <div className="flex items-baseline gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-white group-hover:text-[#C41E3A] transition-colors">
                          {product.name}
                        </h3>
                        <span className="text-xs font-mono text-[#666] uppercase tracking-wider">
                          {product.subtitle}
                        </span>
                      </div>
                      <p className="text-sm text-[#888] leading-relaxed mb-4">
                        {product.description}
                      </p>
                      <span className="text-xs font-semibold text-[#C41E3A] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        View product <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>

          {/* Action shot — full width */}
          <ScrollReveal>
            <div className="relative rounded-xl overflow-hidden">
              <Image
                src="/site/hero-tr200-action.png"
                alt="Engineer installing Torke TR-200 anchor into concrete base plate on construction site"
                width={1200}
                height={500}
                className="w-full h-64 sm:h-80 lg:h-96 object-cover"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#080808] to-transparent" />
              <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8">
                <div className="w-1 h-5 bg-[#C41E3A] mb-2" />
                <p className="text-white font-bold text-lg sm:text-xl mb-1">Built for the site. Proven in the field.</p>
                <p className="text-white/60 text-sm font-mono">ETA-certified anchor systems for structural concrete connections</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================
          WHY TORKE — Three pillars
          ================================================================ */}
      <section className="relative bg-[#080808] overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-[25%] bg-gradient-to-l from-[#C41E3A]/[0.03] to-transparent transform skew-x-[-12deg] translate-x-[20%]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-28">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-[2px] bg-[#C41E3A]" />
                <span className="text-xs font-mono text-[#C41E3A] tracking-[0.2em] uppercase">
                  Why Torke
                </span>
                <div className="w-10 h-[2px] bg-[#C41E3A]" />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight">
                Engineering Excellence, End to End
              </h2>
              <p className="text-[#777] max-w-2xl mx-auto text-base sm:text-lg">
                We don&apos;t just sell fixings. We deliver complete traceability
                from mill to site, verified with every single batch.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Mill-to-Site Traceability */}
            <ScrollReveal delay={0}>
              <div className="relative bg-[#111] border border-[#1E1E1E] rounded-xl p-8 group hover:border-[#C41E3A]/25 hover:bg-[#141414] transition-all duration-300 h-full">
                <div className="w-14 h-14 bg-[#C41E3A]/10 border border-[#C41E3A]/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#C41E3A]/20 transition-colors">
                  <Layers className="h-7 w-7 text-[#C41E3A]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">
                  Mill-to-Site Traceability
                </h3>
                <p className="text-sm text-[#888] leading-relaxed mb-6">
                  Full batch tracking from raw material supplier through to
                  installation point. No gaps in the chain, no missing
                  documentation.
                </p>
                <div className="flex items-center gap-0">
                  {[
                    { label: "Mill", opacity: "1" },
                    { label: "QC", opacity: "0.7" },
                    { label: "Ship", opacity: "0.5" },
                    { label: "Site", opacity: "0.3" },
                  ].map((step, idx) => (
                    <div key={step.label} className="contents">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-2.5 h-2.5 rounded-full bg-[#C41E3A]"
                          style={{ opacity: step.opacity }}
                        />
                        <span className="text-[9px] font-mono text-[#555] mt-1.5">
                          {step.label}
                        </span>
                      </div>
                      {idx < 3 && (
                        <div
                          className="flex-1 h-[1px] bg-[#C41E3A]"
                          style={{ opacity: Number(step.opacity) * 0.6 }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* QR-Verified Batches */}
            <ScrollReveal delay={120}>
              <div className="relative bg-[#111] border border-[#1E1E1E] rounded-xl p-8 group hover:border-[#C41E3A]/25 hover:bg-[#141414] transition-all duration-300 h-full">
                <div className="w-14 h-14 bg-[#C41E3A]/10 border border-[#C41E3A]/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#C41E3A]/20 transition-colors">
                  <QrCode className="h-7 w-7 text-[#C41E3A]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">
                  QR-Verified Batches
                </h3>
                <p className="text-sm text-[#888] leading-relaxed mb-6">
                  Every batch ships with a unique QR code. Scan it on site for
                  instant access to mill certificates, test reports, and batch
                  data.
                </p>
                <div className="flex items-center gap-3 p-3 bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg">
                  <QrCode className="h-8 w-8 text-[#C41E3A]/60" />
                  <div>
                    <div className="text-[10px] font-mono text-[#555]">SCAN FOR</div>
                    <div className="text-xs font-mono text-[#999]">EN 10204 3.1 Certificate</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* EN 1992-4 Design Tool */}
            <ScrollReveal delay={240}>
              <div className="relative bg-[#111] border border-[#1E1E1E] rounded-xl p-8 group hover:border-[#C41E3A]/25 hover:bg-[#141414] transition-all duration-300 h-full">
                <div className="w-14 h-14 bg-[#C41E3A]/10 border border-[#C41E3A]/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#C41E3A]/20 transition-colors">
                  <Zap className="h-7 w-7 text-[#C41E3A]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">
                  EN 1992-4 Design Tool
                </h3>
                <p className="text-sm text-[#888] leading-relaxed mb-6">
                  Torke TRACE calculates anchor capacity to EN 1992-4. Input your
                  loads, get verified embedment depths, edge distances, and
                  spacing.
                </p>
                <Link
                  href="/design"
                  className="inline-flex items-center gap-2 text-sm text-[#C41E3A] font-semibold hover:text-[#D6354F] transition-colors group/link"
                >
                  Launch TRACE Calculator
                  <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ================================================================
          CTA — Full width red gradient
          ================================================================ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-28">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#C41E3A] via-[#A8182F] to-[#8B1225]" />
            <div className="absolute right-0 top-0 h-full w-[50%] bg-black/20 transform skew-x-[-12deg] translate-x-[20%]" />
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            <div className="relative px-8 sm:px-16 py-16 sm:py-20 text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight">
                Ready to source with confidence?
              </h2>
              <p className="text-white/80 mb-10 max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
                Browse our certified product range or get in touch for trade
                pricing and project support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-[#C41E3A] hover:bg-white/90 font-bold px-10 h-14 text-base shadow-lg"
                >
                  <Link href="/products">View All Products</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10 font-semibold px-10 h-14 text-base"
                >
                  <Link href="/contact">Contact Sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
