"use client";

import React from "react";
import { useDesignStore } from "@/stores/design";

interface AnchorBoltProps {
  position: [number, number, number];
}

/** Single anchor bolt with washer and threaded extension */
export const AnchorBolt = React.memo(function AnchorBolt({
  position,
}: AnchorBoltProps) {
  const diameter = useDesignStore((s) => s.inputs.anchorDiameter);
  const embedment = useDesignStore((s) => s.inputs.embedmentDepth);
  const plateThickness = useDesignStore((s) => s.inputs.plateThickness);

  // Convert mm to metres
  const radius = diameter / 2 / 1000;
  const embedH = embedment / 1000;
  const plateT = plateThickness / 1000;

  // Washer dimensions
  const washerRadius = radius * 1.8;
  const washerHeight = 0.003;

  // Threaded extension above plate
  const threadHeight = 0.015;

  return (
    <group position={position}>
      {/* Main bolt shaft (embedded in concrete) */}
      <mesh position={[0, -embedH / 2, 0]}>
        <cylinderGeometry args={[radius, radius, embedH, 16]} />
        <meshStandardMaterial
          color="#999999"
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Washer at plate top */}
      <mesh position={[0, plateT + washerHeight / 2, 0]}>
        <cylinderGeometry args={[washerRadius, washerRadius, washerHeight, 16]} />
        <meshStandardMaterial
          color="#777777"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Threaded extension above plate */}
      <mesh position={[0, plateT + washerHeight + threadHeight / 2, 0]}>
        <cylinderGeometry args={[radius * 0.9, radius * 0.9, threadHeight, 16]} />
        <meshStandardMaterial
          color="#888888"
          metalness={0.8}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
});
