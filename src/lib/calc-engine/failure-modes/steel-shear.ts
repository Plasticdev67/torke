/**
 * Steel Shear Failure - EN 1992-4 Cl. 7.2.2.3
 *
 * Without lever arm: VRk,s = 0.5 * As * fuk
 * VRd,s = VRk,s / gamma_Ms
 *
 * gamma_Ms = 1.2 for ductile steel
 */

import type { DesignInputs, FailureModeResult } from "../types";
import {
  TENSILE_STRESS_AREA,
  STEEL_GRADES,
  PARTIAL_SAFETY_FACTORS,
} from "../constants";

export function calculateSteelShear(inputs: DesignInputs): FailureModeResult {
  const As = TENSILE_STRESS_AREA[inputs.anchorDiameter];
  const { fuk } = STEEL_GRADES[inputs.steelGrade];
  const gamma_Ms = PARTIAL_SAFETY_FACTORS.gamma_Ms_ductile;

  // Characteristic resistance (N -> kN)
  const VRk_s = (0.5 * As * fuk) / 1000;

  // Design resistance
  const VRd_s = VRk_s / gamma_Ms;

  // Design load
  const designLoad = inputs.shearLoad;

  // Utilisation
  const utilisation =
    VRd_s > 0 ? Math.min(designLoad / VRd_s, 999) : designLoad > 0 ? 999 : 0;

  return {
    name: "Steel Shear",
    clauseRef: "EN 1992-4 Cl. 7.2.2.3",
    designLoad,
    designResistance: VRd_s,
    utilisation: Math.max(0, utilisation),
    pass: utilisation <= 1.0,
    intermediateValues: {
      As: { label: "Tensile stress area", value: As, unit: "mm2" },
      fuk: { label: "Ultimate tensile strength", value: fuk, unit: "MPa" },
      VRk_s: { label: "Characteristic resistance", value: VRk_s, unit: "kN" },
      gamma_Ms: { label: "Partial safety factor", value: gamma_Ms, unit: "-" },
      VRd_s: { label: "Design resistance", value: VRd_s, unit: "kN" },
    },
    formula: `VRk,s = 0.5 * As * fuk = 0.5 * ${As} * ${fuk} = ${(VRk_s * 1000).toFixed(0)} N = ${VRk_s.toFixed(2)} kN`,
  };
}
