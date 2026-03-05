/**
 * @torke/calc-engine - Public API
 *
 * Pure function: calculateAnchorDesign(inputs) => DesignResults
 * Implements all 7 EN 1992-4 failure modes plus combined interaction.
 * Deterministic: identical inputs produce identical results in any JS runtime.
 *
 * Zero UI dependencies. Works client-side and server-side.
 */

import type { DesignInputs, DesignResults, FailureModeResult } from "./types";
import { SCOPE_LIMITATIONS } from "./constants";
import { designInputsSchema } from "./validation";
import { calculateSteelTension } from "./failure-modes/steel-tension";
import { calculateSteelShear } from "./failure-modes/steel-shear";
import { calculateConcreteCone } from "./failure-modes/concrete-cone";
import { calculatePullOut } from "./failure-modes/pull-out";
import { calculateConcretePryout } from "./failure-modes/concrete-pryout";
import { calculateConcreteEdge } from "./failure-modes/concrete-edge";
import { calculateSplitting } from "./failure-modes/splitting";
import { calculateCombinedInteraction } from "./failure-modes/combined";

/**
 * Calculate the full EN 1992-4 anchor design check.
 *
 * @param inputs - Validated design inputs
 * @returns Complete design results with all failure modes, combined interaction,
 *          governing mode, and scope limitations
 * @throws ZodError if inputs are invalid
 */
export function calculateAnchorDesign(inputs: DesignInputs): DesignResults {
  // Validate inputs
  designInputsSchema.parse(inputs);

  // Calculate all 7 failure modes
  const steelTension = calculateSteelTension(inputs);
  const steelShear = calculateSteelShear(inputs);
  const concreteCone = calculateConcreteCone(inputs);
  const pullOut = calculatePullOut(inputs);
  const concretePryout = calculateConcretePryout(inputs);
  const concreteEdge = calculateConcreteEdge(inputs);
  const splitting = calculateSplitting(inputs);

  const failureModes: FailureModeResult[] = [
    steelTension,
    steelShear,
    concreteCone,
    pullOut,
    concretePryout,
    concreteEdge,
    splitting,
  ];

  // Calculate combined tension-shear interaction
  const combinedInteraction = calculateCombinedInteraction({
    tensionLoad: inputs.tensionLoad,
    shearLoad: inputs.shearLoad,
    steelTension,
    steelShear,
    concreteTensionModes: [concreteCone, pullOut, splitting],
    concreteShearModes: [concretePryout, concreteEdge],
  });

  // Determine governing failure mode (highest utilisation among all modes)
  const allModes = [...failureModes, combinedInteraction];
  const governing = allModes.reduce((max, mode) =>
    mode.utilisation > max.utilisation ? mode : max
  );

  // Overall pass: all individual modes pass AND combined passes
  const overallPass =
    failureModes.every((m) => m.pass) && combinedInteraction.pass;

  return {
    failureModes,
    combinedInteraction,
    overallPass,
    governingMode: governing.name,
    governingUtilisation: governing.utilisation,
    scopeLimitations: [...SCOPE_LIMITATIONS],
  };
}

// Re-export types for consumers
export type {
  DesignInputs,
  DesignResults,
  FailureModeResult,
  IntermediateValue,
  ConcreteClass,
  GroupPattern,
  SteelGrade,
  AnchorDiameter,
  AnchorType,
  Environment,
  EdgeDistances,
  AnchorSpacing,
} from "./types";
