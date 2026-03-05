"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { useDesignStore } from "@/stores/design";

interface FailureConeProps {
  type: "cone-breakout" | "edge-breakout" | "pryout";
  visible: boolean;
  utilisation: number; // 0-1
}

/** Get colour based on utilisation ratio */
function getUtilisationColor(utilisation: number): string {
  if (utilisation > 0.9) return "#EF4444"; // Red
  if (utilisation > 0.6) return "#EAB308"; // Amber
  return "#22C55E"; // Green
}

/** Concrete cone breakout overlay, colour-coded by utilisation */
export const FailureCone = React.memo(function FailureCone({
  type,
  visible,
  utilisation,
}: FailureConeProps) {
  const embedment = useDesignStore((s) => s.inputs.embedmentDepth);

  const hef = embedment / 1000; // metres
  const color = getUtilisationColor(utilisation);

  // Cone geometry based on CCD method: 35-degree cone, radius = 1.5 * hef
  const coneRadius = 1.5 * hef;

  const geometry = useMemo(() => {
    switch (type) {
      case "cone-breakout": {
        // Inverted cone: point up at bolt head, base below
        return new THREE.ConeGeometry(coneRadius, hef, 32, 1, true);
      }
      case "edge-breakout": {
        // Wedge shape: half-cone towards edge
        return new THREE.ConeGeometry(coneRadius * 0.8, hef * 0.8, 32, 1, true);
      }
      case "pryout": {
        // Shallow wide cone for pryout failure surface
        return new THREE.ConeGeometry(coneRadius * 1.3, hef * 0.5, 32, 1, true);
      }
    }
  }, [type, coneRadius, hef]);

  if (!visible) return null;

  // Y offset: cone hangs below plate (y=0)
  const yOffset = type === "pryout" ? -hef * 0.25 : -hef / 2;

  return (
    <group position={[0, yOffset, 0]}>
      {/* Solid semi-transparent cone */}
      <mesh geometry={geometry} rotation={[Math.PI, 0, 0]}>
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Wireframe overlay */}
      <mesh geometry={geometry} rotation={[Math.PI, 0, 0]}>
        <meshStandardMaterial
          color={color}
          wireframe
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  );
});
