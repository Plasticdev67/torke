/**
 * Torke Product Datasheet Generator
 *
 * Generates a premium branded PDF datasheet for a single product.
 * Uses data from transformed-products.json + embedded product images.
 *
 * Usage: npx tsx scripts/gen-datasheet.ts [product-slug]
 * Default: pro-v500-v4-resin-anchor
 */

import { PDFDocument, rgb, StandardFonts, type PDFPage, type PDFFont, type PDFImage } from "pdf-lib";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, resolve } from "path";

// ---------------------------------------------------------------------------
// Brand constants
// ---------------------------------------------------------------------------

const A4_WIDTH = 595;
const A4_HEIGHT = 842;
const MARGIN = 40;
const CONTENT_WIDTH = A4_WIDTH - 2 * MARGIN;

// Colours
const TORKE_RED = rgb(196 / 255, 30 / 255, 58 / 255);    // #C41E3A
const TORKE_RED_DARK = rgb(158 / 255, 24 / 255, 48 / 255); // #9E1830
const BLACK = rgb(0, 0, 0);
const NEAR_BLACK = rgb(0.04, 0.04, 0.04);                  // #0A0A0A
const DARK_GREY = rgb(0.2, 0.2, 0.2);
const MID_GREY = rgb(0.45, 0.45, 0.45);
const LIGHT_GREY = rgb(0.92, 0.92, 0.92);
const VERY_LIGHT_GREY = rgb(0.96, 0.96, 0.96);
const WHITE = rgb(1, 1, 1);

const HEADER_HEIGHT = 72;
const FOOTER_HEIGHT = 50;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductData {
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
  features: string[];
  applications: string[];
  baseMaterials: string[];
  availableSizes: Array<{ diameter?: string; length?: string; materials: string[] }>;
  datasheets: Array<{ name: string; url: string }>;
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = BLACK,
) {
  page.drawText(text, { x, y, size, font, color });
}

