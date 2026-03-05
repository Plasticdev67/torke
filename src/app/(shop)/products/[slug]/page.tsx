import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Mail } from "lucide-react";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { CartProvider } from "@/components/shop/CartProvider";
import { db } from "@/server/db";
import { products, categories } from "@/server/db/schema/products";
import { eq, and, sql } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImages } from "@/components/products/ProductImages";
import { ProductSpecs } from "@/components/products/ProductSpecs";
import { ProductCard } from "@/components/products/ProductCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { productSchema, breadcrumbSchema } from "@/lib/schema-markup";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.isActive, true)),
  });

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: product.name,
    description:
      product.description?.slice(0, 160) ||
      `${product.name} - Professional construction fixings by Torke.`,
    openGraph: {
      title: `${product.name} | Torke`,
      description:
        product.description?.slice(0, 160) ||
        `${product.name} - Professional construction fixings.`,
      images: product.images?.[0]
        ? [`/${product.images[0].replace(/\\/g, "/")}`]
        : [],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch product with category
  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.isActive, true)),
    with: { category: true },
  });

  if (!product) {
    notFound();
  }

  // Fetch parent category if subcategory
  let parentCategory = null;
  if (product.category?.parentId) {
    parentCategory = await db.query.categories.findFirst({
      where: eq(categories.id, product.category.parentId),
    });
  }

  // Fetch related products from same category
  const related = await db.query.products.findMany({
    where: and(
      eq(products.categoryId, product.categoryId),
      eq(products.isActive, true),
      sql`${products.id} != ${product.id}`
    ),
    limit: 4,
    with: { category: true },
  });

  const images = (product.images as string[]) || [];
  const techSpecs = (product.technicalSpecs as Record<string, unknown>) || null;
  const categorySlug = parentCategory?.slug || product.category?.slug || "";
  const categoryName = parentCategory?.name || product.category?.name || "";

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Products", url: "/products" },
    ...(categoryName
      ? [{ name: categoryName, url: `/products?category=${categorySlug}` }]
      : []),
    { name: product.name, url: `/products/${product.slug}` },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={productSchema({
          name: product.name,
          sku: product.sku,
          description: product.description,
          images: product.images as string[] | null,
          pricePence: product.pricePence,
        })}
      />
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />

      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center gap-2 text-sm flex-wrap">
          <li>
            <Link
              href="/"
              className="text-[#999] hover:text-white transition-premium"
            >
              Home
            </Link>
          </li>
          <li className="text-[#666]">/</li>
          <li>
            <Link
              href="/products"
              className="text-[#999] hover:text-white transition-premium"
            >
              Products
            </Link>
          </li>
          {categoryName && (
            <>
              <li className="text-[#666]">/</li>
              <li>
                <Link
                  href={`/products?category=${categorySlug}`}
                  className="text-[#999] hover:text-white transition-premium"
                >
                  {categoryName}
                </Link>
              </li>
            </>
          )}
          {product.category && parentCategory && (
            <>
              <li className="text-[#666]">/</li>
              <li className="text-[#999]">{product.category.name}</li>
            </>
          )}
          <li className="text-[#666]">/</li>
          <li className="text-white font-medium truncate max-w-[200px]">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Back link */}
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-white transition-premium mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Link>

      {/* Product layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mb-16">
        {/* Images — 60% */}
        <div className="lg:col-span-3">
          <ProductImages images={images} productName={product.name} />
        </div>

        {/* Product info — 40% */}
        <div className="lg:col-span-2">
          {/* Category */}
          {product.category && (
            <Link
              href={`/products?category=${categorySlug}`}
              className="inline-block text-xs font-medium uppercase tracking-wider text-[#C41E3A] hover:text-[#D6354F] transition-premium mb-3"
            >
              {categoryName}
              {parentCategory && ` / ${product.category.name}`}
            </Link>
          )}

          {/* Product name */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
            {product.name}
          </h1>

          {/* SKU */}
          <p className="text-sm text-[#999] font-mono mb-3">{product.sku}</p>

          {/* Price */}
          {product.pricePence != null ? (
            <p className="text-xl font-bold text-white mb-5 tabular-nums">
              {"\u00A3"}{(product.pricePence / 100).toFixed(2)}
              <span className="text-sm font-normal text-[#999] ml-1">ex. VAT</span>
            </p>
          ) : (
            <p className="text-sm text-[#999] mb-5">Contact for pricing</p>
          )}

          {/* Key spec badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {product.diameter && (
              <Badge className="bg-[#2D2D2D] text-[#B3B3B3] border-[#333] text-xs px-3 py-1">
                {product.diameter}
              </Badge>
            )}
            {product.material && (
              <Badge className="bg-[#2D2D2D] text-[#B3B3B3] border-[#333] text-xs px-3 py-1">
                {product.material}
              </Badge>
            )}
            {product.finish && (
              <Badge className="bg-[#2D2D2D] text-[#B3B3B3] border-[#333] text-xs px-3 py-1">
                {product.finish}
              </Badge>
            )}
            {product.loadClass && (
              <Badge className="bg-[#C41E3A]/10 text-[#C41E3A] border-[#C41E3A]/20 text-xs px-3 py-1">
                Load Class: {product.loadClass}
              </Badge>
            )}
            {product.etaReference && (
              <Badge className="bg-[#C41E3A]/10 text-[#C41E3A] border-[#C41E3A]/20 text-xs px-3 py-1">
                ETA: {product.etaReference}
              </Badge>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-8">
              <p className="text-sm text-[#B3B3B3] leading-relaxed whitespace-pre-line line-clamp-6">
                {product.description.split("\n").slice(0, 6).join("\n")}
              </p>
            </div>
          )}

          {/* CTAs */}
          <div className="space-y-3">
            {product.pricePence != null ? (
              <CartProvider>
                <AddToCartButton
                  productId={product.id}
                  productName={product.name}
                  sku={product.sku}
                  unitPricePence={product.pricePence}
                />
              </CartProvider>
            ) : (
              <Button
                asChild
                size="lg"
                className="w-full bg-[#C41E3A] hover:bg-[#D6354F] text-white font-semibold h-12"
              >
                <Link href="/contact">
                  <Mail className="h-4 w-4 mr-2" />
                  Request Quote
                </Link>
              </Button>
            )}

            {product.datasheetUrl && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full border-[#333] bg-transparent text-white hover:bg-[#1A1A1A] font-semibold h-12"
              >
                <a
                  href={product.datasheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download Datasheet
                </a>
              </Button>
            )}
          </div>

          {/* Traceability badge */}
          <div className="mt-8 bg-[#1A1A1A] border border-[#333] rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#C41E3A]/10 rounded flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-[#C41E3A]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-white font-medium">
                  Full Batch Traceability
                </p>
                <p className="text-xs text-[#999] mt-0.5">
                  Every batch includes EN 10204 3.1 mill certification with QR
                  code verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Documents */}
      {product.datasheetUrl && (
        <div className="mb-16">
          <h2 className="text-lg font-bold text-white mb-4">
            <span className="inline-block w-1 h-5 bg-[#C41E3A] mr-3 align-middle" />
            Technical Documents
          </h2>
          <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#C41E3A]/10 rounded flex items-center justify-center">
                  <FileText className="h-5 w-5 text-[#C41E3A]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Product Datasheet
                  </p>
                  <p className="text-xs text-[#666]">PDF document</p>
                </div>
              </div>
              <a
                href={product.datasheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-1.5 bg-[#C41E3A] hover:bg-[#D6354F] text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                <FileText className="h-4 w-4" />
                Download
              </a>
            </div>
          </div>
          <Link
            href="/resources"
            className="inline-flex items-center gap-1 text-sm text-[#C41E3A] hover:text-[#D6354F] mt-3 transition-colors"
          >
            View all technical resources
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      )}

      {/* Technical Specifications */}
      <div className="mb-16">
        <ProductSpecs
          technicalSpecs={techSpecs}
          diameter={product.diameter}
          material={product.material}
          lengthMm={product.lengthMm}
          finish={product.finish}
          etaReference={product.etaReference}
          loadClass={product.loadClass}
          datasheetUrl={product.datasheetUrl}
        />
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">
              <span className="inline-block w-1 h-5 bg-[#C41E3A] mr-3 align-middle" />
              Related Products
            </h2>
            {categorySlug && (
              <Link
                href={`/products?category=${categorySlug}`}
                className="text-sm text-[#C41E3A] hover:text-[#D6354F] transition-premium"
              >
                View all {categoryName}
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((item) => (
              <ProductCard
                key={item.slug}
                name={item.name}
                slug={item.slug}
                sku={item.sku}
                diameter={item.diameter}
                material={item.material}
                loadClass={item.loadClass}
                images={item.images}
                category={
                  item.category
                    ? { name: item.category.name, slug: item.category.slug }
                    : null
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
