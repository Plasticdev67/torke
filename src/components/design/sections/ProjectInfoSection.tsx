"use client";

import { FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CollapsibleSection } from "../CollapsibleSection";
import { FieldGroup } from "../FieldGroup";
import { useDesignStore } from "@/stores/design";

export function ProjectInfoSection() {
  const projectName = useDesignStore((s) => s.inputs.projectName);
  const engineerName = useDesignStore((s) => s.inputs.engineerName);
  const projectRef = useDesignStore((s) => s.inputs.projectRef);
  const date = useDesignStore((s) => s.inputs.date);
  const setInput = useDesignStore((s) => s.setInput);

  return (
    <CollapsibleSection title="Project Info" icon={<FileText className="h-4 w-4" />}>
      <FieldGroup label="Project Name">
        <Input
          value={projectName}
          onChange={(e) => setInput("projectName", e.target.value)}
          placeholder="e.g. Office Block Extension"
          className="bg-[#1A1A1A] border-[#333] text-white placeholder:text-[#555]"
        />
      </FieldGroup>

      <FieldGroup label="Engineer Name">
        <Input
          value={engineerName}
          onChange={(e) => setInput("engineerName", e.target.value)}
          placeholder="e.g. J. Smith"
          className="bg-[#1A1A1A] border-[#333] text-white placeholder:text-[#555]"
        />
      </FieldGroup>

      <FieldGroup label="Project Reference">
        <Input
          value={projectRef}
          onChange={(e) => setInput("projectRef", e.target.value)}
          placeholder="e.g. PRJ-2026-001"
          className="bg-[#1A1A1A] border-[#333] text-white placeholder:text-[#555]"
        />
      </FieldGroup>

      <FieldGroup label="Date">
        <Input
          value={date}
          readOnly
          className="bg-[#111] border-[#333] text-[#888] cursor-not-allowed"
        />
      </FieldGroup>
    </CollapsibleSection>
  );
}
