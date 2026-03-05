/**
 * Combined Tension-Shear Interaction - EN 1992-4 Table 7.3
 *
 * Steel interaction:   (NEd/NRd,s)^2 + (VEd/VRd,s)^2 <= 1.0
 * Concrete interaction: (NEd/NRd,c)^1.5 + (VEd/VRd,c)^1.5 <= 1.0
 *
 * Uses min concrete tension resistance from cone/pullout/splitting
 * Uses min concrete shear resistance from pryout/edge
 *
 * The governing combined utilisation is the higher of steel and concrete.
 */

import type { FailureModeResult } from "../types";

interface CombinedInputs {
  tensionLoad: number;
  shearLoad: number;
  steelTension: FailureModeResult;
  steelShear: FailureModeResult;
  concreteTensionModes: FailureModeResult[]; // cone, pullout, splitting
  concreteShearModes: FailureModeResult[]; // pryout, edge
}

export function calculateCombinedInteraction(
  inputs: CombinedInputs
): FailureModeResult {
  const { tensionLoad, shearLoad } = inputs;

  // Steel interaction: quadratic (exponent 2)
  const NRd_s = inputs.steelTension.designResistance;
  const VRd_s = inputs.steelShear.designResistance;

  const steelTensionRatio = NRd_s > 0 ? tensionLoad / NRd_s : 0;
  const steelShearRatio = VRd_s > 0 ? shearLoad / VRd_s : 0;
  const steelInteraction =
    Math.pow(steelTensionRatio, 2) + Math.pow(steelShearRatio, 2);

  // Concrete interaction: power 1.5
  // Min concrete tension resistance (governing concrete tension mode)
  const minConcreteTension = inputs.concreteTensionModes.reduce(
    (min, mode) =>
      mode.designResistance < min.designResistance ? mode : min,
    inputs.concreteTensionModes[0]!
  );

  // Min concrete shear resistance (governing concrete shear mode)
  const minConcreteShear = inputs.concreteShearModes.reduce(
    (min, mode) =>
      mode.designResistance < min.designResistance ? mode : min,
    inputs.concreteShearModes[0]!
  );

  const NRd_c = minConcreteTension.designResistance;
  const VRd_c = minConcreteShear.designResistance;

  const concreteTensionRatio = NRd_c > 0 ? tensionLoad / NRd_c : 0;
  const concreteShearRatio = VRd_c > 0 ? shearLoad / VRd_c : 0;
  const concreteInteraction =
    Math.pow(concreteTensionRatio, 1.5) + Math.pow(concreteShearRatio, 1.5);

  // Governing is the higher of steel and concrete interaction
  const governingInteraction = Math.max(steelInteraction, concreteInteraction);
  const governingType =
    steelInteraction >= concreteInteraction ? "steel" : "concrete";

  const utilisation = Math.max(0, Math.min(governingInteraction, 999));

  return {
    name: "Combined Interaction",
    clauseRef: "EN 1992-4 Table 7.3",
    designLoad: 0, // Combined check doesn't have a single load
    designResistance: 0, // Combined check doesn't have a single resistance
    utilisation,
    pass: utilisation <= 1.0,
    intermediateValues: {
      steelTensionRatio: {
        label: "NEd/NRd,s",
        value: steelTensionRatio,
        unit: "-",
      },
      steelShearRatio: {
        label: "VEd/VRd,s",
        value: steelShearRatio,
        unit: "-",
      },
      steelInteraction: {
        label: "Steel interaction",
        value: steelInteraction,
        unit: "-",
      },
      concreteTensionRatio: {
        label: "NEd/NRd,c (governing)",
        value: concreteTensionRatio,
        unit: "-",
      },
      concreteShearRatio: {
        label: "VEd/VRd,c (governing)",
        value: concreteShearRatio,
        unit: "-",
      },
      concreteInteraction: {
        label: "Concrete interaction",
        value: concreteInteraction,
        unit: "-",
      },
      governingInteraction: {
        label: "Governing interaction",
        value: governingInteraction,
        unit: "-",
      },
    },
    formula:
      governingType === "steel"
        ? `Steel: (NEd/NRd,s)^2 + (VEd/VRd,s)^2 = (${steelTensionRatio.toFixed(3)})^2 + (${steelShearRatio.toFixed(3)})^2 = ${steelInteraction.toFixed(3)} <= 1.0`
        : `Concrete: (NEd/NRd,c)^1.5 + (VEd/VRd,c)^1.5 = (${concreteTensionRatio.toFixed(3)})^1.5 + (${concreteShearRatio.toFixed(3)})^1.5 = ${concreteInteraction.toFixed(3)} <= 1.0`,
  };
}
