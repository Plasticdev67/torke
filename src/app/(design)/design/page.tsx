"use client";

import { useEffect, useRef } from "react";
import { InputPanel } from "@/components/design/InputPanel";
import { ResultsPanel } from "@/components/design/ResultsPanel";
import { OverallStatus } from "@/components/design/OverallStatus";
import { ActionBar } from "@/components/design/ActionBar";
import { useDesignStore } from "@/stores/design";
import { calculateAnchorDesign } from "@/lib/calc-engine";

export default function DesignPage() {
  const inputs = useDesignStore((s) => s.inputs);
  const setResults = useDesignStore((s) => s.setResults);
  const setCalculating = useDesignStore((s) => s.setCalculating);

  // Debounced recalculation when inputs change
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      try {
        setCalculating(true);
        const results = calculateAnchorDesign(inputs);
        setResults(results);
      } catch {
        setResults(null);
      } finally {
        setCalculating(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [inputs, setResults, setCalculating]);

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left panel: Inputs (scrollable) */}
      <div className="w-full lg:w-[400px] shrink-0 overflow-y-auto border-r border-[#222] bg-[#0F0F0F]">
        <InputPanel />
      </div>

      {/* Right panel: 3D Visualisation + Results */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 3D Visualisation placeholder (50-60% height) */}
        <div className="flex h-[50%] shrink-0 items-center justify-center border-b border-[#222]">
          <div className="text-center">
            <div className="mb-2 text-lg font-semibold text-[#666]">
              3D Visualisation
            </div>
            <p className="text-sm text-[#444]">
              Interactive anchor model will appear here
            </p>
          </div>
        </div>

        {/* Overall status (compact) */}
        <OverallStatus />

        {/* Results panel (scrollable, flex-1) */}
        <ResultsPanel />

        {/* Sticky action bar */}
        <ActionBar />
      </div>
    </div>
  );
}
