/**
 * @torke/calc-engine - Constants
 *
 * EN 1992-4 k-factors, concrete classes, partial safety factors,
 * steel properties, and scope limitations.
 */

import type { ConcreteClass, SteelGrade, AnchorDiameter } from "./types";

// --- Concrete classes: fck values per EN 1992-1-1 Table 3.1 ---

export const CONCRETE_CLASSES: Record<ConcreteClass, { fck: number; fckCube: number }> = {
  "C20/25": { fck: 20, fckCube: 25 },
  "C25/30": { fck: 25, fckCube: 30 },
  "C30/37": { fck: 30, fckCube: 37 },
  "C35/45": { fck: 35, fckCube: 45 },
  "C40/50": { fck: 40, fckCube: 50 },
  "C45/55": { fck: 45, fckCube: 55 },
  "C50/60": { fck: 50, fckCube: 60 },
};

// --- k1 factors for concrete cone breakout: EN 1992-4 Table 7.1 ---

export const K1_FACTORS = {
  "post-installed": { cracked: 7.7, uncracked: 11.0 },
  "cast-in": { cracked: 8.9, uncracked: 12.7 },
} as const;

// --- Partial safety factors: EN 1992-4 Table 4.1 ---

export const PARTIAL_SAFETY_FACTORS = {
  /** gamma_Ms for ductile steel failure (tension and shear) */
  gamma_Ms_ductile: 1.2,
  /** gamma_Ms for brittle steel failure */
  gamma_Ms_brittle: 1.5,
  /** gamma_Mc for concrete failure modes */
  gamma_Mc: 1.5,
} as const;

// --- Tensile stress area As (mm^2) per bolt diameter ---

export const TENSILE_STRESS_AREA: Record<AnchorDiameter, number> = {
  8: 36.6,
  10: 58.0,
  12: 84.3,
  16: 157.0,
  20: 245.0,
  24: 353.0,
  30: 561.0,
};

// --- Steel grades: fuk (ultimate tensile strength, MPa) ---

export const STEEL_GRADES: Record<SteelGrade, { fuk: number; fyk: number }> = {
  "5.8": { fuk: 500, fyk: 400 },
  "8.8": { fuk: 800, fyk: 640 },
  "10.9": { fuk: 1000, fyk: 900 },
  "A4-70": { fuk: 700, fyk: 450 },
  "A4-80": { fuk: 800, fyk: 600 },
};

// --- c factor for steel tension: EN 1992-4 Cl. 7.2.1.3 ---

export const STEEL_TENSION_C_FACTOR = {
  chemical: 0.85,
  mechanical: 1.0,
} as const;

// --- Pryout k factor: EN 1992-4 Cl. 7.2.2.4 ---

export const PRYOUT_K_FACTOR = {
  /** hef < 60mm */
  shallow: 1,
  /** hef >= 60mm */
  deep: 2,
} as const;

// --- Generic bond strength for pull-out (MPa): EN 1992-4 Cl. 7.2.1.5 ---

export const GENERIC_BOND_STRENGTH = {
  chemical: 15.0,
  mechanical: 0, // Mechanical anchors: pull-out governed by cone breakout
} as const;

// --- Scope limitations (DESIGN-07) ---

export const SCOPE_LIMITATIONS: string[] = [
  "No seismic design (EN 1992-4 Annex C not implemented)",
  "No fire design (EN 1992-4 Annex D not implemented)",
  "Splitting check uses generic EN 1992-4 values -- consult product ETA for specific limits",
  "Pull-out uses generic values -- product-specific ETA data may differ",
];
