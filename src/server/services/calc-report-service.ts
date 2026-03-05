/**
 * Anchor Design Calculation Report - PDF Generator
 *
 * Generates a formal engineering calculation report using pdf-lib.
 * Follows the Torke PDF pattern established in certpack-service and invoice-service.
 *
 * Report structure:
 * 1. Cover page with Torke branding
 * 2. Table of contents
 * 3. Inputs summary
 * 4. One section per failure mode (clause ref, formula, intermediate values, result)
 * 5. Combined interaction section
 * 6. Summary page (all modes, governing mode, overall pass/fail)
 *
 * Every page footer includes scope limitations and page number.
 */

import { PDFDocument, rgb, StandardFonts, type PDFPage, type PDFFont } from "pdf-lib";
import type { DesignInputs, DesignResults, FailureModeResult } from "@/lib/calc-engine/types";

// --------------------------------------------------------------------------
// Constants (matching certpack / invoice pattern)
// --------------------------------------------------------------------------

const A4_WIDTH = 595;
const A4_HEIGHT = 842;
const MARGIN = 50;
const TORKE_RED = rgb(196 / 255, 30 / 255, 58 / 255);
const BLACK = rgb(0, 0, 0);
const DARK_GREY = rgb(0.3, 0.3, 0.3);
const LIGHT_GREY = rgb(0.85, 0.85, 0.85);
const WHITE = rgb(1, 1, 1);
const GREEN = rgb(0.1, 0.6, 0.1);
const RED_TEXT = rgb(0.8, 0.1, 0.1);

const CONTENT_WIDTH = A4_WIDTH - 2 * MARGIN;
const FOOTER_Y = MARGIN + 10;
const FOOTER_SCOPE = "Scope: No seismic design. No fire design. Splitting/pull-out use generic values -- see report for full limitations.";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

interface ReportUser {
  name: string;
  email: string;
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = BLACK
) {
  page.drawText(text, { x, y, size, font, color });
}

function drawHLine(page: PDFPage, y: number, x1: number, x2: number, color = DARK_GREY) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: 0.5, color });
}

function drawPageFooter(
  page: PDFPage,
  pageNum: number,
  totalPages: number,
  regularFont: PDFFont
) {
  drawHLine(page, FOOTER_Y + 5, MARGIN, A4_WIDTH - MARGIN);
  drawText(page, FOOTER_SCOPE, MARGIN, FOOTER_Y - 5, regularFont, 5.5, DARK_GREY);
  const pageStr = `Page ${pageNum} of ${totalPages}`;
  const pageStrWidth = regularFont.widthOfTextAtSize(pageStr, 7);
  drawText(page, pageStr, A4_WIDTH - MARGIN - pageStrWidth, FOOTER_Y - 5, regularFont, 7, DARK_GREY);
}

function formatValue(value: number, unit: string): string {
  if (!isFinite(value)) return "Infinity";
  const formatted = value >= 1000 ? value.toFixed(0) : value < 0.01 ? value.toExponential(2) : value.toFixed(2);
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatInputLabel(key: string): string {
  const labels: Record<string, string> = {
    anchorType: "Anchor Type",
    anchorDiameter: "Anchor Diameter",
    steelGrade: "Steel Grade",
    embedmentDepth: "Embedment Depth (hef)",
    concreteClass: "Concrete Class",
    crackedConcrete: "Cracked Concrete",
    memberThickness: "Member Thickness",
    tensionLoad: "Tension Load (NEd)",
    shearLoad: "Shear Load (VEd)",
    groupPattern: "Group Pattern",
    "spacing.s1": "Spacing s1",
    "spacing.s2": "Spacing s2",
    "edgeDistances.c1": "Edge Distance c1",
    "edgeDistances.c2": "Edge Distance c2",
    "edgeDistances.c3": "Edge Distance c3",
    "edgeDistances.c4": "Edge Distance c4",
    plateThickness: "Plate Thickness",
    plateWidth: "Plate Width",
    plateDepth: "Plate Depth",
    environment: "Environment",
    projectName: "Project Name",
    engineerName: "Engineer Name",
    projectRef: "Project Reference",
    date: "Date",
  };
  return labels[key] ?? key;
}

function formatInputValue(key: string, value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    const units: Record<string, string> = {
      anchorDiameter: "mm",
      embedmentDepth: "mm",
      memberThickness: "mm",
      tensionLoad: "kN",
      shearLoad: "kN",
      "spacing.s1": "mm",
      "spacing.s2": "mm",
      "edgeDistances.c1": "mm",
      "edgeDistances.c2": "mm",
      "edgeDistances.c3": "mm",
      "edgeDistances.c4": "mm",
      plateThickness: "mm",
      plateWidth: "mm",
      plateDepth: "mm",
    };
    return units[key] ? `${value} ${units[key]}` : String(value);
  }
  return String(value ?? "");
}

