/**
 * @torke/calc-engine - Type definitions
 *
 * All input/output types for the EN 1992-4 anchor design calculation engine.
 * Pure TypeScript - zero UI dependencies.
 */

export type ConcreteClass =
  | "C20/25"
  | "C25/30"
  | "C30/37"
  | "C35/45"
  | "C40/50"
  | "C45/55"
  | "C50/60";

export type SteelGrade = "5.8" | "8.8" | "10.9" | "A4-70" | "A4-80";

export type GroupPattern = "single" | "2x1" | "2x2" | "3x2" | "custom";

export type AnchorType = "chemical" | "mechanical";

export type Environment = "dry" | "humid" | "marine";

export type AnchorDiameter = 8 | 10 | 12 | 16 | 20 | 24 | 30;

export interface EdgeDistances {
  c1: number; // mm
  c2: number; // mm
  c3: number; // mm
  c4: number; // mm
}

export interface AnchorSpacing {
  s1: number; // mm
  s2: number; // mm
}

export interface DesignInputs {
  // Project info (UI-only, not used in calculations)
  projectName: string;
  engineerName: string;
  projectRef: string;
  date: string;

  // Anchor type
  anchorType: AnchorType;
  anchorDiameter: AnchorDiameter;
  steelGrade: SteelGrade;
  embedmentDepth: number; // mm (hef)
  concreteClass: ConcreteClass;
  crackedConcrete: boolean;
  memberThickness: number; // mm
  tensionLoad: number; // kN (NEd)
  shearLoad: number; // kN (VEd)
  groupPattern: GroupPattern;
  spacing: AnchorSpacing;
  edgeDistances: EdgeDistances;
  plateThickness: number; // mm
  plateWidth: number; // mm
  plateDepth: number; // mm
  environment: Environment;
}

export interface IntermediateValue {
  label: string;
  value: number;
  unit: string;
}

export interface FailureModeResult {
  name: string;
  clauseRef: string;
  designLoad: number; // kN
  designResistance: number; // kN
  utilisation: number; // 0-1
  pass: boolean;
  intermediateValues: Record<string, IntermediateValue>;
  formula: string;
}

export interface DesignResults {
  failureModes: FailureModeResult[];
  combinedInteraction: FailureModeResult;
  overallPass: boolean;
  governingMode: string;
  governingUtilisation: number;
  scopeLimitations: string[];
}
