/**
 * Group effects tests for the calc engine.
 * Tests anchor positioning and projected area calculations for various patterns.
 */
import { describe, it, expect } from "vitest";
import { getAnchorPositions, getAnchorCount, calculateGroupEccentricity } from "@/lib/calc-engine/geometry/group-effects";
import {
  calculateProjectedArea,
  calculateReferenceArea,
  calculateAreaRatio,
} from "@/lib/calc-engine/geometry/projected-areas";
import type { EdgeDistances, AnchorSpacing } from "@/lib/calc-engine/types";

const FAR_EDGES: EdgeDistances = { c1: 500, c2: 500, c3: 500, c4: 500 };
const DEFAULT_SPACING: AnchorSpacing = { s1: 100, s2: 100 };

describe("getAnchorPositions", () => {
  it("returns single position at origin for 'single' pattern", () => {
    const positions = getAnchorPositions("single", DEFAULT_SPACING);
    expect(positions).toEqual([[0, 0]]);
  });

  it("returns 2 positions for '2x1' pattern", () => {
    const positions = getAnchorPositions("2x1", { s1: 200, s2: 0 });
    expect(positions).toHaveLength(2);
    expect(positions[0]).toEqual([-100, 0]);
    expect(positions[1]).toEqual([100, 0]);
  });

  it("returns 4 positions for '2x2' pattern", () => {
    const positions = getAnchorPositions("2x2", { s1: 200, s2: 150 });
    expect(positions).toHaveLength(4);
    // Verify symmetry about centroid
    const xSum = positions.reduce((s, p) => s + p[0], 0);
    const ySum = positions.reduce((s, p) => s + p[1], 0);
    expect(xSum).toBeCloseTo(0);
    expect(ySum).toBeCloseTo(0);
  });

  it("returns 6 positions for '3x2' pattern", () => {
    const positions = getAnchorPositions("3x2", { s1: 150, s2: 100 });
    expect(positions).toHaveLength(6);
  });

  it("returns correct count for each pattern", () => {
    expect(getAnchorCount("single")).toBe(1);
    expect(getAnchorCount("2x1")).toBe(2);
    expect(getAnchorCount("2x2")).toBe(4);
    expect(getAnchorCount("3x2")).toBe(6);
  });
});

describe("calculateReferenceArea", () => {
  it("returns (3*hef)^2 for any embedment depth", () => {
    expect(calculateReferenceArea(100)).toBe(90000); // (300)^2
    expect(calculateReferenceArea(110)).toBe(108900); // (330)^2
    expect(calculateReferenceArea(200)).toBe(360000); // (600)^2
  });
});

describe("calculateProjectedArea", () => {
  it("equals reference area for single anchor far from edges", () => {
    const hef = 100;
    const area = calculateProjectedArea(hef, FAR_EDGES, DEFAULT_SPACING, "single");
    const refArea = calculateReferenceArea(hef);
    expect(area).toBe(refArea);
  });

  it("is reduced for single anchor near one edge", () => {
    const hef = 100;
    const edgeDistances: EdgeDistances = { c1: 100, c2: 500, c3: 500, c4: 500 };
    const area = calculateProjectedArea(hef, edgeDistances, DEFAULT_SPACING, "single");
    const refArea = calculateReferenceArea(hef);
    expect(area).toBeLessThan(refArea);
  });

  it("is further reduced for corner anchor (two close edges)", () => {
    const hef = 100;
    const cornerEdges: EdgeDistances = { c1: 100, c2: 100, c3: 500, c4: 500 };
    const oneEdge: EdgeDistances = { c1: 100, c2: 500, c3: 500, c4: 500 };
    const cornerArea = calculateProjectedArea(hef, cornerEdges, DEFAULT_SPACING, "single");
    const oneEdgeArea = calculateProjectedArea(hef, oneEdge, DEFAULT_SPACING, "single");
    expect(cornerArea).toBeLessThan(oneEdgeArea);
  });

  it("is larger for groups than single anchors (far from edges)", () => {
    const hef = 100;
    const singleArea = calculateProjectedArea(hef, FAR_EDGES, DEFAULT_SPACING, "single");
    const groupArea = calculateProjectedArea(hef, FAR_EDGES, DEFAULT_SPACING, "2x2");
    expect(groupArea).toBeGreaterThan(singleArea);
  });

  it("produces different area ratios for different group patterns", () => {
    const hef = 100;
    const ratio_single = calculateAreaRatio(hef, FAR_EDGES, DEFAULT_SPACING, "single");
    const ratio_2x1 = calculateAreaRatio(hef, FAR_EDGES, DEFAULT_SPACING, "2x1");
    const ratio_2x2 = calculateAreaRatio(hef, FAR_EDGES, DEFAULT_SPACING, "2x2");
    expect(ratio_single).toBe(1.0);
    expect(ratio_2x1).toBeGreaterThan(ratio_single);
    expect(ratio_2x2).toBeGreaterThan(ratio_2x1);
  });
});

describe("calculateGroupEccentricity", () => {
  it("returns 1.0 for concentric loading", () => {
    const positions: [number, number][] = [[-50, -50], [50, -50], [-50, 50], [50, 50]];
    const factor = calculateGroupEccentricity(positions, [0, 0], 100);
    expect(factor).toBe(1.0);
  });

  it("returns less than 1.0 for eccentric loading", () => {
    const positions: [number, number][] = [[-50, -50], [50, -50], [-50, 50], [50, 50]];
    const factor = calculateGroupEccentricity(positions, [30, 0], 100);
    expect(factor).toBeLessThan(1.0);
    expect(factor).toBeGreaterThan(0);
  });

  it("returns 1.0 for single anchor", () => {
    const factor = calculateGroupEccentricity([[0, 0]], [0, 0], 100);
    expect(factor).toBe(1.0);
  });
});
