"use client";

import { InputPanel } from "@/components/design/InputPanel";

export default function DesignPage() {
  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left panel: Inputs (scrollable) */}
      <div className="w-full lg:w-[400px] shrink-0 overflow-y-auto border-r border-[#222] bg-[#0F0F0F]">
        <InputPanel />
      </div>

      {/* Right panel: 3D Visualisation + Results (placeholder) */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 3D Visualisation placeholder */}
        <div className="flex flex-1 items-center justify-center border-b border-[#222]">
          <div className="text-center">
            <div className="mb-2 text-lg font-semibold text-[#666]">
              3D Visualisation
            </div>
            <p className="text-sm text-[#444]">
              Interactive anchor model will appear here
            </p>
          </div>
        </div>

        {/* Results placeholder */}
        <div className="flex h-64 shrink-0 items-center justify-center lg:h-80">
          <div className="text-center">
            <div className="mb-2 text-lg font-semibold text-[#666]">
              Results
            </div>
            <p className="text-sm text-[#444]">
              Utilisation ratios and failure mode checks will appear here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
