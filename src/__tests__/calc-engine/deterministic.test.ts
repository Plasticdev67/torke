/**
 * Deterministic tests for the calc engine.
 * Confirms same inputs produce identical results across multiple runs.
 */
import { describe, it, expect } from "vitest";
import { calculateAnchorDesign } from "@/lib/calc-engine";
import type { DesignInputs } from "@/lib/calc-engine/types";

const TEST_INPUT: DesignInputs = {
  projectName: "",
  engineerName: "",
  projectRef: "",
  date: "2026-01-01",
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

describe("Deterministic Results", () => {
  it("produces identical results across 100 runs", () => {
    const firstResult = calculateAnchorDesign(TEST_INPUT);
    const firstJson = JSON.stringify(firstResult);

    for (let i = 0; i < 100; i++) {
      const result = calculateAnchorDesign(TEST_INPUT);
      expect(JSON.stringify(result)).toBe(firstJson);
    }
  });

  it("produces identical results for different input objects with same values", () => {
    const input1 = { ...TEST_INPUT };
    const input2 = { ...TEST_INPUT };
    const result1 = calculateAnchorDesign(input1);
    const result2 = calculateAnchorDesign(input2);
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
  });
});
