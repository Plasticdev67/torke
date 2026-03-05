/**
 * Tests for PDF report generation service.
 * Validates that generateCalcReport produces a valid multi-page PDF
 * with Torke branding, inputs summary, failure modes, and summary page.
 */
import { describe, it, expect } from "vitest";
import { generateCalcReport } from "@/server/services/calc-report-service";
import { calculateAnchorDesign } from "@/lib/calc-engine";
import type { DesignInputs } from "@/lib/calc-engine/types";

const SAMPLE_INPUTS: DesignInputs = {
  projectName: "Test Project Alpha",
  engineerName: "John Smith",
  projectRef: "TP-001",
  date: "2026-03-01",
  anchorType: "chemical",
  anchorDiameter: 12,
  embedmentDepth: 110,
  concreteClass: "C30/37",
  crackedConcrete: true,
  tensionLoad: 15,
  shearLoad: 8,
  edgeDistances: { c1: 200, c2: 200, c3: 200, c4: 200 },
  spacing: { s1: 100, s2: 100 },
  groupPattern: "single",
  steelGrade: "8.8",
  environment: "dry",
  plateThickness: 15,
  plateWidth: 150,
  plateDepth: 150,
  memberThickness: 250,
};

describe("generateCalcReport", () => {
  it("produces a PDF byte array with > 0 bytes", async () => {
    const results = calculateAnchorDesign(SAMPLE_INPUTS);
    const pdfBytes = await generateCalcReport(
      SAMPLE_INPUTS,
      results,
      { name: "John Smith", email: "john@example.com" },
      "CALC-2026-000001"
    );

    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(0);
  });

  it("produces a valid PDF (starts with %PDF-)", async () => {
    const results = calculateAnchorDesign(SAMPLE_INPUTS);
    const pdfBytes = await generateCalcReport(
      SAMPLE_INPUTS,
      results,
      { name: "John Smith", email: "john@example.com" },
      "CALC-2026-000001"
    );

    // Check PDF magic bytes: %PDF-
    const header = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(header).toBe("%PDF-");
  });

  it("produces a multi-page PDF with > 5 pages", async () => {
    const results = calculateAnchorDesign(SAMPLE_INPUTS);
    const pdfBytes = await generateCalcReport(
      SAMPLE_INPUTS,
      results,
      { name: "John Smith", email: "john@example.com" },
      "CALC-2026-000001"
    );

    // Load the generated PDF back and count pages using pdf-lib
    const { PDFDocument } = await import("pdf-lib");
    const loadedDoc = await PDFDocument.load(pdfBytes);
    const pageCount = loadedDoc.getPageCount();
    // Cover + TOC + Inputs + 7 failure modes + combined + summary = 12+ pages
    expect(pageCount).toBeGreaterThan(5);
  });
});