// --------------------------------------------------------------------------
// Build flat input rows from DesignInputs
// --------------------------------------------------------------------------

function flattenInputs(inputs: DesignInputs): { key: string; value: unknown }[] {
  const rows: { key: string; value: unknown }[] = [];
  const order = [
    "projectName", "engineerName", "projectRef", "date",
    "anchorType", "anchorDiameter", "steelGrade", "embedmentDepth",
    "concreteClass", "crackedConcrete", "memberThickness",
    "tensionLoad", "shearLoad", "groupPattern",
  ];
  for (const k of order) {
    rows.push({ key: k, value: (inputs as Record<string, unknown>)[k] });
  }
  // Spacing
  rows.push({ key: "spacing.s1", value: inputs.spacing.s1 });
  rows.push({ key: "spacing.s2", value: inputs.spacing.s2 });
  // Edge distances
  rows.push({ key: "edgeDistances.c1", value: inputs.edgeDistances.c1 });
  rows.push({ key: "edgeDistances.c2", value: inputs.edgeDistances.c2 });
  rows.push({ key: "edgeDistances.c3", value: inputs.edgeDistances.c3 });
  rows.push({ key: "edgeDistances.c4", value: inputs.edgeDistances.c4 });
  // Plate
  rows.push({ key: "plateThickness", value: inputs.plateThickness });
  rows.push({ key: "plateWidth", value: inputs.plateWidth });
  rows.push({ key: "plateDepth", value: inputs.plateDepth });
  rows.push({ key: "environment", value: inputs.environment });
  return rows;
}

// --------------------------------------------------------------------------
// Section builders
// --------------------------------------------------------------------------

interface PageState {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  pageCount: number;
  boldFont: PDFFont;
  regularFont: PDFFont;
  monoFont: PDFFont;
}

function newPage(state: PageState): void {
  state.page = state.doc.addPage([A4_WIDTH, A4_HEIGHT]);
  state.y = A4_HEIGHT - MARGIN - 10;
  state.pageCount++;
}

function ensureSpace(state: PageState, needed: number): void {
  if (state.y < FOOTER_Y + 30 + needed) {
    newPage(state);
  }
}

// --- Cover Page ---

function buildCoverPage(
  state: PageState,
  inputs: DesignInputs,
  results: DesignResults,
  user: ReportUser,
  calcReference: string
): void {
  const { page, boldFont, regularFont } = state;

  // Red header bar
  page.drawRectangle({ x: 0, y: A4_HEIGHT - 60, width: A4_WIDTH, height: 60, color: TORKE_RED });
  drawText(page, "TORKE", 50, A4_HEIGHT - 42, boldFont, 28, WHITE);
  drawText(page, "Design Report", A4_WIDTH - 180, A4_HEIGHT - 42, regularFont, 14, WHITE);

  let y = A4_HEIGHT - 120;

  // Title
  drawText(page, "Anchor Design Calculation", MARGIN, y, boldFont, 22, BLACK);
  y -= 30;
  drawText(page, "to EN 1992-4", MARGIN, y, regularFont, 14, DARK_GREY);
  y -= 50;

  // Details block
  const labelX = MARGIN;
  const valueX = MARGIN + 140;
  const lh = 20;

  const details = [
    ["Calculation Reference:", calcReference],
    ["Project Name:", inputs.projectName || "-"],
    ["Project Reference:", inputs.projectRef || "-"],
    ["Engineer:", inputs.engineerName || user.name],
    ["Date:", inputs.date || new Date().toLocaleDateString("en-GB")],
    ["Overall Status:", results.overallPass ? "PASS" : "FAIL"],
  ];

  for (const [label, value] of details) {
    drawText(page, label, labelX, y, boldFont, 10);
    const color = label === "Overall Status:" ? (results.overallPass ? GREEN : RED_TEXT) : BLACK;
    drawText(page, value, valueX, y, regularFont, 10, color);
    y -= lh;
  }

  y -= 20;
  drawHLine(page, y, MARGIN, A4_WIDTH - MARGIN);
  y -= 20;

  // Disclaimer
  drawText(page, "Scope Limitations:", MARGIN, y, boldFont, 9, TORKE_RED);
  y -= 14;
  for (const limitation of results.scopeLimitations) {
    drawText(page, `- ${limitation}`, MARGIN + 10, y, regularFont, 8, DARK_GREY);
    y -= 12;
  }

  y -= 20;
  drawText(
    page,
    "This calculation report is generated by Torke Design. The engineer is responsible for verifying",
    MARGIN,
    y,
    regularFont,
    7,
    DARK_GREY
  );
  y -= 10;
  drawText(
    page,
    "all inputs, confirming applicability of the design standard, and ensuring compliance with project requirements.",
    MARGIN,
    y,
    regularFont,
    7,
    DARK_GREY
  );

  state.y = y;
}

