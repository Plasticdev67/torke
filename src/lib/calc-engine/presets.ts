/**
 * @torke/calc-engine - Presets
 *
 * 3-5 starter configurations for common anchor design scenarios.
 * Uses realistic engineering values.
 */

import type { DesignInputs } from "./types";

export interface Preset {
  name: string;
  description: string;
  inputs: DesignInputs;
}

const DEFAULT_EDGE_DISTANCES = { c1: 200, c2: 200, c3: 200, c4: 200 };
const DEFAULT_SPACING = { s1: 100, s2: 100 };
const DEFAULT_PROJECT_INFO = {
  projectName: "",
  engineerName: "",
  projectRef: "",
  date: new Date().toISOString().slice(0, 10),
};

export const PRESETS: Preset[] = [
  {
    name: "Blank / Default",
    description: "Start from scratch with default values",
    inputs: {
      ...DEFAULT_PROJECT_INFO,
      anchorType: "chemical",
      anchorDiameter: 12,
      embedmentDepth: 100,
      concreteClass: "C30/37",
      crackedConcrete: true,
      tensionLoad: 0,
      shearLoad: 0,
      edgeDistances: { c1: 200, c2: 200, c3: 200, c4: 200 },
      spacing: { s1: 100, s2: 100 },
      groupPattern: "single",
      steelGrade: "8.8",
      environment: "dry",
      plateThickness: 15,
      plateWidth: 150,
      plateDepth: 150,
      memberThickness: 250,
    },
  },
  {
    name: "Single M12 Baseplate",
    description: "Single chemical anchor, light baseplate connection",
    inputs: {
      ...DEFAULT_PROJECT_INFO,
      anchorType: "chemical",
      anchorDiameter: 12,
      embedmentDepth: 110,
      concreteClass: "C30/37",
      crackedConcrete: true,
      tensionLoad: 15,
      shearLoad: 8,
      edgeDistances: DEFAULT_EDGE_DISTANCES,
      spacing: DEFAULT_SPACING,
      groupPattern: "single",
      steelGrade: "8.8",
      environment: "dry",
      plateThickness: 15,
      plateWidth: 150,
      plateDepth: 150,
      memberThickness: 250,
    },
  },
  {
    name: "4-Bolt M16 Column Base",
    description: "2x2 group for steel column base plate",
    inputs: {
      ...DEFAULT_PROJECT_INFO,
      anchorType: "chemical",
      anchorDiameter: 16,
      embedmentDepth: 200,
      concreteClass: "C30/37",
      crackedConcrete: true,
      tensionLoad: 60,
      shearLoad: 25,
      edgeDistances: { c1: 250, c2: 250, c3: 250, c4: 250 },
      spacing: { s1: 200, s2: 200 },
      groupPattern: "2x2",
      steelGrade: "8.8",
      environment: "dry",
      plateThickness: 20,
      plateWidth: 300,
      plateDepth: 300,
      memberThickness: 400,
    },
  },
  {
    name: "2-Bolt M20 Bracket",
    description: "2x1 group for structural bracket connection",
    inputs: {
      ...DEFAULT_PROJECT_INFO,
      anchorType: "chemical",
      anchorDiameter: 20,
      embedmentDepth: 125,
      concreteClass: "C25/30",
      crackedConcrete: true,
      tensionLoad: 40,
      shearLoad: 30,
      edgeDistances: { c1: 150, c2: 200, c3: 200, c4: 200 },
      spacing: { s1: 150, s2: 0 },
      groupPattern: "2x1",
      steelGrade: "8.8",
      environment: "dry",
      plateThickness: 20,
      plateWidth: 250,
      plateDepth: 150,
      memberThickness: 300,
    },
  },
  {
    name: "6-Bolt M24 Heavy Base",
    description: "3x2 group for heavy equipment base plate",
    inputs: {
      ...DEFAULT_PROJECT_INFO,
      anchorType: "chemical",
      anchorDiameter: 24,
      embedmentDepth: 300,
      concreteClass: "C40/50",
      crackedConcrete: false,
      tensionLoad: 150,
      shearLoad: 80,
      edgeDistances: { c1: 300, c2: 300, c3: 300, c4: 300 },
      spacing: { s1: 200, s2: 200 },
      groupPattern: "3x2",
      steelGrade: "10.9",
      environment: "dry",
      plateThickness: 30,
      plateWidth: 500,
      plateDepth: 400,
      memberThickness: 600,
    },
  },
];
