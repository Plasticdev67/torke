import { generateCalcReport } from "../src/server/services/calc-report-service.js";
import { calculateAnchorDesign } from "../src/lib/calc-engine/index.js";
import { writeFileSync } from "fs";
import type { DesignInputs } from "../src/lib/calc-engine/types.js";

const inputs: DesignInputs = {
  projectName: "Torke HQ — Steel Frame Connection",
  engineerName: "James Morton",
  projectRef: "TRK-2026-0042",
  date: "2026-03-05",
  anchorType: "chemical",
  anchorDiameter: 16,
  embedmentDepth: 125,
  concreteClass: "C30/37",
  crackedConcrete: true,
  tensionLoad: 25,
  shearLoad: 12,
  edgeDistances: { c1: 200, c2: 200, c3: 200, c4: 200 },
  spacing: { s1: 120, s2: 120 },
  groupPattern: "single",
  steelGrade: "8.8",
  environment: "dry",
  plateThickness: 20,
  plateWidth: 200,
  plateDepth: 200,
  memberThickness: 300,
};

async function main() {
  const results = calculateAnchorDesign(inputs);
  const bytes = await generateCalcReport(
    inputs,
    results,
    { name: "James Morton", email: "james@torke.co.uk" },
    "CALC-2026-000042"
  );
  writeFileSync("sample-calc-report.pdf", bytes);
  console.log(`Done: ${bytes.length} bytes written to sample-calc-report.pdf`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
