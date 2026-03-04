/**
 * Transform scraped Proventure product data into Torke schema.
 *
 * Reads: data/scraped-products.json
 * Writes: data/transformed-products.json, data/categories.json
 *
 * Transformation rules:
 * - Map 6 Proventure categories to 3 Torke top-level categories + sub-categories
 * - Generate URL-safe slugs (unique)
 * - Generate Torke SKUs (TRK-{TYPE}-{DIAMETER}-{LENGTH}-{MATERIAL} where possible)
 * - Extract facet fields: diameter, material, length, finish, loadClass
 * - Validate required fields
 *
 * Usage: npx tsx scripts/transform-products.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';

// ───────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────

interface ScrapedProduct {
  sourceUrl: string;
  name: string;
  sku: string;
  category: string;
  subcategory?: string;
  description: string;
  technicalSpecs: Record<string, string>;
  imageUrls: string[];
  datasheetUrl?: string;
  datasheets: Array<{ name: string; url: string }>;
  etaReference?: string;
  features: string[];
  applications: string[];
  baseMaterials: string[];
  availableSizes: Array<{
    diameter?: string;
    length?: string;
    materials: string[];
  }>;
  comparisonTable?: Array<Record<string, string>>;
  scrapedAt: string;
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

interface Category {
  name: string;
  slug: string;
  parentSlug: string | null;
  sortOrder: number;
  description: string;
}

// ───────────────────────────────────────────────────────
// Category mapping: 6 Proventure -> 3 Torke top-level
// ───────────────────────────────────────────────────────

const CATEGORY_MAP: Record<
  string,
  { torkeCategory: string; torkeCategorySlug: string; subcategorySlug: string; subcategoryName: string }
> = {
  'Chemical Anchors': {
    torkeCategory: 'Chemical Anchors',
    torkeCategorySlug: 'chemical-anchors',
    subcategorySlug: 'injection-resins',
    subcategoryName: 'Injection Resins & Accessories',
  },
  'Shot Fired Fixings': {
    torkeCategory: 'General Fixings',
    torkeCategorySlug: 'general-fixings',
    subcategorySlug: 'shot-fired-fixings',
    subcategoryName: 'Shot Fired Fixings',
  },
  'Mechanical Anchors': {
    torkeCategory: 'Mechanical Anchors',
    torkeCategorySlug: 'mechanical-anchors',
    subcategorySlug: 'expansion-anchors',
    subcategoryName: 'Expansion Anchors',
  },
  'Screw Anchor Bolts': {
    torkeCategory: 'Mechanical Anchors',
    torkeCategorySlug: 'mechanical-anchors',
    subcategorySlug: 'screw-anchors',
    subcategoryName: 'Screw Anchors',
  },
  'Drill Bits': {
    torkeCategory: 'General Fixings',
    torkeCategorySlug: 'general-fixings',
    subcategorySlug: 'drill-bits',
    subcategoryName: 'Drill Bits',
  },
  'Diamond Blades & Corebits': {
    torkeCategory: 'General Fixings',
    torkeCategorySlug: 'general-fixings',
    subcategorySlug: 'diamond-blades-corebits',
    subcategoryName: 'Diamond Blades & Corebits',
  },
};

// ───────────────────────────────────────────────────────
// SKU type codes for Torke SKU generation
// ───────────────────────────────────────────────────────

const TYPE_CODES: Record<string, string> = {
  'chemical-anchors': 'CA',
  'mechanical-anchors': 'MA',
  'general-fixings': 'GF',
};

const MATERIAL_CODES: Record<string, string> = {
  a2: 'A2',
  'a2-304': 'A2',
  a4: 'A4',
  'a4-316': 'A4',
  'zinc plated': 'ZP',
  'zinc-plated': 'ZP',
  galvanised: 'GV',
  'hot dipped galvanised': 'GV',
  'hot-dip galvanised': 'GV',
  'stainless steel': 'SS',
  'carbon steel': 'CS',
  'grade 8.8': 'G88',
};

// ───────────────────────────────────────────────────────
// Utility functions
// ───────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function extractDiameter(text: string): string | null {
  const match = text.match(/\bM(\d+)\b/i);
  return match ? `M${match[1]}` : null;
}

function extractLengthMm(text: string): number | null {
  // Match patterns like "120mm", "x 120mm", "120 mm"
  const match = text.match(/\b(\d+)\s*mm\b/i);
  if (match) {
    const len = parseInt(match[1]!, 10);
    // Sanity check: product lengths are typically 20-500mm
    if (len >= 10 && len <= 1000) return len;
  }
  return null;
}

function extractMaterial(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes('a4') || lower.includes('a4-316')) return 'A4 Stainless';
  if (lower.includes('a2') || lower.includes('a2-304')) return 'A2 Stainless';
  if (lower.includes('stainless steel')) return 'Stainless Steel';
  if (lower.includes('zinc plated') || lower.includes('zinc-plated'))
    return 'Zinc Plated';
  if (lower.includes('galvanised') || lower.includes('galvanized'))
    return 'Hot-Dip Galvanised';
  if (lower.includes('carbon steel')) return 'Carbon Steel';
  return null;
}

function extractFinish(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes('zinc plated')) return 'Zinc Plated';
  if (lower.includes('hot dip') || lower.includes('hot-dip'))
    return 'Hot-Dip Galvanised';
  if (lower.includes('a4')) return 'A4 Stainless';
  if (lower.includes('a2')) return 'A2 Stainless';
  if (lower.includes('electro galv')) return 'Electro Galvanised';
  return null;
}

function extractLoadClass(text: string): string | null {
  // Look for load class patterns like "C1", "C2", seismic categories
  const match = text.match(
    /\b(C[12]|seismic\s*(?:C[12]|category\s*[12]))/i
  );
  return match ? match[1]! : null;
}

/**
 * Generate Torke SKU.
 * Format: TRK-{TYPE_CODE}-{IDENTIFIER}
 * For products with size info: TRK-{TYPE}-{DIAMETER}-{LENGTH}-{MATERIAL}
 * For product families (no specific size): TRK-{TYPE}-{SHORT_CODE}
 */
