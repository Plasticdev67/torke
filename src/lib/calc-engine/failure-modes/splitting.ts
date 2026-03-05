/**
 * Splitting Failure - EN 1992-4 Cl. 7.2.1.6
 *
 * NRk,sp = NRk,c * psi_h,sp
 * psi_h,sp = (h / hmin)^(2/3) <= (2*hef / hmin)^(2/3)
 *
 * hmin = generic minimum member thickness (simplified, product-specific values from ETA)
 * NRd,sp = NRk,sp / gamma_Mc
 * gamma_Mc = 1.5
 */

import type { DesignInputs, FailureModeResult } from "../types";
import { PARTIAL_SAFETY_FACTORS } from "../constants";
import { calculateConcreteCone } from "./concrete-cone";

/**
 * Generic minimum member thickness for splitting check.
 * In practice this comes from the product ETA.
 * Using a conservative generic formula: hmin = max(2*hef, 100mm)
 */
function getGenericMinThickness(hef: number): number {
  return Math.max(2 * hef, 100);
}

export function calculateSplitting(inputs: DesignInputs): FailureModeResult {
  const hef = inputs.embedmentDepth;
  const h = inputs.memberThickness;
  const gamma_Mc = PARTIAL_SAFETY_FACTORS.gamma_Mc;

  // Get cone breakout result (splitting is based on cone resistance)
  const coneResult = calculateConcreteCone(inputs);
  const NRk_c = coneResult.designResistance * gamma_Mc; // Back to characteristic

  // Generic minimum member thickness
  const hmin = getGenericMinThickness(hef);

  // Member thickness factor
  const psi_h_sp_raw = Math.pow(h / hmin, 2 / 3);
  const psi_h_sp_max = Math.pow((2 * hef) / hmin, 2 / 3);
  const psi_h_sp = Math.min(psi_h_sp_raw, psi_h_sp_max);

  // Characteristic splitting resistance
  const NRk_sp = NRk_c * psi_h_sp;

  // Design resistance
  const NRd_sp = NRk_sp / gamma_Mc;

  const designLoad = inputs.tensionLoad;
  const utilisation =
    NRd_sp > 0
      ? Math.min(designLoad / NRd_sp, 999)
      : designLoad > 0
        ? 999
        : 0;

  return {
    name: "Splitting",
    clauseRef: "EN 1992-4 Cl. 7.2.1.6",
    designLoad,
    designResistance: NRd_sp,
    utilisation: Math.max(0, utilisation),
    pass: utilisation <= 1.0,
    intermediateValues: {
      hef: { label: "Embedment depth", value: hef, unit: "mm" },
      h: { label: "Member thickness", value: h, unit: "mm" },
      hmin: { label: "Min member thickness (generic)", value: hmin, unit: "mm" },
      NRk_c: { label: "Cone breakout resistance", value: NRk_c, unit: "kN" },
      psi_h_sp: { label: "Splitting factor", value: psi_h_sp, unit: "-" },
      NRk_sp: { label: "Characteristic resistance", value: NRk_sp, unit: "kN" },
      gamma_Mc: { label: "Partial safety factor", value: gamma_Mc, unit: "-" },
    },
    formula: `NRk,sp = NRk,c * psi_h,sp = ${NRk_c.toFixed(2)} * ${psi_h_sp.toFixed(3)} = ${NRk_sp.toFixed(2)} kN`,
  };
}
