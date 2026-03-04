/**
 * Database seed script for products and categories.
 *
 * Reads: data/categories.json, data/transformed-products.json
 * Writes: PostgreSQL (categories + products tables)
 *
 * Idempotent: uses onConflictDoNothing() so re-runs are safe.
 * Requires: DATABASE_URL environment variable.
 *
 * Usage: npx tsx scripts/seed-products.ts
 */

import { readFileSync } from 'fs';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { categories, products } from '../src/server/db/schema/products.js';

// ───────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────

interface CategoryData {
  name: string;
  slug: string;
  parentSlug: string | null;
  sortOrder: number;
  description: string;
}

interface TransformedProduct {
  name: string;
  slug: string;
  sku: string;
  categorySlug: string;
  subcategorySlug: string | null;
  description: string;
  technicalSpecs: Record<string, string>;
  diameter: string | null;
  material: string | null;
  lengthMm: number | null;
  finish: string | null;
  loadClass: string | null;
  etaReference: string | null;
  localImages: string[];
  localDatasheetPath: string | null;
  sourceUrl: string;
  features: string[];
  applications: string[];
  baseMaterials: string[];
  availableSizes: Array<{
    diameter?: string;
    length?: string;
    materials: string[];
  }>;
  datasheets: Array<{ name: string; url: string }>;
  isActive: true;
}

// ───────────────────────────────────────────────────────
// Database connection
// ───────────────────────────────────────────────────────

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  console.error('Set it in .env.local or export it:');
  console.error(
    '  export DATABASE_URL=postgresql://postgres:torke@localhost:5432/torke'
  );
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

// ───────────────────────────────────────────────────────
// Seed logic
// ───────────────────────────────────────────────────────

async function seedCategories(
  categoryData: CategoryData[]
): Promise<Map<string, string>> {
  console.log(`Seeding ${categoryData.length} categories...`);

  const slugToId = new Map<string, string>();

  // Insert top-level categories first
  const topLevel = categoryData.filter((c) => !c.parentSlug);
  for (const cat of topLevel) {
    const result = await db
      .insert(categories)
      .values({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        sortOrder: cat.sortOrder,
      })
      .onConflictDoNothing({ target: categories.slug })
      .returning({ id: categories.id });

    if (result.length > 0 && result[0]) {
      slugToId.set(cat.slug, result[0].id);
      console.log(`  + ${cat.name} (${cat.slug}) -> ${result[0].id}`);
    } else {
      // Already exists, look it up
      const existing = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, cat.slug))
        .limit(1);
      if (existing[0]) {
        slugToId.set(cat.slug, existing[0].id);
        console.log(`  = ${cat.name} (${cat.slug}) already exists`);
      }
    }
  }

  // Insert sub-categories with parentId references
  const subCats = categoryData.filter((c) => c.parentSlug);
  for (const cat of subCats) {
    const parentId = slugToId.get(cat.parentSlug!);
    if (!parentId) {
      console.error(`  WARNING: Parent "${cat.parentSlug}" not found for "${cat.slug}"`);
      continue;
    }

    const result = await db
      .insert(categories)
      .values({
        name: cat.name,
        slug: cat.slug,
        parentId,
        description: cat.description,
        sortOrder: cat.sortOrder,
      })
      .onConflictDoNothing({ target: categories.slug })
      .returning({ id: categories.id });

    if (result.length > 0 && result[0]) {
      slugToId.set(cat.slug, result[0].id);
      console.log(`  + ${cat.name} (${cat.slug}) -> ${result[0].id} [parent: ${cat.parentSlug}]`);
    } else {
      const existing = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, cat.slug))
        .limit(1);
      if (existing[0]) {
        slugToId.set(cat.slug, existing[0].id);
        console.log(`  = ${cat.name} (${cat.slug}) already exists`);
      }
    }
  }

  return slugToId;
}

async function seedProducts(
  productData: TransformedProduct[],
  slugToId: Map<string, string>
): Promise<number> {
  console.log(`\nSeeding ${productData.length} products...`);

  let inserted = 0;
  let skipped = 0;
  let failed = 0;
  const missingImages: string[] = [];
  const withDatasheets: string[] = [];

  for (let i = 0; i < productData.length; i++) {
    const product = productData[i]!;

    // Look up category ID - prefer subcategory if available, fall back to top-level
    const categoryId =
      (product.subcategorySlug
        ? slugToId.get(product.subcategorySlug)
        : null) || slugToId.get(product.categorySlug);

    if (!categoryId) {
      console.error(
        `  SKIP: No category found for "${product.name}" (${product.categorySlug}/${product.subcategorySlug})`
      );
      failed++;
      continue;
    }

    try {
      const result = await db
        .insert(products)
        .values({
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          categoryId,
          description: product.description,
          technicalSpecs: product.technicalSpecs,
          diameter: product.diameter,
          material: product.material,
          lengthMm: product.lengthMm,
          finish: product.finish,
          loadClass: product.loadClass,
          etaReference: product.etaReference,
          datasheetUrl: product.localDatasheetPath,
          images: product.localImages,
          isActive: product.isActive,
        })
        .onConflictDoNothing({ target: products.slug })
        .returning({ id: products.id });

      if (result.length > 0) {
        inserted++;
        if (product.localImages.length === 0) missingImages.push(product.name);
        if (product.localDatasheetPath) withDatasheets.push(product.name);
      } else {
        skipped++;
      }

      if ((i + 1) % 10 === 0 || i === productData.length - 1) {
        console.log(
          `  Progress: ${i + 1}/${productData.length} (${inserted} inserted, ${skipped} skipped)`
        );
      }
    } catch (err: any) {
      console.error(`  ERROR inserting "${product.name}": ${err.message}`);
      failed++;
    }
  }

  return inserted;
}

async function seed() {
  console.log('=== Torke Product Database Seed ===\n');

  // Load data
  const categoryData: CategoryData[] = JSON.parse(
    readFileSync('data/categories.json', 'utf-8')
  );
  const productData: TransformedProduct[] = JSON.parse(
    readFileSync('data/transformed-products.json', 'utf-8')
  );

  console.log(`Data loaded: ${categoryData.length} categories, ${productData.length} products\n`);

  // Seed categories
  const slugToId = await seedCategories(categoryData);

  // Seed products
  const insertedCount = await seedProducts(productData, slugToId);

  // Summary
  console.log('\n=== SEED COMPLETE ===');
  console.log(`Categories seeded: ${slugToId.size}`);
  console.log(`Products seeded: ${insertedCount}/${productData.length}`);

  // Per-category breakdown
  console.log('\nProducts per category:');
  const catCounts = new Map<string, number>();
  for (const p of productData) {
    const cat = p.categorySlug;
    catCounts.set(cat, (catCounts.get(cat) || 0) + 1);
  }
  for (const [slug, count] of catCounts) {
    console.log(`  ${slug}: ${count}`);
  }

  const noImages = productData.filter((p) => p.localImages.length === 0);
  const hasDatasheet = productData.filter((p) => p.localDatasheetPath);
  console.log(`\nProducts with missing images: ${noImages.length}`);
  console.log(`Products with datasheets: ${hasDatasheet.length}`);

  // Close connection
  await client.end();
}

seed().catch((err) => {
  console.error('Fatal error:', err);
  client.end();
  process.exit(1);
});
