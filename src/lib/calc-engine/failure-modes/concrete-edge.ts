/**
 * Concrete Edge Breakout - EN 1992-4 Cl. 7.2.2.5
 *
 * VRk,c^0 = k1 * d^alpha * lf^beta * sqrt(fck) * c1^1.5
 * VRk,c = VRk,c^0 * (Ac,V / Ac,V^0) * psi_s,V * psi_h,V * psi_ec,V * psi_alpha,V
 *
 * Simplified: alpha = 0.1, beta = 0.1 for post-installed anchors
 * lf = hef for bonded, min(hef, 8d) for torque-controlled
 * gamma_Mc = 1.5
 */

import type { DesignInputs, FailureModeResult } from "../types";
import { CONCRETE_CLASSES, PARTIAL_SAFETY_FACTORS } from "../constants";

export function calculateConcreteEdge(inputs: DesignInputs): FailureModeResult {
  const { fck } = CONCRETE_CLASSES[inputs.concreteClass];
  const d = inputs.anchorDiameter;
  const hef = inputs.embedmentDepth;
  const gamma_Mc = PARTIAL_SAFETY_FACTORS.gamma_Mc;

  // Edge distance in shear load direction (use c1 = minimum edge)
  const c1 = Math.min(
    inputs.edgeDistances.c1,
    inputs.edgeDistances.c2,
    inputs.edgeDistances.c3,
    inputs.edgeDistances.c4
  );

  // Effective length: hef for bonded (chemical), min(hef, 8d) for mechanical
  const lf =
    inputs.anchorType === "chemical" ? hef : Math.min(hef, 8 * d);

  // k1 for edge breakout (post-installed anchors)
  const k1_edge = 1.7; // EN 1992-4 Cl. 7.2.2.5

  // Simplified exponents for post-installed anchors
  const alpha = 0.1;
  const beta = 0.1;

  // Base resistance: VRk,c^0 (N -> kN)
  const VRk_c_0 =
    (k1_edge *
      Math.pow(d, alpha) *
      Math.pow(lf, beta) *
      Math.sqrt(fck) *
      Math.pow(c1, 1.5)) /
    1000;

  // Reference projected area: Ac,V^0 = 4.5 * c1^2
  const Ac_V_0 = 4.5 * c1 * c1;

  // Actual projected area (simplified: consider perpendicular edges and member thickness)
  const h = inputs.memberThickness;
  const halfWidth = 1.5 * c1;

  // Perpendicular edge distances
  const c2_perp = inputs.edgeDistances.c2;
  const c4_perp = inputs.edgeDistances.c4;

  // Width = min(1.5*c1, c2) + min(1.5*c1, c4) + group width
  let width = Math.min(halfWidth, c2_perp) + Math.min(halfWidth, c4_perp);

  // For groups, add spacing contribution
  if (inputs.groupPattern !== "single") {
    width += inputs.spacing.s2;
  }

  const depth = Math.min(1.5 * c1, h);
  const Ac_V = width * depth;
  const areaRatio = Ac_V_0 > 0 ? Ac_V / Ac_V_0 : 1;

  // Edge distance factor: psi_s,V = 0.7 + 0.3 * c2 / (1.5 * c1)
  const c2_min = Math.min(c2_perp, c4_perp);
  const psi_s_V = Math.min(1.0, 0.7 + (0.3 * c2_min) / (1.5 * c1));

  // Member thickness factor: psi_h,V = sqrt(1.5 * c1 / h) >= 1.0
  const psi_h_V = Math.max(1.0, Math.sqrt((1.5 * c1) / h));

  // Eccentricity factor (concentric loading)
  const psi_ec_V = 1.0;

  // Load angle factor (perpendicular to edge = 1.0)
  const psi_alpha_V = 1.0;

  // Characteristic resistance
  const VRk_c = VRk_c_0 * areaRatio * psi_s_V * psi_h_V * psi_ec_V * psi_alpha_V;

  // Design resistance
  const VRd_c = VRk_c / gamma_Mc;

  const designLoad = inputs.shearLoad;
  const utilisation =
    VRd_c > 0
      ? Math.min(designLoad / VRd_c, 999)
      : designLoad > 0
        ? 999
        : 0;

  return {
    name: "Concrete Edge Breakout",
    clauseRef: "EN 1992-4 Cl. 7.2.2.5",
    designLoad,
    designResistance: VRd_c,
    utilisation: Math.max(0, utilisation),
    pass: utilisation <= 1.0,
    intermediateValues: {
      k1_edge: { label: "k1 factor (edge)", value: k1_edge, unit: "-" },
      d: { label: "Anchor diameter", value: d, unit: "mm" },
      lf: { label: "Effective length", value: lf, unit: "mm" },
      fck: { label: "Concrete strength", value: fck, unit: "MPa" },
      c1: { label: "Edge distance (load dir)", value: c1, unit: "mm" },
      VRk_c_0: { label: "Base resistance", value: VRk_c_0, unit: "kN" },
      Ac_V_0: { label: "Reference projected area", value: Ac_V_0, unit: "mm2" },
      Ac_V: { label: "Actual projected area", value: Ac_V, unit: "mm2" },
      areaRatio: { label: "Area ratio", value: areaRatio, unit: "-" },
      psi_s_V: { label: "Edge distance factor", value: psi_s_V, unit: "-" },
      psi_h_V: { label: "Member thickness factor", value: psi_h_V, unit: "-" },
      VRk_c: { label: "Characteristic resistance", value: VRk_c, unit: "kN" },
      gamma_Mc: { label: "Partial safety factor", value: gamma_Mc, unit: "-" },
    },
    formula: `VRk,c = VRk,c^0 * (Ac,V/Ac,V^0) * psi_s,V * psi_h,V = ${VRk_c_0.toFixed(2)} * ${areaRatio.toFixed(3)} * ${psi_s_V.toFixed(3)} * ${psi_h_V.toFixed(3)} = ${VRk_c.toFixed(2)} kN`,
  };
}
