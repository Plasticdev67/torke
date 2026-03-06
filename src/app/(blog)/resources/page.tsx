import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Download, ArrowRight } from "lucide-react";
import { db } from "@/server/db";
import { products, categories } from "@/server/db/schema/products";
import { eq, isNotNull, and } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { ResourceFilter } from "./ResourceFilter";
import { assetUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Technical Resources | Torke",
  description:
    "Download product datasheets, ETAs, and Declarations of Performance for Torke construction fixings. Technical documentation for engineers and specifiers.",
};

// Category display names for grouping
const CATEGORY_LABELS: Record<string, string> = {
  "chemical-anchors": "Chemical Anchors",
  "mechanical-anchors": "Mechanical Anchors",
  "general-fixings": "General Fixings",
};

export default async function ResourcesPage() {
  // Fetch products that have datasheetUrl set, with category info
  const resourceProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      datasheetUrl: products.datasheetUrl,
      etaReference: products.etaReference,
      categoryId: products.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      parentId: categories.parentId,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.isActive, true), isNotNull(products.datasheetUrl)));

  // Resolve parent categories for subcategories
  const parentIds = new Set(
    resourceProducts.filter((p) => p.parentId).map((p) => p.parentId!)
  );
  const parentCategories = new Map<string, { name: string; slug: string }>();
  if (parentIds.size > 0) {
    const parents = await db
      .select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(categories)
      .where(eq(categories.id, [...parentIds][0]!));
    // Fetch all parents
    for (const pid of parentIds) {
      const parent = await db.query.categories.findFirst({
        where: eq(categories.id, pid),
      });
      if (parent) {
        parentCategories.set(parent.id, { name: parent.name, slug: parent.slug });
      }
    }
  }

  // Group by top-level category
  const grouped = new Map<string, typeof resourceProducts>();
  for (const product of resourceProducts) {
    const topCat = product.parentId
      ? parentCategories.get(product.parentId)?.slug ?? product.categorySlug
      : product.categorySlug;
    const existing = grouped.get(topCat) ?? [];
    existing.push(product);
    grouped.set(topCat, existing);
  }

  // Build structured data for client filter
  const allResources = resourceProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    datasheetUrl: assetUrl(p.datasheetUrl!),
    etaReference: p.etaReference,
    category: p.parentId
      ? parentCategories.get(p.parentId)?.slug ?? p.categorySlug
      : p.categorySlug,
    categoryLabel: p.parentId
      ? parentCategories.get(p.parentId)?.name ?? p.categoryName
      : p.categoryName,
    subcategory: p.parentId ? p.categoryName : null,
  }));

  const categoryOptions = [...new Set(allResources.map((r) => r.category))].map(
    (slug) => ({
      slug,
      label: CATEGORY_LABELS[slug] ?? slug,
    })
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          <span className="inline-block w-1.5 h-8 bg-[#C41E3A] mr-3 align-middle" />
          Technical Resources
        </h1>
        <p className="text-[#999] text-lg max-w-2xl">
          Download product datasheets, European Technical Assessments (ETAs), and
          Declarations of Performance (DoPs) for all Torke fixings.
        </p>
      </div>

      {/* Client-side filtered resource list */}
      <ResourceFilter
        resources={allResources}
        categoryOptions={categoryOptions}
      />

      {/* CTA */}
      <div className="mt-16 bg-[#1A1A1A] border border-[#333] rounded-lg p-8 text-center">
        <h2 className="text-xl font-bold text-white mb-2">
          Need a specific document?
        </h2>
        <p className="text-[#999] mb-4">
          Contact our technical team for bespoke documentation, project-specific
          cert packs, or EN 10204 3.1 mill certificates.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 bg-[#C41E3A] hover:bg-[#D6354F] text-white px-6 py-2.5 rounded font-semibold text-sm transition-colors"
        >
          Contact Technical Team
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
