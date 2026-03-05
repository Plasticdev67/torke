/**
 * Steel Tension Failure - EN 1992-4 Cl. 7.2.1.3
 *
 * NRk,s = c * As * fuk
 * NRd,s = NRk,s / gamma_Ms
 *
 * c = 0.85 for chemical anchors, 1.0 for mechanical anchors
 * gamma_Ms = 1.2 for ductile steel
 */

import type { DesignInputs, FailureModeResult } from "../types";
import {
  TENSILE_STRESS_AREA,
  STEEL_GRADES,
  STEEL_TENSION_C_FACTOR,
  PARTIAL_SAFETY_FACTORS,
} from "../constants";

export function calculateSteelTension(inputs: DesignInputs): FailureModeResult {
  const As = TENSILE_STRESS_AREA[inputs.anchorDiameter];
  const { fuk } = STEEL_GRADES[inputs.steelGrade];
  const c = STEEL_TENSION_C_FACTOR[inputs.anchorType];
  const gamma_Ms = PARTIAL_SAFETY_FACTORS.gamma_Ms_ductile;

  // Characteristic resistance (N -> kN)
  const NRk_s = (c * As * fuk) / 1000;

  // Design resistance
  const NRd_s = NRk_s / gamma_Ms;

  // Design load (per anchor for groups)
  const designLoad = inputs.tensionLoad;

  // Utilisation
  const utilisation =
    NRd_s > 0 ? Math.min(designLoad / NRd_s, 999) : designLoad > 0 ? 999 : 0;

  return {
    name: "Steel Tension",
    clauseRef: "EN 1992-4 Cl. 7.2.1.3",
    designLoad,
    designResistance: NRd_s,
    utilisation: Math.max(0, utilisation),
    pass: utilisation <= 1.0,
    intermediateValues: {
      c_factor: { label: "c factor", value: c, unit: "-" },
      As: { label: "Tensile stress area", value: As, unit: "mm2" },
      fuk: { label: "Ultimate tensile strength", value: fuk, unit: "MPa" },
      NRk_s: { label: "Characteristic resistance", value: NRk_s, unit: "kN" },
      gamma_Ms: { label: "Partial safety factor", value: gamma_Ms, unit: "-" },
      NRd_s: { label: "Design resistance", value: NRd_s, unit: "kN" },
    },
    formula: `NRk,s = c * As * fuk = ${c} * ${As} * ${fuk} = ${(NRk_s * 1000).toFixed(0)} N = ${NRk_s.toFixed(2)} kN`,
  };
}