// --- Table of Contents ---

function buildTocPage(state: PageState, failureModes: FailureModeResult[]): void {
  newPage(state);
  const { page, boldFont, regularFont } = state;
  let y = state.y;

  drawText(page, "Table of Contents", MARGIN, y, boldFont, 16, TORKE_RED);
  y -= 30;

  const sections = [
    "1. Design Inputs Summary",
    ...failureModes.map((m, i) => `${i + 2}. ${m.name} (${m.clauseRef})`),
    `${failureModes.length + 2}. Combined Interaction Check`,
    `${failureModes.length + 3}. Results Summary`,
  ];

  for (const s of sections) {
    drawText(page, s, MARGIN + 10, y, regularFont, 10, BLACK);
    y -= 18;
  }

  state.y = y;
}

// --- Inputs Summary ---

function buildInputsPage(state: PageState, inputs: DesignInputs): void {
  newPage(state);
  let y = state.y;

  drawText(state.page, "1. Design Inputs Summary", MARGIN, y, state.boldFont, 14, TORKE_RED);
  y -= 25;

  // Table header
  const labelX = MARGIN;
  const valueX = MARGIN + 200;

  state.page.drawRectangle({ x: labelX - 2, y: y - 4, width: CONTENT_WIDTH + 4, height: 16, color: LIGHT_GREY });
  drawText(state.page, "Parameter", labelX, y, state.boldFont, 8);
  drawText(state.page, "Value", valueX, y, state.boldFont, 8);
  y -= 16;
  drawHLine(state.page, y, labelX - 2, A4_WIDTH - MARGIN + 2);
  y -= 2;

  const rows = flattenInputs(inputs);
  for (const row of rows) {
    y -= 14;
    ensureSpace(state, 14);
    if (state.y !== y) {
      // Page changed, reset
      y = state.y - 14;
    }
    drawText(state.page, formatInputLabel(row.key), labelX, y, state.regularFont, 8);
    drawText(state.page, formatInputValue(row.key, row.value), valueX, y, state.regularFont, 8);
    drawHLine(state.page, y - 3, labelX - 2, A4_WIDTH - MARGIN + 2);
  }

  state.y = y;
}

// --- Failure Mode Section ---

