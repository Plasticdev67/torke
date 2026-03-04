import Link from "next/link";
import { ArrowRight, Shield, Layers, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  {
    name: "Chemical Anchors",
    slug: "chemical-anchors",
    description:
      "High-performance epoxy and hybrid resin systems for heavy-duty anchoring in concrete and masonry.",
    count: 7,
  },
  {
    name: "Mechanical Anchors",
    slug: "mechanical-anchors",
    description:
      "Expansion anchors, through bolts, and screw anchors engineered for reliable concrete connections.",
    count: 15,
  },
  {
    name: "General Fixings",
    slug: "general-fixings",
    description:
      "Shot fired fixings, drill bits, diamond blades, and corebits for professional installation.",
    count: 10,
  },
];

const valueProps = [
  {
    icon: Shield,
    title: "EN 10204 3.1 Certified",
    description:
      "Every batch ships with verifiable mill certification. Scan the QR code for instant traceability.",
  },
  {
    icon: Layers,
    title: "Mill-to-Site Traceability",
    description:
      "Full batch tracking from raw material supplier through to installation point. No gaps in the chain.",
  },
  {
    icon: QrCode,
    title: "FIFO Batch Allocation",
    description:
      "Automated first-in-first-out allocation ensures proper stock rotation and complete audit trails.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#111] to-[#0A0A0A]" />
        {/* Diagonal red accent slashes — packaging DNA */}
        <div className="absolute right-0 top-0 h-full w-[40%] bg-[#C41E3A]/[0.04] transform skew-x-[-12deg] translate-x-[20%]" />
        <div className="absolute right-0 bottom-0 h-32 w-full bg-gradient-to-t from-[#C41E3A]/[0.06] to-transparent" />
        <div className="absolute right-[15%] top-[10%] h-[120%] w-1 bg-[#C41E3A]/10 transform skew-x-[-12deg]" />
        <div className="absolute right-[18%] top-[10%] h-[120%] w-8 bg-[#C41E3A]/[0.03] transform skew-x-[-12deg]" />
        {/* Technical line drawing overlay — like the packaging illustrations */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            {/* Red accent line — matching packaging stripe */}
            <div className="w-16 h-1 bg-[#C41E3A] mb-8" />

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-6">
              Precision Fixings.
              <br />
              <span className="text-[#C41E3A]">Full Traceability.</span>
            </h1>

            <p className="text-lg sm:text-xl text-[#B3B3B3] mb-10 max-w-2xl leading-relaxed">
              Professional-grade construction fixings with mill-to-site batch
              traceability. Every product, every batch, every certificate —
              verified and accessible via QR code.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-[#C41E3A] hover:bg-[#D6354F] text-white font-semibold px-8 h-12"
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
                className="border-[#333] bg-transparent text-white hover:bg-[#1A1A1A] font-semibold px-8 h-12"
              >
                <Link href="/contact">Request a Quote</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Category Cards */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Product Range
          </h2>
          <p className="text-[#999]">
            Three categories. Full ETA certification. Complete traceability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="group block"
            >
              <div className="relative bg-[#1A1A1A] border border-[#333] rounded-lg p-8 h-full transition-all duration-300 hover:border-[#C41E3A]/30 hover:shadow-lg hover:shadow-[#C41E3A]/5 overflow-hidden">
                {/* Diagonal accent — packaging DNA */}
                <div className="absolute top-0 right-0 w-24 h-full bg-[#C41E3A]/[0.06] transform skew-x-[-12deg] translate-x-10 group-hover:bg-[#C41E3A]/[0.12] transition-all duration-300" />
                {/* Category accent */}
                <div className="relative w-10 h-1 bg-[#C41E3A] mb-6 group-hover:w-16 transition-all duration-300" />

                <h3 className="text-xl font-bold text-white mb-2">
                  {cat.name}
                </h3>
                <p className="text-sm text-[#999] mb-6 leading-relaxed">
                  {cat.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#666] font-mono">
                    {cat.count} products
                  </span>
                  <span className="text-[#C41E3A] group-hover:translate-x-1 transition-transform duration-200">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Value Propositions */}
      <section className="bg-[#111] border-y border-[#222]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Why Torke?
            </h2>
            <p className="text-[#999] max-w-2xl mx-auto">
              We don&apos;t just sell fixings. We deliver complete traceability
              from mill to site, verified with every batch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {valueProps.map((prop) => {
              const Icon = prop.icon;
              return (
                <div key={prop.title} className="text-center">
                  <div className="w-14 h-14 mx-auto bg-[#C41E3A]/10 rounded-lg flex items-center justify-center mb-5">
                    <Icon className="h-7 w-7 text-[#C41E3A]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {prop.title}
                  </h3>
                  <p className="text-sm text-[#999] leading-relaxed max-w-xs mx-auto">
                    {prop.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-[#C41E3A]/10 to-transparent border border-[#C41E3A]/20 rounded-lg p-10 sm:p-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to source with confidence?
          </h2>
          <p className="text-[#B3B3B3] mb-8 max-w-xl mx-auto">
            Browse our certified product range or get in touch for trade
            pricing and project support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-[#C41E3A] hover:bg-[#D6354F] text-white font-semibold px-8"
            >
              <Link href="/products">View All Products</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-[#333] bg-transparent text-white hover:bg-[#1A1A1A] font-semibold px-8"
            >
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
