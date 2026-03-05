"use client";

import { useState } from "react";
import { Anchor } from "lucide-react";
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
import type { AnchorDiameter, AnchorType, SteelGrade } from "@/lib/calc-engine/types";

const ANCHOR_TYPES: { value: AnchorType; label: string }[] = [
  { value: "chemical", label: "Chemical Anchor" },
  { value: "mechanical", label: "Mechanical Anchor" },
];

const ANCHOR_DIAMETERS: AnchorDiameter[] = [8, 10, 12, 16, 20, 24, 30];

const STEEL_GRADES: { value: SteelGrade; label: string }[] = [
  { value: "5.8", label: "Grade 5.8" },
  { value: "8.8", label: "Grade 8.8" },
  { value: "10.9", label: "Grade 10.9" },
  { value: "A4-70", label: "A4-70 (Stainless)" },
  { value: "A4-80", label: "A4-80 (Stainless)" },
];

export function AnchorTypeSection() {
  const anchorType = useDesignStore((s) => s.inputs.anchorType);
  const anchorDiameter = useDesignStore((s) => s.inputs.anchorDiameter);
  const steelGrade = useDesignStore((s) => s.inputs.steelGrade);
  const embedmentDepth = useDesignStore((s) => s.inputs.embedmentDepth);
  const setInput = useDesignStore((s) => s.setInput);

  const [embedError, setEmbedError] = useState<string | undefined>();

  const handleEmbedmentChange = (value: string) => {
    const num = Number(value);
    if (isNaN(num)) return;
    if (num < 40) {
      setEmbedError("Minimum 40mm");
    } else if (num > 500) {
      setEmbedError("Maximum 500mm");
    } else {
      setEmbedError(undefined);
    }
    setInput("embedmentDepth", num);
  };

  return (
    <CollapsibleSection title="Anchor Type" icon={<Anchor className="h-4 w-4" />}>
      <FieldGroup label="Anchor Type">
        <Select
          value={anchorType}
          onValueChange={(v) => setInput("anchorType", v as AnchorType)}
        >
          <SelectTrigger className="w-full bg-[#1A1A1A] border-[#333] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1A1A] border-[#333]">
            {ANCHOR_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value} className="text-white focus:bg-[#2D2D2D] focus:text-white">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      <FieldGroup label="Anchor Diameter" unit="mm">
        <Select
          value={String(anchorDiameter)}
          onValueChange={(v) => setInput("anchorDiameter", Number(v) as AnchorDiameter)}
        >
          <SelectTrigger className="w-full bg-[#1A1A1A] border-[#333] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1A1A] border-[#333]">
            {ANCHOR_DIAMETERS.map((d) => (
              <SelectItem key={d} value={String(d)} className="text-white focus:bg-[#2D2D2D] focus:text-white">
                M{d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      <FieldGroup label="Steel Grade">
        <Select
          value={steelGrade}
          onValueChange={(v) => setInput("steelGrade", v as SteelGrade)}
        >
          <SelectTrigger className="w-full bg-[#1A1A1A] border-[#333] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1A1A] border-[#333]">
            {STEEL_GRADES.map((g) => (
              <SelectItem key={g.value} value={g.value} className="text-white focus:bg-[#2D2D2D] focus:text-white">
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      <FieldGroup label="Embedment Depth" unit="mm" error={embedError}>
        <Input
          type="number"
          value={embedmentDepth}
          onChange={(e) => handleEmbedmentChange(e.target.value)}
          min={40}
          max={500}
          className={`bg-[#1A1A1A] border-[#333] text-white ${embedError ? "border-red-500" : ""}`}
        />
      </FieldGroup>
    </CollapsibleSection>
  );
}
