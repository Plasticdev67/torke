/**
 * Playwright scraper for proventure.co.uk product catalogue.
 * One-time data migration tool — scrapes all product family pages
 * and extracts structured data for the Torke product database.
 *
 * Usage: npx tsx scripts/scrape-proventure.ts
 */

import { chromium, type Page } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const BASE_URL = 'https://www.proventure.co.uk';
const DELAY_MS = 1500; // Be polite to the server

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

// Categories discovered from proventure.co.uk navigation
const CATEGORIES = [
  {
    name: 'Chemical Anchors',
    slug: 'chemical-anchors',
    url: '/products/chemical-anchors/',
    products: [
      '/products/chemical-anchors/pro-v500-v4-resin/',
      '/products/chemical-anchors/pro-v200-v4-resin/',
      '/products/chemical-anchors/pro-v-plus/',
      '/products/chemical-anchors/asphalt-anchor/',
      '/products/chemical-anchors/pro-v200-site-kit/',
      '/products/chemical-anchors/chemical-v-anchor-rod/',
      '/products/chemical-anchors/internally-threaded-sleeve/',
      '/products/chemical-anchors/mesh-sleeve/',
      '/products/chemical-anchors/chemical-anchor-dispensers/',
      '/products/chemical-anchors/accessories/',
    ],
  },
  {
    name: 'Shot Fired Fixings',
    slug: 'shot-fired-fixings',
    url: '/products/shot-fired-fixings/',
    products: [
      '/products/shot-fired-fixings/grating-fasteners/',
      '/products/shot-fired-fixings/p370-powder-actuated-cartridge-tool/',
      '/products/shot-fired-fixings/p370-consumables/',
    ],
  },
  {
    name: 'Mechanical Anchors',
    slug: 'mechanical-anchors',
    url: '/products/fischer-mechanical-fixings/',
    products: [
      '/products/fischer-mechanical-fixings/faz-ii-bolt-anchor/',
      '/products/fischer-mechanical-fixings/fh-ii-high-performance-anchor/',
      '/products/fischer-mechanical-fixings/fbn-ii-bolt-anchor/',
      '/products/fischer-mechanical-fixings/fxa-throughbolt/',
      '/products/fischer-mechanical-fixings/sxr-frame-fixing/',
      '/products/fischer-mechanical-fixings/fis-v-injection-mortar/',
      '/products/fischer-mechanical-fixings/fbs-ii-concrete-screw/',
      '/products/fischer-mechanical-fixings/dhk-insulation-support/',
      '/products/fischer-mechanical-fixings/dhm-insulation-support/',
    ],
  },
  {
    name: 'Screw Anchor Bolts',
    slug: 'screw-anchor-bolts',
    url: '/products/screw-anchor-bolts/',
    products: [
      '/products/screw-anchor-bolts/screw-anchor-bolt/',
      '/products/screw-anchor-bolts/tapcon-blue/',
      '/products/screw-anchor-bolts/fbs-ii-concrete-screw/',
    ],
  },
  {
    name: 'Drill Bits',
    slug: 'drill-bits',
    url: '/products/drill-bits/',
    products: [
      '/products/drill-bits/sds-plus-2-cutting-edges/',
      '/products/drill-bits/sds-plus-4-cutting-edges/',
      '/products/drill-bits/hollow-drill-bits/',
      '/products/drill-bits/sds-max-2-cutting-edges/',
      '/products/drill-bits/sds-max-4-cutting-edges/',
    ],
  },
  {
    name: 'Diamond Blades & Corebits',
    slug: 'diamond-blades-corebits',
    url: '/products/diamond-blades-corebits/',
    products: [
      '/products/diamond-blades-corebits/diamond-blades/',
      '/products/diamond-blades-corebits/diamond-corebits/',
    ],
  },
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a simple SKU from the product URL slug.
 * Format: PRV-{SLUG_UPPER} (Proventure source SKU).
 * Torke SKUs will be generated in the transform step.
 */
function generateSourceSku(url: string): string {
  const slug = url.split('/').filter(Boolean).pop() || 'unknown';
  const code = slug
    .replace(/-/g, '')
    .toUpperCase()
    .slice(0, 12);
  return `PRV-${code}`;
}

/**
 * Extract all structured data from a single product page.
 */
async function extractProductData(
  page: Page,
  productUrl: string,
  categoryName: string
): Promise<ScrapedProduct> {
  // Product name from H1
  const name = await page
    .evaluate(() => document.querySelector('h1')?.textContent?.trim() || '')
    .catch(() => '');

  // Generate source SKU from URL
  const sku = generateSourceSku(productUrl);

  // Description: get text from the main content area, excluding navigation
  const description = await page
    .evaluate(() => {
      // Try to find the main content after the H1
      const h1 = document.querySelector('h1');
      if (!h1) return '';

      // Walk siblings after h1's parent section to collect description text
      let desc = '';
      let el = h1.parentElement?.nextElementSibling;
      while (el) {
        const tag = el.tagName.toLowerCase();
        if (tag === 'h2' || tag === 'h3') break;
        const text = el.textContent?.trim();
        if (text && text.length > 10) {
          desc += text + '\n';
        }
        el = el.nextElementSibling;
      }

      // If no description found via siblings, try the "MORE INFORMATION" section
      if (!desc) {
        const h3s = Array.from(document.querySelectorAll('h3'));
        const moreInfo = h3s.find(
          (h) => h.textContent?.trim() === 'MORE INFORMATION'
        );
        if (moreInfo) {
          let sibling = moreInfo.nextElementSibling;
          while (sibling) {
            const sibTag = sibling.tagName.toLowerCase();
            if (sibTag === 'h2' || sibTag === 'h3') break;
            const text = sibling.textContent?.trim();
            if (text && text.length > 5) desc += text + '\n';
            sibling = sibling.nextElementSibling;
          }
        }
      }

      return desc.trim();
    })
    .catch(() => '');

  // Features: extract from FEATURES AND BENEFITS section
  const features = await page
    .evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      const featuresH2 = h2s.find((h) =>
        h.textContent?.trim().toUpperCase().includes('FEATURE')
      );
      if (!featuresH2) return [];

      const items: string[] = [];
      let el = featuresH2.nextElementSibling;
      while (el) {
        if (el.tagName === 'H2' || el.tagName === 'H3') break;
        const lis = el.querySelectorAll('li');
        if (lis.length > 0) {
          lis.forEach((li) => {
            const text = li.textContent?.trim();
            if (text) items.push(text);
          });
        }
        el = el.nextElementSibling;
      }
      return items;
    })
    .catch(() => []);

  // Applications
  const applications = await page
    .evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      const appH2 = h2s.find((h) =>
        h.textContent?.trim().toUpperCase().includes('APPLICATION')
      );
      if (!appH2) return [];

      const items: string[] = [];
      let el = appH2.nextElementSibling;
      while (el) {
        if (el.tagName === 'H2' || el.tagName === 'H3') break;
        const lis = el.querySelectorAll('li');
        if (lis.length > 0) {
          lis.forEach((li) => {
            const text = li.textContent?.trim();
            if (text) items.push(text);
          });
        } else {
          const text = el.textContent?.trim();
          if (text && text.length > 5) items.push(text);
        }
        el = el.nextElementSibling;
      }
      return items;
    })
    .catch(() => []);

  // Base materials
  const baseMaterials = await page
    .evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      const matH2 = h2s.find((h) =>
        h.textContent?.trim().toUpperCase().includes('BASE MATERIAL')
      );
      if (!matH2) return [];

      const items: string[] = [];
      let el = matH2.nextElementSibling;
      while (el) {
        if (el.tagName === 'H2' || el.tagName === 'H3') break;
        const lis = el.querySelectorAll('li');
        if (lis.length > 0) {
          lis.forEach((li) => {
            const text = li.textContent?.trim();
            if (text) items.push(text);
          });
        }
        el = el.nextElementSibling;
      }
      return items;
    })
    .catch(() => []);

  // Extract all tables as spec data
  const tables = await page
    .evaluate(() => {
      return Array.from(document.querySelectorAll('table')).map((table) => {
        const headers = Array.from(table.querySelectorAll('th')).map(
          (th) => th.textContent?.trim() || ''
        );
        const rows = Array.from(table.querySelectorAll('tr')).map((tr) =>
          Array.from(tr.querySelectorAll('td, th')).map(
            (cell) => cell.textContent?.trim() || ''
          )
        );
        return { headers, rows };
      });
    })
    .catch(() => []);

  // Parse size/material availability from tables
  const availableSizes: ScrapedProduct['availableSizes'] = [];
  const technicalSpecs: Record<string, string> = {};
  let comparisonTable: Array<Record<string, string>> | undefined;

  for (const table of tables) {
    const headerStr = table.headers.join(' ').toLowerCase();

    // Detect size/availability tables (thread diameter, anchor length, etc.)
    if (
      headerStr.includes('diameter') ||
      headerStr.includes('thread') ||
      headerStr.includes('length')
    ) {
      for (const row of table.rows.slice(1)) {
        // Skip header row
        if (row.length < 2) continue;
        if (row[0]?.startsWith('✓') || row[0]?.startsWith('♦')) continue; // Legend row

        const diameter = row[0] || undefined;
        const length = row[1] || undefined;
        const materials: string[] = [];

        // Check remaining columns for checkmarks (indicating material availability)
        for (let i = 2; i < row.length && i < table.headers.length; i++) {
          if (row[i]?.includes('✓')) {
            materials.push(table.headers[i] || `col-${i}`);
          }
        }

        if (diameter) {
          availableSizes.push({ diameter, length, materials });
        }
      }
    }
    // Detect comparison/feature tables
    else if (headerStr.includes('comparison') || headerStr.includes('feature')) {
      comparisonTable = [];
      for (const row of table.rows.slice(1)) {
        if (row.length >= 2) {
          const entry: Record<string, string> = {};
          table.headers.forEach((h, i) => {
            if (h && row[i]) entry[h] = row[i];
          });
          if (Object.keys(entry).length > 0) {
            comparisonTable.push(entry);
          }
        }
      }
    }
    // Detect version tables
    else if (headerStr.includes('version')) {
      for (const row of table.rows.slice(1)) {
        if (row.length >= 2) {
          const key = row[0] || '';
          // Store version info as specs
          if (key && row[1]) {
            technicalSpecs[`version_${key.replace(/\s+/g, '_').toLowerCase()}`] =
              row.slice(1).join(' | ');
          }
        }
      }
    }
  }

  // Images: get product images (exclude nav icons, logos)
  const imageUrls = await page
    .evaluate((baseUrl: string) => {
      return Array.from(document.querySelectorAll('img'))
        .map((img) => {
          const src = img.getAttribute('src') || '';
          const alt = img.getAttribute('alt') || '';
          return { src, alt };
        })
        .filter(
          (img) =>
            img.src &&
            !img.src.includes('logo') &&
            !img.src.includes('icon') &&
            !img.src.includes('favicon') &&
            img.src.startsWith('/media/')
        )
        .map((img) => `${baseUrl}${img.src}`)
        // Deduplicate
        .filter((url, i, arr) => arr.indexOf(url) === i);
    }, BASE_URL)
    .catch(() => []);

  // PDF downloads
  const datasheets = await page
    .evaluate((baseUrl: string) => {
      return Array.from(document.querySelectorAll('a[href$=".pdf"]'))
        .map((a) => ({
          name: a.textContent?.trim() || 'Unknown',
          url: `${baseUrl}${a.getAttribute('href')}`,
        }))
        .filter(
          (d, i, arr) => arr.findIndex((x) => x.url === d.url) === i
        );
    }, BASE_URL)
    .catch(() => []);

  const datasheetUrl = datasheets.length > 0 ? datasheets[0]!.url : undefined;

  // ETA references from page text
  const etaReference = await page
    .evaluate(() => {
      const text = document.body?.textContent || '';
      const etaMatch = text.match(/ETA[\s-]*\d+[\s/]*\d+/i);
      return etaMatch ? etaMatch[0] : undefined;
    })
    .catch(() => undefined);

  // Extract extra info from body text for specs
  const bodyText = await page
    .evaluate(() => {
      const main =
        document.querySelector('main') ||
        document.querySelector('article') ||
        document.querySelector('.content-area');
      return main?.textContent?.trim()?.slice(0, 5000) || '';
    })
    .catch(() => '');

  // Look for common spec patterns in the text
  const tempMatch = bodyText.match(
    /temperature.*?(-?\d+[°]?\s*C?\s*to\s*-?\d+[°]?\s*C)/i
  );
  if (tempMatch) technicalSpecs['working_temperature'] = tempMatch[1]!;

  const cureMatch = bodyText.match(/cure\s*time.*?(\d+\s*(?:min|hour|minute)s?)/i);
  if (cureMatch) technicalSpecs['cure_time'] = cureMatch[1]!;

  const fireMatch = bodyText.match(
    /fire\s*(?:rated?|resistance|rating).*?(\d+\s*(?:min|hour)s?|R\d+)/i
  );
  if (fireMatch) technicalSpecs['fire_rating'] = fireMatch[1]!;

  return {
    sourceUrl: `${BASE_URL}${productUrl}`,
    name,
    sku,
    category: categoryName,
    description,
    technicalSpecs,
    imageUrls,
    datasheetUrl,
    datasheets,
    etaReference,
    features,
    applications,
    baseMaterials,
    availableSizes,
    comparisonTable,
    scrapedAt: new Date().toISOString(),
  };
}