function buildFailureModeSection(
  state: PageState,
  mode: FailureModeResult,
  sectionNum: number
): void {
  newPage(state);
  let y = state.y;

  // Section header
  drawText(
    state.page,
    `${sectionNum}. ${mode.name}`,
    MARGIN,
    y,
    state.boldFont,
    14,
    TORKE_RED
  );
  y -= 18;
  drawText(state.page, `Clause Reference: ${mode.clauseRef}`, MARGIN, y, state.regularFont, 9, DARK_GREY);
  y -= 25;

  // Formula (monospace)
  drawText(state.page, "Formula:", MARGIN, y, state.boldFont, 9);
  y -= 14;

  // Wrap formula text if needed
  const formulaLines = wrapText(mode.formula, state.monoFont, 7, CONTENT_WIDTH - 10);
  for (const line of formulaLines) {
    ensureSpace(state, 12);
    if (state.y < y) y = state.y;
    drawText(state.page, line, MARGIN + 10, y, state.monoFont, 7, BLACK);
    y -= 12;
  }

  y -= 10;

  // Intermediate Values table
  const ivEntries = Object.entries(mode.intermediateValues);
  if (ivEntries.length > 0) {
    ensureSpace(state, 30);
    if (state.y < y) y = state.y;

    drawText(state.page, "Intermediate Values:", MARGIN, y, state.boldFont, 9);
    y -= 16;

    // Table header
    const col1 = MARGIN;
    const col2 = MARGIN + 200;
    const col3 = MARGIN + 320;

    state.page.drawRectangle({ x: col1 - 2, y: y - 4, width: CONTENT_WIDTH + 4, height: 16, color: LIGHT_GREY });
    drawText(state.page, "Parameter", col1, y, state.boldFont, 7);
    drawText(state.page, "Value", col2, y, state.boldFont, 7);
    drawText(state.page, "Unit", col3, y, state.boldFont, 7);
    y -= 16;
    drawHLine(state.page, y, col1 - 2, A4_WIDTH - MARGIN + 2);
    y -= 2;

    for (const [, iv] of ivEntries) {
      y -= 13;
      ensureSpace(state, 13);
      if (state.y !== y && state.y > y) y = state.y - 13;
      drawText(state.page, iv.label, col1, y, state.regularFont, 7);
      drawText(state.page, formatValue(iv.value, ""), col2, y, state.regularFont, 7);
      drawText(state.page, iv.unit, col3, y, state.regularFont, 7);
      drawHLine(state.page, y - 3, col1 - 2, A4_WIDTH - MARGIN + 2);
    }
  }

  y -= 25;
  ensureSpace(state, 40);
  if (state.y < y) y = state.y;

  // Result line
  drawText(state.page, "Design Check:", MARGIN, y, state.boldFont, 10);
  y -= 16;

  const nedStr = `Design Load = ${mode.designLoad.toFixed(2)} kN`;
  const nrdStr = `Design Resistance = ${isFinite(mode.designResistance) ? mode.designResistance.toFixed(2) : "Infinity"} kN`;
  const utilStr = `Utilisation = ${(mode.utilisation * 100).toFixed(1)}%`;

  drawText(state.page, nedStr, MARGIN + 10, y, state.regularFont, 9);
  y -= 14;
  drawText(state.page, nrdStr, MARGIN + 10, y, state.regularFont, 9);
  y -= 14;
  drawText(state.page, utilStr, MARGIN + 10, y, state.boldFont, 9);
  y -= 20;

  // Pass/Fail indicator
  const status = mode.pass ? "PASS" : "FAIL";
  const statusColor = mode.pass ? GREEN : RED_TEXT;
  state.page.drawRectangle({
    x: MARGIN,
    y: y - 4,
    width: 80,
    height: 22,
    color: mode.pass ? rgb(0.9, 1, 0.9) : rgb(1, 0.9, 0.9),
    borderColor: statusColor,
    borderWidth: 1,
  });
  drawText(state.page, status, MARGIN + 20, y, state.boldFont, 14, statusColor);

  state.y = y - 30;
}

// --- Combined Interaction ---

function buildCombinedSection(
  state: PageState,
  combined: FailureModeResult,
  sectionNum: number
): void {
  // Reuse failure mode section builder
  buildFailureModeSection(state, combined, sectionNum);
}

// --- Summary Page ---

