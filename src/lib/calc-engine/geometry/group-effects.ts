/**
 * @torke/calc-engine - Group Effects
 *
 * Anchor position layouts for standard patterns and eccentricity calculations.
 * Positions are in mm from the group centroid.
 */

import type { GroupPattern, AnchorSpacing } from "../types";

/**
 * Get anchor positions for a given group pattern and spacing.
 * Returns [x, y] coordinates in mm from the group centroid.
 *
 * Patterns:
 * - single: [[0, 0]]
 * - 2x1: 2 anchors in a row (direction 1)
 * - 2x2: 4 anchors in a grid
 * - 3x2: 6 anchors, 3 columns x 2 rows
 * - custom: treated as single (user provides custom positions separately)
 */
export function getAnchorPositions(
  pattern: GroupPattern,
  spacing: AnchorSpacing
): [number, number][] {
  const { s1, s2 } = spacing;

  switch (pattern) {
    case "single":
    case "custom":
      return [[0, 0]];

    case "2x1":
      // 2 anchors along direction 1 (x-axis)
      return [
        [-s1 / 2, 0],
        [s1 / 2, 0],
      ];

    case "2x2":
      // 4 anchors at corners of rectangle
      return [
        [-s1 / 2, -s2 / 2],
        [s1 / 2, -s2 / 2],
        [-s1 / 2, s2 / 2],
        [s1 / 2, s2 / 2],
      ];

    case "3x2":
      // 6 anchors: 3 columns x 2 rows
      return [
        [-s1, -s2 / 2],
        [0, -s2 / 2],
        [s1, -s2 / 2],
        [-s1, s2 / 2],
        [0, s2 / 2],
        [s1, s2 / 2],
      ];

    default:
      return [[0, 0]];
  }
}

/**
 * Get the number of anchors in a group pattern.
 */
export function getAnchorCount(pattern: GroupPattern): number {
  switch (pattern) {
    case "single":
    case "custom":
      return 1;
    case "2x1":
      return 2;
    case "2x2":
      return 4;
    case "3x2":
      return 6;
    default:
      return 1;
  }
}

/**
 * Calculate eccentricity factor psi_ec,N for a group of anchors.
 *
 * psi_ec,N = 1 / (1 + 2*eN / s_cr,N) where:
 * - eN = eccentricity of the resultant load from the centroid
 * - s_cr,N = 3 * hef
 *
 * For concentric loading (load at centroid), psi_ec,N = 1.0
 *
 * @param positions - Anchor positions [x, y][] from centroid
 * @param loadPoint - Point of load application [x, y] from centroid
 * @param hef - Effective embedment depth (mm)
 * @returns Eccentricity factor (0-1)
 */
export function calculateGroupEccentricity(
  positions: [number, number][],
  loadPoint: [number, number],
  hef: number
): number {
  if (positions.length <= 1) return 1.0;

  const s_cr_N = 3 * hef;

  // Eccentricity is distance from centroid to load application point
  const eN = Math.sqrt(loadPoint[0] ** 2 + loadPoint[1] ** 2);

  if (eN === 0) return 1.0;

  const psi_ec_N = 1 / (1 + (2 * eN) / s_cr_N);
  return Math.max(0, Math.min(1, psi_ec_N));
}
