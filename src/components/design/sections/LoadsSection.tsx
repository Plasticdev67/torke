"use client";

import { useState } from "react";
import { ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CollapsibleSection } from "../CollapsibleSection";
import { FieldGroup } from "../FieldGroup";
import { useDesignStore } from "@/stores/design";

export function LoadsSection() {
  const tensionLoad = useDesignStore((s) => s.inputs.tensionLoad);
  const shearLoad = useDesignStore((s) => s.inputs.shearLoad);
  const setInput = useDesignStore((s) => s.setInput);

  const [tensionError, setTensionError] = useState<string | undefined>();
  const [shearError, setShearError] = useState<string | undefined>();

  const handleTensionChange = (value: string) => {
    const num = Number(value);
    if (isNaN(num)) return;
    if (num < 0) {
      setTensionError("Must be non-negative");
    } else {
      setTensionError(undefined);
    }
    setInput("tensionLoad", num);
  };

  const handleShearChange = (value: string) => {
    const num = Number(value);
    if (isNaN(num)) return;
    if (num < 0) {
      setShearError("Must be non-negative");
    } else {
      setShearError(undefined);
    }
    setInput("shearLoad", num);
  };

  return (
    <CollapsibleSection title="Design Loads" icon={<ArrowDown className="h-4 w-4" />}>
      <FieldGroup label="Tension Load (NEd)" unit="kN" error={tensionError}>
        <Input
          type="number"
          value={tensionLoad}
          onChange={(e) => handleTensionChange(e.target.value)}
          min={0}
          step={0.1}
          className={`bg-[#1A1A1A] border-[#333] text-white ${tensionError ? "border-red-500" : ""}`}
        />
      </FieldGroup>

      <FieldGroup label="Shear Load (VEd)" unit="kN" error={shearError}>
        <Input
          type="number"
          value={shearLoad}
          onChange={(e) => handleShearChange(e.target.value)}
          min={0}
          step={0.1}
          className={`bg-[#1A1A1A] border-[#333] text-white ${shearError ? "border-red-500" : ""}`}
        />
      </FieldGroup>

      <p className="text-xs text-[#555]">
        Enter factored design loads per EN 1990 load combinations (ULS).
        Loads are applied to the anchor group as a whole.
      </p>
    </CollapsibleSection>
  );
}
