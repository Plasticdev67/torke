"use client";

import { Grid3x3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CollapsibleSection } from "../CollapsibleSection";
import { FieldGroup } from "../FieldGroup";
import { useDesignStore } from "@/stores/design";
import type { GroupPattern } from "@/lib/calc-engine/types";

const GROUP_PATTERNS: { value: GroupPattern; label: string }[] = [
  { value: "single", label: "Single Anchor" },
  { value: "2x1", label: "2x1 (2 anchors in a row)" },
  { value: "2x2", label: "2x2 (4-bolt group)" },
  { value: "3x2", label: "3x2 (6-bolt group)" },
];

export function GeometrySection() {
  const groupPattern = useDesignStore((s) => s.inputs.groupPattern);
  const spacing = useDesignStore((s) => s.inputs.spacing);
  const edgeDistances = useDesignStore((s) => s.inputs.edgeDistances);
  const plateThickness = useDesignStore((s) => s.inputs.plateThickness);
  const plateWidth = useDesignStore((s) => s.inputs.plateWidth);
  const plateDepth = useDesignStore((s) => s.inputs.plateDepth);
  const setInput = useDesignStore((s) => s.setInput);

  const isGroup = groupPattern !== "single";

  const updateSpacing = (key: "s1" | "s2", value: string) => {
    const num = Number(value);
    if (isNaN(num)) return;
    setInput("spacing", { ...spacing, [key]: num });
  };

  const updateEdge = (key: "c1" | "c2" | "c3" | "c4", value: string) => {
    const num = Number(value);
    if (isNaN(num)) return;
    setInput("edgeDistances", { ...edgeDistances, [key]: num });
  };

  return (
    <CollapsibleSection title="Geometry" icon={<Grid3x3 className="h-4 w-4" />}>
      <FieldGroup label="Group Pattern">
        <Select
          value={groupPattern}
          onValueChange={(v) => setInput("groupPattern", v as GroupPattern)}
        >
          <SelectTrigger className="w-full bg-[#1A1A1A] border-[#333] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1A1A] border-[#333]">
            {GROUP_PATTERNS.map((p) => (
              <SelectItem key={p.value} value={p.value} className="text-white focus:bg-[#2D2D2D] focus:text-white">
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      {/* Spacing inputs (shown when group pattern) */}
      {isGroup && (
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Spacing s1" unit="mm">
            <Input
              type="number"
              value={spacing.s1}
              onChange={(e) => updateSpacing("s1", e.target.value)}
              min={0}
              className="bg-[#1A1A1A] border-[#333] text-white"
            />
          </FieldGroup>
          <FieldGroup label="Spacing s2" unit="mm">
            <Input
              type="number"
              value={spacing.s2}
              onChange={(e) => updateSpacing("s2", e.target.value)}
              min={0}
              className="bg-[#1A1A1A] border-[#333] text-white"
            />
          </FieldGroup>
        </div>
      )}

      {/* Edge distances */}
      <div className="mt-1">
        <label className="mb-2 block text-xs font-medium text-[#999]">
          Edge Distances
        </label>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="c1" unit="mm">
            <Input
              type="number"
              value={edgeDistances.c1}
              onChange={(e) => updateEdge("c1", e.target.value)}
              min={0}
              className="bg-[#1A1A1A] border-[#333] text-white"
            />
          </FieldGroup>
          <FieldGroup label="c2" unit="mm">
            <Input
              type="number"
              value={edgeDistances.c2}
              onChange={(e) => updateEdge("c2", e.target.value)}
              min={0}
              className="bg-[#1A1A1A] border-[#333] text-white"
            />
          </FieldGroup>
          <FieldGroup label="c3" unit="mm">
            <Input
              type="number"
              value={edgeDistances.c3}
              onChange={(e) => updateEdge("c3", e.target.value)}
              min={0}
              className="bg-[#1A1A1A] border-[#333] text-white"
            />
          </FieldGroup>
          <FieldGroup label="c4" unit="mm">
            <Input
              type="number"
              value={edgeDistances.c4}
              onChange={(e) => updateEdge("c4", e.target.value)}
              min={0}
              className="bg-[#1A1A1A] border-[#333] text-white"
            />
          </FieldGroup>
        </div>
      </div>

      {/* Plate dimensions */}
      <div className="mt-1">
        <label className="mb-2 block text-xs font-medium text-[#999]">
          Base Plate
        </label>
        <div className="grid grid-cols-3 gap-3">
          <FieldGroup label="Thickness" unit="mm">
            <Input
              type="number"
              value={plateThickness}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (!isNaN(n)) setInput("plateThickness", n);
              }}
              min={0}
              className="bg-[#1A1A1A] border-[#333] text-white"
            />
          </FieldGroup>
          <FieldGroup label="Width" unit="mm">
            <Input
              type="number"
              value={plateWidth}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (!isNaN(n)) setInput("plateWidth", n);
              }}
              min={0}
              className="bg-[#1A1A1A] border-[#333] text-white"
            />
          </FieldGroup>
          <FieldGroup label="Depth" unit="mm">
            <Input
              type="number"
              value={plateDepth}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (!isNaN(n)) setInput("plateDepth", n);
              }}
              min={0}
              className="bg-[#1A1A1A] border-[#333] text-white"
            />
          </FieldGroup>
        </div>
      </div>
    </CollapsibleSection>
  );
}