function categoryLabel(slug: string): string {
  const map: Record<string, string> = {
    "chemical-anchors": "Chemical Anchors",
    "injection-resins": "Injection Resins",
    "mechanical-anchors": "Mechanical Anchors",
    "general-fixings": "General Fixings",
    "drilling": "Drilling",
    "direct-fastening": "Direct Fastening",
  };
  return map[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Page structure helpers
// ---------------------------------------------------------------------------

function drawHeader(page: PDFPage, boldFont: PDFFont, regularFont: PDFFont) {
  // Dark header bar
  page.drawRectangle({
    x: 0,
    y: A4_HEIGHT - HEADER_HEIGHT,
    width: A4_WIDTH,
    height: HEADER_HEIGHT,
    color: NEAR_BLACK,
  });

  // Red accent stripe (thin, at bottom of header)
  page.drawRectangle({
    x: 0,
    y: A4_HEIGHT - HEADER_HEIGHT,
    width: A4_WIDTH,
    height: 3,
    color: TORKE_RED,
  });

  // Torke T monogram (geometric shape)
  const tX = MARGIN;
  const tY = A4_HEIGHT - HEADER_HEIGHT + 16;
  const tSize = 40;
  // White square with cut corner
  page.drawRectangle({ x: tX, y: tY, width: tSize, height: tSize, color: WHITE });
  // Cut corner triangle (bottom-right)
  page.drawLine({
    start: { x: tX + tSize * 0.75, y: tY },
    end: { x: tX + tSize, y: tY + tSize * 0.25 },
    thickness: 12,
    color: NEAR_BLACK,
  });
  // T letter
  drawText(page, "T", tX + 10, tY + 8, boldFont, 26, NEAR_BLACK);

  // TORKE wordmark
  drawText(page, "TORKE", tX + tSize + 12, tY + 14, boldFont, 22, WHITE);
  drawText(page, "\u00AE", tX + tSize + 12 + boldFont.widthOfTextAtSize("TORKE", 22) + 2, tY + 24, regularFont, 8, rgb(1, 1, 1));

  // "PRODUCT DATA SHEET" right-aligned
  const label = "PRODUCT DATA SHEET";
  const labelW = boldFont.widthOfTextAtSize(label, 9);
  drawText(page, label, A4_WIDTH - MARGIN - labelW, tY + 20, boldFont, 9, MID_GREY);

  // Document ref right-aligned below
  const ref = `REF: TDS-${new Date().getFullYear()}`;
  const refW = regularFont.widthOfTextAtSize(ref, 7);
  drawText(page, ref, A4_WIDTH - MARGIN - refW, tY + 8, regularFont, 7, MID_GREY);
}

function drawFooter(page: PDFPage, regularFont: PDFFont, boldFont: PDFFont, pageNum: number) {
  const footerTop = FOOTER_HEIGHT;

  // Red line above footer
  page.drawRectangle({
    x: 0,
    y: footerTop,
    width: A4_WIDTH,
    height: 2,
    color: TORKE_RED,
  });

  // Footer content
  const y1 = footerTop - 14;
  const y2 = footerTop - 26;
  const y3 = footerTop - 38;

  drawText(page, "TORKE", MARGIN, y1, boldFont, 8, NEAR_BLACK);
  drawText(page, "\u00AE", MARGIN + boldFont.widthOfTextAtSize("TORKE", 8) + 1, y1 + 3, regularFont, 5, MID_GREY);
  drawText(page, "Construction Fixings", MARGIN + 42, y1, regularFont, 7, MID_GREY);

  drawText(page, "info@torke.co.uk", MARGIN, y2, regularFont, 7, MID_GREY);
  drawText(page, "|", MARGIN + regularFont.widthOfTextAtSize("info@torke.co.uk  ", 7), y2, regularFont, 7, LIGHT_GREY);
  drawText(page, "torke.co.uk", MARGIN + regularFont.widthOfTextAtSize("info@torke.co.uk    ", 7) + 6, y2, regularFont, 7, MID_GREY);

  // Disclaimer
  drawText(page, "All data subject to technical changes. Values are characteristic unless otherwise stated.", MARGIN, y3, regularFont, 5.5, MID_GREY);

  // Page number right-aligned
  const pageStr = `${pageNum}`;
  const pw = boldFont.widthOfTextAtSize(pageStr, 8);
  drawText(page, pageStr, A4_WIDTH - MARGIN - pw, y1, boldFont, 8, TORKE_RED);

  // Diagonal accent mark in footer (brand DNA)
  page.drawLine({
    start: { x: A4_WIDTH - MARGIN - pw - 20, y: y1 + 10 },
    end: { x: A4_WIDTH - MARGIN - pw - 10, y: y1 - 4 },
    thickness: 2,
    color: TORKE_RED,
  });
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function drawSectionTitle(
  page: PDFPage,
  title: string,
  x: number,
  y: number,
  boldFont: PDFFont,
): number {
  // Red accent bar before title
  page.drawRectangle({ x, y: y - 1, width: 3, height: 14, color: TORKE_RED });
  drawText(page, title.toUpperCase(), x + 10, y, boldFont, 10, NEAR_BLACK);
  // Thin rule under title
  page.drawRectangle({ x, y: y - 6, width: CONTENT_WIDTH, height: 0.5, color: LIGHT_GREY });
  return y - 22;
}

function drawBulletList(
  page: PDFPage,
  items: string[],
  x: number,
  startY: number,
  regularFont: PDFFont,
  maxWidth: number,
  columns: number = 1,
): number {
  let y = startY;
  const colWidth = (maxWidth - (columns - 1) * 16) / columns;
  const itemsPerCol = Math.ceil(items.length / columns);

  for (let col = 0; col < columns; col++) {
    let colY = startY;
    const colX = x + col * (colWidth + 16);
    const start = col * itemsPerCol;
    const end = Math.min(start + itemsPerCol, items.length);

    for (let i = start; i < end; i++) {
      const item = items[i]!;
      // Red square bullet
      page.drawRectangle({
        x: colX,
        y: colY + 1,
        width: 4,
        height: 4,
        color: TORKE_RED,
      });

      const lines = wrapText(item, regularFont, 8, colWidth - 14);
      for (const line of lines) {
        drawText(page, line, colX + 12, colY, regularFont, 8, DARK_GREY);
        colY -= 13;
      }
    }
    if (colY < y) y = colY;
  }
  return y;
}

function drawTickOrCross(page: PDFPage, cx: number, cy: number, isTick: boolean, _font: PDFFont) {
  if (isTick) {
    const green = rgb(0.1, 0.6, 0.1);
    page.drawLine({ start: { x: cx, y: cy + 3 }, end: { x: cx + 3, y: cy }, thickness: 1.5, color: green });
    page.drawLine({ start: { x: cx + 3, y: cy }, end: { x: cx + 8, y: cy + 7 }, thickness: 1.5, color: green });
  } else {
    const red = rgb(0.8, 0.1, 0.1);
    page.drawLine({ start: { x: cx, y: cy + 6 }, end: { x: cx + 6, y: cy }, thickness: 1.5, color: red });
    page.drawLine({ start: { x: cx, y: cy }, end: { x: cx + 6, y: cy + 6 }, thickness: 1.5, color: red });
  }
}

function drawComparisonTable(
  page: PDFPage,
  startY: number,
  boldFont: PDFFont,
  regularFont: PDFFont,
): number {
  let y = startY;

  // Table header
  const col1 = MARGIN;
  const col2 = MARGIN + 280;
  const col3 = MARGIN + 390;
  const colW = CONTENT_WIDTH;

  page.drawRectangle({ x: col1, y: y - 4, width: colW, height: 18, color: NEAR_BLACK });
  drawText(page, "FEATURE", col1 + 8, y, boldFont, 7, WHITE);
  drawText(page, "TORKE TR500", col2 + 8, y, boldFont, 7, WHITE);
  drawText(page, "HILTI RE 500 V4", col3 + 8, y, boldFont, 7, WHITE);
  y -= 18;

  const rows: [string, string, string][] = [
    ["ETA Option 1", "\u2713", "\u2713"],
    ["Rebar Connections (EAD 330087)", "\u2713", "\u2713"],
    ["Seismic Loads C1 & C2", "\u2713", "\u2713"],
    ["Submerged / Underwater", "\u2713", "\u2713"],
    ["Dust Free Drilling", "\u2713", "\u2713"],
    ["Design Software (TRACE)", "\u2713", "\u2713"],
    ["WRAS Approved (Potable Water)", "\u2713", "\u2718"],
    ["100-Year Anchor Working Life", "\u2713", "\u2713"],
    ["Fire Approved Class A1", "\u2713", "\u2713"],
  ];

  for (let i = 0; i < rows.length; i++) {
    const [feature, torke, hilti] = rows[i]!;
    const bg = i % 2 === 0 ? VERY_LIGHT_GREY : WHITE;
    page.drawRectangle({ x: col1, y: y - 4, width: colW, height: 16, color: bg });
    drawText(page, feature!, col1 + 8, y, regularFont, 7.5, DARK_GREY);
    // Torke column — draw tick/cross as shapes
    drawTickOrCross(page, col2 + 20, y, torke === "\u2713", boldFont);
    // Hilti column
    drawTickOrCross(page, col3 + 20, y, hilti === "\u2713", boldFont);

    // Vertical dividers
    page.drawLine({ start: { x: col2, y: y - 4 }, end: { x: col2, y: y + 12 }, thickness: 0.5, color: LIGHT_GREY });
    page.drawLine({ start: { x: col3, y: y - 4 }, end: { x: col3, y: y + 12 }, thickness: 0.5, color: LIGHT_GREY });

    y -= 16;
  }

  // Bottom border
  page.drawRectangle({ x: col1, y: y + 12, width: colW, height: 1, color: NEAR_BLACK });

  return y;
}

function drawCertBadges(
  page: PDFPage,
  startY: number,
  boldFont: PDFFont,
  regularFont: PDFFont,
): number {
  let y = startY;

  const badges = [
    { label: "ETA", sub: "European Technical\nAssessment" },
    { label: "CE", sub: "CE Certified" },
    { label: "WRAS", sub: "Potable Water\nApproved" },
    { label: "C1/C2", sub: "Seismic\nPerformance" },
    { label: "A1", sub: "Fire\nClassification" },
  ];

  const badgeW = 86;
  const badgeH = 60;
  const gap = (CONTENT_WIDTH - badges.length * badgeW) / (badges.length - 1);

  for (let i = 0; i < badges.length; i++) {
    const bx = MARGIN + i * (badgeW + gap);
    const by = y - badgeH;

    // Badge outline
    page.drawRectangle({
      x: bx,
      y: by,
      width: badgeW,
      height: badgeH,
      borderColor: TORKE_RED,
      borderWidth: 1.5,
      color: WHITE,
    });

    // Red top stripe
    page.drawRectangle({
      x: bx,
      y: by + badgeH - 3,
      width: badgeW,
      height: 3,
      color: TORKE_RED,
    });

    // Label
    const lw = boldFont.widthOfTextAtSize(badges[i]!.label, 14);
    drawText(page, badges[i]!.label, bx + (badgeW - lw) / 2, by + 28, boldFont, 14, NEAR_BLACK);

    // Sub text (split on \n)
    const subLines = badges[i]!.sub.split("\n");
    let subY = by + 18;
    for (const line of subLines) {
      const sw = regularFont.widthOfTextAtSize(line, 6);
      drawText(page, line, bx + (badgeW - sw) / 2, subY, regularFont, 6, MID_GREY);
      subY -= 8;
    }
  }

  return y - badgeH - 10;
}

// ---------------------------------------------------------------------------
// Main datasheet builder
// ---------------------------------------------------------------------------

// Torke product name overrides (replacing Proventure names)
const TORKE_NAMES: Record<string, { name: string; subtitle: string }> = {
  "pro-v500-v4-resin-anchor": { name: "TORKE TR500", subtitle: "Ultimate Performance Epoxy Anchoring Resin" },
  "pro-v200-v4-resin": { name: "TORKE TR200", subtitle: "High Performance Vinylester Resin" },
  "pro-v-plus-resin": { name: "TORKE TR Plus", subtitle: "General Purpose Anchoring Resin" },
  "pro-v-asphalt-anchor": { name: "TORKE TR Asphalt", subtitle: "Specialist Asphalt Anchoring System" },
};

async function generateDatasheet(product: ProductData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  // Apply Torke name override
  const override = TORKE_NAMES[product.slug];
  const displayName = override?.name ?? product.name;
  const subtitle = override?.subtitle ?? "";

  // Embed product image if available
  let productImage: PDFImage | null = null;
  if (product.localImages.length > 0) {
    const imgPath = resolve(product.localImages[0]!.replace(/\\/g, "/"));
    if (existsSync(imgPath)) {
      const imgBytes = readFileSync(imgPath);
      try {
        productImage = await doc.embedJpg(imgBytes);
      } catch {
        try { productImage = await doc.embedPng(imgBytes); } catch { /* skip */ }
      }
    }
  }

  // =========================================================================
  // PAGE 1
  // =========================================================================
  const page1 = doc.addPage([A4_WIDTH, A4_HEIGHT]);
  drawHeader(page1, bold, regular);

  let y = A4_HEIGHT - HEADER_HEIGHT - 28;

  // Category breadcrumb
  const catLabel = categoryLabel(product.subcategorySlug ?? product.categorySlug);
  drawText(page1, catLabel.toUpperCase(), MARGIN, y, regular, 7, TORKE_RED);
  y -= 6;

  // Red underline for category
  const catW = regular.widthOfTextAtSize(catLabel.toUpperCase(), 7);
  page1.drawRectangle({ x: MARGIN, y: y, width: catW, height: 1, color: TORKE_RED });
  y -= 18;

  // Product name (large)
  const nameLines = wrapText(displayName, bold, 24, CONTENT_WIDTH - 180);
  for (const line of nameLines) {
    drawText(page1, line, MARGIN, y, bold, 24, NEAR_BLACK);
    y -= 30;
  }

  // Subtitle
  if (subtitle) {
    drawText(page1, subtitle, MARGIN, y, regular, 10, MID_GREY);
    y -= 16;
  }

  // SKU
  drawText(page1, product.sku, MARGIN, y, regular, 9, MID_GREY);
  y -= 20;

  // Thin separator
  page1.drawRectangle({ x: MARGIN, y: y, width: CONTENT_WIDTH, height: 0.5, color: LIGHT_GREY });
  y -= 16;

  // Layout: left side = description + features, right side = product image
  const imgColWidth = 180;
  const textColWidth = CONTENT_WIDTH - imgColWidth - 20;

  // Product image (right side)
  if (productImage) {
    const imgAspect = productImage.width / productImage.height;
    const displayW = imgColWidth;
    const displayH = displayW / imgAspect;
    const imgX = A4_WIDTH - MARGIN - displayW;
    const imgY = y - displayH + 20;

    // Light background for image
    page1.drawRectangle({
      x: imgX - 8,
      y: imgY - 8,
      width: displayW + 16,
      height: displayH + 16,
      color: VERY_LIGHT_GREY,
      borderColor: LIGHT_GREY,
      borderWidth: 0.5,
    });

    page1.drawImage(productImage, {
      x: imgX,
      y: imgY,
      width: displayW,
      height: displayH,
    });
  }

  // Description (left side, cleaned up — strip Proventure/Hilti references)
  const descClean = product.description
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("Download") && !l.startsWith("Enquire") && !l.startsWith("Technical Data") && !l.startsWith("Feature comparison") && l !== "PRO V500 V4" && l !== "HILTI RE 500 V4" && !l.includes("PROCALC"))
    .join(" ")
    .replace(/Proven alternative to Hilti HIT-RE 500 V4/gi, "")
    .replace(/PRO V500 V4/gi, displayName)
    .replace(/Proventure/gi, "Torke")
    .replace(/Hilti [A-Z-]+ \d+[A-Z]?\d*/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // Build a proper summary for the TR500
  const summary = override
    ? `${displayName} is an ultimate performance epoxy anchoring resin engineered for heavy-duty structural connections, rebar installations, and safety-critical applications. European Technical Assessment approved with seismic performance to C1 and C2. WRAS approved for potable water applications. Designed for cracked and uncracked concrete, diamond cored holes, and wet or submerged conditions. 100-year anchor working life.`
    : (descClean.length > 300 ? descClean.slice(0, 300).replace(/\s\S*$/, "...") : descClean);
  const descLines = wrapText(summary, regular, 8.5, textColWidth);
  for (const line of descLines) {
    drawText(page1, line, MARGIN, y, regular, 8.5, DARK_GREY);
    y -= 13;
  }
  y -= 12;

  // KEY FEATURES section
  y = drawSectionTitle(page1, "Key Features", MARGIN, y, bold);

  // Split features into two columns (strip competitor references)
  const featuresCapped = product.features
    .filter((f) => !f.toLowerCase().includes("alternative to hilti"))
    .map((f) => f.replace(/PRO V500 V4/gi, displayName).replace(/Proventure/gi, "Torke"))
    .slice(0, 14);
  y = drawBulletList(page1, featuresCapped, MARGIN, y, regular, textColWidth + imgColWidth + 20, 2);
  y -= 16;

  // APPLICATIONS section
  if (product.applications.length > 0) {
    y = drawSectionTitle(page1, "Applications", MARGIN, y, bold);
    y = drawBulletList(page1, product.applications, MARGIN, y, regular, CONTENT_WIDTH, 3);
    y -= 16;
  }

  // CERTIFICATION BADGES
  if (y > FOOTER_HEIGHT + 90) {
    y = drawSectionTitle(page1, "Approvals & Certifications", MARGIN, y, bold);
    y = drawCertBadges(page1, y, bold, regular);
  }

  drawFooter(page1, regular, bold, 1);

  // =========================================================================
  // PAGE 2
  // =========================================================================
  const page2 = doc.addPage([A4_WIDTH, A4_HEIGHT]);
  drawHeader(page2, bold, regular);
  y = A4_HEIGHT - HEADER_HEIGHT - 28;

  // Product name recap (smaller)
  drawText(page2, displayName, MARGIN, y, bold, 14, NEAR_BLACK);
  drawText(page2, product.sku, MARGIN + bold.widthOfTextAtSize(displayName, 14) + 12, y + 1, regular, 8, MID_GREY);
  y -= 28;

  // COMPARISON TABLE (PRO V500 vs Hilti)
  y = drawSectionTitle(page2, "Performance Comparison", MARGIN, y, bold);
  y = drawComparisonTable(page2, y, bold, regular);
  y -= 24;

  // BASE MATERIALS section
  y = drawSectionTitle(page2, "Base Materials", MARGIN, y, bold);
  const baseMats = [
    "Concrete (cracked and uncracked)",
    "Natural stone",
    "Diamond cored holes",
    "Wet, water-filled, and submerged conditions",
  ];
  y = drawBulletList(page2, baseMats, MARGIN, y, regular, CONTENT_WIDTH, 2);
  y -= 20;

  // AVAILABLE DOCUMENTS section
  if (product.datasheets.length > 0) {
    y = drawSectionTitle(page2, "Available Technical Documents", MARGIN, y, bold);
    for (const ds of product.datasheets) {
      // Document icon (simple rectangle)
      page2.drawRectangle({ x: MARGIN, y: y - 2, width: 10, height: 12, borderColor: TORKE_RED, borderWidth: 0.8, color: WHITE });
      drawText(page2, "PDF", MARGIN + 1.5, y, regular, 4.5, TORKE_RED);
      drawText(page2, ds.name, MARGIN + 16, y, regular, 8, DARK_GREY);
      y -= 16;
    }
    y -= 8;
  }

  // CALL TO ACTION box
  y -= 10;
  const ctaH = 70;
  page2.drawRectangle({
    x: MARGIN,
    y: y - ctaH,
    width: CONTENT_WIDTH,
    height: ctaH,
    color: NEAR_BLACK,
  });
  // Red accent on left
  page2.drawRectangle({
    x: MARGIN,
    y: y - ctaH,
    width: 4,
    height: ctaH,
    color: TORKE_RED,
  });

  drawText(page2, "NEED TECHNICAL SUPPORT?", MARGIN + 20, y - 20, bold, 11, WHITE);
  drawText(page2, "Our engineering team can help with anchor design, specification, and installation guidance.", MARGIN + 20, y - 36, regular, 8, rgb(0.7, 0.7, 0.7));
  drawText(page2, "info@torke.co.uk", MARGIN + 20, y - 52, bold, 9, TORKE_RED);
  drawText(page2, "|", MARGIN + 20 + bold.widthOfTextAtSize("info@torke.co.uk  ", 9), y - 52, regular, 9, MID_GREY);
  drawText(page2, "torke.co.uk/products/" + product.slug, MARGIN + 20 + bold.widthOfTextAtSize("info@torke.co.uk     ", 9) + 6, y - 52, regular, 8, rgb(0.7, 0.7, 0.7));

  // Diagonal accent in CTA box (top right corner)
  page2.drawLine({
    start: { x: A4_WIDTH - MARGIN - 30, y: y - 4 },
    end: { x: A4_WIDTH - MARGIN - 4, y: y - ctaH + 4 },
    thickness: 3,
    color: TORKE_RED,
  });

  drawFooter(page2, regular, bold, 2);

  return doc.save();
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

async function main() {
  const slug = process.argv[2] || "pro-v500-v4-resin-anchor";
  const dataPath = join(process.cwd(), "data", "transformed-products.json");
  const products: ProductData[] = JSON.parse(readFileSync(dataPath, "utf-8"));
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    console.error(`Product "${slug}" not found. Available slugs:`);
    products.forEach((p) => console.error(`  ${p.slug}`));
    process.exit(1);
  }

  console.log(`Generating datasheet for: ${product.name} (${product.sku})`);
  const bytes = await generateDatasheet(product);
  const outPath = join(process.cwd(), `datasheet-${slug}.pdf`);
  writeFileSync(outPath, bytes);
  console.log(`Written: ${outPath} (${bytes.length} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
