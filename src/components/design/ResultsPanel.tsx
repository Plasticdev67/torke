"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useDesignStore } from "@/stores/design";
import { FailureModeBar } from "./FailureModeBar";
import { FailureModeDetail } from "./FailureModeDetail";

export function ResultsPanel() {
  const results = useDesignStore((s) => s.results);
  const [expandedSet, setExpandedSet] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (!results) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-[#555]">Adjust parameters to see results</p>
      </div>
    );
  }

  // All failure modes + combined interaction as the last entry
  const allModes = [...results.failureModes, results.combinedInteraction];
  const totalChecks = allModes.length;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-3 py-3">
      {/* Scope limitations banner */}
      {results.scopeLimitations.length > 0 && (
        <div className="mb-3 rounded-lg border border-amber-800/50 bg-amber-950/30 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500">
            <AlertTriangle className="h-3.5 w-3.5" />
            Limitations
          </div>
          <ul className="mt-1 space-y-0.5 pl-5 text-[11px] text-amber-600/80">
            {results.scopeLimitations.map((lim) => (
              <li key={lim} className="list-disc">
                {lim}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Section header */}
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#888]">
          Failure Mode Checks
        </h3>
        <span className="rounded-full bg-[#1A1A1A] px-2 py-0.5 text-[10px] font-medium text-[#666]">
          {totalChecks} checks
        </span>
      </div>

      {/* Failure mode bars */}
      <div className="space-y-1.5">
        {allModes.map((mode, idx) => (
          <div key={mode.name}>
            <FailureModeBar
              result={mode}
              expanded={expandedSet.has(idx)}
              onToggle={() => toggle(idx)}
            />
            {expandedSet.has(idx) && <FailureModeDetail result={mode} />}
          </div>
        ))}
      </div>
    </div>
  );
}