async function scrapeProventure() {
  console.log('Starting Proventure product scrape...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Categories: ${CATEGORIES.length}`);

  const totalProducts = CATEGORIES.reduce(
    (sum, cat) => sum + cat.products.length,
    0
  );
  console.log(`Total product pages to scrape: ${totalProducts}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  const allProducts: ScrapedProduct[] = [];
  let productIndex = 0;

  for (const category of CATEGORIES) {
    console.log(`\n--- Category: ${category.name} (${category.products.length} products) ---`);

    for (const productPath of category.products) {
      productIndex++;
      const productUrl = `${BASE_URL}${productPath}`;

      try {
        console.log(
          `Scraping product ${productIndex}/${totalProducts}: ${productPath}`
        );

        await page.goto(productUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 20000,
        });

        // Wait for main content to load
        await page.waitForSelector('h1', { timeout: 10000 }).catch(() => {});

        const product = await extractProductData(
          page,
          productPath,
          category.name
        );

        // Add subcategory from URL path
        const pathParts = productPath.split('/').filter(Boolean);
        if (pathParts.length >= 3) {
          product.subcategory = pathParts[1]; // e.g., "chemical-anchors"
        }

        allProducts.push(product);

        console.log(
          `  -> ${product.name} | Images: ${product.imageUrls.length} | PDFs: ${product.datasheets.length} | Sizes: ${product.availableSizes.length}`
        );

        // Be polite
        await sleep(DELAY_MS);
      } catch (err: any) {
        console.error(
          `  ERROR scraping ${productUrl}: ${err.message}`
        );
        // Continue to next product
      }
    }
  }

  await browser.close();

  // Ensure data directory exists
  mkdirSync('data', { recursive: true });

  // Write scraped data
  const outputPath = 'data/scraped-products.json';
  writeFileSync(outputPath, JSON.stringify(allProducts, null, 2));

  console.log(`\n=== SCRAPE COMPLETE ===`);
  console.log(`Products scraped: ${allProducts.length}/${totalProducts}`);
  console.log(`Output: ${outputPath}`);

  // Summary stats
  const withImages = allProducts.filter((p) => p.imageUrls.length > 0).length;
  const withDatasheets = allProducts.filter((p) => p.datasheets.length > 0).length;
  const withSizes = allProducts.filter((p) => p.availableSizes.length > 0).length;
  const withEta = allProducts.filter((p) => p.etaReference).length;
  const withFeatures = allProducts.filter((p) => p.features.length > 0).length;

  console.log(`\nData completeness:`);
  console.log(`  With images:     ${withImages}/${allProducts.length}`);
  console.log(`  With datasheets: ${withDatasheets}/${allProducts.length}`);
  console.log(`  With sizes:      ${withSizes}/${allProducts.length}`);
  console.log(`  With ETA refs:   ${withEta}/${allProducts.length}`);
  console.log(`  With features:   ${withFeatures}/${allProducts.length}`);

  // Per-category breakdown
  console.log(`\nPer category:`);
  for (const cat of CATEGORIES) {
    const catProducts = allProducts.filter((p) => p.category === cat.name);
    console.log(`  ${cat.name}: ${catProducts.length} products`);
  }
}

scrapeProventure().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
