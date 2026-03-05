"use client";

import { Check, X } from "lucide-react";
import { useDesignStore } from "@/stores/design";

export function OverallStatus() {
  const results = useDesignStore((s) => s.results);

  if (!results) return null;

  const pct = Math.round(results.governingUtilisation * 100);

  return (
    <div
      className={`mx-3 my-2 rounded-lg px-4 py-3 ${
        results.overallPass
          ? "bg-gradient-to-r from-green-950/60 to-green-900/30 ring-1 ring-green-800/40"
          : "bg-gradient-to-r from-red-950/60 to-red-900/30 ring-1 ring-red-800/40"
      }`}
    >
      {/* Status line */}
      <div className="flex items-center gap-2">
        {results.overallPass ? (
          <>
            <Check className="h-5 w-5 text-green-400" />
            <span className="text-sm font-bold tracking-wide text-green-400">PASS</span>
          </>
        ) : (
          <>
            <X className="h-5 w-5 text-red-400" />
            <span className="text-sm font-bold tracking-wide text-red-400">FAIL</span>
          </>
        )}
      </div>

      {/* Governing mode */}
      <div className="mt-1 text-xs text-[#888]">
        Governed by:{" "}
        <span className="font-medium text-[#AAA]">
          {results.governingMode} ({pct}%)
        </span>
      </div>
    </div>
  );
}
