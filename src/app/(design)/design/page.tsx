"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { InputPanel } from "@/components/design/InputPanel";
import { ResultsPanel } from "@/components/design/ResultsPanel";
import { OverallStatus } from "@/components/design/OverallStatus";
import { ActionBar } from "@/components/design/ActionBar";
import { useDesignStore } from "@/stores/design";
import { calculateAnchorDesign } from "@/lib/calc-engine";

// Lazy-load 3D scene (R3F requires browser APIs, no SSR)
const AnchorScene = dynamic(
  () =>
    import("@/components/design-3d/AnchorScene").then((m) => ({
      default: m.AnchorScene,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#1A1A1A]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#333] border-t-[#C41E3A]" />
          <p className="text-xs text-[#666]">Loading 3D scene...</p>
        </div>
      </div>
    ),
  }
);

export default function DesignPage() {
  const inputs = useDesignStore((s) => s.inputs);
  const results = useDesignStore((s) => s.results);
  const setResults = useDesignStore((s) => s.setResults);
  const setCalculating = useDesignStore((s) => s.setCalculating);

  // 3D scene overlay toggles
  const [showDimensions, setShowDimensions] = useState(true);
  const [showCones, setShowCones] = useState({
    coneBreakout: false,
    edgeBreakout: false,
    pryout: false,
  });

  // Debounced recalculation when inputs change
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      try {
        setCalculating(true);
        const r = calculateAnchorDesign(inputs);
        setResults(r);
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
        {/* 3D Visualisation -- hidden on mobile, shown on lg+ */}
        <div className="hidden lg:flex h-[50%] shrink-0 flex-col border-b border-[#222]">
          {/* Cone / dimension toggle controls */}
          <div className="flex items-center gap-3 border-b border-[#222] bg-[#111] px-3 py-1.5 text-xs">
            <label className="flex items-center gap-1.5 text-[#888] hover:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={showDimensions}
                onChange={(e) => setShowDimensions(e.target.checked)}
                className="accent-[#C41E3A]"
              />
              Dimensions
            </label>
            <span className="text-[#333]">|</span>
            <label className="flex items-center gap-1.5 text-[#888] hover:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={showCones.coneBreakout}
                onChange={(e) =>
                  setShowCones((s) => ({ ...s, coneBreakout: e.target.checked }))
                }
                className="accent-[#C41E3A]"
              />
              Cone Breakout
            </label>
            <label className="flex items-center gap-1.5 text-[#888] hover:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={showCones.edgeBreakout}
                onChange={(e) =>
                  setShowCones((s) => ({ ...s, edgeBreakout: e.target.checked }))
                }
                className="accent-[#C41E3A]"
              />
              Edge Breakout
            </label>
            <label className="flex items-center gap-1.5 text-[#888] hover:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={showCones.pryout}
                onChange={(e) =>
                  setShowCones((s) => ({ ...s, pryout: e.target.checked }))
                }
                className="accent-[#C41E3A]"
              />
              Pryout
            </label>
          </div>

          {/* R3F Canvas */}
          <div className="flex-1">
            <AnchorScene
              showDimensions={showDimensions}
              showCones={showCones}
              failureModes={results?.failureModes ?? []}
            />
          </div>
        </div>

        {/* Mobile fallback: hidden on lg+ */}
        <div className="flex lg:hidden items-center justify-center border-b border-[#222] bg-[#1A1A1A] py-6">
          <div className="text-center px-6">
            <div className="mb-2 text-sm font-medium text-[#666]">
              3D Visualisation
            </div>
            <p className="text-xs text-[#444]">
              Rotate to landscape or use a larger screen to view the interactive 3D model
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
