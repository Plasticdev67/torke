"use client";

import { useState } from "react";
import { Box } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CollapsibleSection } from "../CollapsibleSection";
import { FieldGroup } from "../FieldGroup";
import { useDesignStore } from "@/stores/design";
import type { ConcreteClass } from "@/lib/calc-engine/types";

const CONCRETE_CLASSES: ConcreteClass[] = [
  "C20/25",
  "C25/30",
  "C30/37",
  "C35/45",
  "C40/50",
  "C45/55",
  "C50/60",
];

export function ConcreteSection() {
  const concreteClass = useDesignStore((s) => s.inputs.concreteClass);
  const crackedConcrete = useDesignStore((s) => s.inputs.crackedConcrete);
  const memberThickness = useDesignStore((s) => s.inputs.memberThickness);
  const setInput = useDesignStore((s) => s.setInput);

  const [thicknessError, setThicknessError] = useState<string | undefined>();

  const handleThicknessChange = (value: string) => {
    const num = Number(value);
    if (isNaN(num)) return;
    if (num < 100) {
      setThicknessError("Minimum 100mm");
    } else {
      setThicknessError(undefined);
    }
    setInput("memberThickness", num);
  };

  return (
    <CollapsibleSection title="Concrete" icon={<Box className="h-4 w-4" />}>
      <FieldGroup label="Concrete Class">
        <Select
          value={concreteClass}
          onValueChange={(v) => setInput("concreteClass", v as ConcreteClass)}
        >
          <SelectTrigger className="w-full bg-[#1A1A1A] border-[#333] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1A1A] border-[#333]">
            {CONCRETE_CLASSES.map((c) => (
              <SelectItem key={c} value={c} className="text-white focus:bg-[#2D2D2D] focus:text-white">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[#999]">
          Cracked Concrete
        </label>
        <Switch
          checked={crackedConcrete}
          onCheckedChange={(checked) => setInput("crackedConcrete", checked)}
        />
      </div>
      <p className="text-xs text-[#555]">
        {crackedConcrete
          ? "Cracked: k1 = 7.7 (post-installed) -- reduced resistance"
          : "Uncracked: k1 = 11.0 (post-installed) -- higher resistance"}
      </p>

      <FieldGroup label="Member Thickness" unit="mm" error={thicknessError}>
        <Input
          type="number"
          value={memberThickness}
          onChange={(e) => handleThicknessChange(e.target.value)}
          min={100}
          className={`bg-[#1A1A1A] border-[#333] text-white ${thicknessError ? "border-red-500" : ""}`}
        />
      </FieldGroup>
    </CollapsibleSection>
  );
}
