import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#111] border-t-2 border-t-[#C41E3A] border-b-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
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
            <p className="text-sm text-[#999] leading-relaxed">
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
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Contact
            </h3>
            <ul className="space-y-2.5">
              <li className="text-sm text-[#999]">
                <a
                  href="mailto:info@torke.co.uk"
                  className="hover:text-white transition-premium"
                >
                  info@torke.co.uk
                </a>
              </li>
              <li className="text-sm text-[#999]">
                <a
                  href="tel:+441onal"
                  className="hover:text-white transition-premium"
                >
                  +44 (0) 1onal
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#222]">
          <p className="text-xs text-[#666] text-center">
            &copy; {new Date().getFullYear()} Torke. All rights reserved. Precision
            fixings with full traceability.
          </p>
        </div>
      </div>
    </footer>
  );
}
