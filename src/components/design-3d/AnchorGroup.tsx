"use client";

import React from "react";
import { useDesignStore } from "@/stores/design";
import { getAnchorPositions } from "@/lib/calc-engine/geometry/group-effects";
import { AnchorBolt } from "./AnchorBolt";

/** Renders the correct number of AnchorBolts based on group pattern */
export const AnchorGroup = React.memo(function AnchorGroup() {
  const groupPattern = useDesignStore((s) => s.inputs.groupPattern);
  const spacing = useDesignStore((s) => s.inputs.spacing);

  // getAnchorPositions returns [x, y] in mm from centroid
  const positions = getAnchorPositions(groupPattern, spacing);

  return (
    <group>
      {positions.map(([x, z], i) => (
        <AnchorBolt
          key={`${groupPattern}-${i}`}
          position={[x / 1000, 0, z / 1000]}
        />
      ))}
    </group>
  );
});
