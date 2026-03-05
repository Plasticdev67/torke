"use client";

import { Cloud } from "lucide-react";
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
import type { Environment } from "@/lib/calc-engine/types";

const ENVIRONMENTS: { value: Environment; label: string; info: string }[] = [
  {
    value: "dry",
    label: "Dry Interior",
    info: "Standard galvanised (zinc) anchors suitable. No additional corrosion measures required.",
  },
  {
    value: "humid",
    label: "Humid / Moderate",
    info: "Consider stainless steel (A4-70/A4-80) for long-term durability. Galvanised may be acceptable for temporary works.",
  },
  {
    value: "marine",
    label: "Marine / Aggressive",
    info: "Stainless steel (A4-80) strongly recommended. High chloride exposure accelerates corrosion of carbon steel fasteners.",
  },
];

export function EnvironmentSection() {
  const environment = useDesignStore((s) => s.inputs.environment);
  const setInput = useDesignStore((s) => s.setInput);

  const selectedEnv = ENVIRONMENTS.find((e) => e.value === environment);

  return (
    <CollapsibleSection title="Environment" icon={<Cloud className="h-4 w-4" />}>
      <FieldGroup label="Exposure Condition">
        <Select
          value={environment}
          onValueChange={(v) => setInput("environment", v as Environment)}
        >
          <SelectTrigger className="w-full bg-[#1A1A1A] border-[#333] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1A1A] border-[#333]">
            {ENVIRONMENTS.map((e) => (
              <SelectItem key={e.value} value={e.value} className="text-white focus:bg-[#2D2D2D] focus:text-white">
                {e.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      {selectedEnv && (
        <p className="text-xs text-[#555]">{selectedEnv.info}</p>
      )}
    </CollapsibleSection>
  );
}
