"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { BasePlate } from "./BasePlate";
import { AnchorGroup } from "./AnchorGroup";
import { ConcreteBlock } from "./ConcreteBlock";
import { DimensionAnnotations } from "./DimensionAnnotation";
import { FailureCone } from "./FailureCone";
import type { FailureModeResult } from "@/lib/calc-engine/types";

interface AnchorSceneProps {
  showDimensions?: boolean;
  showCones?: {
    coneBreakout: boolean;
    edgeBreakout: boolean;
    pryout: boolean;
  };
  failureModes?: FailureModeResult[];
}

function SceneContent({
  showDimensions = true,
  showCones,
  failureModes = [],
}: AnchorSceneProps) {
  // Look up utilisation for each failure mode type
  const getUtilisation = (keyword: string): number => {
    const mode = failureModes.find((m) =>
      m.name.toLowerCase().includes(keyword)
    );
    return mode?.utilisation ?? 0;
  };

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-3, 3, -3]} intensity={0.3} />

      {/* Scene objects */}
      <ConcreteBlock />
      <BasePlate />
      <AnchorGroup />
      <DimensionAnnotations visible={showDimensions} />

      {/* Failure cones (toggleable) */}
      {showCones?.coneBreakout && (
        <FailureCone
          type="cone-breakout"
          visible
          utilisation={getUtilisation("concrete cone")}
        />
      )}
      {showCones?.edgeBreakout && (
        <FailureCone
          type="edge-breakout"
          visible
          utilisation={getUtilisation("concrete edge")}
        />
      )}
      {showCones?.pryout && (
        <FailureCone
          type="pryout"
          visible
          utilisation={getUtilisation("pryout")}
        />
      )}

      {/* Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        minDistance={0.1}
        maxDistance={2}
      />
    </>
  );
}

/** Loading skeleton for Suspense fallback */
function SceneLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#333] border-t-[#C41E3A]" />
        <p className="text-xs text-[#666]">Loading 3D scene...</p>
      </div>
    </div>
  );
}

/** Main R3F Canvas scene for anchor visualisation */
export function AnchorScene({
  showDimensions = true,
  showCones,
  failureModes = [],
}: AnchorSceneProps) {
  return (
    <Suspense fallback={<SceneLoader />}>
      <Canvas
        camera={{ position: [0.3, 0.3, 0.3], fov: 50 }}
        style={{ background: "#1A1A1A" }}
        gl={{ antialias: true, alpha: false }}
      >
        <SceneContent
          showDimensions={showDimensions}
          showCones={showCones}
          failureModes={failureModes}
        />
      </Canvas>
    </Suspense>
  );
}