function generateTorkeSku(
  categorySlug: string,
  name: string,
  diameter: string | null,
  lengthMm: number | null,
  material: string | null,
  sourceSlug: string
): string {
  const typeCode = TYPE_CODES[categorySlug] || 'GF';

  if (diameter && lengthMm) {
    // Specific size product
    const matCode = material
      ? MATERIAL_CODES[material.toLowerCase()] || 'XX'
      : 'XX';
    return `TRK-${typeCode}-${diameter}-${lengthMm}-${matCode}`;
  }

  // Product family (no specific size) -- use abbreviated name
  const shortCode = sourceSlug
    .replace(/-/g, '')
    .toUpperCase()
    .slice(0, 8);
  return `TRK-${typeCode}-${shortCode}`;
}

// ───────────────────────────────────────────────────────
// Main transform
// ───────────────────────────────────────────────────────

function transform() {
  console.log('Reading scraped products...');
  const raw: ScrapedProduct[] = JSON.parse(
    readFileSync('data/scraped-products.json', 'utf-8')
  );
  console.log(`Loaded ${raw.length} scraped products\n`);

  // Build category tree
  const categoriesMap = new Map<string, Category>();

  // Top-level categories
  const topLevelCategories: Category[] = [
    {
      name: 'Chemical Anchors',
      slug: 'chemical-anchors',
      parentSlug: null,
      sortOrder: 1,
      description:
        'High-performance chemical anchoring systems including injection resins, anchor rods, and accessories.',
    },
    {
      name: 'Mechanical Anchors',
      slug: 'mechanical-anchors',
      parentSlug: null,
      sortOrder: 2,
      description:
        'Expansion anchors, through bolts, screw anchors and frame fixings for concrete and masonry.',
    },
    {
      name: 'General Fixings',
      slug: 'general-fixings',
      parentSlug: null,
      sortOrder: 3,
      description:
        'Shot fired fixings, drill bits, diamond blades, and installation accessories.',
    },
  ];

  for (const cat of topLevelCategories) {
    categoriesMap.set(cat.slug, cat);
  }

  // Sub-categories from mapping
  const subcategories = new Set<string>();
  for (const mapping of Object.values(CATEGORY_MAP)) {
    const key = mapping.subcategorySlug;
    if (!subcategories.has(key)) {
      subcategories.add(key);
      categoriesMap.set(key, {
        name: mapping.subcategoryName,
        slug: key,
        parentSlug: mapping.torkeCategorySlug,
        sortOrder: subcategories.size,
        description: '',
      });
    }
  }

  const allCategories = Array.from(categoriesMap.values());

  // Transform products
  const slugTracker = new Set<string>();
  const skuTracker = new Set<string>();
  const transformed: TransformedProduct[] = [];
  const warnings: string[] = [];

  for (const product of raw) {
    // Validate required fields
    if (!product.name) {
      warnings.push(`REJECTED: Product at ${product.sourceUrl} has no name`);
      continue;
    }

    // Map category
    const catMapping = CATEGORY_MAP[product.category];
    if (!catMapping) {
      warnings.push(
        `WARNING: Unknown category "${product.category}" for ${product.name}`
      );
      continue;
    }

    // Generate slug
    let slug = slugify(product.name);
    if (slugTracker.has(slug)) {
      // Append source SKU to make unique
      slug = `${slug}-${slugify(product.sku)}`;
    }
    if (slugTracker.has(slug)) {
      // Last resort: append index
      slug = `${slug}-${transformed.length}`;
    }
    slugTracker.add(slug);

    // Extract facet fields from name + description + specs
    const fullText = `${product.name} ${product.description} ${JSON.stringify(product.technicalSpecs)}`;
    const diameter = extractDiameter(fullText);
    const lengthMm = extractLengthMm(fullText);
    const material = extractMaterial(fullText);
    const finish = extractFinish(fullText);
    const loadClass = extractLoadClass(fullText);

    // Generate Torke SKU
    const sourceSlug = product.sourceUrl.split('/').filter(Boolean).pop() || 'unknown';
    let sku = generateTorkeSku(
      catMapping.torkeCategorySlug,
      product.name,
      diameter,
      lengthMm,
      material,
      sourceSlug
    );

    // Ensure SKU uniqueness
    if (skuTracker.has(sku)) {
      sku = `${sku}-${transformed.length}`;
    }
    skuTracker.add(sku);

    // Warn about missing data
    if (product.imageUrls.length === 0) {
      warnings.push(`WARNING: No images for ${product.name}`);
    }
    if (product.datasheets.length === 0) {
      warnings.push(`WARNING: No datasheets for ${product.name}`);
    }

    // Build ETA reference from description text
    let etaRef = product.etaReference || null;
    if (!etaRef) {
      const etaMatch = fullText.match(/ETA[\s-]*\d+[\s/]*\d+/i);
      if (etaMatch) etaRef = etaMatch[0];
    }

    const transformedProduct: TransformedProduct = {
      name: product.name,
      slug,
      sku,
      categorySlug: catMapping.torkeCategorySlug,
      subcategorySlug: catMapping.subcategorySlug,
      description: product.description,
      technicalSpecs: product.technicalSpecs,
      diameter,
      material,
      lengthMm,
      finish,
      loadClass,
      etaReference: etaRef,
      localImages: product.imageUrls, // Will be replaced with local paths after download
      localDatasheetPath: product.datasheetUrl || null,
      sourceUrl: product.sourceUrl,
      features: product.features,
      applications: product.applications,
      baseMaterials: product.baseMaterials,
      availableSizes: product.availableSizes,
      datasheets: product.datasheets,
      isActive: true,
    };

    transformed.push(transformedProduct);
  }

  // Write outputs
  mkdirSync('data', { recursive: true });

  writeFileSync(
    'data/transformed-products.json',
    JSON.stringify(transformed, null, 2)
  );
  writeFileSync('data/categories.json', JSON.stringify(allCategories, null, 2));

  // Summary
  console.log('=== TRANSFORMATION COMPLETE ===\n');
  console.log(`Products transformed: ${transformed.length}/${raw.length}`);
  console.log(`Categories: ${allCategories.length} (${topLevelCategories.length} top-level + ${allCategories.length - topLevelCategories.length} sub)`);

  // Category distribution
  console.log('\nCategory distribution:');
  for (const cat of topLevelCategories) {
    const count = transformed.filter((p) => p.categorySlug === cat.slug).length;
    console.log(`  ${cat.name}: ${count} products`);
  }

  console.log('\nSubcategory distribution:');
  for (const [slug, cat] of categoriesMap) {
    if (cat.parentSlug) {
      const count = transformed.filter((p) => p.subcategorySlug === slug).length;
      console.log(`  ${cat.name}: ${count} products`);
    }
  }

  // Facet extraction stats
  const withDiameter = transformed.filter((p) => p.diameter).length;
  const withMaterial = transformed.filter((p) => p.material).length;
  const withLength = transformed.filter((p) => p.lengthMm).length;
  const withFinish = transformed.filter((p) => p.finish).length;
  const withLoadClass = transformed.filter((p) => p.loadClass).length;
  const withEta = transformed.filter((p) => p.etaReference).length;

  console.log('\nFacet extraction:');
  console.log(`  Diameter:   ${withDiameter}/${transformed.length}`);
  console.log(`  Material:   ${withMaterial}/${transformed.length}`);
  console.log(`  Length:     ${withLength}/${transformed.length}`);
  console.log(`  Finish:     ${withFinish}/${transformed.length}`);
  console.log(`  Load class: ${withLoadClass}/${transformed.length}`);
  console.log(`  ETA ref:    ${withEta}/${transformed.length}`);

  // Slug uniqueness check
  const slugs = transformed.map((p) => p.slug);
  const uniqueSlugs = new Set(slugs);
  console.log(
    `\nSlug uniqueness: ${uniqueSlugs.size}/${slugs.length} unique`
  );

  const skus = transformed.map((p) => p.sku);
  const uniqueSkus = new Set(skus);
  console.log(
    `SKU uniqueness:  ${uniqueSkus.size}/${skus.length} unique`
  );

  // Warnings
  if (warnings.length > 0) {
    console.log(`\n--- Warnings (${warnings.length}) ---`);
    for (const w of warnings) {
      console.log(`  ${w}`);
    }
  }

  console.log('\nOutput files:');
  console.log('  data/transformed-products.json');
  console.log('  data/categories.json');
}

transform();
