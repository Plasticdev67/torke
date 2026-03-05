"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DesignInputs, DesignResults } from "@/lib/calc-engine/types";

/** Default inputs: "Single M12 baseplate" preset */
const DEFAULT_INPUTS: DesignInputs = {
  // Project info
  projectName: "",
  engineerName: "",
  projectRef: "",
  date: new Date().toISOString().slice(0, 10),

  // Anchor type
  anchorType: "chemical",
  anchorDiameter: 12,
  steelGrade: "8.8",
  embedmentDepth: 110,

  // Concrete
  concreteClass: "C30/37",
  crackedConcrete: true,
  memberThickness: 200,

  // Loads
  tensionLoad: 10,
  shearLoad: 5,

  // Geometry
  groupPattern: "single",
  spacing: { s1: 0, s2: 0 },
  edgeDistances: { c1: 150, c2: 150, c3: 150, c4: 150 },
  plateThickness: 10,
  plateWidth: 150,
  plateDepth: 150,

  // Environment
  environment: "dry",
};

/** Preset configurations for common starting points */
export const DESIGN_PRESETS: Record<string, { label: string; values: Partial<DesignInputs> }> = {
  single_m12: {
    label: "Single M12 Baseplate",
    values: {}, // Uses DEFAULT_INPUTS
  },
  single_m16: {
    label: "Single M16 Heavy Duty",
    values: {
      anchorDiameter: 16,
      embedmentDepth: 125,
      steelGrade: "8.8",
      tensionLoad: 25,
      shearLoad: 10,
      plateThickness: 15,
      plateWidth: 200,
      plateDepth: 200,
    },
  },
  quad_m12: {
    label: "4-Bolt M12 Column Base",
    values: {
      groupPattern: "2x2",
      anchorDiameter: 12,
      embedmentDepth: 110,
      spacing: { s1: 200, s2: 200 },
      tensionLoad: 40,
      shearLoad: 15,
      plateThickness: 20,
      plateWidth: 300,
      plateDepth: 300,
    },
  },
  quad_m20: {
    label: "4-Bolt M20 Column Base",
    values: {
      groupPattern: "2x2",
      anchorDiameter: 20,
      embedmentDepth: 170,
      steelGrade: "8.8",
      spacing: { s1: 250, s2: 250 },
      tensionLoad: 80,
      shearLoad: 30,
      memberThickness: 300,
      plateThickness: 25,
      plateWidth: 400,
      plateDepth: 400,
    },
  },
  blank: {
    label: "Blank Slate",
    values: {
      projectName: "",
      engineerName: "",
      projectRef: "",
      anchorType: "chemical",
      anchorDiameter: 12,
      steelGrade: "8.8",
      embedmentDepth: 80,
      concreteClass: "C25/30",
      crackedConcrete: true,
      memberThickness: 150,
      tensionLoad: 0,
      shearLoad: 0,
      groupPattern: "single",
      spacing: { s1: 0, s2: 0 },
      edgeDistances: { c1: 100, c2: 100, c3: 100, c4: 100 },
      plateThickness: 10,
      plateWidth: 150,
      plateDepth: 150,
      environment: "dry",
    },
  },
};

interface DesignState {
  inputs: DesignInputs;
  results: DesignResults | null;
  isCalculating: boolean;
  calcReference: string | null;
  setInput: <K extends keyof DesignInputs>(key: K, value: DesignInputs[K]) => void;
  setInputs: (partial: Partial<DesignInputs>) => void;
  loadPreset: (preset: Partial<DesignInputs>) => void;
  setResults: (results: DesignResults | null) => void;
  setCalculating: (isCalculating: boolean) => void;
  reset: () => void;
}

export const useDesignStore = create<DesignState>()(
  persist(
    (set) => ({
      inputs: { ...DEFAULT_INPUTS },
      results: null,
      isCalculating: false,
      calcReference: null,

      setInput: (key, value) => {
        set((state) => ({
          inputs: { ...state.inputs, [key]: value },
        }));
      },

      setInputs: (partial) => {
        set((state) => ({
          inputs: { ...state.inputs, ...partial },
        }));
      },

      loadPreset: (preset) => {
        set({
          inputs: { ...DEFAULT_INPUTS, ...preset },
          results: null,
          calcReference: null,
        });
      },

      setResults: (results) => set({ results }),

      setCalculating: (isCalculating) => set({ isCalculating }),

      reset: () =>
        set({
          inputs: { ...DEFAULT_INPUTS },
          results: null,
          isCalculating: false,
          calcReference: null,
        }),
    }),
    { name: "torke-design" }
  )
);
