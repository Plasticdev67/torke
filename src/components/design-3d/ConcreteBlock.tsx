"use client";

import React from "react";
import * as THREE from "three";
import { useDesignStore } from "@/stores/design";

/** Semi-transparent concrete block showing bolt embedment */
export const ConcreteBlock = React.memo(function ConcreteBlock() {
  const embedment = useDesignStore((s) => s.inputs.embedmentDepth);
  const plateWidth = useDesignStore((s) => s.inputs.plateWidth);
  const plateDepth = useDesignStore((s) => s.inputs.plateDepth);
  const edgeDistances = useDesignStore((s) => s.inputs.edgeDistances);

  // Block extends beyond plate by edge distances (use min of each pair)
  const minC1 = Math.min(edgeDistances.c1, edgeDistances.c2);
  const minC2 = Math.min(edgeDistances.c3, edgeDistances.c4);

  // Convert mm to metres
  const blockW = (plateWidth + minC1 * 2) / 1000;
  const blockD = (plateDepth + minC2 * 2) / 1000;
  const blockH = (embedment * 1.5) / 1000;

  return (
    <group>
      {/* Solid semi-transparent concrete */}
      <mesh position={[0, -blockH / 2, 0]}>
        <boxGeometry args={[blockW, blockH, blockD]} />
        <meshStandardMaterial
          color="#AAAAAA"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Wireframe overlay for edge visibility */}
      <mesh position={[0, -blockH / 2, 0]}>
        <boxGeometry args={[blockW, blockH, blockD]} />
        <meshStandardMaterial
          color="#888888"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>
    </group>
  );
});
