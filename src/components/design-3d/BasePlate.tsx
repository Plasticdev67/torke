"use client";

import React from "react";
import { useDesignStore } from "@/stores/design";

/** Base plate geometry - extruded rectangle positioned at top of concrete */
export const BasePlate = React.memo(function BasePlate() {
  const plateWidth = useDesignStore((s) => s.inputs.plateWidth);
  const plateDepth = useDesignStore((s) => s.inputs.plateDepth);
  const plateThickness = useDesignStore((s) => s.inputs.plateThickness);

  // Convert mm to scene units (metres)
  const w = plateWidth / 1000;
  const d = plateDepth / 1000;
  const t = plateThickness / 1000;

  return (
    <mesh position={[0, t / 2, 0]}>
      <boxGeometry args={[w, t, d]} />
      <meshStandardMaterial
        color="#9AAABB"
        metalness={0.85}
        roughness={0.15}
      />
    </mesh>
  );
});
