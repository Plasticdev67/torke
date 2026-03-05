"use client";

import { FileDown, Save, Lock } from "lucide-react";
import { useDesignStore } from "@/stores/design";

export function ActionBar() {
  const results = useDesignStore((s) => s.results);
  const disabled = !results;

  // Stubs - will be wired to auth gate and actual functionality in Plan 06
  const handleExportPdf = () => {
    // TODO: check auth, then export PDF
    console.log("[ActionBar] Export PDF clicked");
  };

  const handleSave = () => {
    // TODO: check auth, then save calculation
    console.log("[ActionBar] Save Calculation clicked");
  };

  return (
    <div className="sticky bottom-0 shrink-0 border-t border-[#222] bg-[#0F0F0F]/95 px-3 py-3 backdrop-blur-sm">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={handleExportPdf}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#C41E3A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#A81830] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FileDown className="h-4 w-4" />
          Export PDF
          {disabled && <Lock className="h-3 w-3 opacity-60" />}
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={handleSave}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#333] px-4 py-2 text-sm font-medium text-[#CCC] transition-colors hover:border-[#555] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Save className="h-4 w-4" />
          Save Calculation
          {disabled && <Lock className="h-3 w-3 opacity-60" />}
        </button>
      </div>

      {/* Scope disclaimer */}
      <p className="mt-2 text-center text-[10px] text-[#555]">
        Calculations exclude seismic and fire design
      </p>
    </div>
  );
}
