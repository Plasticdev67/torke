"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDesignStore, DESIGN_PRESETS } from "@/stores/design";
import { ProjectInfoSection } from "./sections/ProjectInfoSection";
import { AnchorTypeSection } from "./sections/AnchorTypeSection";
import { ConcreteSection } from "./sections/ConcreteSection";
import { LoadsSection } from "./sections/LoadsSection";
import { GeometrySection } from "./sections/GeometrySection";
import { EnvironmentSection } from "./sections/EnvironmentSection";

export function InputPanel() {
  const loadPreset = useDesignStore((s) => s.loadPreset);

  return (
    <div className="flex flex-col gap-1 p-4">
      {/* Preset selector */}
      <div className="mb-3">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#888]">
          Load Preset
        </label>
        <Select
          onValueChange={(key) => {
            const preset = DESIGN_PRESETS[key];
            if (preset) {
              loadPreset(preset.values);
            }
          }}
        >
          <SelectTrigger className="w-full bg-[#1A1A1A] border-[#333] text-white">
            <SelectValue placeholder="Select a preset..." />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1A1A] border-[#333]">
            {Object.entries(DESIGN_PRESETS).map(([key, preset]) => (
              <SelectItem
                key={key}
                value={key}
                className="text-white focus:bg-[#2D2D2D] focus:text-white"
              >
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Input sections */}
      <ProjectInfoSection />
      <AnchorTypeSection />
      <ConcreteSection />
      <LoadsSection />
      <GeometrySection />
      <EnvironmentSection />
    </div>
  );
}