function buildSummaryPage(
  state: PageState,
  results: DesignResults,
  sectionNum: number
): void {
  newPage(state);
  let y = state.y;

  drawText(state.page, `${sectionNum}. Results Summary`, MARGIN, y, state.boldFont, 16, TORKE_RED);
  y -= 30;

  // Summary table
  const col1 = MARGIN;
  const col2 = MARGIN + 180;
  const col3 = MARGIN + 300;
  const col4 = MARGIN + 400;

  // Header
  state.page.drawRectangle({ x: col1 - 2, y: y - 4, width: CONTENT_WIDTH + 4, height: 16, color: LIGHT_GREY });
  drawText(state.page, "Failure Mode", col1, y, state.boldFont, 8);
  drawText(state.page, "Clause", col2, y, state.boldFont, 8);
  drawText(state.page, "Utilisation", col3, y, state.boldFont, 8);
  drawText(state.page, "Status", col4, y, state.boldFont, 8);
  y -= 16;
  drawHLine(state.page, y, col1 - 2, A4_WIDTH - MARGIN + 2);
  y -= 2;

  const allModes = [...results.failureModes, results.combinedInteraction];

  for (const mode of allModes) {
    y -= 16;
    const isGoverning = mode.name === results.governingMode;
    const rowColor = isGoverning ? rgb(1, 0.92, 0.92) : undefined;

    if (rowColor) {
      state.page.drawRectangle({ x: col1 - 2, y: y - 4, width: CONTENT_WIDTH + 4, height: 16, color: rowColor });
    }

    const nameFont = isGoverning ? state.boldFont : state.regularFont;
    drawText(state.page, mode.name, col1, y, nameFont, 8);
    drawText(state.page, mode.clauseRef, col2, y, state.regularFont, 8);
    drawText(state.page, `${(mode.utilisation * 100).toFixed(1)}%`, col3, y, state.regularFont, 8);

    const statusColor = mode.pass ? GREEN : RED_TEXT;
    drawText(state.page, mode.pass ? "PASS" : "FAIL", col4, y, state.boldFont, 8, statusColor);

    drawHLine(state.page, y - 4, col1 - 2, A4_WIDTH - MARGIN + 2);
  }

  y -= 10;

  // Governing mode callout
  drawText(
    state.page,
    `Governing Failure Mode: ${results.governingMode} (${(results.governingUtilisation * 100).toFixed(1)}%)`,
    MARGIN,
    y,
    state.boldFont,
    9,
    TORKE_RED
  );
  y -= 40;

  // Overall PASS/FAIL
  const overallStatus = results.overallPass ? "PASS" : "FAIL";
  const overallColor = results.overallPass ? GREEN : RED_TEXT;
  const bgColor = results.overallPass ? rgb(0.9, 1, 0.9) : rgb(1, 0.9, 0.9);

  state.page.drawRectangle({
    x: A4_WIDTH / 2 - 80,
    y: y - 10,
    width: 160,
    height: 45,
    color: bgColor,
    borderColor: overallColor,
    borderWidth: 2,
  });

  drawText(state.page, "OVERALL", A4_WIDTH / 2 - 35, y + 18, state.boldFont, 10, DARK_GREY);
  drawText(state.page, overallStatus, A4_WIDTH / 2 - 30, y - 2, state.boldFont, 24, overallColor);

  state.y = y - 50;
}

// --------------------------------------------------------------------------
// Text wrapping helper
// --------------------------------------------------------------------------

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, size);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [""];
}

// --------------------------------------------------------------------------
// Main export
// --------------------------------------------------------------------------

export async function generateCalcReport(
  inputs: DesignInputs,
  results: DesignResults,
  user: ReportUser,
  calcReference: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);
  const monoFont = await doc.embedFont(StandardFonts.Courier);

  const state: PageState = {
    doc,
    page: doc.addPage([A4_WIDTH, A4_HEIGHT]),
    y: A4_HEIGHT - MARGIN - 10,
    pageCount: 1,
    boldFont,
    regularFont,
    monoFont,
  };

  // 1. Cover page
  buildCoverPage(state, inputs, results, user, calcReference);

  // 2. Table of contents
  buildTocPage(state, results.failureModes);

  // 3. Inputs summary
  buildInputsPage(state, inputs);

  // 4. Failure mode sections (one page each)
  let sectionNum = 2;
  for (const mode of results.failureModes) {
    buildFailureModeSection(state, mode, sectionNum);
    sectionNum++;
  }

  // 5. Combined interaction
  buildCombinedSection(state, results.combinedInteraction, sectionNum);
  sectionNum++;

  // 6. Summary page
  buildSummaryPage(state, results, sectionNum);

  // Add footers to all pages
  const totalPages = doc.getPageCount();
  const pages = doc.getPages();
  for (let i = 0; i < totalPages; i++) {
    drawPageFooter(pages[i]!, i + 1, totalPages, regularFont);
  }

  return doc.save();
}
