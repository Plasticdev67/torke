/**
 * Failure mode tests for the calc engine.
 * Tests all 7 failure modes + combined interaction.
 *
 * RED phase: These tests will initially fail because
 * failure mode implementations are created in Task 2.
 */
import { describe, it, expect } from "vitest";
import { calculateAnchorDesign } from "@/lib/calc-engine";
import type { DesignInputs } from "@/lib/calc-engine/types";

/** Standard test input: M12 single anchor, centre of C30/37 slab */
const SINGLE_M12_CENTRE: DesignInputs = {
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

describe("Steel Tension Failure (Cl. 7.2.1.3)", () => {
  it("produces a valid utilisation ratio between 0 and 1", () => {
    const result = calculateAnchorDesign(SINGLE_M12_CENTRE);
    const mode = result.failureModes.find((m) => m.name === "Steel Tension");
    expect(mode).toBeDefined();
    expect(mode!.utilisation).toBeGreaterThanOrEqual(0);
    expect(mode!.utilisation).toBeLessThanOrEqual(1);
    expect(mode!.clauseRef).toBe("EN 1992-4 Cl. 7.2.1.3");
  });

  it("uses c=0.85 for chemical anchors", () => {
    const result = calculateAnchorDesign(SINGLE_M12_CENTRE);
    const mode = result.failureModes.find((m) => m.name === "Steel Tension");
    expect(mode!.intermediateValues["c_factor"]?.value).toBe(0.85);
  });

  it("uses c=1.0 for mechanical anchors", () => {
    const mechInput = { ...SINGLE_M12_CENTRE, anchorType: "mechanical" as const };
    const result = calculateAnchorDesign(mechInput);
    const mode = result.failureModes.find((m) => m.name === "Steel Tension");
    expect(mode!.intermediateValues["c_factor"]?.value).toBe(1.0);
  });
});

describe("Steel Shear Failure (Cl. 7.2.2.3)", () => {
  it("produces a valid utilisation ratio", () => {
    const result = calculateAnchorDesign(SINGLE_M12_CENTRE);
    const mode = result.failureModes.find((m) => m.name === "Steel Shear");
    expect(mode).toBeDefined();
    expect(mode!.utilisation).toBeGreaterThanOrEqual(0);
    expect(mode!.utilisation).toBeLessThanOrEqual(1);
    expect(mode!.clauseRef).toBe("EN 1992-4 Cl. 7.2.2.3");
  });
});

describe("Concrete Cone Breakout (Cl. 7.2.1.4)", () => {
  it("produces a valid utilisation ratio", () => {
    const result = calculateAnchorDesign(SINGLE_M12_CENTRE);
    const mode = result.failureModes.find((m) => m.name === "Concrete Cone Breakout");
    expect(mode).toBeDefined();
    expect(mode!.utilisation).toBeGreaterThanOrEqual(0);
    expect(mode!.utilisation).toBeLessThanOrEqual(1);
    expect(mode!.clauseRef).toBe("EN 1992-4 Cl. 7.2.1.4");
  });

  it("has lower resistance near an edge", () => {
    const edgeInput: DesignInputs = {
      ...SINGLE_M12_CENTRE,
      edgeDistances: { c1: 80, c2: 200, c3: 200, c4: 200 },
    };
    const centreResult = calculateAnchorDesign(SINGLE_M12_CENTRE);
    const edgeResult = calculateAnchorDesign(edgeInput);
    const centreMode = centreResult.failureModes.find(
      (m) => m.name === "Concrete Cone Breakout"
    )!;
    const edgeMode = edgeResult.failureModes.find(
      (m) => m.name === "Concrete Cone Breakout"
    )!;
    expect(edgeMode.designResistance).toBeLessThan(centreMode.designResistance);
  });
});

describe("Pull-out Failure (Cl. 7.2.1.5)", () => {
  it("produces a valid utilisation ratio for chemical anchors", () => {
    const result = calculateAnchorDesign(SINGLE_M12_CENTRE);
    const mode = result.failureModes.find((m) => m.name === "Pull-out");
    expect(mode).toBeDefined();
    expect(mode!.utilisation).toBeGreaterThanOrEqual(0);
    expect(mode!.clauseRef).toBe("EN 1992-4 Cl. 7.2.1.5");
  });
});

describe("Concrete Pryout (Cl. 7.2.2.4)", () => {
  it("produces a valid utilisation ratio", () => {
    const result = calculateAnchorDesign(SINGLE_M12_CENTRE);
    const mode = result.failureModes.find((m) => m.name === "Concrete Pryout");
    expect(mode).toBeDefined();
    expect(mode!.utilisation).toBeGreaterThanOrEqual(0);
    expect(mode!.clauseRef).toBe("EN 1992-4 Cl. 7.2.2.4");
  });
});

describe("Concrete Edge Breakout (Cl. 7.2.2.5)", () => {
  it("produces a valid utilisation ratio", () => {
    const result = calculateAnchorDesign(SINGLE_M12_CENTRE);
    const mode = result.failureModes.find((m) => m.name === "Concrete Edge Breakout");
    expect(mode).toBeDefined();
    expect(mode!.utilisation).toBeGreaterThanOrEqual(0);
    expect(mode!.clauseRef).toBe("EN 1992-4 Cl. 7.2.2.5");
  });

  it("has higher utilisation when closer to edge", () => {
    const edgeInput: DesignInputs = {
      ...SINGLE_M12_CENTRE,
      edgeDistances: { c1: 80, c2: 200, c3: 200, c4: 200 },
    };
    const centreResult = calculateAnchorDesign(SINGLE_M12_CENTRE);
    const edgeResult = calculateAnchorDesign(edgeInput);
    const centreMode = centreResult.failureModes.find(
      (m) => m.name === "Concrete Edge Breakout"
    )!;
    const edgeMode = edgeResult.failureModes.find(
      (m) => m.name === "Concrete Edge Breakout"
    )!;
    expect(edgeMode.utilisation).toBeGreaterThan(centreMode.utilisation);
  });
});

describe("Splitting Failure (Cl. 7.2.1.6)", () => {
  it("produces a valid utilisation ratio", () => {
    const result = calculateAnchorDesign(SINGLE_M12_CENTRE);
    const mode = result.failureModes.find((m) => m.name === "Splitting");
    expect(mode).toBeDefined();
    expect(mode!.utilisation).toBeGreaterThanOrEqual(0);
    expect(mode!.clauseRef).toBe("EN 1992-4 Cl. 7.2.1.6");
  });
});

describe("Combined Interaction (Table 7.3)", () => {
  it("produces a valid combined utilisation", () => {
    const result = calculateAnchorDesign(SINGLE_M12_CENTRE);
    expect(result.combinedInteraction).toBeDefined();
    expect(result.combinedInteraction.utilisation).toBeGreaterThanOrEqual(0);
    expect(result.combinedInteraction.clauseRef).toBe("EN 1992-4 Table 7.3");
  });

  it("passes when all individual modes pass with low utilisation", () => {
    const lowLoad: DesignInputs = { ...SINGLE_M12_CENTRE, tensionLoad: 1, shearLoad: 1 };
    const result = calculateAnchorDesign(lowLoad);
    expect(result.combinedInteraction.pass).toBe(true);
    expect(result.overallPass).toBe(true);
  });
});
