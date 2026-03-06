import Link from "next/link";

const certifications = [
  "ETA Certified",
  "CE Marked",
  "UKCA",
  "EN 10204 3.1",
  "ISO 9001",
];

export function Footer() {
  return (
    <footer className="bg-[#111] border-t-2 border-t-[#C41E3A] border-b-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-[#C41E3A] flex items-center justify-center" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)' }}>
                <span className="text-white font-black text-lg leading-none">
                  T
                </span>
              </div>
              <span className="text-white font-bold tracking-[0.15em]">
                TORKE<sup className="text-[7px] ml-0.5 align-super opacity-70">&reg;</sup>
              </span>
            </div>
            <p className="text-sm text-[#999] leading-relaxed max-w-xs">
              Professional construction fixings with full mill-to-site batch
              traceability and verifiable EN 10204 3.1 certification.
            </p>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Products
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/products?category=chemical-anchors"
                  className="text-sm text-[#999] hover:text-white transition-premium"
                >
                  Chemical Anchors
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=mechanical-anchors"
                  className="text-sm text-[#999] hover:text-white transition-premium"
                >
                  Mechanical Anchors
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=general-fixings"
                  className="text-sm text-[#999] hover:text-white transition-premium"
                >
                  General Fixings
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-sm text-[#999] hover:text-white transition-premium"
                >
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-[#999] hover:text-white transition-premium"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="text-sm text-[#999] hover:text-white transition-premium"
                >
                  Resources
                </Link>
              </li>
              <li>
                <Link
                  href="/glossary"
                  className="text-sm text-[#999] hover:text-white transition-premium"
                >
                  Glossary
                </Link>
              </li>
              <li>
                <Link
                  href="/design"
                  className="text-sm text-[#999] hover:text-white transition-premium"
                >
                  TRACE
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-[#999] hover:text-white transition-premium"
                >
                  About Torke
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-[#999] hover:text-white transition-premium"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-sm text-[#999] hover:text-white transition-premium"
                >
                  Careers
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Certifications */}
        <div className="mt-10 pt-6 border-t border-[#222]">
          <p className="text-xs text-[#666] uppercase tracking-wider mb-3">Certifications</p>
          <div className="flex flex-wrap gap-2">
            {certifications.map((cert) => (
              <span
                key={cert}
                className="text-xs text-[#999] border border-[#333] rounded-full px-3 py-1 hover:border-[#C41E3A]/40 hover:text-white transition-premium"
              >
                {cert}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-[#222]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-xs text-[#666]">
              <p>&copy; {new Date().getFullYear()} Torke Ltd. All rights reserved.</p>
              <p className="mt-1">Registered in England &amp; Wales.</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#666]">
              <a
                href="mailto:info@torke.co.uk"
                className="hover:text-white transition-premium"
              >
                info@torke.co.uk
              </a>
              <span className="text-[#333]">|</span>
              <a
                href="tel:+441611234567"
                className="hover:text-white transition-premium"
              >
                +44 (0) 161 123 4567
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
