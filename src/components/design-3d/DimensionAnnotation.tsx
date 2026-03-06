"use client";

import React from "react";
import { Html, Line } from "@react-three/drei";
import { useDesignStore } from "@/stores/design";

interface DimensionLineProps {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  offset?: [number, number, number];
}

/** A single dimension line with label */
function DimensionLine({ start, end, label, offset = [0, 0, 0] }: DimensionLineProps) {
  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2 + offset[0],
    (start[1] + end[1]) / 2 + offset[1],
    (start[2] + end[2]) / 2 + offset[2],
  ];

  return (
    <group>
      <Line
        points={[start, end]}
        color="#333333"
        lineWidth={1}
        dashed
        dashSize={0.005}
        gapSize={0.003}
      />
      {/* Tick marks at ends */}
      <Line
        points={[
          [start[0], start[1] - 0.005, start[2]],
          [start[0], start[1] + 0.005, start[2]],
        ]}
        color="#333333"
        lineWidth={1.5}
      />
      <Line
        points={[
          [end[0], end[1] - 0.005, end[2]],
          [end[0], end[1] + 0.005, end[2]],
        ]}
        color="#333333"
        lineWidth={1.5}
      />
      <Html position={midpoint} center>
        <div
          style={{
            background: "rgba(51,51,51,0.9)",
            color: "#fff",
            fontSize: "10px",
            fontFamily: "monospace",
            padding: "2px 6px",
            borderRadius: "3px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            userSelect: "none",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

interface DimensionAnnotationsProps {
  visible?: boolean;
}

/** Dimension annotations showing edge distances, spacing, and embedment */
export const DimensionAnnotations = React.memo(function DimensionAnnotations({
  visible = true,
}: DimensionAnnotationsProps) {
  const embedment = useDesignStore((s) => s.inputs.embedmentDepth);
  const spacing = useDesignStore((s) => s.inputs.spacing);
  const edgeDistances = useDesignStore((s) => s.inputs.edgeDistances);
  const groupPattern = useDesignStore((s) => s.inputs.groupPattern);
  const plateWidth = useDesignStore((s) => s.inputs.plateWidth);
  const plateDepth = useDesignStore((s) => s.inputs.plateDepth);

  if (!visible) return null;

  const embedH = embedment / 1000;
  const pw = plateWidth / 1000;
  const pd = plateDepth / 1000;

  const lines: DimensionLineProps[] = [];

  // Embedment depth (vertical, beside the bolt group)
  lines.push({
    start: [pw / 2 + 0.02, 0, 0],
    end: [pw / 2 + 0.02, -embedH, 0],
    label: `hef = ${embedment} mm`,
    offset: [0.02, 0, 0],
  });

  // Edge distances c1–c4 (from bolt group to each concrete edge)
  const c1m = edgeDistances.c1 / 1000;
  const c2m = edgeDistances.c2 / 1000;
  const c3m = edgeDistances.c3 / 1000;
  const c4m = edgeDistances.c4 / 1000;

  // c1: +X direction (right edge)
  lines.push({
    start: [pw / 2, 0.015, 0],
    end: [pw / 2 + c1m, 0.015, 0],
    label: `c₁ = ${edgeDistances.c1} mm`,
    offset: [0, 0.01, 0],
  });

  // c2: -X direction (left edge)
  lines.push({
    start: [-pw / 2, 0.015, 0],
    end: [-pw / 2 - c2m, 0.015, 0],
    label: `c₂ = ${edgeDistances.c2} mm`,
    offset: [0, 0.01, 0],
  });

  // c3: +Z direction (front edge)
  lines.push({
    start: [0, 0.015, pd / 2],
    end: [0, 0.015, pd / 2 + c3m],
    label: `c₃ = ${edgeDistances.c3} mm`,
    offset: [0, 0.01, 0],
  });

  // c4: -Z direction (back edge)
  lines.push({
    start: [0, 0.015, -pd / 2],
    end: [0, 0.015, -pd / 2 - c4m],
    label: `c₄ = ${edgeDistances.c4} mm`,
    offset: [0, 0.01, 0],
  });

  // Spacing s1 (between bolts when multi-bolt pattern)
  const hasSpacing = groupPattern !== "single" && groupPattern !== "custom";
  if (hasSpacing && spacing.s1 > 0) {
    const s1m = spacing.s1 / 1000;
    lines.push({
      start: [-s1m / 2, 0.025, 0],
      end: [s1m / 2, 0.025, 0],
      label: `s1 = ${spacing.s1} mm`,
      offset: [0, 0.01, 0],
    });
  }

  if (hasSpacing && spacing.s2 > 0) {
    const s2m = spacing.s2 / 1000;
    lines.push({
      start: [0, 0.025, -s2m / 2],
      end: [0, 0.025, s2m / 2],
      label: `s2 = ${spacing.s2} mm`,
      offset: [0, 0.01, 0],
    });
  }

  return (
    <group>
      {lines.map((line, i) => (
        <DimensionLine key={i} {...line} />
      ))}
    </group>
  );
});
