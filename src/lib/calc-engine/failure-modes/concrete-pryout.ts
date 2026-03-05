/**
 * Concrete Pryout Failure - EN 1992-4 Cl. 7.2.2.4
 *
 * VRk,cp = k * NRk,c
 * k = 1 for hef < 60mm, k = 2 for hef >= 60mm
 *
 * VRd,cp = VRk,cp / gamma_Mc
 * gamma_Mc = 1.5
 */

import type { DesignInputs, FailureModeResult } from "../types";
import { PARTIAL_SAFETY_FACTORS } from "../constants";
import { calculateConcreteCone } from "./concrete-cone";

export function calculateConcretePryout(inputs: DesignInputs): FailureModeResult {
  const hef = inputs.embedmentDepth;
  const gamma_Mc = PARTIAL_SAFETY_FACTORS.gamma_Mc;

  // k factor depends on embedment depth
  const k = hef < 60 ? 1 : 2;

  // Get the cone breakout characteristic resistance
  const coneResult = calculateConcreteCone(inputs);
  // NRk,c is the characteristic (before dividing by gamma)
  const NRk_c = coneResult.designResistance * gamma_Mc;

  // Characteristic pryout resistance
  const VRk_cp = k * NRk_c;

  // Design resistance
  const VRd_cp = VRk_cp / gamma_Mc;

  const designLoad = inputs.shearLoad;
  const utilisation =
    VRd_cp > 0
      ? Math.min(designLoad / VRd_cp, 999)
      : designLoad > 0
        ? 999
        : 0;

  return {
    name: "Concrete Pryout",
    clauseRef: "EN 1992-4 Cl. 7.2.2.4",
    designLoad,
    designResistance: VRd_cp,
    utilisation: Math.max(0, utilisation),
    pass: utilisation <= 1.0,
    intermediateValues: {
      k: { label: "Pryout factor", value: k, unit: "-" },
      hef: { label: "Embedment depth", value: hef, unit: "mm" },
      NRk_c: { label: "Cone breakout resistance", value: NRk_c, unit: "kN" },
      VRk_cp: { label: "Characteristic pryout resistance", value: VRk_cp, unit: "kN" },
      gamma_Mc: { label: "Partial safety factor", value: gamma_Mc, unit: "-" },
    },
    formula: `VRk,cp = k * NRk,c = ${k} * ${NRk_c.toFixed(2)} = ${VRk_cp.toFixed(2)} kN`,
  };
}
