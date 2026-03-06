import Link from "next/link";
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

export default async function HomePage() {
  // Fetch featured products (first 4 active products with images)
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

  // Fallback categories if DB query fails
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
      title: "EN 1992-4 Compliant",
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
          HERO SECTION
          ================================================================ */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#0D0D0D] to-[#0A0A0A]" />

        {/* Blueprint grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]">
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

        {/* Major diagonal red slash - packaging DNA */}
        <div className="absolute -right-20 top-0 h-full w-[45%] bg-gradient-to-l from-[#C41E3A]/[0.08] to-transparent transform skew-x-[-12deg] translate-x-[10%]" />

        {/* Secondary diagonal slashes */}
        <div className="absolute right-[12%] top-[-10%] h-[130%] w-[3px] bg-[#C41E3A]/20 transform skew-x-[-12deg]" />
        <div className="absolute right-[14%] top-[-10%] h-[130%] w-12 bg-[#C41E3A]/[0.04] transform skew-x-[-12deg]" />
        <div className="absolute right-[28%] top-[-10%] h-[130%] w-[1px] bg-[#C41E3A]/10 transform skew-x-[-12deg]" />

        {/* Bottom red glow */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#C41E3A]/[0.06] to-transparent" />

        {/* Crosshair/target marks - technical drawing feel */}
        <div className="absolute top-20 right-[20%] w-16 h-16 opacity-[0.08]">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white" />
          <div className="absolute left-1/2 top-0 h-full w-[1px] bg-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-white rounded-full" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40 w-full">
          <div className="max-w-4xl">
            {/* Red accent bar */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-1 bg-[#C41E3A]" />
              <span className="text-xs font-mono text-[#C41E3A] tracking-[0.3em] uppercase">
                Construction Fixings
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white tracking-tight leading-[0.95] mb-8">
              Precision
              <br />
              Fixings.
              <br />
              <span className="text-[#C41E3A]">Full Traceability.</span>
            </h1>

            <p className="text-lg sm:text-xl text-[#999] mb-12 max-w-2xl leading-relaxed font-medium">
              Professional-grade construction fixings with mill-to-site batch
              traceability. Every product, every batch, every certificate
              — verified and accessible via QR code.
            </p>

            {/* Stat counters */}
            <div className="flex flex-wrap gap-8 sm:gap-12 mb-12">
              <div className="border-l-2 border-[#C41E3A] pl-4">
                <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  32+
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
                  100%
                </div>
                <div className="text-xs text-[#666] font-mono uppercase tracking-wider mt-1">
                  Batch Traceability
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-[#C41E3A] hover:bg-[#D6354F] text-white font-semibold px-8 h-13 text-base shadow-lg shadow-[#C41E3A]/20"
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
                className="border-[#333] bg-transparent text-white hover:bg-[#1A1A1A] hover:border-[#C41E3A]/30 font-semibold px-8 h-13 text-base"
              >
                <Link href="/design">
                  Torke TRACE Calculator
                  <Crosshair className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          FEATURED PRODUCTS SECTION
          ================================================================ */}
      {featuredProducts.length > 0 && (
        <section className="border-t border-[#1A1A1A]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
            <div className="flex items-end justify-between mb-12">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-[2px] bg-[#C41E3A]" />
                  <span className="text-xs font-mono text-[#C41E3A] tracking-[0.2em] uppercase">
                    Featured
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white">
                  Featured Products
                </h2>
              </div>
              <Link
                href="/products"
                className="hidden sm:flex items-center gap-2 text-sm text-[#999] hover:text-[#C41E3A] transition-colors font-medium"
              >
                View all products
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group block"
                >
                  <div className="relative bg-[#1A1A1A] border border-[#282828] rounded-lg overflow-hidden transition-all duration-300 hover:border-[#C41E3A]/30 hover:shadow-xl hover:shadow-[#C41E3A]/5">
                    {/* Product image */}
                    <div className="relative aspect-square bg-[#111] overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                            <Crosshair className="h-8 w-8 text-[#333]" />
                          </div>
                        </div>
                      )}
                      {/* Red corner accent */}
                      <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-t-[#C41E3A]/80 border-l-[40px] border-l-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    <div className="p-5">
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
                        {product.material && (
                          <span className="text-[#555]">
                            {product.material}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 text-xs text-[#C41E3A] font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        View details
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <Link
              href="/products"
              className="sm:hidden flex items-center justify-center gap-2 mt-8 text-sm text-[#999] hover:text-[#C41E3A] transition-colors font-medium"
            >
              View all products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ================================================================
          ENGINEERING CREDENTIALS SECTION
          ================================================================ */}
      <section className="relative bg-[#0D0D0D] border-y border-[#1A1A1A] overflow-hidden">
        {/* Subtle diagonal accent */}
        <div className="absolute left-0 top-0 h-full w-[30%] bg-gradient-to-r from-[#C41E3A]/[0.03] to-transparent transform skew-x-[12deg] -translate-x-[20%]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-[2px] bg-[#C41E3A]" />
              <span className="text-xs font-mono text-[#C41E3A] tracking-[0.2em] uppercase">
                Compliance
              </span>
              <div className="w-8 h-[2px] bg-[#C41E3A]" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Engineering Credentials
            </h2>
            <p className="text-[#777] max-w-2xl mx-auto text-base">
              Every Torke product meets or exceeds the most demanding
              construction industry standards. No compromises.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {certifications.map((cert) => {
              const Icon = cert.icon;
              return (
                <div
                  key={cert.title}
                  className="relative bg-[#141414] border border-[#222] rounded-lg p-6 group hover:border-[#C41E3A]/20 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-11 h-11 bg-[#C41E3A]/10 border border-[#C41E3A]/20 rounded-lg flex items-center justify-center group-hover:bg-[#C41E3A]/15 transition-colors">
                      <Icon className="h-5 w-5 text-[#C41E3A]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">
                        {cert.title}
                      </h3>
                      <p className="text-xs text-[#777] leading-relaxed">
                        {cert.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================
          CATEGORY CARDS SECTION
          ================================================================ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-[#C41E3A]" />
            <span className="text-xs font-mono text-[#C41E3A] tracking-[0.2em] uppercase">
              Range
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Product Range
          </h2>
          <p className="text-[#777] text-base">
            Three categories. Full ETA certification. Complete traceability on
            every batch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayCategories.map((cat) => {
            const Icon = categoryIcons[cat.slug] || Hammer;
            return (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="group block"
              >
                <div className="relative bg-[#1A1A1A] border border-[#282828] rounded-lg p-8 h-full transition-all duration-300 hover:border-[#C41E3A]/40 hover:shadow-xl hover:shadow-[#C41E3A]/10 overflow-hidden">
                  {/* Diagonal accent - packaging DNA */}
                  <div className="absolute top-0 right-0 w-28 h-full bg-[#C41E3A]/[0.05] transform skew-x-[-12deg] translate-x-12 group-hover:bg-[#C41E3A]/[0.12] transition-all duration-500" />

                  {/* Category icon */}
                  <div className="relative w-12 h-12 bg-[#C41E3A]/10 border border-[#C41E3A]/15 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#C41E3A]/15 group-hover:border-[#C41E3A]/25 transition-all duration-300">
                    <Icon className="h-6 w-6 text-[#C41E3A]" />
                  </div>

                  {/* Red accent bar */}
                  <div className="relative w-10 h-[2px] bg-[#C41E3A] mb-5 group-hover:w-16 transition-all duration-300" />

                  <h3 className="relative text-xl font-bold text-white mb-2">
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
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ================================================================
          WHY TORKE SECTION
          ================================================================ */}
      <section className="relative bg-[#0D0D0D] border-y border-[#1A1A1A] overflow-hidden">
        {/* Diagonal accent */}
        <div className="absolute right-0 top-0 h-full w-[25%] bg-gradient-to-l from-[#C41E3A]/[0.03] to-transparent transform skew-x-[-12deg] translate-x-[20%]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-[2px] bg-[#C41E3A]" />
              <span className="text-xs font-mono text-[#C41E3A] tracking-[0.2em] uppercase">
                Why Torke
              </span>
              <div className="w-8 h-[2px] bg-[#C41E3A]" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Engineering Excellence, End to End
            </h2>
            <p className="text-[#777] max-w-2xl mx-auto text-base">
              We don&apos;t just sell fixings. We deliver complete traceability
              from mill to site, verified with every single batch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Mill-to-Site Traceability */}
            <div className="relative bg-[#141414] border border-[#222] rounded-lg p-8 group hover:border-[#C41E3A]/20 transition-all duration-300">
              <div className="w-14 h-14 bg-[#C41E3A]/10 border border-[#C41E3A]/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#C41E3A]/15 transition-colors">
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
              {/* Mini timeline visualization */}
              <div className="flex items-center gap-0">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-[#C41E3A]" />
                  <span className="text-[9px] font-mono text-[#555] mt-1">
                    Mill
                  </span>
                </div>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-[#C41E3A] to-[#C41E3A]/40" />
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-[#C41E3A]/70" />
                  <span className="text-[9px] font-mono text-[#555] mt-1">
                    QC
                  </span>
                </div>
                <div className="flex-1 h-[1px] bg-[#C41E3A]/30" />
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-[#C41E3A]/50" />
                  <span className="text-[9px] font-mono text-[#555] mt-1">
                    Ship
                  </span>
                </div>
                <div className="flex-1 h-[1px] bg-[#C41E3A]/20" />
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-[#C41E3A]/30" />
                  <span className="text-[9px] font-mono text-[#555] mt-1">
                    Site
                  </span>
                </div>
              </div>
            </div>

            {/* QR-Verified Batches */}
            <div className="relative bg-[#141414] border border-[#222] rounded-lg p-8 group hover:border-[#C41E3A]/20 transition-all duration-300">
              <div className="w-14 h-14 bg-[#C41E3A]/10 border border-[#C41E3A]/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#C41E3A]/15 transition-colors">
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
              {/* QR visual */}
              <div className="flex items-center gap-3 p-3 bg-[#0D0D0D] border border-[#222] rounded-md">
                <QrCode className="h-8 w-8 text-[#C41E3A]/60" />
                <div>
                  <div className="text-[10px] font-mono text-[#555]">
                    SCAN FOR
                  </div>
                  <div className="text-xs font-mono text-[#999]">
                    EN 10204 3.1 Certificate
                  </div>
                </div>
              </div>
            </div>

            {/* EN 1992-4 Design Tool */}
            <div className="relative bg-[#141414] border border-[#222] rounded-lg p-8 group hover:border-[#C41E3A]/20 transition-all duration-300">
              <div className="w-14 h-14 bg-[#C41E3A]/10 border border-[#C41E3A]/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#C41E3A]/15 transition-colors">
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
              {/* Calculator preview */}
              <Link
                href="/design"
                className="flex items-center gap-2 text-xs text-[#C41E3A] font-medium hover:text-[#D6354F] transition-colors"
              >
                Launch TRACE Calculator
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          CTA SECTION
          ================================================================ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <div className="relative overflow-hidden rounded-xl">
          {/* Red gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#C41E3A] via-[#A8182F] to-[#8B1225]" />

          {/* Diagonal dark slash */}
          <div className="absolute right-0 top-0 h-full w-[50%] bg-black/20 transform skew-x-[-12deg] translate-x-[20%]" />

          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.06]">
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          <div className="relative px-8 sm:px-14 py-14 sm:py-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              Ready to source with confidence?
            </h2>
            <p className="text-white/80 mb-10 max-w-xl mx-auto text-base leading-relaxed">
              Browse our certified product range or get in touch for trade
              pricing and project support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-white text-[#C41E3A] hover:bg-white/90 font-bold px-10 h-13 text-base shadow-lg"
              >
                <Link href="/products">View All Products</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 font-semibold px-10 h-13 text-base"
              >
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
