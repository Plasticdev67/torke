"use client";

import { ChevronDown, Check, X } from "lucide-react";
import type { FailureModeResult } from "@/lib/calc-engine/types";

function utilisationColour(utilisation: number): string {
  if (utilisation < 0.6) return "#22C55E";
  if (utilisation <= 0.9) return "#EAB308";
  return "#EF4444";
}

interface FailureModeBarProps {
  result: FailureModeResult;
  expanded: boolean;
  onToggle: () => void;
}

export function FailureModeBar({ result, expanded, onToggle }: FailureModeBarProps) {
  const pct = Math.round(result.utilisation * 100);
  const colour = utilisationColour(result.utilisation);

  return (
    <button
      type="button"
      onClick={onToggle}
      className="group flex w-full items-center gap-3 rounded-lg bg-[#1A1A1A] px-3 py-2.5 text-left transition-colors hover:bg-[#1F1F1F]"
    >
      {/* Pass/fail icon */}
      {result.pass ? (
        <Check className="h-4 w-4 shrink-0 text-[#22C55E]" />
      ) : (
        <X className="h-4 w-4 shrink-0 text-[#EF4444]" />
      )}

      {/* Name */}
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#CCC]">
        {result.name}
      </span>

      {/* Bar + percentage */}
      <div className="flex w-32 items-center gap-2">
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[#333]">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(pct, 100)}%`,
              backgroundColor: colour,
            }}
          />
        </div>
        <span className="w-10 text-right text-xs font-mono tabular-nums" style={{ color: colour }}>
          {pct}%
        </span>
      </div>

      {/* Chevron */}
      <ChevronDown
        className={`h-4 w-4 shrink-0 text-[#666] transition-transform duration-200 ${
          expanded ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}
