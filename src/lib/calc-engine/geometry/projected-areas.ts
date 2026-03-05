/**
 * @torke/calc-engine - Projected Area Calculations
 *
 * Calculates the actual projected area Ac,N for concrete cone breakout
 * considering edge truncation and anchor overlap for groups.
 *
 * Reference: EN 1992-4 Cl. 7.2.1.4
 * Reference area: Ac,N^0 = (3 * hef)^2 for a single anchor (uninfluenced)
 * Actual area: geometric rectangle clipped to concrete boundaries
 */

import type { EdgeDistances, AnchorSpacing, GroupPattern } from "../types";
import { getAnchorPositions } from "./group-effects";

/**
 * Calculate the reference projected area Ac,N^0 for a single anchor.
 * This is the idealised breakout prism area with no edge or spacing effects.
 *
 * Ac,N^0 = s_cr,N^2 = (3 * hef)^2
 */
export function calculateReferenceArea(hef: number): number {
  const s_cr_N = 3 * hef;
  return s_cr_N * s_cr_N;
}

/**
 * Calculate the actual projected area Ac,N considering edges and anchor groups.
 *
 * For a single anchor: a square of side 3*hef centred on the anchor,
 * clipped to concrete boundaries defined by edge distances.
 *
 * For groups: the union bounding box of all individual anchor squares,
 * clipped to concrete boundaries.
 *
 * @param hef - Effective embedment depth (mm)
 * @param edgeDistances - Edge distances from anchor centroid (mm)
 * @param spacing - Anchor spacing (mm)
 * @param groupPattern - Anchor group pattern
 * @returns Actual projected area Ac,N (mm^2)
 */
export function calculateProjectedArea(
  hef: number,
  edgeDistances: EdgeDistances,
  spacing: AnchorSpacing,
  groupPattern: GroupPattern
): number {
  const s_cr_N = 3 * hef; // Critical spacing
  const c_cr_N = 1.5 * hef; // Critical edge distance

  // Get anchor positions relative to centroid
  const positions = getAnchorPositions(groupPattern, spacing);

  // Find the bounding box of all anchor influence zones
  // Each anchor has an influence zone of s_cr_N/2 = 1.5*hef in each direction
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;

  for (const [x, y] of positions) {
    xMin = Math.min(xMin, x - c_cr_N);
    xMax = Math.max(xMax, x + c_cr_N);
    yMin = Math.min(yMin, y - c_cr_N);
    yMax = Math.max(yMax, y + c_cr_N);
  }

  // Clip to concrete boundaries defined by edge distances
  // c1 = edge in -x direction, c3 = edge in +x direction
  // c2 = edge in -y direction, c4 = edge in +y direction
  const concreteXMin = -edgeDistances.c1;
  const concreteXMax = edgeDistances.c3;
  const concreteYMin = -edgeDistances.c2;
  const concreteYMax = edgeDistances.c4;

  // Intersect the bounding box with concrete boundaries
  const clippedXMin = Math.max(xMin, concreteXMin);
  const clippedXMax = Math.min(xMax, concreteXMax);
  const clippedYMin = Math.max(yMin, concreteYMin);
  const clippedYMax = Math.min(yMax, concreteYMax);

  // If no intersection, area is zero
  if (clippedXMax <= clippedXMin || clippedYMax <= clippedYMin) {
    return 0;
  }

  return (clippedXMax - clippedXMin) * (clippedYMax - clippedYMin);
}

/**
 * Calculate the area ratio Ac,N / Ac,N^0.
 */
export function calculateAreaRatio(
  hef: number,
  edgeDistances: EdgeDistances,
  spacing: AnchorSpacing,
  groupPattern: GroupPattern
): number {
  const Ac_N_0 = calculateReferenceArea(hef);
  const Ac_N = calculateProjectedArea(hef, edgeDistances, spacing, groupPattern);
  return Ac_N / Ac_N_0;
}

/**
 * Calculate the projected area for shear edge breakout Ac,V.
 * Reference area: Ac,V^0 = 4.5 * c1^2
 *
 * @param c1 - Edge distance in load direction (mm)
 * @param edgeDistances - All edge distances (mm)
 * @param spacing - Anchor spacing (mm)
 * @param groupPattern - Anchor group pattern
 * @returns Actual projected area Ac,V (mm^2)
 */
export function calculateShearProjectedArea(
  c1: number,
  edgeDistances: EdgeDistances,
  spacing: AnchorSpacing,
  groupPattern: GroupPattern,
  memberThickness: number
): number {
  const positions = getAnchorPositions(groupPattern, spacing);

  // Reference: 1.5*c1 in each direction perpendicular to edge, 1.5*c1 depth
  const halfWidth = 1.5 * c1;

  let yMin = Infinity;
  let yMax = -Infinity;

  for (const [, y] of positions) {
    yMin = Math.min(yMin, y - halfWidth);
    yMax = Math.max(yMax, y + halfWidth);
  }

  // Clip perpendicular direction to concrete boundaries
  const clippedYMin = Math.max(yMin, -edgeDistances.c2);
  const clippedYMax = Math.min(yMax, edgeDistances.c4);

  if (clippedYMax <= clippedYMin) return 0;

  // Depth limited by 1.5*c1 or member thickness
  const depth = Math.min(1.5 * c1, memberThickness);

  return (clippedYMax - clippedYMin) * depth;
}

/**
 * Calculate shear reference area Ac,V^0.
 */
export function calculateShearReferenceArea(c1: number): number {
  return 4.5 * c1 * c1;
}
