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
      {/* Solid concrete — warm grey, semi-transparent to see anchors */}
      <mesh position={[0, -blockH / 2, 0]}>
        <boxGeometry args={[blockW, blockH, blockD]} />
        <meshStandardMaterial
          color="#B0A89C"
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
          depthWrite={false}
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      {/* Wireframe overlay for edge visibility */}
      <mesh position={[0, -blockH / 2, 0]}>
        <boxGeometry args={[blockW, blockH, blockD]} />
        <meshStandardMaterial
          color="#7A7268"
          wireframe
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Top surface — slightly darker to show where plate sits */}
      <mesh position={[0, -0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[blockW, blockD]} />
        <meshStandardMaterial
          color="#A09888"
          transparent
          opacity={0.3}
          roughness={1}
        />
      </mesh>
    </group>
  );
});
