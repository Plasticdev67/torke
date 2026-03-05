/**
 * Pull-out Failure - EN 1992-4 Cl. 7.2.1.5
 *
 * Generic values: NRk,p = pi * d * hef * tau_Rk
 * tau_Rk = 15 MPa for chemical anchors (generic bond strength)
 * tau_Rk = 0 for mechanical anchors (pull-out governed by cone)
 *
 * NRd,p = NRk,p / gamma_Mc
 * gamma_Mc = 1.5
 */

import type { DesignInputs, FailureModeResult } from "../types";
import { GENERIC_BOND_STRENGTH, PARTIAL_SAFETY_FACTORS } from "../constants";

export function calculatePullOut(inputs: DesignInputs): FailureModeResult {
  const d = inputs.anchorDiameter;
  const hef = inputs.embedmentDepth;
  const gamma_Mc = PARTIAL_SAFETY_FACTORS.gamma_Mc;
  const tau_Rk = GENERIC_BOND_STRENGTH[inputs.anchorType];

  // Characteristic resistance (N -> kN)
  // NRk,p = pi * d * hef * tau_Rk
  const NRk_p = (Math.PI * d * hef * tau_Rk) / 1000;

  // For mechanical anchors, pull-out is not the governing mode
  // Use a very large resistance so it doesn't govern
  const effectiveNRk_p = tau_Rk === 0 ? Infinity : NRk_p;

  // Design resistance
  const NRd_p = effectiveNRk_p / gamma_Mc;

  const designLoad = inputs.tensionLoad;
  const utilisation =
    NRd_p === Infinity
      ? 0
      : NRd_p > 0
        ? Math.min(designLoad / NRd_p, 999)
        : designLoad > 0
          ? 999
          : 0;

  return {
    name: "Pull-out",
    clauseRef: "EN 1992-4 Cl. 7.2.1.5",
    designLoad,
    designResistance: NRd_p === Infinity ? 9999 : NRd_p,
    utilisation: Math.max(0, utilisation),
    pass: utilisation <= 1.0,
    intermediateValues: {
      d: { label: "Anchor diameter", value: d, unit: "mm" },
      hef: { label: "Embedment depth", value: hef, unit: "mm" },
      tau_Rk: { label: "Bond strength (generic)", value: tau_Rk, unit: "MPa" },
      NRk_p: { label: "Characteristic resistance", value: tau_Rk === 0 ? 9999 : NRk_p, unit: "kN" },
      gamma_Mc: { label: "Partial safety factor", value: gamma_Mc, unit: "-" },
    },
    formula:
      tau_Rk === 0
        ? "Mechanical anchor: pull-out governed by cone breakout"
        : `NRk,p = pi * d * hef * tau_Rk = pi * ${d} * ${hef} * ${tau_Rk} = ${NRk_p.toFixed(2)} kN`,
  };
}
