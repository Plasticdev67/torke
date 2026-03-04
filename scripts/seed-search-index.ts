/**
 * Meilisearch index configuration and bulk product indexing.
 *
 * Reads: Products from PostgreSQL (joined with category names)
 * Writes: Meilisearch 'products' index
 *
 * Configures:
 * - Searchable attributes: name, sku, description, etaReference, categoryName
 * - Filterable attributes: categorySlug, diameter, material, finish, loadClass, isActive
 * - Sortable attributes: name, sku
 *
 * Requires: DATABASE_URL, MEILISEARCH_URL, MEILISEARCH_ADMIN_KEY
 *
 * Usage: npx tsx scripts/seed-search-index.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { MeiliSearch } from 'meilisearch';
import { categories, products } from '../src/server/db/schema/products.js';

// ───────────────────────────────────────────────────────
// Environment validation
// ───────────────────────────────────────────────────────

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const meiliUrl = process.env.MEILISEARCH_URL || 'http://localhost:7700';
const meiliKey = process.env.MEILISEARCH_ADMIN_KEY || '';

// ───────────────────────────────────────────────────────
// Clients
// ───────────────────────────────────────────────────────

const client = postgres(connectionString);
const db = drizzle(client);

const meili = new MeiliSearch({
  host: meiliUrl,
  apiKey: meiliKey,
});

// ───────────────────────────────────────────────────────
// Index configuration
// ───────────────────────────────────────────────────────

const INDEX_NAME = 'products';

const SEARCHABLE_ATTRIBUTES = [
  'name',
  'sku',
  'description',
  'etaReference',
  'categoryName',
  'subcategoryName',
];

const FILTERABLE_ATTRIBUTES = [
  'categorySlug',
  'subcategorySlug',
  'diameter',
  'material',
  'finish',
  'loadClass',
  'isActive',
];

const SORTABLE_ATTRIBUTES = ['name', 'sku'];

// ───────────────────────────────────────────────────────
// Search document type
// ───────────────────────────────────────────────────────

interface SearchDocument {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  categorySlug: string;
  categoryName: string;
  subcategorySlug: string | null;
  subcategoryName: string | null;
  diameter: string | null;
  material: string | null;
  finish: string | null;
  loadClass: string | null;
  etaReference: string | null;
  images: string[] | null;
  datasheetUrl: string | null;
  isActive: boolean;
}

// ───────────────────────────────────────────────────────
// Main seeding logic
// ───────────────────────────────────────────────────────

async function configureIndex() {
  console.log('Configuring Meilisearch index...');

  // Create or get the index
  try {
    await meili.createIndex(INDEX_NAME, { primaryKey: 'id' });
    console.log(`  Created index: ${INDEX_NAME}`);
  } catch {
    console.log(`  Index "${INDEX_NAME}" already exists`);
  }

  const index = meili.index(INDEX_NAME);

  // Configure searchable attributes
  const searchTask = await index.updateSearchableAttributes(SEARCHABLE_ATTRIBUTES);
  console.log(`  Searchable attributes set: ${SEARCHABLE_ATTRIBUTES.join(', ')}`);

  // Configure filterable attributes
  const filterTask = await index.updateFilterableAttributes(FILTERABLE_ATTRIBUTES);
  console.log(`  Filterable attributes set: ${FILTERABLE_ATTRIBUTES.join(', ')}`);

  // Configure sortable attributes
  const sortTask = await index.updateSortableAttributes(SORTABLE_ATTRIBUTES);
  console.log(`  Sortable attributes set: ${SORTABLE_ATTRIBUTES.join(', ')}`);

  // Wait for all settings tasks to complete
  await meili.waitForTasks(
    [searchTask.taskUid, filterTask.taskUid, sortTask.taskUid],
    { timeOutMs: 30000 }
  );

  console.log('  Index configuration complete');
  return index;
}

async function fetchProducts(): Promise<SearchDocument[]> {
  console.log('\nFetching products from database...');

  // Build a category slug->name lookup
  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      parentId: categories.parentId,
    })
    .from(categories);

  const catIdToSlug = new Map<string, string>();
  const catIdToName = new Map<string, string>();
  const catIdToParentId = new Map<string, string | null>();

  for (const cat of allCategories) {
    catIdToSlug.set(cat.id, cat.slug);
    catIdToName.set(cat.id, cat.name);
    catIdToParentId.set(cat.id, cat.parentId);
  }

  // Fetch all products
  const allProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      description: products.description,
      categoryId: products.categoryId,
      diameter: products.diameter,
      material: products.material,
      finish: products.finish,
      loadClass: products.loadClass,
      etaReference: products.etaReference,
      images: products.images,
      datasheetUrl: products.datasheetUrl,
      isActive: products.isActive,
    })
    .from(products);

  console.log(`  Found ${allProducts.length} products`);

  // Transform to search documents
  const documents: SearchDocument[] = allProducts.map((p) => {
    const catSlug = catIdToSlug.get(p.categoryId) || '';
    const catName = catIdToName.get(p.categoryId) || '';
    const parentId = catIdToParentId.get(p.categoryId);

    // Determine top-level category vs subcategory
    let categorySlug = catSlug;
    let categoryName = catName;
    let subcategorySlug: string | null = null;
    let subcategoryName: string | null = null;

    if (parentId) {
      // This product is in a subcategory
      subcategorySlug = catSlug;
      subcategoryName = catName;
      categorySlug = catIdToSlug.get(parentId) || catSlug;
      categoryName = catIdToName.get(parentId) || catName;
    }

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      description: p.description,
      categorySlug,
      categoryName,
      subcategorySlug,
      subcategoryName,
      diameter: p.diameter,
      material: p.material,
      finish: p.finish,
      loadClass: p.loadClass,
      etaReference: p.etaReference,
      images: p.images as string[] | null,
      datasheetUrl: p.datasheetUrl,
      isActive: p.isActive,
    };
  });

  return documents;
}

async function indexProducts(documents: SearchDocument[]) {
  console.log(`\nIndexing ${documents.length} products into Meilisearch...`);

  const index = meili.index(INDEX_NAME);

  // Bulk-index all products
  const task = await index.addDocuments(documents);
  console.log(`  Indexing task created: ${task.taskUid}`);

  // Wait for indexing to complete
  await meili.waitForTask(task.taskUid, { timeOutMs: 60000 });
  console.log('  Indexing complete');

  // Verify: get index stats
  const stats = await index.getStats();
  console.log(`\n  Index stats:`);
  console.log(`    Total documents: ${stats.numberOfDocuments}`);
  console.log(`    Is indexing: ${stats.isIndexing}`);

  return stats;
}

async function seed() {
  console.log('=== Torke Meilisearch Index Seed ===\n');
  console.log(`Meilisearch URL: ${meiliUrl}`);
  console.log(`Index name: ${INDEX_NAME}\n`);

  // Step 1: Configure index
  await configureIndex();

  // Step 2: Fetch products from database
  const documents = await fetchProducts();

  if (documents.length === 0) {
    console.log('\nNo products found in database. Run seed:db first.');
    await client.end();
    process.exit(1);
  }

  // Step 3: Index products
  const stats = await indexProducts(documents);

  // Summary
  console.log('\n=== SEARCH INDEX SEED COMPLETE ===');
  console.log(`Documents indexed: ${stats.numberOfDocuments}`);
  console.log(`Searchable: ${SEARCHABLE_ATTRIBUTES.join(', ')}`);
  console.log(`Filterable: ${FILTERABLE_ATTRIBUTES.join(', ')}`);
  console.log(`Sortable: ${SORTABLE_ATTRIBUTES.join(', ')}`);

  // Close database connection
  await client.end();
}

seed().catch((err) => {
  console.error('Fatal error:', err);
  client.end();
  process.exit(1);
});
