"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-[#222] bg-[#141414]">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#1A1A1A] transition-colors">
          <div className="flex items-center gap-2">
            {icon && <span className="text-[#C41E3A]">{icon}</span>}
            <span className="text-sm font-semibold text-white">{title}</span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-[#666] transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-[#222] px-4 py-3">
            <div className="flex flex-col gap-3">{children}</div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
