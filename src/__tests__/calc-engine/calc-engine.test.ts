/**
 * Full pipeline tests for the calc engine.
 * Tests the complete calculateAnchorDesign function end-to-end.
 */
import { describe, it, expect } from "vitest";
import { calculateAnchorDesign } from "@/lib/calc-engine";
import type { DesignInputs, DesignResults } from "@/lib/calc-engine/types";
import { SCOPE_LIMITATIONS } from "@/lib/calc-engine/constants";
import { designInputsSchema } from "@/lib/calc-engine/validation";
import { PRESETS } from "@/lib/calc-engine/presets";

const SINGLE_M12: DesignInputs = {
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

describe("calculateAnchorDesign - Full Pipeline", () => {
  it("returns results with all 7 failure modes", () => {
    const result = calculateAnchorDesign(SINGLE_M12);
    expect(result.failureModes).toHaveLength(7);
    const names = result.failureModes.map((m) => m.name);
    expect(names).toContain("Steel Tension");
    expect(names).toContain("Steel Shear");
    expect(names).toContain("Concrete Cone Breakout");
    expect(names).toContain("Pull-out");
    expect(names).toContain("Concrete Pryout");
    expect(names).toContain("Concrete Edge Breakout");
    expect(names).toContain("Splitting");
  });

  it("returns combined interaction check", () => {
    const result = calculateAnchorDesign(SINGLE_M12);
    expect(result.combinedInteraction).toBeDefined();
    expect(result.combinedInteraction.name).toBe("Combined Interaction");
  });

  it("identifies the governing failure mode", () => {
    const result = calculateAnchorDesign(SINGLE_M12);
    expect(result.governingMode).toBeTruthy();
    expect(result.governingUtilisation).toBeGreaterThan(0);
    const governingMode = result.failureModes.find(
      (m) => m.name === result.governingMode
    );
    expect(governingMode).toBeDefined();
  });

  it("includes scope limitations on every result", () => {
    const result = calculateAnchorDesign(SINGLE_M12);
    expect(result.scopeLimitations).toContain(
      "No seismic design (EN 1992-4 Annex C not implemented)"
    );
    expect(result.scopeLimitations).toContain(
      "No fire design (EN 1992-4 Annex D not implemented)"
    );
  });

  it("each failure mode has clause reference, formula, and intermediate values", () => {
    const result = calculateAnchorDesign(SINGLE_M12);
    for (const mode of result.failureModes) {
      expect(mode.clauseRef).toMatch(/EN 1992-4/);
      expect(mode.formula).toBeTruthy();
      expect(Object.keys(mode.intermediateValues).length).toBeGreaterThan(0);
      expect(mode.designResistance).toBeGreaterThan(0);
    }
  });

  it("all utilisations are between 0 and 1 for moderate loads", () => {
    const result = calculateAnchorDesign(SINGLE_M12);
    for (const mode of result.failureModes) {
      expect(mode.utilisation).toBeGreaterThanOrEqual(0);
      expect(mode.utilisation).toBeLessThanOrEqual(1);
    }
  });
});

describe("Input Validation", () => {
  it("rejects negative tension load", () => {
    const result = designInputsSchema.safeParse({
      ...SINGLE_M12,
      tensionLoad: -5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero embedment depth", () => {
    const result = designInputsSchema.safeParse({
      ...SINGLE_M12,
      embedmentDepth: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects embedment depth below 40mm", () => {
    const result = designInputsSchema.safeParse({
      ...SINGLE_M12,
      embedmentDepth: 30,
    });
    expect(result.success).toBe(false);
  });

  it("rejects embedment depth above 500mm", () => {
    const result = designInputsSchema.safeParse({
      ...SINGLE_M12,
      embedmentDepth: 600,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid concrete class", () => {
    const result = designInputsSchema.safeParse({
      ...SINGLE_M12,
      concreteClass: "C60/75",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid anchor diameter", () => {
    const result = designInputsSchema.safeParse({
      ...SINGLE_M12,
      anchorDiameter: 15,
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid inputs", () => {
    const result = designInputsSchema.safeParse(SINGLE_M12);
    expect(result.success).toBe(true);
  });
});

describe("Presets", () => {
  it("has at least 4 presets", () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(4);
  });

  it("all presets pass validation", () => {
    for (const preset of PRESETS) {
      const result = designInputsSchema.safeParse(preset.inputs);
      expect(result.success).toBe(true);
    }
  });

  it("includes 'Single M12 Baseplate' preset", () => {
    const found = PRESETS.find((p) => p.name.includes("M12"));
    expect(found).toBeDefined();
  });

  it("includes '4-Bolt M16 Column Base' preset", () => {
    const found = PRESETS.find((p) => p.name.includes("M16"));
    expect(found).toBeDefined();
  });
});

describe("Group Pattern Effects", () => {
  it("4-bolt group near edge has higher cone utilisation than centre", () => {
    const groupCentre: DesignInputs = {
      ...SINGLE_M12,
      anchorDiameter: 16,
      embedmentDepth: 200,
      tensionLoad: 60,
      shearLoad: 25,
      groupPattern: "2x2",
      spacing: { s1: 200, s2: 200 },
      edgeDistances: { c1: 400, c2: 400, c3: 400, c4: 400 },
      memberThickness: 400,
    };

    const groupEdge: DesignInputs = {
      ...groupCentre,
      edgeDistances: { c1: 100, c2: 400, c3: 400, c4: 400 },
    };

    const centreResult = calculateAnchorDesign(groupCentre);
    const edgeResult = calculateAnchorDesign(groupEdge);

    const centreCone = centreResult.failureModes.find(
      (m) => m.name === "Concrete Cone Breakout"
    )!;
    const edgeCone = edgeResult.failureModes.find(
      (m) => m.name === "Concrete Cone Breakout"
    )!;

    expect(edgeCone.utilisation).toBeGreaterThan(centreCone.utilisation);
  });
});
