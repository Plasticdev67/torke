/**
 * Download product images and datasheets from Proventure.
 *
 * Reads: data/transformed-products.json
 * Writes: data/assets/images/{slug}/, data/assets/datasheets/{slug}.pdf
 * Updates: data/transformed-products.json with local file paths
 *
 * Features:
 * - Retry logic (3 attempts per download)
 * - Continues on failure (logs but doesn't stop)
 * - Progress logging
 * - Deduplicates downloads
 *
 * Usage: npx tsx scripts/download-assets.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';

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

const MAX_RETRIES = 3;
const DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadFile(
  url: string,
  outputPath: string,
  retries: number = MAX_RETRIES
): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const uint8 = new Uint8Array(buffer);

      // Ensure directory exists
      const dir = outputPath.replace(/[/\\][^/\\]+$/, '');
      mkdirSync(dir, { recursive: true });

      writeFileSync(outputPath, uint8);
      return true;
    } catch (err: any) {
      if (attempt < retries) {
        await sleep(DELAY_MS * attempt);
      } else {
        console.error(`  FAILED after ${retries} attempts: ${url} - ${err.message}`);
        return false;
      }
    }
  }
  return false;
}

async function downloadAssets() {
  console.log('Reading transformed products...');
  const products: TransformedProduct[] = JSON.parse(
    readFileSync('data/transformed-products.json', 'utf-8')
  );
  console.log(`Found ${products.length} products\n`);

  const assetsDir = 'data/assets';
  const imagesDir = join(assetsDir, 'images');
  const datasheetsDir = join(assetsDir, 'datasheets');

  mkdirSync(imagesDir, { recursive: true });
  mkdirSync(datasheetsDir, { recursive: true });

  let totalImages = 0;
  let downloadedImages = 0;
  let failedImages = 0;
  let totalDatasheets = 0;
  let downloadedDatasheets = 0;
  let failedDatasheets = 0;
  let skippedExisting = 0;

  const downloadedUrls = new Set<string>();

  for (let i = 0; i < products.length; i++) {
    const product = products[i]!;
    console.log(
      `\n[${i + 1}/${products.length}] ${product.name} (${product.slug})`
    );

    // Download images
    const productImagesDir = join(imagesDir, product.slug);
    const localImagePaths: string[] = [];

    for (let j = 0; j < product.localImages.length; j++) {
      const imageUrl = product.localImages[j]!;
      totalImages++;

      if (downloadedUrls.has(imageUrl)) {
        // Already downloaded (shared image between products)
        continue;
      }

      const ext = extname(basename(new URL(imageUrl).pathname)) || '.jpg';
      const filename = `image-${j + 1}${ext}`;
      const outputPath = join(productImagesDir, filename);

      if (existsSync(outputPath)) {
        skippedExisting++;
        localImagePaths.push(outputPath);
        downloadedUrls.add(imageUrl);
        continue;
      }

      console.log(
        `  Downloading image ${j + 1}/${product.localImages.length}: ${basename(imageUrl)}`
      );

      const success = await downloadFile(imageUrl, outputPath);
      if (success) {
        downloadedImages++;
        localImagePaths.push(outputPath);
        downloadedUrls.add(imageUrl);
      } else {
        failedImages++;
      }

      await sleep(DELAY_MS);
    }

    // Update product with local image paths
    product.localImages = localImagePaths;

    // Download datasheets
    for (let j = 0; j < product.datasheets.length; j++) {
      const datasheet = product.datasheets[j]!;
      totalDatasheets++;

      if (downloadedUrls.has(datasheet.url)) continue;

      const pdfFilename = `${product.slug}-${j + 1}.pdf`;
      const outputPath = join(datasheetsDir, pdfFilename);

      if (existsSync(outputPath)) {
        skippedExisting++;
        downloadedUrls.add(datasheet.url);
        if (j === 0) product.localDatasheetPath = outputPath;
        continue;
      }

      console.log(
        `  Downloading datasheet ${j + 1}/${product.datasheets.length}: ${datasheet.name}`
      );

      const success = await downloadFile(datasheet.url, outputPath);
      if (success) {
        downloadedDatasheets++;
        downloadedUrls.add(datasheet.url);
        if (j === 0) product.localDatasheetPath = outputPath;
      } else {
        failedDatasheets++;
      }

      await sleep(DELAY_MS);
    }
  }

  // Write updated products with local paths
  writeFileSync(
    'data/transformed-products.json',
    JSON.stringify(products, null, 2)
  );

  console.log('\n=== DOWNLOAD COMPLETE ===');
  console.log(`Images:     ${downloadedImages} downloaded, ${failedImages} failed, ${totalImages} total`);
  console.log(`Datasheets: ${downloadedDatasheets} downloaded, ${failedDatasheets} failed, ${totalDatasheets} total`);
  console.log(`Skipped (already exists): ${skippedExisting}`);
  console.log(`Unique URLs downloaded: ${downloadedUrls.size}`);
}

downloadAssets().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
