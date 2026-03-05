"use client";

import type { FailureModeResult } from "@/lib/calc-engine/types";

interface FailureModeDetailProps {
  result: FailureModeResult;
}

export function FailureModeDetail({ result }: FailureModeDetailProps) {
  const intermediateEntries = Object.entries(result.intermediateValues);

  return (
    <div className="mx-1 mb-2 rounded-lg border border-[#222] bg-[#111] p-4">
      {/* Clause reference badge */}
      <div className="mb-3">
        <span className="inline-block rounded bg-[#1A1A1A] px-2 py-0.5 text-xs font-mono text-[#888] ring-1 ring-[#333]">
          {result.clauseRef}
        </span>
      </div>

      {/* Design load vs resistance */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[#666]">Design Load</div>
          <div className="font-mono text-sm text-[#CCC]">
            N<sub>Ed</sub> = {result.designLoad.toFixed(1)} kN
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[#666]">Design Resistance</div>
          <div className="font-mono text-sm text-[#CCC]">
            N<sub>Rd</sub> = {result.designResistance.toFixed(1)} kN
          </div>
        </div>
      </div>

      {/* Formula */}
      {result.formula && (
        <div className="mb-3">
          <div className="text-[10px] uppercase tracking-wider text-[#666]">Formula</div>
          <div className="mt-1 rounded bg-[#0A0A0A] px-2 py-1 font-mono text-xs text-[#AAA]">
            {result.formula}
          </div>
        </div>
      )}

      {/* Intermediate values */}
      {intermediateEntries.length > 0 && (
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wider text-[#666]">
            Intermediate Values
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {intermediateEntries.map(([key, iv]) => (
              <div key={key} className="flex items-baseline justify-between gap-2 font-mono text-xs">
                <span className="text-[#888]">{iv.label}</span>
                <span className="text-[#CCC]">
                  {typeof iv.value === "number" && isFinite(iv.value)
                    ? iv.value.toFixed(1)
                    : String(iv.value)}{" "}
                  <span className="text-[#666]">{iv.unit}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
