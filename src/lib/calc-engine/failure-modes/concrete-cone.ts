/**
 * Concrete Cone Breakout - EN 1992-4 Cl. 7.2.1.4
 *
 * NRk,c = NRk,c^0 * (Ac,N / Ac,N^0) * psi_s,N * psi_re,N * psi_ec,N
 * NRd,c = NRk,c / gamma_Mc
 *
 * NRk,c^0 = k1 * sqrt(fck) * hef^1.5
 * k1 = 7.7 (cracked) or 11.0 (uncracked) for post-installed
 * gamma_Mc = 1.5
 */

import type { DesignInputs, FailureModeResult } from "../types";
import { CONCRETE_CLASSES, K1_FACTORS, PARTIAL_SAFETY_FACTORS } from "../constants";
import {
  calculateProjectedArea,
  calculateReferenceArea,
} from "../geometry/projected-areas";

export function calculateConcreteCone(inputs: DesignInputs): FailureModeResult {
  const { fck } = CONCRETE_CLASSES[inputs.concreteClass];
  const hef = inputs.embedmentDepth;
  const gamma_Mc = PARTIAL_SAFETY_FACTORS.gamma_Mc;

  // k1 factor: Table 7.1
  const anchorCategory = "post-installed"; // All Torke products are post-installed
  const crackState = inputs.crackedConcrete ? "cracked" : "uncracked";
  const k1 = K1_FACTORS[anchorCategory][crackState];

  // Base resistance: NRk,c^0 = k1 * sqrt(fck) * hef^1.5  (N -> kN)
  const NRk_c_0 = (k1 * Math.sqrt(fck) * Math.pow(hef, 1.5)) / 1000;

  // Reference and actual projected areas
  const Ac_N_0 = calculateReferenceArea(hef);
  const Ac_N = calculateProjectedArea(
    hef,
    inputs.edgeDistances,
    inputs.spacing,
    inputs.groupPattern
  );
  const areaRatio = Ac_N / Ac_N_0;

  // Edge effect factor: psi_s,N = 0.7 + 0.3 * c_min / c_cr,N
  const c_cr_N = 1.5 * hef;
  const { c1, c2, c3, c4 } = inputs.edgeDistances;
  const cMin = Math.min(c1, c2, c3, c4);
  const psi_s_N = Math.min(1.0, 0.7 + (0.3 * cMin) / c_cr_N);

  // Shell spalling factor: psi_re,N = 0.5 + hef/200 <= 1.0
  const psi_re_N = Math.min(1.0, 0.5 + hef / 200);

  // Eccentricity factor (concentric loading assumed)
  const psi_ec_N = 1.0;

  // Characteristic resistance
  const NRk_c = NRk_c_0 * areaRatio * psi_s_N * psi_re_N * psi_ec_N;

  // Design resistance
  const NRd_c = NRk_c / gamma_Mc;

  const designLoad = inputs.tensionLoad;
  const utilisation =
    NRd_c > 0 ? Math.min(designLoad / NRd_c, 999) : designLoad > 0 ? 999 : 0;

  return {
    name: "Concrete Cone Breakout",
    clauseRef: "EN 1992-4 Cl. 7.2.1.4",
    designLoad,
    designResistance: NRd_c,
    utilisation: Math.max(0, utilisation),
    pass: utilisation <= 1.0,
    intermediateValues: {
      k1: { label: "k1 factor", value: k1, unit: "-" },
      fck: { label: "Concrete strength", value: fck, unit: "MPa" },
      hef: { label: "Embedment depth", value: hef, unit: "mm" },
      NRk_c_0: { label: "Base resistance (single)", value: NRk_c_0, unit: "kN" },
      Ac_N_0: { label: "Reference projected area", value: Ac_N_0, unit: "mm2" },
      Ac_N: { label: "Actual projected area", value: Ac_N, unit: "mm2" },
      areaRatio: { label: "Area ratio Ac,N/Ac,N^0", value: areaRatio, unit: "-" },
      psi_s_N: { label: "Edge effect factor", value: psi_s_N, unit: "-" },
      psi_re_N: { label: "Shell spalling factor", value: psi_re_N, unit: "-" },
      psi_ec_N: { label: "Eccentricity factor", value: psi_ec_N, unit: "-" },
      NRk_c: { label: "Characteristic resistance", value: NRk_c, unit: "kN" },
      gamma_Mc: { label: "Partial safety factor", value: gamma_Mc, unit: "-" },
    },
    formula: `NRk,c = NRk,c^0 * (Ac,N/Ac,N^0) * psi_s,N * psi_re,N * psi_ec,N = ${NRk_c_0.toFixed(2)} * ${areaRatio.toFixed(3)} * ${psi_s_N.toFixed(3)} * ${psi_re_N.toFixed(3)} * ${psi_ec_N.toFixed(3)} = ${NRk_c.toFixed(2)} kN`,
  };
}
